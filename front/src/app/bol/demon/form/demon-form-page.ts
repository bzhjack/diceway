import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormArray, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {DetailDraft, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
import {controlValueSignal, formArrayValueSignal, formDirtySignal} from '../../shared/form/form-signals';
import {PouvoirAddEvent} from '../../shared/pouvoir/add-menu/pouvoir-add-menu.component';
import {PouvoirEntry} from '../../shared/pouvoir/list/pouvoir-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {DemonGeneralComponent} from './general/demon-general.component';
import {DemonPouvoirsComponent} from './pouvoirs/demon-pouvoirs.component';

const DEMON_STAT_GROUPS: readonly StatGroup[] = [
  {
    key: 'attr',
    label: 'Attributs',
    columns: 4,
    cells: [
      {control: 'vigueur', label: 'Vigueur'},
      {control: 'agilite', label: 'Agilité'},
      {control: 'esprit', label: 'Esprit'},
      {control: 'aura', label: 'Aura'},
    ],
  },
  {
    key: 'combat',
    label: 'Combat',
    columns: 3,
    cells: [
      {control: 'melee', label: 'Mêlée'},
      {control: 'tir', label: 'Tir'},
      {control: 'defense', label: 'Défense'},
    ],
  },
  {
    key: 'res',
    label: 'Ressources',
    columns: 1,
    cells: [{control: 'vitalite', label: 'Vitalité', highlight: true}],
  },
];

const DEMON_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouveau démon',
  editTitle: 'Modifier le démon',
  createEyebrow: 'Bestiaire infernal BOL',
  editEyebrow: 'Édition infernale BOL',
  createSubmitLabel: 'Enregistrer le démon',
  editSubmitLabel: 'Mettre à jour le démon',
  loadError: 'Le chargement du démon a échoué.',
  createError: 'La création du démon a échoué.',
  updateError: 'La mise à jour du démon a échoué.',
  unsavedChanges: 'Ce démon a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar du démon',
};

@Component({
  selector: 'bol-demon-form-page',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButtonModule,
    MatIconModule,
    DemonGeneralComponent,
    DemonPouvoirsComponent,
    StatsGridComponent,
  ],
  templateUrl: './demon-form-page.html',
  styleUrl: './demon-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonFormPageComponent extends BolEntityFormPageBase<BolDemonModel> {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly pouvoirsList = this.demonStateService.pouvoirList;

  protected readonly labels = DEMON_FORM_LABELS;
  protected readonly demonStatGroups = DEMON_STAT_GROUPS;

  protected readonly demonForm = this.formBuilder.group({
    id: this.formBuilder.control<string | null>(null),
    nom: this.formBuilder.control('', Validators.required),
    id_categorie: this.formBuilder.control<number | null>(null, Validators.required),
    commentaire: this.formBuilder.control<string | null>(null),
    vigueur: this.formBuilder.control(0, Validators.required),
    agilite: this.formBuilder.control(0, Validators.required),
    esprit: this.formBuilder.control(0, Validators.required),
    aura: this.formBuilder.control(0, Validators.required),
    vitalite: this.formBuilder.control(0, Validators.required),
    melee: this.formBuilder.control(0, Validators.required),
    tir: this.formBuilder.control(0, Validators.required),
    defense: this.formBuilder.control(0, Validators.required),
    degats: this.formBuilder.control('0', Validators.required),
    avatar: this.formBuilder.control<string | null>(null),
    pouvoirs: this.formBuilder.array([]),
  });

  protected get entityForm() {
    return this.demonForm;
  }

  protected readonly formDirty = formDirtySignal(this.demonForm);

  protected readonly categorieId = controlValueSignal(this.demonForm.controls.id_categorie);
  protected readonly avatarPreview = controlValueSignal(this.demonForm.controls.avatar);

  protected readonly selectedPouvoirsDraft = formArrayValueSignal<DetailDraft>(this.pouvoirs);
  protected readonly selectedCategorie = computed(() =>
    (this.categories() ?? []).find((categorie) => Number(categorie.id) === Number(this.categorieId())),
  );
  protected readonly filteredPouvoirs = availableCatalog(this.pouvoirsList, this.selectedPouvoirsDraft);
  protected readonly selectedPouvoirEntries = selectedEntries(
    this.selectedPouvoirsDraft,
    this.pouvoirsList,
    (definition, entry): PouvoirEntry => ({
      id: Number(entry.id),
      label: definition.pouvoir,
      description: definition.description || null,
      detail: entry.detail || null,
    }),
  );

  constructor() {
    super();
    this.setupReferenceDefaults(
      this.selectedCategorie,
      (categorie) => Number(categorie.id),
      (categorie) => ({
        vitalite: categorie.vitalite ?? 0,
        degats: categorie.degats ?? '0',
      }),
    );
  }

  protected get pouvoirs(): FormArray {
    return this.demonForm.controls.pouvoirs as FormArray;
  }

  protected addPouvoirEntry(event: PouvoirAddEvent): void {
    this.pouvoirs.push(
      this.formBuilder.group({
        id: this.formBuilder.control(event.id, Validators.required),
        detail: this.formBuilder.control(event.detail),
      }),
    );
    this.pouvoirs.markAsDirty();
  }

  protected removePouvoir(index: number): void {
    this.removeItem(this.pouvoirs, index);
  }

  protected loadEntity(id: string): Observable<BolDemonModel> {
    return this.demonsService.demon(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolDemonModel> {
    return this.demonsService.createDemon(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolDemonModel> {
    return this.demonsService.updateDemon(payload);
  }

  protected resetForm(): void {
    this.hydratedReferenceId = null;
    this.demonForm.reset(
      {
        id: null,
        nom: '',
        id_categorie: null,
        commentaire: null,
        vigueur: 0,
        agilite: 0,
        esprit: 0,
        aura: 0,
        vitalite: 0,
        melee: 0,
        tir: 0,
        defense: 0,
        degats: '0',
        avatar: null,
      },
      {emitEvent: false},
    );
    this.pouvoirs.clear({emitEvent: false});
    this.syncArrays(this.pouvoirs);
  }

  protected hydrateForm(demon: BolDemonModel): void {
    this.hydratedReferenceId = Number(demon.id_categorie);
    this.pouvoirs.clear({emitEvent: false});

    for (const pouvoir of demon.pouvoirs) {
      this.pouvoirs.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(pouvoir.pouvoir_id), Validators.required),
          detail: this.formBuilder.control(pouvoir.detail || null),
        }),
        {emitEvent: false},
      );
    }

    this.demonForm.patchValue(
      {
        id: demon.id,
        nom: demon.nom,
        id_categorie: Number(demon.id_categorie),
        commentaire: demon.commentaire,
        vigueur: demon.vigueur,
        agilite: demon.agilite,
        esprit: demon.esprit,
        aura: demon.aura,
        vitalite: demon.vitalite,
        melee: demon.melee,
        tir: demon.tir,
        defense: demon.defense,
        degats: demon.degats,
        avatar: demon.avatar,
      },
      {emitEvent: true},
    );
    this.syncArrays(this.pouvoirs);
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.demonForm.getRawValue();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      id_categorie: rawValue.id_categorie,
      commentaire: rawValue.commentaire,
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      aura: rawValue.aura,
      vitalite: rawValue.vitalite,
      melee: rawValue.melee,
      tir: rawValue.tir,
      defense: rawValue.defense,
      degats: rawValue.degats,
      avatar: rawValue.avatar,
      pouvoirs: (rawValue.pouvoirs as DetailDraft[]).map((pouvoir) => ({
        id: pouvoir.id,
        detail: pouvoir.detail,
      })),
    };
  }
}
