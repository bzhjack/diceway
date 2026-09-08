import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {applyEach, FieldTree, FormField, form, min, minLength, required, validate, validateTree} from '@angular/forms/signals';
import {Observable, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {PictureComponent} from '../../../shared/picture/picture';
import {AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, AVANTAGE_POUVOIR_DU_NEANT_ID} from '../../bol-rules.constants';
import {BolCarriereModel} from '../../models/bol-carriere.model';
import {BolHerosAttributs, BolHerosCombat, BolHerosModel, BolHerosOrigines, BolHerosRessources} from '../../models/bol-heros.model';
import {BolHerosTraitsModel} from '../../models/bol-trait.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolHerosStateService, HeroCreationWarning} from '../../services/bol-heros-state.service';
import {addMenuOptions} from '../../shared/add-menu/add-menu.component';
import {ArmeEntry} from '../../shared/arme/list/arme-list.component';
import {ArmureEntry} from '../../shared/armure/list/armure-list.component';
import {CarriereEntry} from '../../shared/carriere/list/carriere-list.component';
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {ArmureDraft, IdDraft, RankedDraft, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup} from '../../shared/stats-grid/stats-grid.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitEntry} from '../../shared/trait/list/trait-list.component';
import {traitDetails} from '../../shared/trait/trait-entry.utils';
import {traitIconType} from '../../shared/trait-icon';
import {HeroSummaryRailComponent} from '../form/summary-rail/summary-rail.component';
import {HeroAdvancedArmesPanelComponent} from './armes-panel/armes-panel.component';
import {HeroAdvancedArmuresPanelComponent} from './armures-panel/armures-panel.component';
import {HeroAdvancedCarrieresPanelComponent} from './carrieres-panel/carrieres-panel.component';
import {automaticLanguageIdsForRegion, selectedLanguageTarget} from './create.rules';
import {HeroAdvancedCreateTools} from './create.tools';
import {
  attributRangeErrors,
  attributsBudgetErrors,
  carriereRangeErrors,
  carrieresBudgetErrors,
  combatBudgetErrors,
} from './create.validators';
import {HeroAdvancedIdentiteComponent} from './identite/identite.component';
import {HeroAdvancedRegionComponent, HeroAdvancedRegionDialogResult} from './region/region.component';
import {HeroAdvancedRessourcesPanelComponent, ResourceEntry} from './ressources-panel/ressources-panel.component';
import {SectionMessage} from './section-message';
import {HeroAdvancedStatsPanelComponent} from './stats-panel/stats-panel.component';

/** Brouillon de trait dans le modèle : `id` est l'id du lien héros/trait côté serveur. */
interface AdvancedTraitDraft {
  id: number | null;
  traitable_id: number;
  type: 'A' | 'D';
  detail: string | null;
  region_id: number | null;
  carriere: boolean;
}

/** Modèle de brouillon du formulaire héros (création avancée), distinct de {@link BolHerosModel}. */
export interface HeroAdvancedFormModel {
  id: string | null;
  user_id: string | null;
  active: boolean;
  type: 'H';
  nom: string;
  joueur: string;
  region_id: number | null;
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
  heroisme: number;
  foi: number;
  pouvoir: number;
  creation: number;
  experience: number;
  vilenie: number;
  armes: IdDraft[];
  armures: ArmureDraft[];
  langues: IdDraft[];
  carrieres: RankedDraft[];
  traits: AdvancedTraitDraft[];
}

function heroAdvancedFormDefaults(): HeroAdvancedFormModel {
  return {
    id: null,
    user_id: null,
    active: false,
    type: 'H',
    nom: '',
    joueur: '',
    region_id: null,
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
    vitalite: 10,
    heroisme: 5,
    foi: 0,
    pouvoir: 0,
    creation: 0,
    experience: 0,
    vilenie: 0,
    armes: [],
    armures: [],
    langues: [],
    carrieres: [],
    traits: [],
  };
}

const MAX_CREATION_AVANTAGES = 3;

const ADVANCED_STAT_GROUPS: readonly StatGroup[] = [
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
];

const HERO_ADVANCED_LABELS: EntityFormLabels = {
  createTitle: 'Démarrer une création avancée',
  editTitle: 'Création avancée du héros',
  createEyebrow: 'Création guidée',
  editEyebrow: 'Création guidée',
  createSubmitLabel: 'Démarrer la création guidée',
  editSubmitLabel: 'Enregistrer',
  loadError: 'Le chargement du héros a échoué.',
  createError: "Impossible d'enregistrer le héros pour le moment.",
  updateError: "Impossible d'enregistrer le héros pour le moment.",
  unsavedChanges: 'Ce héros a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar du héros',
};

/**
 * Création avancée d'un héros : contrairement au formulaire simple, chaque
 * sous-ressource (trait, carrière, arme, armure, langue) est persistée
 * immédiatement via l'API, et les règles de création (budgets E11/E12,
 * contraintes régionales, quota de langues) sont vérifiées en continu.
 */
@Component({
  selector: 'bol-hero-advanced-page',
  imports: [
    FormField,
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    HeroSummaryRailComponent,
    HeroAdvancedIdentiteComponent,
    HeroAdvancedCarrieresPanelComponent,
    HeroAdvancedStatsPanelComponent,
    HeroAdvancedRessourcesPanelComponent,
    HeroAdvancedArmesPanelComponent,
    HeroAdvancedArmuresPanelComponent,
  ],
  templateUrl: './hero-advanced-page.html',
  styleUrl: './hero-advanced-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedPageComponent extends BolEntityFormPageBase<BolHerosModel, HeroAdvancedFormModel> {
  private readonly herosService = inject(BolHerosService);
  private readonly herosStateService = inject(BolHerosStateService);

  protected readonly labels = HERO_ADVANCED_LABELS;
  protected readonly heroStatGroups = ADVANCED_STAT_GROUPS;

  protected readonly armesList = this.herosStateService.armeList;
  protected readonly armuresList = this.herosStateService.armureList;
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly languesList = this.herosStateService.langueList;
  protected readonly avantagesList = this.herosStateService.avantagesList;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;
  protected readonly regionList = this.herosStateService.regionList;

  protected readonly warnCount = this.herosStateService.warnCount;
  protected readonly modifiers = this.herosStateService.traitsModifiers;
  protected readonly heroismCost = this.herosStateService.heroismCost;
  protected readonly carriereDesavantageCount = this.herosStateService.carriereDesavantageCount;
  protected readonly combatBudget = this.herosStateService.combatBudget;
  protected readonly carriereBudget = this.herosStateService.carriereBudget;

  // Étape 1 : brouillon minimal, la création avancée travaille sur un héros existant.
  protected readonly draftModel = signal({joueur: '', nom: ''});
  protected readonly draftForm = form(this.draftModel, (fieldPath) => {
    required(fieldPath.joueur, {message: 'Nom du joueur requis'});
    minLength(fieldPath.joueur, 3, {message: 'Minimum 3 caractères'});
    required(fieldPath.nom, {message: 'Nom du héros requis'});
    minLength(fieldPath.nom, 3, {message: 'Minimum 3 caractères'});
  });
  protected readonly creatingDraft = signal(false);
  /** Une mutation de sous-ressource (trait, carrière, arme…) est en cours côté API. */
  protected readonly mutating = signal(false);

  protected readonly model = signal<HeroAdvancedFormModel>(heroAdvancedFormDefaults());
  protected readonly heroForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom du héros requis'});
    required(fieldPath.joueur, {message: 'Nom du joueur requis'});
    required(fieldPath.region_id, {message: 'Région requise'});
    min(fieldPath.region_id, 1);

    validate(fieldPath.vigueur, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.agilite, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.esprit, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.aura, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.initiative, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.melee, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.tir, ({value}) => attributRangeErrors(value()));
    validate(fieldPath.defense, ({value}) => attributRangeErrors(value()));

    applyEach(fieldPath.armes, (item) => required(item.id));
    applyEach(fieldPath.armures, (item) => required(item.id));
    applyEach(fieldPath.langues, (item) => required(item.id));
    applyEach(fieldPath.carrieres, (item) => {
      required(item.id);
      validate(item.value, ({value}) => carriereRangeErrors(value()));
    });
    applyEach(fieldPath.traits, (item) => {
      required(item.traitable_id);
      required(item.type);
    });

    // Budgets dynamiques (E11 Non-combattant) : combatBudget()/carriereBudget() sont lus en
    // direct dans le validateur, qui se réévalue automatiquement à chaque changement — pas
    // besoin de ré-appliquer les validateurs manuellement comme en Reactive Forms.
    validateTree(fieldPath, ({value}) => {
      const errors = attributsBudgetErrors(value());
      return errors.length ? errors : null;
    });
    validateTree(fieldPath, ({value}) => {
      const errors = combatBudgetErrors(value(), this.combatBudget());
      return errors.length ? errors : null;
    });
    validateTree(fieldPath, ({value}) => {
      const errors = carrieresBudgetErrors(
        value().carrieres.map((carriere) => carriere.value),
        this.carriereBudget(),
      );
      return errors.length ? errors : null;
    });
  });

  protected get entityForm() {
    return this.heroForm;
  }

  /** Vue castée pour bol-stats-grid, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.heroForm as unknown as FieldTree<Record<string, number>>;

  protected readonly avatarPreview = computed(() => this.model().avatar);
  protected readonly heroNom = computed(() => this.model().nom);
  protected readonly heroJoueur = computed(() => this.model().joueur);
  protected readonly activeValue = computed(() => this.model().active);
  private readonly regionIdValue = computed(() => this.model().region_id);
  private readonly vigueurValue = computed(() => this.model().vigueur);

  protected readonly selectedArmesDraft = computed(() => this.model().armes);
  protected readonly selectedArmuresDraft = computed(() => this.model().armures);
  protected readonly selectedLanguesDraft = computed(() => this.model().langues);
  protected readonly selectedCarrieresDraft = computed(() => this.model().carrieres);
  protected readonly selectedTraitsDraft = computed(() => this.model().traits);

  protected readonly selectedRegion = computed(() => {
    const regionId = this.regionIdValue();
    if (regionId === null) {
      return null;
    }

    return (this.regionList() ?? []).find((region) => Number(region.id) === Number(regionId)) ?? null;
  });

  /** Héros courant reconstruit depuis le formulaire, pour le BolHerosStateService. */
  private readonly currentHero = computed(() => this.buildHero());

  // Traits : catalogues généraux fusionnés avec les variantes régionales (même id → la régionale gagne).
  protected readonly mergedAvantages = computed(() =>
    Object.values({
      ...HeroAdvancedCreateTools.toObject(this.avantagesList() ?? []),
      ...HeroAdvancedCreateTools.toObject(this.herosStateService.regionalAvantages()),
    }),
  );
  protected readonly mergedDesavantages = computed(() =>
    Object.values({
      ...HeroAdvancedCreateTools.toObject(this.desavantagesList() ?? []),
      ...HeroAdvancedCreateTools.toObject(this.herosStateService.regionalDesavantages()),
    }),
  );

  private readonly avantageDrafts = computed(() => this.selectedTraitsDraft().filter((trait) => trait.type === 'A'));
  private readonly desavantageDrafts = computed(() =>
    this.selectedTraitsDraft().filter((trait) => trait.type === 'D' && !trait.carriere),
  );
  private readonly regionalAvantageDrafts = computed(() =>
    this.avantageDrafts().filter((trait) => (trait.region_id ?? 0) > 0),
  );
  private readonly regionalDesavantageDrafts = computed(() =>
    this.desavantageDrafts().filter((trait) => (trait.region_id ?? 0) > 0),
  );
  private readonly generalDesavantageDrafts = computed(() =>
    this.desavantageDrafts().filter((trait) => (trait.region_id ?? 0) <= 0),
  );

  protected readonly availableAvantages = computed(() => {
    if (this.avantageDrafts().length >= MAX_CREATION_AVANTAGES) {
      return [];
    }

    const selectedIds = this.avantageDrafts().map((trait) => Number(trait.traitable_id));
    return this.mergedAvantages().filter((avantage) => !selectedIds.includes(Number(avantage.id)));
  });
  protected readonly availableDesavantages = computed(() => {
    const selectedIds = this.selectedTraitsDraft()
      .filter((trait) => trait.type === 'D')
      .map((trait) => Number(trait.traitable_id));
    return this.mergedDesavantages().filter((desavantage) => !selectedIds.includes(Number(desavantage.id)));
  });

  protected readonly selectedTraitEntries = computed(() =>
    this.selectedTraitsDraft().map((draft): TraitEntry => {
      const source =
        draft.type === 'A'
          ? this.mergedAvantages().find((avantage) => Number(avantage.id) === Number(draft.traitable_id))
          : this.mergedDesavantages().find((desavantage) => Number(desavantage.id) === Number(draft.traitable_id));
      const details = [...(source ? traitDetails(source) : [])];
      if (draft.detail) {
        details.unshift({title: 'Détail', description: draft.detail});
      }

      return {
        id: Number(draft.id ?? draft.traitable_id),
        type: draft.type,
        label: source
          ? 'avantage' in source
            ? source.avantage
            : source.desavantage
          : `Trait #${draft.traitable_id}`,
        details,
        icon: traitIconType(source),
        badge: draft.carriere ? 'career' : (draft.region_id ?? 0) > 0 ? 'region' : null,
      };
    }),
  );

  // Carrières
  protected readonly filteredCarrieres = availableCatalog(this.carrieresList, this.selectedCarrieresDraft);
  protected readonly carriereOptions = addMenuOptions(this.filteredCarrieres, (carriere) => carriere.carriere);
  protected readonly selectedCarrieres = selectedEntries(
    this.selectedCarrieresDraft,
    this.carrieresList,
    (definition, entry, index): CarriereEntry => ({
      id: entry.id,
      label: definition.carriere,
      description: definition.description || null,
      rank: this.heroForm.carrieres[index].value,
    }),
  );
  protected readonly careerDesavantageOptions = addMenuOptions(
    computed(() => {
      const takenIds = this.selectedTraitsDraft()
        .filter((trait) => trait.type === 'D')
        .map((trait) => Number(trait.traitable_id));
      return (this.desavantagesList() ?? []).filter((desavantage) => !takenIds.includes(Number(desavantage.id)));
    }),
    (desavantage) => desavantage.desavantage,
  );

  // Armes / armures
  protected readonly filteredArmes = availableCatalog(this.armesList, this.selectedArmesDraft);
  protected readonly filteredArmures = availableCatalog(this.armuresList, this.selectedArmuresDraft);
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
      categorie: armure.categorie,
      equipee: entry.equipee,
      malusAgilite: armure.malus_agilite,
      malusInitiative: armure.malus_initiative,
    }),
  );

  private readonly agiliteMalusTotal = computed(() =>
    this.selectedArmures()
      .filter((armure) => armure.equipee)
      .reduce((sum, armure) => sum + armure.malusAgilite, 0),
  );

  private readonly initiativeMalusTotal = computed(() =>
    this.selectedArmures()
      .filter((armure) => armure.equipee)
      .reduce((sum, armure) => sum + armure.malusInitiative, 0),
  );

  // E13 : arme lourde (d6B) avec vigueur négative.
  protected readonly warnHeavyArme = computed(
    () => Number(this.vigueurValue()) < 0 && this.selectedArmes().some((arme) => arme.degats?.startsWith('d6B')),
  );

  // Langues : lémurien + langue natale d'office, quota selon esprit/carrières/origine.
  private readonly selectedLangueIds = computed(() => this.selectedLanguesDraft().map((draft) => Number(draft.id)));
  private readonly automaticLangueIds = computed(() =>
    automaticLanguageIdsForRegion(this.selectedRegion(), this.languesList()),
  );
  protected readonly automaticLangueLabels = computed(() =>
    this.automaticLangueIds()
      .map((langueId) => (this.languesList() ?? []).find((langue) => Number(langue.id) === langueId)?.langue)
      .filter((label): label is string => Boolean(label)),
  );
  /** Carrières sélectionnées enrichies de leur définition (pour donne_langue et l'état courant). */
  private readonly carrieresForRules = computed(() =>
    this.selectedCarrieresDraft().map((draft) => ({
      carriere_id: Number(draft.id),
      value: Number(draft.value ?? 0),
      carriere: (this.carrieresList() ?? []).find((carriere) => Number(carriere.id) === Number(draft.id)),
    })),
  );
  private readonly langueTarget = computed(() =>
    selectedLanguageTarget(
      this.selectedRegion(),
      Number(this.model().esprit ?? 0),
      this.carrieresForRules(),
      this.languesList(),
    ),
  );
  private readonly langueRemaining = computed(() => this.langueTarget() - this.selectedLangueIds().length);
  protected readonly availableLangues = computed(() =>
    (this.languesList() ?? []).filter(
      (langue) =>
        !this.selectedLangueIds().includes(Number(langue.id)) &&
        !this.automaticLangueIds().includes(Number(langue.id)),
    ),
  );
  protected readonly languesHint = computed(() => {
    const remaining = this.langueRemaining();
    return remaining > 0 ? `Encore ${remaining} langue(s) à choisir.` : null;
  });
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

  // Erreurs et avertissements par section (affichés dans les panneaux, agrégés dans le service).
  protected readonly originesErrors = computed<SectionMessage[]>(() => {
    const model = this.model();
    const errors: SectionMessage[] = [];
    if (!model.joueur) {
      errors.push({control: 'Joueur', error: 'Le nom du joueur est requis.'});
    }
    if (!model.nom) {
      errors.push({control: 'Nom', error: 'Le nom du héros est requis.'});
    }
    if (!model.region_id) {
      errors.push({control: 'Région', error: 'Une région doit être choisie.'});
    }

    return errors;
  });
  protected readonly originesWarns = computed<HeroCreationWarning[]>(() => {
    if (!this.originesErrors().length && !this.regionIdValue()) {
      return [{step: 'Région', warn: 'Vous devez choisir une région.'}];
    }

    return [];
  });

  protected readonly attributErrors = computed<SectionMessage[]>(() => {
    const model = this.model();
    const errors = this.rangeErrors([
      ['vigueur', model.vigueur],
      ['agilite', model.agilite],
      ['esprit', model.esprit],
      ['aura', model.aura],
    ]);
    for (const issue of attributsBudgetErrors(model)) {
      errors.push({control: '', error: issue.message});
    }

    return errors;
  });
  protected readonly attributWarns = computed<HeroCreationWarning[]>(() => {
    if (this.attributErrors().length) {
      return [];
    }

    const raw = this.model();
    const sum = Number(raw.vigueur) + Number(raw.agilite) + Number(raw.esprit) + Number(raw.aura);
    return sum < 4 ? [{step: 'Attributs', warn: `Il manque ${4 - sum} point(s) dans les attributs.`}] : [];
  });

  protected readonly combatErrors = computed<SectionMessage[]>(() => {
    const model = this.model();
    const errors = this.rangeErrors([
      ['initiative', model.initiative],
      ['melee', model.melee],
      ['tir', model.tir],
      ['defense', model.defense],
    ]);
    for (const issue of combatBudgetErrors(model, this.combatBudget())) {
      errors.push({control: '', error: issue.message});
    }

    return errors;
  });
  protected readonly combatWarns = computed<HeroCreationWarning[]>(() => {
    if (this.combatErrors().length) {
      return [];
    }

    const raw = this.model();
    const budget = this.combatBudget();
    const sum = Number(raw.initiative) + Number(raw.melee) + Number(raw.tir) + Number(raw.defense);
    if (sum >= budget) {
      return [];
    }

    const prefix = this.herosStateService.isNonCombattant() ? '⚔ Non-combattant — ' : '';
    return [{step: 'Combat', warn: `${prefix}Il manque ${budget - sum} point(s) dans le combat (budget : ${budget}).`}];
  });

  /** Panneau Attributs / Combat : fusion des deux jeux d'erreurs/avertissements pour l'affichage. */
  protected readonly statsErrors = computed(() => [...this.attributErrors(), ...this.combatErrors()]);
  protected readonly statsWarns = computed(() => [...this.attributWarns(), ...this.combatWarns()]);

  protected readonly carriereErrors = computed<SectionMessage[]>(() => {
    const errors: SectionMessage[] = [];
    for (const draft of this.selectedCarrieresDraft()) {
      const issue = carriereRangeErrors(draft.value);
      if (issue) {
        const definition = this.carriereFromId(draft.id);
        errors.push({control: definition?.carriere ?? '', error: issue.message});
      }
    }

    const budget = this.carriereBudget();
    for (const issue of carrieresBudgetErrors(
      this.selectedCarrieresDraft().map((draft) => draft.value),
      budget,
    )) {
      errors.push({control: '', error: issue.message});
    }

    return errors;
  });
  protected readonly carriereWarns = computed<HeroCreationWarning[]>(() => {
    if (this.carriereErrors().length) {
      return [];
    }

    const warnings: HeroCreationWarning[] = [];
    const drafts = this.selectedCarrieresDraft();
    if (drafts.length !== 4) {
      warnings.push({step: 'Carrières', warn: 'Vous devez choisir 4 carrières.'});
    }

    const budget = this.carriereBudget();
    const sum = drafts.reduce((total, draft) => total + Number(draft.value ?? 0), 0);
    if (sum < budget) {
      warnings.push({step: 'Carrières', warn: `Il manque ${budget - sum} point(s) dans les carrières (budget : ${budget}).`});
    }

    if (this.carriereDesavantageCount()) {
      warnings.push({
        step: 'Traits',
        warn: `Carrière dangereuse : il faut encore ${this.carriereDesavantageCount()} désavantage(s) supplémentaire(s).`,
      });
    }

    const region = this.selectedRegion();
    const selectedIds = drafts.map((draft) => Number(draft.id));
    if (region?.premiere_carriere_id && selectedIds.length > 0 && selectedIds[0] !== region.premiere_carriere_id) {
      warnings.push({
        step: 'Carrières',
        warn: `Pour cette origine, la première carrière doit être ${
          region.premiere_carriere?.carriere ?? this.carriereFromId(region.premiere_carriere_id)?.carriere ?? 'requise'
        }.`,
      });
    }
    for (const requiredId of region?.carrieres_requises ?? []) {
      if (!selectedIds.includes(requiredId)) {
        warnings.push({
          step: 'Carrières',
          warn: `Pour cette origine, la carrière ${this.carriereFromId(requiredId)?.carriere ?? 'requise'} doit être choisie.`,
        });
      }
    }
    for (const forbiddenId of region?.carrieres_interdites ?? []) {
      if (selectedIds.includes(forbiddenId)) {
        warnings.push({
          step: 'Carrières',
          warn: `Pour cette origine, la carrière ${this.carriereFromId(forbiddenId)?.carriere ?? 'interdite'} n'est pas autorisée.`,
        });
      }
    }

    return warnings;
  });

  protected readonly traitWarns = computed<HeroCreationWarning[]>(() => {
    const warnings: HeroCreationWarning[] = [];
    const avantages = this.avantageDrafts();
    if (!avantages.length) {
      warnings.push({step: 'Traits', warn: 'Vous devez choisir au moins un avantage.'});
    }
    if (avantages.length > MAX_CREATION_AVANTAGES) {
      warnings.push({step: 'Traits', warn: 'Un héros ne peut pas avoir plus de trois avantages à la création.'});
    }

    if (this.herosStateService.regionalAvantages().length && !this.regionalAvantageDrafts().length) {
      warnings.push({step: 'Traits', warn: 'Vous devez choisir au moins un avantage régional.'});
    }

    if (avantages.length >= 2 && this.regionalDesavantageDrafts().length === 0) {
      warnings.push({step: 'Traits', warn: "Le 2e avantage exige un désavantage régional ou coûte 1 point d'héroïsme."});
    }
    if (avantages.length >= 3 && this.generalDesavantageDrafts().length === 0) {
      warnings.push({step: 'Traits', warn: "Le 3e avantage exige un désavantage général ou coûte 1 point d'héroïsme."});
    }

    // E12 : avantages spéciaux exigeant chacun un désavantage général supplémentaire.
    const avantageIds = avantages.map((trait) => Number(trait.traitable_id));
    const specialNames = [AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, AVANTAGE_POUVOIR_DU_NEANT_ID]
      .filter((id) => avantageIds.includes(id))
      .map((id) => this.mergedAvantages().find((avantage) => Number(avantage.id) === id)?.avantage ?? `Avantage #${id}`);
    const extraRequired = this.herosStateService.specialAvantageDesavantageRequired();
    const extraActual = this.generalDesavantageDrafts().length;
    if (extraRequired > 0 && extraActual < extraRequired) {
      warnings.push({
        step: 'Traits',
        warn: `${specialNames.join(', ')} exige(nt) encore ${extraRequired - extraActual} désavantage(s) général(aux) supplémentaire(s).`,
      });
    }

    return warnings;
  });

  protected readonly langueErrors = computed<SectionMessage[]>(() => {
    if (this.selectedRegion() && this.langueTarget() === 0) {
      return [];
    }

    const remaining = this.langueRemaining();
    if (remaining < 0) {
      return [{control: 'Langues', error: `Vous avez ${Math.abs(remaining)} langue(s) en trop.`}];
    }

    return [];
  });
  protected readonly langueWarns = computed<HeroCreationWarning[]>(() => {
    if (!this.langueErrors().length && this.langueRemaining() > 0) {
      return [{step: 'Langues', warn: `Vous devez encore choisir ${this.langueRemaining()} langue(s).`}];
    }

    return [];
  });

  // Ressources affichées : valeurs de base + modificateurs de traits/carrières (appliqués à l'activation).
  protected readonly displayResources = computed<readonly ResourceEntry[]>(() => {
    const ressources = {...this.currentHero().ressources};
    for (const modifier of this.modifiers()) {
      if (modifier.attr in ressources) {
        const key = modifier.attr as keyof BolHerosRessources;
        ressources[key] = Number(ressources[key]) + Number(modifier.value);
      }
    }

    return [
      {key: 'vitalite', label: 'Vitalité', value: ressources.vitalite},
      {key: 'heroisme', label: 'Héroïsme', value: ressources.heroisme},
      {key: 'pouvoir', label: 'Pouvoir', value: ressources.pouvoir},
      {key: 'foi', label: 'Foi', value: ressources.foi},
      {key: 'creation', label: 'Création', value: ressources.creation},
      {key: 'experience', label: 'Expérience', value: ressources.experience},
    ];
  });
  protected readonly railVitalite = computed(
    () => this.displayResources().find((entry) => entry.key === 'vitalite')?.value ?? 10,
  );
  protected readonly railHeroisme = computed(
    () => this.displayResources().find((entry) => entry.key === 'heroisme')?.value ?? 5,
  );

  protected readonly submitDisabled = computed(
    () => this.pending() || this.loading() || this.heroForm().invalid() || this.langueErrors().length > 0,
  );
  protected readonly activateDisabled = computed(
    () => this.submitDisabled() || this.warnCount() > 0 || this.activeValue(),
  );

  constructor() {
    super();

    // Armes/armures sont éditables depuis l'intendance : recharger à chaque ouverture du formulaire.
    this.herosStateService.refreshEquipmentCatalog();

    // Le service d'état alimente budgets, modificateurs et règles régionales.
    effect(() => {
      if (!this.editMode()) {
        this.herosStateService.currentHeros.set(null);
        return;
      }

      const hero = this.currentHero();
      if (hero.id) {
        this.herosStateService.currentHeros.set(hero);
      }
    });

    effect(() => {
      if (!this.editMode()) {
        this.herosStateService.clearWarnings();
        return;
      }

      this.herosStateService.setWarnOrigines(this.originesWarns());
      this.herosStateService.setWarnAttrs(this.attributWarns());
      this.herosStateService.setWarnCombat(this.combatWarns());
      this.herosStateService.setWarnCarrieres(this.carriereWarns());
      this.herosStateService.setWarnTraits(this.traitWarns());
      this.herosStateService.setWarnLangues(this.langueWarns());
    });
  }

  private rangeErrors(fields: ReadonlyArray<readonly [string, number]>): SectionMessage[] {
    const errors: SectionMessage[] = [];
    for (const [name, value] of fields) {
      const issue = attributRangeErrors(value);
      if (issue) {
        errors.push({control: HeroAdvancedCreateTools.translate(name), error: issue.message});
      }
    }

    return errors;
  }

  // --- Étape 1 : brouillon ---

  protected onDraftSubmit(event: Event): void {
    event.preventDefault();
    this.startDraft();
  }

  protected startDraft(): void {
    if (this.creatingDraft() || this.draftForm().invalid()) {
      return;
    }

    this.creatingDraft.set(true);
    this.herosService
      .createHerosAdvanced({
        joueur: this.draftModel().joueur,
        nom: this.draftModel().nom,
        type: 'H',
        active: false,
      })
      .pipe(finalize(() => this.creatingDraft.set(false)))
      .subscribe({
        next: (hero) => {
          void this.router.navigate(['/create/hero-advanced', hero.id], {
            state: this.returnUrl() ? {returnUrl: this.returnUrl()!} : undefined,
          });
        },
        error: (error: unknown) => this.errorMessage.set(extractApiErrorMessage(error, this.labels.createError)),
      });
  }

  // --- Sauvegarde / activation ---

  protected override save(): void {
    this.submit(false);
  }

  protected onFormSubmit(event: Event): void {
    event.preventDefault();
    this.save();
  }

  protected confirmActivation(): void {
    confirmDialog(this.dialog, {
      title: 'Activer le héros',
      message: 'Voulez-vous valider la création de ce héros ?',
      confirmLabel: 'Oui',
      cancelLabel: 'Non',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.submit(true);
      }
    });
  }

  private submit(activate: boolean): void {
    if (!this.editMode()) {
      return;
    }

    const hero = activate ? this.buildActivatedHero() : this.buildHero();
    const payload = {...this.toPayload(hero), active: activate || hero.active};

    this.performSave(payload, () => {
      const returnUrl = this.returnUrl();
      if (returnUrl) {
        void this.router.navigateByUrl(returnUrl);
        return;
      }

      void this.router.navigate(['/library/heroes']);
    });
  }

  /** À l'activation, applique les modificateurs de traits/carrières aux valeurs enregistrées. */
  private buildActivatedHero(): BolHerosModel {
    const hero = this.buildHero();
    const combat = {...hero.combat};
    const attributs = {...hero.attributs};
    const ressources = {...hero.ressources};

    for (const modifier of this.modifiers()) {
      const key = modifier.attr;
      if (key in ressources) {
        const resKey = key as keyof BolHerosRessources;
        ressources[resKey] = Number(ressources[resKey]) + Number(modifier.value);
      } else if (key in combat) {
        const combatKey = key as keyof BolHerosCombat;
        combat[combatKey] = Number(combat[combatKey]) + Number(modifier.value);
      } else if (key in attributs) {
        const attrKey = key as keyof BolHerosAttributs;
        attributs[attrKey] = Number(attributs[attrKey]) + Number(modifier.value);
      }
    }

    return {...hero, active: true, combat, attributs, ressources};
  }

  protected loadEntity(id: string): Observable<BolHerosModel> {
    return this.herosService.heros(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.createHerosAdvanced(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.updateHerosAdvanced(payload);
  }

  protected buildPayload(): Record<string, unknown> {
    return this.toPayload(this.buildHero());
  }

  /** La validation backend attend nom et joueur à la racine (le contrôleur lit ensuite origines.*). */
  private toPayload(hero: BolHerosModel): Record<string, unknown> {
    return {...hero, nom: hero.origines.nom, joueur: hero.origines.joueur};
  }

  private buildHero(): BolHerosModel {
    const raw = this.model();
    const langues = raw.langues.map((langue) => Number(langue.id));

    return {
      id: raw.id,
      user_id: raw.user_id,
      active: Boolean(raw.active),
      type: 'H',
      origines: {
        avatar: raw.avatar,
        nom: raw.nom || null,
        region_id: raw.region_id,
        joueur: raw.joueur || null,
        langues,
        commentaire: raw.commentaire || null,
      },
      ressources: {
        vitalite: raw.vitalite,
        heroisme: raw.heroisme,
        foi: raw.foi,
        pouvoir: raw.pouvoir,
        creation: raw.creation,
        experience: raw.experience,
        vilenie: raw.vilenie,
      },
      combat: {
        initiative: raw.initiative,
        initiative_effective: raw.initiative - this.initiativeMalusTotal(),
        melee: raw.melee,
        tir: raw.tir,
        defense: raw.defense,
        defense_effective: raw.defense,
      },
      attributs: {
        vigueur: raw.vigueur,
        agilite: raw.agilite,
        agilite_effective: raw.agilite - this.agiliteMalusTotal(),
        esprit: raw.esprit,
        aura: raw.aura,
      },
      equipement_effectif: {bouclier_malus_attaque_subie: 0, bouclier_malus_attaque_subie_portee: null},
      traits: raw.traits.map((trait) => ({
        id: trait.id ?? undefined,
        traitable_id: trait.traitable_id,
        type: trait.type,
        detail: trait.detail,
        region_id: trait.region_id,
        carriere: trait.carriere,
      })),
      carrieres: raw.carrieres.map((carriere) => ({
        carriere_id: Number(carriere.id),
        value: Number(carriere.value ?? 0),
      })),
      langues,
      armes: raw.armes.map((arme) => Number(arme.id)),
      armures: raw.armures.map((armure) => Number(armure.id)),
    };
  }

  protected hydrateForm(hero: BolHerosModel): void {
    const armes = (hero.armes ?? []).map((arme) => ({id: Number(typeof arme === 'number' ? arme : arme.arme_id)}));
    const armures = (hero.armures ?? []).map((armure) => ({
      id: Number(typeof armure === 'number' ? armure : armure.armure_id),
      equipee: typeof armure === 'number' ? false : Boolean(armure.equipee),
    }));
    const langues = (hero.langues ?? hero.origines.langues ?? []).map((langue) => ({
      id: Number(typeof langue === 'number' ? langue : langue.langue_id),
    }));
    const carrieres = (hero.carrieres ?? []).map((carriere) => ({
      id: Number(carriere.carriere_id),
      value: Number(carriere.value ?? 0),
    }));
    const traits = (hero.traits ?? []).map((trait) => this.toTraitDraft(trait));

    this.model.set({
      id: hero.id,
      user_id: hero.user_id,
      active: hero.active,
      type: 'H',
      nom: hero.origines.nom ?? '',
      joueur: hero.origines.joueur ?? '',
      region_id: hero.origines.region_id ? Number(hero.origines.region_id) : null,
      commentaire: hero.origines.commentaire ?? '',
      avatar: hero.origines.avatar ?? null,
      vigueur: Number(hero.attributs.vigueur),
      agilite: Number(hero.attributs.agilite),
      esprit: Number(hero.attributs.esprit),
      aura: Number(hero.attributs.aura),
      initiative: Number(hero.combat.initiative),
      melee: Number(hero.combat.melee),
      tir: Number(hero.combat.tir),
      defense: Number(hero.combat.defense),
      // Avant activation, vitalité et héroïsme restent aux valeurs de base ;
      // les modificateurs sont affichés à part et appliqués à l'activation.
      vitalite: hero.active ? Number(hero.ressources.vitalite ?? 10) : 10,
      heroisme: hero.active ? Number(hero.ressources.heroisme ?? 5) : 5,
      foi: Number(hero.ressources.foi ?? 0),
      pouvoir: Number(hero.ressources.pouvoir ?? 0),
      creation: Number(hero.ressources.creation ?? 0),
      experience: Number(hero.ressources.experience ?? 0),
      vilenie: Number(hero.ressources.vilenie ?? 0),
      armes,
      armures,
      langues,
      carrieres,
      traits,
    });
  }

  protected resetForm(): void {
    this.model.set(heroAdvancedFormDefaults());
  }

  // --- Origines (avatar et région persistés immédiatement) ---

  protected override pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: this.labels.avatarDialogTitle},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.model.update((current) => ({...current, avatar}));
        this.heroForm().markAsDirty();
        this.persistOrigines();
      }
    });
  }

  protected openRegionPicker(): void {
    const ref = this.dialog.open(HeroAdvancedRegionComponent, {
      width: 'min(1280px, 96vw)',
      maxWidth: '96vw',
      data: {
        id_region: this.model().region_id ?? undefined,
        nom: this.model().nom,
      },
    });

    ref.afterClosed().pipe(take(1)).subscribe((data: HeroAdvancedRegionDialogResult | null | undefined) => {
      if (!data?.region) {
        return;
      }

      this.model.update((current) => ({
        ...current,
        region_id: Number(data.region.id),
        nom: data.nom || current.nom,
      }));
      this.heroForm().markAsDirty();
      this.persistOrigines();
    });
  }

  protected clearRegion(): void {
    this.model.update((current) => ({...current, region_id: null}));
    this.heroForm().markAsDirty();
  }

  private persistOrigines(): void {
    const heroId = this.entityId();
    if (!heroId) {
      return;
    }

    const raw = this.model();
    const origines: BolHerosOrigines = {
      avatar: raw.avatar,
      nom: raw.nom || null,
      joueur: raw.joueur || null,
      region_id: raw.region_id,
      commentaire: raw.commentaire || null,
      langues: raw.langues.map((langue) => Number(langue.id)),
    };

    this.herosService.updateOriginesHeros(heroId, origines).subscribe({
      error: (error: unknown) => this.errorMessage.set(extractApiErrorMessage(error, this.labels.updateError)),
    });
  }

  // --- Sous-ressources persistées à l'ajout/suppression ---

  protected addTraitEntry(event: TraitAddEvent): void {
    if (event.type === 'A' && this.avantageDrafts().length >= MAX_CREATION_AVANTAGES) {
      return;
    }

    const source =
      event.type === 'A'
        ? this.mergedAvantages().find((avantage) => Number(avantage.id) === Number(event.id))
        : this.mergedDesavantages().find((desavantage) => Number(desavantage.id) === Number(event.id));
    this.createTrait({
      traitable_id: event.id,
      type: event.type,
      detail: source?.pivot?.detail ?? null,
      region_id: source?.pivot?.region_id ?? null,
      carriere: false,
    });
  }

  protected addCareerDisadvantage(id: number): void {
    const source = (this.desavantagesList() ?? []).find((desavantage) => Number(desavantage.id) === Number(id));
    this.createTrait({
      traitable_id: id,
      type: 'D',
      detail: source?.pivot?.detail ?? null,
      region_id: source?.pivot?.region_id ?? null,
      carriere: true,
    });
  }

  private createTrait(trait: BolHerosTraitsModel): void {
    this.persistCreate(
      (heroId) => this.herosService.createTrait(heroId, trait),
      (created) => this.pushTraitEntry({...trait, ...created}),
      "L'ajout du trait a échoué.",
    );
  }

  protected removeTraitAt(index: number): void {
    const entry = this.selectedTraitEntries()[index];
    if (!entry) {
      return;
    }

    this.persistDelete('Supprimer le trait', 'Voulez-vous supprimer ce trait ?', (heroId) =>
      this.herosService.deleteTrait(heroId, entry.id),
    ).subscribe(() => this.removeEntryById('traits', entry.id));
  }

  protected addCarriereEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createCarriere(heroId, {carriere_id: id, value: 0}),
      () => this.pushCarriereEntry(id, 0),
      "L'ajout de la carrière a échoué.",
    );
  }

  protected removeCarriereAt(index: number): void {
    const entry = this.selectedCarrieres()[index];
    if (!entry) {
      return;
    }

    this.persistDelete('Supprimer la carrière', 'Voulez-vous supprimer cette carrière ?', (heroId) =>
      this.herosService.deleteCarriere(heroId, entry.id),
    ).subscribe(() => this.removeEntryById('carrieres', entry.id));
  }

  protected addArmeEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createArme(heroId, {arme_id: id}),
      () => this.pushIdEntry('armes', id),
      "L'ajout de l'arme a échoué.",
    );
  }

  protected removeArmeAt(index: number): void {
    const entry = this.selectedArmes()[index];
    if (!entry) {
      return;
    }

    this.persistDelete('Supprimer l’arme', 'Voulez-vous supprimer cette arme ?', (heroId) =>
      this.herosService.deleteArme(heroId, entry.id),
    ).subscribe(() => this.removeEntryById('armes', entry.id));
  }

  protected addArmureEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createArmure(heroId, {armure_id: id, equipee: false}),
      () => this.pushArmureEntry(id),
      "L'ajout de l'armure a échoué.",
    );
  }

  protected removeArmureAt(index: number): void {
    const entry = this.selectedArmures()[index];
    if (!entry) {
      return;
    }

    this.persistDelete('Supprimer l’armure', 'Voulez-vous supprimer cette armure ?', (heroId) =>
      this.herosService.deleteArmure(heroId, entry.id),
    ).subscribe(() => this.removeEntryById('armures', entry.id));
  }

  protected addLangueEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createLangue(heroId, {langue_id: id}),
      () => this.pushIdEntry('langues', id),
      "L'ajout de la langue a échoué.",
    );
  }

  protected removeLangueAt(index: number): void {
    const entry = this.selectedLangues()[index];
    if (!entry) {
      return;
    }

    this.persistDelete('Supprimer la langue', 'Voulez-vous supprimer cette langue ?', (heroId) =>
      this.herosService.deleteLangue(heroId, entry.id),
    ).subscribe(() => this.removeEntryById('langues', entry.id));
  }

  /** Crée une sous-ressource côté API puis reflète l'ajout dans le formulaire. */
  private persistCreate<R>(
    request: (heroId: string) => Observable<R>,
    onCreated: (response: R) => void,
    errorLabel: string,
  ): void {
    const heroId = this.entityId();
    if (!heroId || this.mutating()) {
      return;
    }

    this.mutating.set(true);
    request(heroId)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (response) => onCreated(response),
        error: (error: unknown) => this.errorMessage.set(extractApiErrorMessage(error, errorLabel)),
      });
  }

  /** Confirme puis supprime une sous-ressource côté API ; le retour n'émet qu'en cas de succès. */
  private persistDelete(
    title: string,
    message: string,
    request: (heroId: string) => Observable<unknown>,
  ): Observable<void> {
    return new Observable<void>((subscriber) => {
      confirmDialog(this.dialog, {title, message, confirmLabel: 'Oui', cancelLabel: 'Non'}).subscribe((confirmed) => {
        const heroId = this.entityId();
        if (!confirmed || !heroId || this.mutating()) {
          subscriber.complete();
          return;
        }

        this.mutating.set(true);
        request(heroId)
          .pipe(finalize(() => this.mutating.set(false)))
          .subscribe({
            next: () => {
              subscriber.next();
              subscriber.complete();
            },
            error: (error: unknown) => {
              this.errorMessage.set(extractApiErrorMessage(error, 'La suppression a échoué.'));
              subscriber.complete();
            },
          });
      });
    });
  }

  private pushIdEntry(key: 'armes' | 'langues', id: number): void {
    this.model.update((current) => ({...current, [key]: [...current[key], {id: Number(id)}]}));
  }

  private pushArmureEntry(id: number): void {
    this.model.update((current) => ({...current, armures: [...current.armures, {id: Number(id), equipee: false}]}));
  }

  private pushCarriereEntry(id: number, value: number): void {
    this.model.update((current) => ({
      ...current,
      carrieres: [...current.carrieres, {id: Number(id), value: Number(value)}],
    }));
  }

  private pushTraitEntry(trait: BolHerosTraitsModel): void {
    this.model.update((current) => ({...current, traits: [...current.traits, this.toTraitDraft(trait)]}));
  }

  private toTraitDraft(trait: BolHerosTraitsModel): AdvancedTraitDraft {
    return {
      id: trait.id ?? null,
      traitable_id: Number(trait.traitable_id),
      type: trait.type,
      detail: trait.detail ?? null,
      region_id: trait.region_id ?? null,
      carriere: Boolean(trait.carriere),
    };
  }

  private removeEntryById(key: 'armes' | 'armures' | 'langues' | 'carrieres' | 'traits', id: number): void {
    this.model.update((current) => ({
      ...current,
      [key]: (current[key] as ReadonlyArray<{id: number | null}>).filter(
        (entry) => Number(entry.id) !== Number(id),
      ),
    }));
  }

  private carriereFromId(id: number): BolCarriereModel | null {
    return (this.carrieresList() ?? []).find((carriere) => Number(carriere.id) === Number(id)) ?? null;
  }
}
