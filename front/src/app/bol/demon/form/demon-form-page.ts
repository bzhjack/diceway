import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {applyEach, FieldTree, form, required} from '@angular/forms/signals';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {AddMenuEvent} from '../../shared/add-menu/add-menu.component';
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {DetailDraft, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
import {PouvoirEntry} from '../../shared/pouvoir/list/pouvoir-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {DemonGeneralComponent} from './general/demon-general.component';
import {DemonPouvoirsComponent} from './pouvoirs/demon-pouvoirs.component';

/** Modèle de brouillon du formulaire démon (distinct de {@link BolDemonModel}, la forme persistée par l'API). */
export interface DemonFormModel {
  id: string | null;
  nom: string;
  id_categorie: number | null;
  /** Chaîne vide plutôt que `null` : `[formField]` sur `<textarea>` exige `Field<string>`. */
  commentaire: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  vitalite: number;
  melee: number;
  tir: number;
  defense: number;
  degats: string;
  avatar: string | null;
  pouvoirs: DetailDraft[];
}

function demonFormDefaults(): DemonFormModel {
  return {
    id: null,
    nom: '',
    id_categorie: null,
    commentaire: '',
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
    pouvoirs: [],
  };
}

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
export class DemonFormPageComponent extends BolEntityFormPageBase<BolDemonModel, DemonFormModel> {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly pouvoirsList = this.demonStateService.pouvoirList;

  protected readonly labels = DEMON_FORM_LABELS;
  protected readonly demonStatGroups = DEMON_STAT_GROUPS;

  protected readonly model = signal<DemonFormModel>(demonFormDefaults());
  protected readonly demonForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom requis'});
    required(fieldPath.id_categorie, {message: 'Catégorie requise'});
    required(fieldPath.vigueur);
    required(fieldPath.agilite);
    required(fieldPath.esprit);
    required(fieldPath.aura);
    required(fieldPath.vitalite);
    required(fieldPath.melee);
    required(fieldPath.tir);
    required(fieldPath.defense);
    required(fieldPath.degats);

    applyEach(fieldPath.pouvoirs, (pouvoir) => {
      required(pouvoir.id);
    });
  });

  protected get entityForm() {
    return this.demonForm;
  }

  /** Vue castée pour bol-stats-grid, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.demonForm as unknown as FieldTree<Record<string, number>>;

  protected readonly avatarPreview = computed(() => this.model().avatar);

  protected readonly selectedPouvoirsDraft = computed(() => this.model().pouvoirs);
  protected readonly selectedCategorie = computed(() =>
    (this.categories() ?? []).find((categorie) => categorie.id === this.model().id_categorie),
  );
  protected readonly filteredPouvoirs = availableCatalog(this.pouvoirsList, this.selectedPouvoirsDraft);
  protected readonly selectedPouvoirEntries = selectedEntries(
    this.selectedPouvoirsDraft,
    this.pouvoirsList,
    (definition, entry): PouvoirEntry => ({
      id: entry.id,
      label: definition.pouvoir,
      description: definition.description || null,
      detail: entry.detail || null,
    }),
  );

  protected readonly showGeneralHint = computed(
    () => this.fieldError(this.demonForm.nom) || this.fieldError(this.demonForm.id_categorie),
  );

  constructor() {
    super();
    this.setupReferenceDefaults(
      this.selectedCategorie,
      (categorie) => categorie.id,
      (categorie) => ({
        vitalite: categorie.vitalite ?? 0,
        degats: categorie.degats ?? '0',
      }),
    );
  }

  protected onFormSubmit(event: Event): void {
    event.preventDefault();
    this.save();
  }

  protected addPouvoirEntry(event: AddMenuEvent): void {
    this.model.update((current) => ({
      ...current,
      pouvoirs: [...current.pouvoirs, {id: event.id, detail: event.detail}],
    }));
  }

  protected removePouvoir(index: number): void {
    this.model.update((current) => ({
      ...current,
      pouvoirs: current.pouvoirs.filter((_, i) => i !== index),
    }));
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
    this.model.set(demonFormDefaults());
  }

  protected hydrateForm(demon: BolDemonModel): void {
    this.hydratedReferenceId = demon.id_categorie;
    this.model.set({
      id: demon.id,
      nom: demon.nom,
      id_categorie: demon.id_categorie,
      commentaire: demon.commentaire ?? '',
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
      pouvoirs: demon.pouvoirs.map((pouvoir) => ({
        id: pouvoir.pouvoir_id,
        detail: pouvoir.detail || null,
      })),
    });
  }

  protected buildPayload(): Record<string, unknown> {
    return {...this.model(), commentaire: this.model().commentaire || null};
  }
}
