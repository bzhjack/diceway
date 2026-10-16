import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, Observable, startWith} from 'rxjs';
import {extractApiErrorMessage} from '../../../../../core/api-error.utils';
import {BolSceneModel, SceneMeteo, SceneMoment} from '../../../../models/bol-scene.model';
import {BolCatalogService} from '../../../../services/bol-catalog.service';
import {BolSceneService} from '../../../../services/bol-scene.service';
import {REGION_MAP_COORDINATES} from '../../../../shared/region/region-map-coordinates';
import {SceneEditorDialogData, SceneEditorValue} from '../../../models/scene-editor-dialog.model';
import {SCENE_TITLE_MAX} from '../../scene-list/scene.util';
import {CarteRegionComponent} from '../carte-region';
import {METEOS, MOMENTS, sceneDecor} from '../theatre.util';
import {editorValue, sceneChanges} from './scene-editor.util';

const PISTES_MAX = 8;
const LECTURE_MAX = 5000;
/** Valeur du bouton « Aucun » du moment : un groupe de boutons ne sait pas sélectionner `null`. */
const AUCUN = 'aucun';

type PisteGroup = FormGroup<{texte: FormControl<string>; scene_id: FormControl<string | null>}>;

function pisteGroup(piste: {texte: string; scene_id: string | null}): PisteGroup {
  return new FormGroup({
    texte: new FormControl(piste.texte, {nonNullable: true, validators: [Validators.maxLength(200)]}),
    scene_id: new FormControl<string | null>(piste.scene_id),
  });
}

/** « Préparer la scène » : son décor (région, lieu, ambiance, illustration), le texte à lire aux joueurs,
 * le secret du MJ et les pistes. Enregistre lui-même et se ferme avec la scène enregistrée. */
@Component({
  selector: 'bol-scene-editor-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    CarteRegionComponent,
  ],
  templateUrl: './scene-editor-dialog.html',
  styleUrl: './scene-editor-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SceneEditorDialogComponent {
  protected readonly data = inject<SceneEditorDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<SceneEditorDialogComponent, BolSceneModel>);
  private readonly sceneService = inject(BolSceneService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly moments = MOMENTS;
  protected readonly meteos = METEOS;
  protected readonly aucun = AUCUN;
  protected readonly dangers = [1, 2, 3, 4];
  protected readonly titreMax = SCENE_TITLE_MAX;
  protected readonly lectureMax = LECTURE_MAX;
  protected readonly pistesMax = PISTES_MAX;

  protected readonly regions = toSignal(
    inject(BolCatalogService)
      .regions()
      .pipe(map((regions) => [...regions].sort((left, right) => left.region.localeCompare(right.region, 'fr')))),
    {initialValue: []},
  );

  private readonly initial = editorValue(this.data.scene);
  protected readonly form = new FormGroup({
    titre: new FormControl(this.initial.titre, {nonNullable: true, validators: [Validators.required, Validators.maxLength(SCENE_TITLE_MAX)]}),
    region_id: new FormControl<number | null>(this.initial.region_id),
    lieu: new FormControl(this.initial.lieu, {nonNullable: true, validators: [Validators.maxLength(120)]}),
    moment: new FormControl<SceneMoment | null>(this.initial.moment),
    meteo: new FormControl<SceneMeteo | null>(this.initial.meteo),
    danger: new FormControl(this.initial.danger, {nonNullable: true}),
    image: new FormControl(this.initial.image, {nonNullable: true, validators: [Validators.maxLength(500), Validators.pattern(/^\s*(https:\/\/|\/assets\/).*|^\s*$/)]}),
    lecture: new FormControl(this.initial.lecture, {nonNullable: true, validators: [Validators.maxLength(LECTURE_MAX)]}),
    notes: new FormControl(this.initial.notes, {nonNullable: true, validators: [Validators.maxLength(10000)]}),
    pistes: new FormArray<PisteGroup>(this.initial.pistes.map(pisteGroup)),
  });

  // Valeur et validité en signaux : l'état d'un formulaire lu dans un template OnPush ne se rafraîchit pas seul.
  private readonly value = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue()), startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  private readonly status = toSignal(this.form.statusChanges.pipe(startWith(this.form.status)), {initialValue: this.form.status});
  protected readonly valid = computed(() => this.status() === 'VALID');
  protected readonly momentChoisi = computed(() => this.value().moment ?? AUCUN);
  protected readonly lectureLength = computed(() => this.value().lecture.length);
  protected readonly pisteCount = computed(() => this.value().pistes.length);
  /** Aperçu du décor pour la valeur en cours : l'illustration, sinon la carte de la région. */
  private readonly decor = computed(() => {
    const value = this.value();
    return sceneDecor({...this.data.scene, image: value.image, region_id: value.region_id}, REGION_MAP_COORDINATES);
  });
  protected readonly apercuImage = computed(() => {
    const decor = this.decor();
    return decor.kind === 'image' ? decor.url : null;
  });
  /** Le point de la région sur la carte, quand l'aperçu est la carte. */
  protected readonly apercuCarte = computed(() => {
    const decor = this.decor();
    return decor.kind === 'carte' ? {x: decor.x, y: decor.y} : null;
  });
  protected readonly busy = signal(false);

  protected get pistes(): FormArray<PisteGroup> {
    return this.form.controls.pistes;
  }

  protected setMoment(change: MatButtonToggleChange): void {
    this.form.controls.moment.setValue(change.value === AUCUN ? null : (change.value as SceneMoment));
  }

  protected addPiste(): void {
    if (this.pistes.length < PISTES_MAX) {
      this.pistes.push(pisteGroup({texte: '', scene_id: null}));
    }
  }

  protected removePiste(index: number): void {
    this.pistes.removeAt(index);
  }

  /** `(submit)` natif : enregistre, puis ferme le dialogue avec la scène renvoyée par le serveur. */
  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.valid() || this.busy()) {
      return;
    }
    this.busy.set(true);
    const value: SceneEditorValue = this.form.getRawValue();
    this.sceneService.update(this.data.scene.id, sceneChanges(value)).subscribe({
      next: (scene) => this.ref.close(scene),
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, "Impossible d'enregistrer la scène."), 'Fermer', {duration: 5000});
      },
    });
  }
}

/** Ouvre « Préparer la scène » ; émet la scène enregistrée, ou `undefined` si le dialogue est fermé sans enregistrer. */
export function openSceneEditor(dialog: MatDialog, data: SceneEditorDialogData): Observable<BolSceneModel | undefined> {
  return dialog
    .open<SceneEditorDialogComponent, SceneEditorDialogData, BolSceneModel>(SceneEditorDialogComponent, {
      data,
      width: 'min(60rem, 96vw)',
      maxWidth: '96vw',
      autoFocus: 'first-tabbable',
    })
    .afterClosed();
}
