import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {applyEach, FieldTree, form, required} from '@angular/forms/signals';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolPnjService} from '../../services/bol-pnj.service';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {AddMenuComponent, addMenuOptions} from '../../shared/add-menu/add-menu.component';
import {ArmeEntry, ArmeListComponent} from '../../shared/arme/list/arme-list.component';
import {ArmureEntry, ArmureListComponent} from '../../shared/armure/list/armure-list.component';
import {CarriereEntry, CarriereListComponent} from '../../shared/carriere/list/carriere-list.component';
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {IdDraft, RankedDraft, availableCatalog, referencedIds, selectedEntries} from '../../shared/form/form-selection';
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitDraft, traitEntriesSignal} from '../../shared/trait/trait-entry.utils';
import {PnjGeneralComponent, PnjTypeOption} from './general/pnj-general.component';
import {PnjSummaryRailComponent} from './summary-rail/pnj-summary-rail.component';

/** Modèle de brouillon du formulaire PNJ (distinct de {@link BolHerosModel}, la forme persistée par l'API). */
export interface PnjFormModel {
  id: string | null;
  nom: string;
  type: 'P' | 'C' | 'R';
  joueur: string;
  /** Chaîne vide plutôt que `null` : `[formField]` sur `<textarea>` exige `Field<string>`. */
  commentaire: string;
  avatar: string | null;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  initiative: number;
  melee: number;
  tir: number;
  defense: number;
  vitalite: number;
  pouvoir: number;
  foi: number;
  vilenie: number;
  creation: number;
  armes: IdDraft[];
  armures: IdDraft[];
  carrieres: RankedDraft[];
  langues: IdDraft[];
  traits: TraitDraft[];
}

function pnjFormDefaults(): PnjFormModel {
  return {
    id: null,
    nom: '',
    type: 'P',
    joueur: 'master',
    commentaire: '',
    avatar: null,
    vigueur: 0,
    agilite: 0,
    esprit: 0,
    aura: 0,
    initiative: 0,
    melee: 0,
    tir: 0,
    defense: 0,
    vitalite: 0,
    pouvoir: 0,
    foi: 0,
    vilenie: 0,
    creation: 0,
    armes: [],
    armures: [],
    carrieres: [],
    langues: [],
    traits: [],
  };
}

const PNJ_TYPE_LABELS: Readonly<Record<'P' | 'C' | 'R', string>> = {
  P: 'Piétaille',
  C: 'Coriace',
  R: 'Rival',
};

const PNJ_TYPE_OPTIONS: readonly PnjTypeOption[] = (
  Object.entries(PNJ_TYPE_LABELS) as ['P' | 'C' | 'R', string][]
).map(([value, label]) => ({label, value}));

const PNJ_STAT_GROUPS: readonly StatGroup[] = [
  {
    key: 'attr',
    label: 'Attributs',
    columns: 2,
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
    columns: 2,
    cells: [
      {control: 'initiative', label: 'Initiative'},
      {control: 'melee', label: 'Mêlée'},
      {control: 'tir', label: 'Tir'},
      {control: 'defense', label: 'Défense'},
    ],
  },
  {
    key: 'res',
    label: 'Ressources',
    columns: 1,
    cells: [
      {control: 'vitalite', label: 'Vitalité', highlight: true},
      {control: 'vilenie', label: 'Vilénie'},
    ],
  },
];

const PNJ_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouveau PNJ',
  editTitle: 'Modifier le PNJ',
  createEyebrow: 'Galerie BOL',
  editEyebrow: 'Édition galerie BOL',
  createSubmitLabel: 'Enregistrer le PNJ',
  editSubmitLabel: 'Mettre à jour le PNJ',
  loadError: 'Le chargement du PNJ a échoué.',
  createError: 'La création du PNJ a échoué.',
  updateError: 'La mise à jour du PNJ a échoué.',
  unsavedChanges: 'Ce PNJ a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar du PNJ',
};

@Component({
  selector: 'bol-pnj-form-page',
  imports: [
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatIconModule,
    DwTagComponent,
    AddMenuComponent,
    ArmeListComponent,
    ArmureListComponent,
    CarriereListComponent,
    PnjGeneralComponent,
    StatsGridComponent,
    PnjSummaryRailComponent,
  ],
  templateUrl: './pnj-form-page.html',
  styleUrl: './pnj-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjFormPageComponent extends BolEntityFormPageBase<BolHerosModel, PnjFormModel> {
  private readonly pnjService = inject(BolPnjService);
  private readonly herosStateService = inject(BolHerosStateService);

  constructor() {
    super();
    // Armes/armures sont éditables depuis l'intendance : recharger à chaque ouverture du formulaire.
    this.herosStateService.refreshEquipmentCatalog();
  }

  protected readonly armesList = this.herosStateService.armeList;
  protected readonly armuresList = this.herosStateService.armureList;
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly languesList = this.herosStateService.langueList;
  protected readonly avantagesList = this.herosStateService.avantagesList;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;

  protected readonly labels = PNJ_FORM_LABELS;
  protected readonly typeOptions = PNJ_TYPE_OPTIONS;
  protected readonly pnjStatGroups = PNJ_STAT_GROUPS;

  protected readonly model = signal<PnjFormModel>(pnjFormDefaults());
  protected readonly pnjForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom requis'});
    required(fieldPath.type, {message: 'Type requis'});
    required(fieldPath.joueur);
    required(fieldPath.vigueur);
    required(fieldPath.agilite);
    required(fieldPath.esprit);
    required(fieldPath.aura);
    required(fieldPath.initiative);
    required(fieldPath.melee);
    required(fieldPath.tir);
    required(fieldPath.defense);
    required(fieldPath.vitalite);
    required(fieldPath.pouvoir);
    required(fieldPath.foi);
    required(fieldPath.vilenie);
    required(fieldPath.creation);

    applyEach(fieldPath.armes, (item) => required(item.id));
    applyEach(fieldPath.armures, (item) => required(item.id));
    applyEach(fieldPath.langues, (item) => required(item.id));
    applyEach(fieldPath.carrieres, (item) => {
      required(item.id);
      required(item.value);
    });
    applyEach(fieldPath.traits, (item) => {
      required(item.id);
      required(item.type);
    });
  });

  protected get entityForm() {
    return this.pnjForm;
  }

  /** Vue castée pour bol-stats-grid, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.pnjForm as unknown as FieldTree<Record<string, number>>;

  protected readonly avatarPreview = computed(() => this.model().avatar);
  protected readonly pnjNom = computed(() => this.model().nom);
  protected readonly pnjType = computed(() => this.model().type);
  protected readonly pnjVitalite = computed(() => this.model().vitalite);
  protected readonly pnjTypeLabel = computed(() => PNJ_TYPE_LABELS[this.pnjType() ?? 'P']);

  protected readonly selectedArmesDraft = computed(() => this.model().armes);
  protected readonly selectedArmuresDraft = computed(() => this.model().armures);
  protected readonly selectedCarrieresDraft = computed(() => this.model().carrieres);
  protected readonly selectedLanguesDraft = computed(() => this.model().langues);
  protected readonly selectedTraitsDraft = computed(() => this.model().traits);

  protected readonly filteredArmes = availableCatalog(this.armesList, this.selectedArmesDraft);
  protected readonly filteredArmures = availableCatalog(this.armuresList, this.selectedArmuresDraft);
  protected readonly filteredCarrieres = availableCatalog(this.carrieresList, this.selectedCarrieresDraft);
  protected readonly filteredLangues = availableCatalog(this.languesList, this.selectedLanguesDraft);
  protected readonly filteredAvantages = availableCatalog(this.avantagesList, () =>
    this.selectedTraitsDraft().filter((trait) => trait.type === 'A'),
  );
  protected readonly filteredDesavantages = availableCatalog(this.desavantagesList, () =>
    this.selectedTraitsDraft().filter((trait) => trait.type === 'D'),
  );

  protected readonly armeOptions = addMenuOptions(
    this.filteredArmes,
    (arme) => arme.arme,
    (arme) => (arme.degats ? `· Dégâts ${arme.degats}` : null),
  );
  protected readonly armureOptions = addMenuOptions(
    this.filteredArmures,
    (armure) => armure.armure,
    (armure) => (armure.protection ? `· Protection ${armure.protection}` : null),
  );
  protected readonly carriereOptions = addMenuOptions(this.filteredCarrieres, (carriere) => carriere.carriere);

  protected readonly selectedArmes = selectedEntries(
    this.selectedArmesDraft,
    this.armesList,
    (arme, entry): ArmeEntry => ({
      id: entry.id,
      label: arme.arme,
      degats: arme.degats,
      portee: arme.portee,
      notes: arme.notes,
    }),
  );
  protected readonly selectedArmures = selectedEntries(
    this.selectedArmuresDraft,
    this.armuresList,
    (armure, entry): ArmureEntry => ({
      id: entry.id,
      label: armure.armure,
      protection: armure.protection,
      malus: armure.malus,
      ptsDePouvoir: armure.pts_de_pouvoir,
    }),
  );
  protected readonly selectedCarrieres = selectedEntries(
    this.selectedCarrieresDraft,
    this.carrieresList,
    (definition, entry, index): CarriereEntry => ({
      id: entry.id,
      label: definition.carriere,
      description: definition.description || null,
      rank: this.pnjForm.carrieres[index].value,
    }),
  );
  protected readonly selectedLangues = selectedEntries(
    this.selectedLanguesDraft,
    this.languesList,
    (langue, entry): LangueEntry => ({
      id: entry.id,
      label: langue.langue,
      description: langue.description || null,
      estLemurienne: Boolean(langue.est_lemurienne),
    }),
  );
  protected readonly selectedTraitEntries = traitEntriesSignal(
    this.selectedTraitsDraft,
    this.avantagesList,
    this.desavantagesList,
  );

  protected readonly showGeneralHint = computed(
    () => this.fieldError(this.pnjForm.nom) || this.fieldError(this.pnjForm.type),
  );

  protected onFormSubmit(event: Event): void {
    event.preventDefault();
    this.save();
  }

  protected addArmeEntry(id: number): void {
    this.model.update((current) => ({...current, armes: [...current.armes, {id}]}));
  }

  protected removeArme(index: number): void {
    this.model.update((current) => ({...current, armes: current.armes.filter((_, i) => i !== index)}));
  }

  protected addArmureEntry(id: number): void {
    this.model.update((current) => ({...current, armures: [...current.armures, {id}]}));
  }

  protected removeArmure(index: number): void {
    this.model.update((current) => ({...current, armures: current.armures.filter((_, i) => i !== index)}));
  }

  protected addLangueEntry(id: number): void {
    this.model.update((current) => ({...current, langues: [...current.langues, {id}]}));
  }

  protected removeLangue(index: number): void {
    this.model.update((current) => ({...current, langues: current.langues.filter((_, i) => i !== index)}));
  }

  protected addCarriereEntry(id: number): void {
    this.model.update((current) => ({...current, carrieres: [...current.carrieres, {id, value: 0}]}));
  }

  protected removeCarriere(index: number): void {
    this.model.update((current) => ({...current, carrieres: current.carrieres.filter((_, i) => i !== index)}));
  }

  protected addTraitEntry(entry: TraitAddEvent): void {
    this.model.update((current) => ({...current, traits: [...current.traits, {id: entry.id, type: entry.type}]}));
  }

  protected removeTrait(index: number): void {
    this.model.update((current) => ({...current, traits: current.traits.filter((_, i) => i !== index)}));
  }

  protected loadEntity(id: string): Observable<BolHerosModel> {
    return this.pnjService.pnj(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.pnjService.createPnj(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.pnjService.updatePnj(payload);
  }

  protected resetForm(): void {
    this.model.set(pnjFormDefaults());
  }

  protected hydrateForm(pnj: BolHerosModel): void {
    this.model.set({
      id: pnj.id,
      nom: pnj.origines.nom ?? '',
      type: (pnj.type as 'P' | 'C' | 'R') ?? 'P',
      joueur: pnj.origines.joueur ?? 'master',
      commentaire: pnj.origines.commentaire ?? '',
      avatar: pnj.origines.avatar ?? null,
      vigueur: pnj.attributs.vigueur,
      agilite: pnj.attributs.agilite,
      esprit: pnj.attributs.esprit,
      aura: pnj.attributs.aura,
      initiative: pnj.combat.initiative,
      melee: pnj.combat.melee,
      tir: pnj.combat.tir,
      defense: pnj.combat.defense,
      vitalite: pnj.ressources.vitalite,
      pouvoir: pnj.ressources.pouvoir,
      foi: pnj.ressources.foi,
      vilenie: pnj.ressources.vilenie,
      creation: pnj.ressources.creation,
      armes: referencedIds(pnj.armes, (arme) => arme.arme_id).map((id) => ({id})),
      armures: referencedIds(pnj.armures, (armure) => armure.armure_id).map((id) => ({id})),
      langues: referencedIds(pnj.origines.langues, (langue) => langue.langue_id).map((id) => ({id})),
      carrieres: pnj.carrieres.map((carriere) => ({
        id: carriere.carriere_id ?? 0,
        value: carriere.value,
      })),
      traits: pnj.traits.map((trait) => ({
        id: trait.traitable_id,
        type: trait.type,
      })),
    });
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.model();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      type: rawValue.type,
      joueur: rawValue.joueur,
      commentaire: rawValue.commentaire || null,
      avatar: rawValue.avatar,
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      aura: rawValue.aura,
      initiative: rawValue.initiative,
      melee: rawValue.melee,
      tir: rawValue.tir,
      defense: rawValue.defense,
      vitalite: rawValue.vitalite,
      pouvoir: rawValue.pouvoir,
      foi: rawValue.foi,
      vilenie: rawValue.vilenie,
      creation: rawValue.creation,
      armes: rawValue.armes.map((arme) => ({id: arme.id})),
      armures: rawValue.armures.map((armure) => ({id: armure.id})),
      carrieres: rawValue.carrieres.map((carriere) => ({
        id: carriere.id,
        value: carriere.value,
      })),
      langues: rawValue.langues.map((langue) => ({id: langue.id})),
      traits: rawValue.traits.map((trait) => ({
        id: trait.id,
        type: trait.type,
      })),
    };
  }
}
