import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {applyEach, FieldTree, form, required} from '@angular/forms/signals';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {AddMenuComponent, AddMenuEvent} from '../../shared/add-menu/add-menu.component';
import {CapaciteEntry} from '../../shared/capacite/list/capacite-list.component';
import {BolSignalEntityFormPageBase} from '../../shared/form/entity-form-page-signal.base';
import {EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {DetailDraft, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
import {StatGroup, StatsGridFieldComponent} from '../../shared/stats-grid/stats-grid-field.component';
import {traitIconType} from '../../shared/trait-icon';
import {CreatureCapacitesComponent} from './capacites/creature-capacites.component';
import {CreatureGeneralComponent} from './general/creature-general.component';

/** Modèle de brouillon du formulaire créature (distinct de {@link BolCreatureModel}, la forme persistée par l'API). */
export interface CreatureFormModel {
  id: string | null;
  nom: string;
  id_taille: number | null;
  /** Chaîne vide plutôt que `null` : `[formField]` sur `<textarea>` exige `Field<string>`. */
  commentaire: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  vitalite: number;
  attaque: number;
  defense: number;
  degats: string;
  protection: string;
  avatar: string | null;
  capacites: DetailDraft[];
}

function creatureFormDefaults(): CreatureFormModel {
  return {
    id: null,
    nom: '',
    id_taille: null,
    commentaire: '',
    vigueur: 0,
    agilite: 0,
    esprit: 0,
    vitalite: 0,
    attaque: 0,
    defense: 0,
    degats: '0',
    protection: '0',
    avatar: null,
    capacites: [],
  };
}

const CREATURE_STAT_GROUPS: readonly StatGroup[] = [
  {
    key: 'attr',
    label: 'Attributs',
    columns: 3,
    cells: [
      {control: 'vigueur', label: 'Vigueur'},
      {control: 'agilite', label: 'Agilité'},
      {control: 'esprit', label: 'Esprit'},
    ],
  },
  {
    key: 'combat',
    label: 'Combat',
    columns: 2,
    cells: [
      {control: 'attaque', label: 'Attaque'},
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

const CREATURE_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouvelle créature',
  editTitle: 'Modifier la créature',
  createEyebrow: 'Bestiaire BOL',
  editEyebrow: 'Édition bestiaire BOL',
  createSubmitLabel: 'Enregistrer la créature',
  editSubmitLabel: 'Mettre à jour la créature',
  loadError: 'Le chargement de la créature a échoué.',
  createError: 'La création de la créature a échoué.',
  updateError: 'La mise à jour de la créature a échoué.',
  unsavedChanges: 'Cette créature a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar de la créature',
};

@Component({
  selector: 'bol-creature-form-page',
  imports: [
    MatCard,
    MatCardContent,
    MatButtonModule,
    MatIconModule,
    CreatureGeneralComponent,
    CreatureCapacitesComponent,
    StatsGridFieldComponent,
  ],
  templateUrl: './creature-form-page.html',
  styleUrl: './creature-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureFormPageComponent extends BolSignalEntityFormPageBase<BolCreatureModel, CreatureFormModel> {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly capacitesList = this.creatureStateService.capaciteList;

  protected readonly labels = CREATURE_FORM_LABELS;
  protected readonly creatureStatGroups = CREATURE_STAT_GROUPS;

  protected readonly model = signal<CreatureFormModel>(creatureFormDefaults());
  protected readonly creatureForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom requis'});
    required(fieldPath.id_taille, {message: 'Taille requise'});
    required(fieldPath.vigueur);
    required(fieldPath.agilite);
    required(fieldPath.esprit);
    required(fieldPath.vitalite);
    required(fieldPath.attaque);
    required(fieldPath.defense);
    required(fieldPath.degats);
    required(fieldPath.protection);

    applyEach(fieldPath.capacites, (capacite) => {
      required(capacite.id);
    });
  });

  protected get entityForm() {
    return this.creatureForm;
  }

  /** Vue castée pour bol-stats-grid-field, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.creatureForm as unknown as FieldTree<Record<string, number>>;

  protected readonly avatarPreview = computed(() => this.model().avatar);

  protected readonly selectedCapacitesDraft = computed(() => this.model().capacites);
  protected readonly selectedTaille = computed(() =>
    (this.tailles() ?? []).find((taille) => taille.id === this.model().id_taille),
  );
  protected readonly filteredCapacites = availableCatalog(this.capacitesList, this.selectedCapacitesDraft);
  protected readonly selectedCapaciteEntries = selectedEntries(
    this.selectedCapacitesDraft,
    this.capacitesList,
    (definition, entry): CapaciteEntry => ({
      id: entry.id,
      label: definition.capacite,
      description: definition.description || null,
      detail: entry.detail || null,
      icon: traitIconType(definition),
      tone: definition.de_bonus ? 'positive' : definition.de_malus ? 'negative' : 'neutral',
    }),
  );

  protected readonly showGeneralHint = computed(
    () => this.fieldError(this.creatureForm.nom) || this.fieldError(this.creatureForm.id_taille),
  );

  constructor() {
    super();
    this.setupReferenceDefaults(
      this.selectedTaille,
      (taille) => taille.id,
      (taille) => ({
        vigueur: taille.vigueur ?? 0,
        vitalite: taille.vitalite ?? 0,
        degats: taille.degats ?? '0',
      }),
    );
  }

  protected onFormSubmit(event: Event): void {
    event.preventDefault();
    this.save();
  }

  protected addCapaciteEntry(event: AddMenuEvent): void {
    this.model.update((current) => ({
      ...current,
      capacites: [...current.capacites, {id: event.id, detail: event.detail}],
    }));
  }

  protected removeCapacite(index: number): void {
    this.model.update((current) => ({
      ...current,
      capacites: current.capacites.filter((_, i) => i !== index),
    }));
  }

  protected loadEntity(id: string): Observable<BolCreatureModel> {
    return this.creaturesService.creature(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.creaturesService.createCreature(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.creaturesService.updateCreature(payload);
  }

  protected resetForm(): void {
    this.hydratedReferenceId = null;
    this.model.set(creatureFormDefaults());
  }

  protected hydrateForm(creature: BolCreatureModel): void {
    this.hydratedReferenceId = creature.id_taille;
    this.model.set({
      id: creature.id,
      nom: creature.nom,
      id_taille: creature.id_taille,
      commentaire: creature.commentaire ?? '',
      vigueur: creature.vigueur,
      agilite: creature.agilite,
      esprit: creature.esprit,
      vitalite: creature.vitalite,
      attaque: creature.attaque,
      defense: creature.defense,
      degats: creature.degats,
      protection: creature.protection,
      avatar: creature.avatar,
      capacites: creature.capacites.map((capacite) => ({
        id: capacite.capacite_id,
        detail: capacite.detail || null,
      })),
    });
  }

  protected buildPayload(): Record<string, unknown> {
    return {...this.model(), commentaire: this.model().commentaire || null};
  }
}
