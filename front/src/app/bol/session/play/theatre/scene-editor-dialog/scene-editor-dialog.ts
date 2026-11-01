import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {applyEach, form, FormField, maxLength, pattern, required} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../../../core/api-error.utils';
import {BolSceneModel, SceneMoment} from '../../../../models/bol-scene.model';
import {BolCatalogService} from '../../../../services/bol-catalog.service';
import {BolSceneService} from '../../../../services/bol-scene.service';
import {SceneEditorDialogData} from '../../../models/scene-editor-dialog.model';
import {SCENE_TITLE_MAX} from '../../scene-list/scene.util';
import {METEOS, MOMENTS, sceneDecor} from '../theatre.util';
import {editorValue, sceneChanges} from './scene-editor.util';

const PISTES_MAX = 8;
const LECTURE_MAX = 5000;
const JEU_MAX = 10000;
/** Valeur du bouton « Aucun » du moment : un groupe de boutons ne sait pas sélectionner `null`. */
const AUCUN = 'aucun';

/** « Préparer la scène » : son décor (région, lieu, ambiance, illustration), le texte à lire aux joueurs,
 * les règles de la scène (« En jeu »), le secret du MJ et les pistes. Enregistre lui-même et se ferme avec la scène enregistrée. */
@Component({
  selector: 'bol-scene-editor-dialog',
  imports: [
    FormField,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
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
  protected readonly lectureMax = LECTURE_MAX;
  protected readonly pistesMax = PISTES_MAX;

  protected readonly regions = toSignal(
    inject(BolCatalogService)
      .regions()
      .pipe(map((regions) => [...regions].sort((left, right) => left.region.localeCompare(right.region, 'fr')))),
    {initialValue: []},
  );

  private readonly value = signal(editorValue(this.data.scene));
  protected readonly sceneForm = form(this.value, (path) => {
    required(path.titre);
    maxLength(path.titre, SCENE_TITLE_MAX);
    maxLength(path.lieu, 120);
    maxLength(path.image, 500);
    pattern(path.image, /^\s*(https:\/\/|\/assets\/).*|^\s*$/);
    maxLength(path.lecture, LECTURE_MAX);
    maxLength(path.jeu, JEU_MAX);
    maxLength(path.notes, 10000);
    applyEach(path.pistes, (piste) => maxLength(piste.texte, 200));
  });

  protected readonly valid = computed(() => this.sceneForm().valid());
  protected readonly imageInvalid = computed(() => this.sceneForm.image().invalid());
  protected readonly momentChoisi = computed(() => this.value().moment ?? AUCUN);
  protected readonly lectureLength = computed(() => this.value().lecture.length);
  protected readonly pisteCount = computed(() => this.value().pistes.length);
  /** Aperçu du décor pour la valeur en cours : l'illustration, sinon l'image par défaut. */
  protected readonly apercu = computed(() => sceneDecor({...this.data.scene, image: this.value().image}));
  protected readonly busy = signal(false);

  protected setMoment(change: MatButtonToggleChange): void {
    this.sceneForm.moment().value.set(change.value === AUCUN ? null : (change.value as SceneMoment));
  }

  protected addPiste(): void {
    if (this.pisteCount() < PISTES_MAX) {
      this.value.update((value) => ({...value, pistes: [...value.pistes, {texte: '', scene_id: null}]}));
    }
  }

  protected removePiste(index: number): void {
    this.value.update((value) => ({...value, pistes: value.pistes.filter((_, position) => position !== index)}));
  }

  /** `(submit)` natif : enregistre, puis ferme le dialogue avec la scène renvoyée par le serveur. */
  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.valid() || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.sceneService.update(this.data.scene.id, sceneChanges(this.value())).subscribe({
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
