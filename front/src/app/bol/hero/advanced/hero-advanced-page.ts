import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable, startWith, take} from 'rxjs';
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
import {IdDraft, RankedDraft, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
import {controlValueSignal, formArrayValueSignal, formDirtySignal} from '../../shared/form/form-signals';
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
  attributValidator,
  attributsFormValidator,
  carriereValidator,
  carrieresFormValidatorFn,
  combatFormValidatorFn,
} from './create.validators';
import {HeroAdvancedIdentiteComponent} from './identite/identite.component';
import {HeroAdvancedRegionComponent, HeroAdvancedRegionDialogResult} from './region/region.component';
import {HeroAdvancedRessourcesPanelComponent, ResourceEntry} from './ressources-panel/ressources-panel.component';
import {SectionMessage} from './section-message';
import {HeroAdvancedStatsPanelComponent} from './stats-panel/stats-panel.component';

/** Brouillon de trait dans le FormArray : `id` est l'id du lien héros/trait côté serveur. */
interface AdvancedTraitDraft {
  id: number | null;
  traitable_id: number;
  type: 'A' | 'D';
  detail: string | null;
  region_id: number | null;
  carriere: boolean;
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
    ReactiveFormsModule,
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
export class HeroAdvancedPageComponent extends BolEntityFormPageBase<BolHerosModel> {
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
  protected readonly draftForm = this.formBuilder.group({
    joueur: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required, Validators.minLength(3)]}),
    nom: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required, Validators.minLength(3)]}),
  });
  protected readonly creatingDraft = signal(false);
  /** Une mutation de sous-ressource (trait, carrière, arme…) est en cours côté API. */
  protected readonly mutating = signal(false);

  protected readonly herosForm = this.formBuilder.group(
    {
      id: this.formBuilder.control<string | null>(null),
      user_id: this.formBuilder.control<string | null>(null),
      active: this.formBuilder.control(false, {nonNullable: true}),
      type: this.formBuilder.control<'H'>('H', {nonNullable: true}),
      nom: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required]}),
      joueur: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required]}),
      region_id: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
      commentaire: this.formBuilder.control<string | null>(null),
      avatar: this.formBuilder.control<string | null>(null),
      vigueur: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      agilite: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      esprit: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      aura: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      initiative: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      melee: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      tir: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      defense: this.formBuilder.control(0, {nonNullable: true, validators: [attributValidator]}),
      vitalite: this.formBuilder.control(10, {nonNullable: true}),
      heroisme: this.formBuilder.control(5, {nonNullable: true}),
      foi: this.formBuilder.control(0, {nonNullable: true}),
      pouvoir: this.formBuilder.control(0, {nonNullable: true}),
      creation: this.formBuilder.control(0, {nonNullable: true}),
      experience: this.formBuilder.control(0, {nonNullable: true}),
      vilenie: this.formBuilder.control(0, {nonNullable: true}),
      armes: this.formBuilder.array([]),
      armures: this.formBuilder.array([]),
      langues: this.formBuilder.array([]),
      carrieres: this.formBuilder.array([]),
      traits: this.formBuilder.array([]),
    },
    {validators: [attributsFormValidator, combatFormValidatorFn(4), carrieresFormValidatorFn(4)]},
  );

  protected get entityForm() {
    return this.herosForm;
  }

  protected readonly formDirty = formDirtySignal(this.herosForm);

  private readonly herosFormValue = toSignal(
    this.herosForm.valueChanges.pipe(startWith(this.herosForm.getRawValue())),
    {initialValue: this.herosForm.getRawValue()},
  );

  protected readonly avatarPreview = controlValueSignal(this.herosForm.controls.avatar);
  protected readonly heroNom = controlValueSignal(this.herosForm.controls.nom);
  protected readonly heroJoueur = controlValueSignal(this.herosForm.controls.joueur);
  protected readonly activeValue = controlValueSignal(this.herosForm.controls.active);
  private readonly regionIdValue = controlValueSignal(this.herosForm.controls.region_id);
  private readonly vigueurValue = controlValueSignal(this.herosForm.controls.vigueur);

  protected readonly selectedArmesDraft = formArrayValueSignal<IdDraft>(this.armes);
  protected readonly selectedArmuresDraft = formArrayValueSignal<IdDraft>(this.armures);
  protected readonly selectedLanguesDraft = formArrayValueSignal<IdDraft>(this.langues);
  protected readonly selectedCarrieresDraft = formArrayValueSignal<RankedDraft>(this.carrieres);
  protected readonly selectedTraitsDraft = formArrayValueSignal<AdvancedTraitDraft>(this.traits);

  protected readonly selectedRegion = computed(() => {
    const regionId = this.regionIdValue();
    if (regionId === null) {
      return null;
    }

    return (this.regionList() ?? []).find((region) => Number(region.id) === Number(regionId)) ?? null;
  });

  /** Héros courant reconstruit depuis le formulaire, pour le BolHerosStateService. */
  private readonly currentHero = computed(() => {
    this.herosFormValue();
    return this.buildHero();
  });

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
      rank: this.carrieres.at(index).get('value') as FormControl<number>,
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
    }),
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
      Number(this.herosFormValue().esprit ?? 0),
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
    this.herosFormValue();
    const errors: SectionMessage[] = [];
    if (this.herosForm.controls.joueur.invalid) {
      errors.push({control: 'Joueur', error: 'Le nom du joueur est requis.'});
    }
    if (this.herosForm.controls.nom.invalid) {
      errors.push({control: 'Nom', error: 'Le nom du héros est requis.'});
    }
    if (this.herosForm.controls.region_id.invalid) {
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
    this.herosFormValue();
    const errors = this.controlErrors(['vigueur', 'agilite', 'esprit', 'aura']);
    if (this.herosForm.errors?.['attrTooManyNegative']) {
      errors.push({control: '', error: 'Un seul attribut peut descendre à -1.'});
    }
    if (this.herosForm.errors?.['attrSumExceeded']) {
      errors.push({control: '', error: 'La somme des attributs ne doit pas dépasser 4.'});
    }

    return errors;
  });
  protected readonly attributWarns = computed<HeroCreationWarning[]>(() => {
    if (this.attributErrors().length) {
      return [];
    }

    const raw = this.herosFormValue();
    const sum = Number(raw.vigueur ?? 0) + Number(raw.agilite ?? 0) + Number(raw.esprit ?? 0) + Number(raw.aura ?? 0);
    return sum < 4 ? [{step: 'Attributs', warn: `Il manque ${4 - sum} point(s) dans les attributs.`}] : [];
  });

  protected readonly combatErrors = computed<SectionMessage[]>(() => {
    this.herosFormValue();
    const errors = this.controlErrors(['initiative', 'melee', 'tir', 'defense']);
    if (this.herosForm.errors?.['aptTooManyNegative']) {
      errors.push({control: '', error: 'Une seule aptitude de combat peut descendre à -1.'});
    }
    if (this.herosForm.errors?.['aptSumExceeded']) {
      errors.push({control: '', error: `La somme des aptitudes de combat ne doit pas dépasser ${this.combatBudget()}.`});
    }

    return errors;
  });
  protected readonly combatWarns = computed<HeroCreationWarning[]>(() => {
    if (this.combatErrors().length) {
      return [];
    }

    const raw = this.herosFormValue();
    const budget = this.combatBudget();
    const sum =
      Number(raw.initiative ?? 0) + Number(raw.melee ?? 0) + Number(raw.tir ?? 0) + Number(raw.defense ?? 0);
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
    this.herosFormValue();
    const errors: SectionMessage[] = [];
    for (const control of this.carrieres.controls) {
      const definition = this.carriereFromId(Number(control.get('id')?.value ?? 0));
      const valueErrors = control.get('value')?.errors ?? {};
      for (const errorKey of Object.keys(valueErrors)) {
        errors.push({control: definition?.carriere ?? '', error: HeroAdvancedCreateTools.translate(errorKey)});
      }
    }

    if (this.herosForm.errors?.['carrSumExceeded']) {
      errors.push({control: '', error: `La somme des carrières ne doit pas dépasser ${this.carriereBudget()}.`});
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

  protected readonly submitDisabled = computed(() => {
    this.herosFormValue();
    return this.pending() || this.loading() || this.herosForm.invalid || this.langueErrors().length > 0;
  });
  protected readonly activateDisabled = computed(
    () => this.submitDisabled() || this.warnCount() > 0 || this.activeValue(),
  );

  constructor() {
    super();

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

    // E11 : Non-combattant fait varier les budgets combat et carrières.
    effect(() => {
      const combatBudget = this.combatBudget();
      const carriereBudget = this.carriereBudget();
      this.herosForm.setValidators([
        attributsFormValidator,
        combatFormValidatorFn(combatBudget),
        carrieresFormValidatorFn(carriereBudget),
      ]);
      this.herosForm.updateValueAndValidity();
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

  protected get armes(): FormArray {
    return this.herosForm.controls.armes as FormArray;
  }

  protected get armures(): FormArray {
    return this.herosForm.controls.armures as FormArray;
  }

  protected get langues(): FormArray {
    return this.herosForm.controls.langues as FormArray;
  }

  protected get carrieres(): FormArray {
    return this.herosForm.controls.carrieres as FormArray;
  }

  protected get traits(): FormArray {
    return this.herosForm.controls.traits as FormArray;
  }

  // --- Étape 1 : brouillon ---

  protected startDraft(): void {
    if (this.creatingDraft() || this.draftForm.invalid) {
      return;
    }

    this.creatingDraft.set(true);
    this.herosService
      .createHerosAdvanced({
        joueur: this.draftForm.controls.joueur.value,
        nom: this.draftForm.controls.nom.value,
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
    const raw = this.herosForm.getRawValue();
    const langues = (raw.langues as IdDraft[]).map((langue) => Number(langue.id));

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
        commentaire: raw.commentaire,
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
        melee: raw.melee,
        tir: raw.tir,
        defense: raw.defense,
      },
      attributs: {
        vigueur: raw.vigueur,
        agilite: raw.agilite,
        esprit: raw.esprit,
        aura: raw.aura,
      },
      traits: (raw.traits as AdvancedTraitDraft[]).map((trait) => ({
        id: trait.id ?? undefined,
        traitable_id: trait.traitable_id,
        type: trait.type,
        detail: trait.detail,
        region_id: trait.region_id,
        carriere: trait.carriere,
      })),
      carrieres: (raw.carrieres as RankedDraft[]).map((carriere) => ({
        carriere_id: Number(carriere.id),
        value: Number(carriere.value ?? 0),
      })),
      langues,
      armes: (raw.armes as IdDraft[]).map((arme) => Number(arme.id)),
      armures: (raw.armures as IdDraft[]).map((armure) => Number(armure.id)),
    };
  }

  protected hydrateForm(hero: BolHerosModel): void {
    this.resetForm();

    for (const arme of hero.armes ?? []) {
      this.pushIdGroup(this.armes, typeof arme === 'number' ? arme : arme.arme_id, false);
    }
    for (const armure of hero.armures ?? []) {
      this.pushIdGroup(this.armures, typeof armure === 'number' ? armure : armure.armure_id, false);
    }
    for (const langue of hero.langues ?? hero.origines.langues ?? []) {
      this.pushIdGroup(this.langues, typeof langue === 'number' ? langue : langue.langue_id, false);
    }
    for (const carriere of hero.carrieres ?? []) {
      this.pushCarriereGroup(Number(carriere.carriere_id), Number(carriere.value ?? 0), false);
    }
    for (const trait of hero.traits ?? []) {
      this.pushTraitGroup(trait, false);
    }

    this.herosForm.patchValue({
      id: hero.id,
      user_id: hero.user_id,
      active: hero.active,
      type: 'H',
      nom: hero.origines.nom ?? '',
      joueur: hero.origines.joueur ?? '',
      region_id: hero.origines.region_id ? Number(hero.origines.region_id) : null,
      commentaire: hero.origines.commentaire ?? null,
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
    });
    this.syncArrays(this.armes, this.armures, this.langues, this.carrieres, this.traits);
  }

  protected resetForm(): void {
    this.herosForm.reset(
      {
        id: null,
        user_id: null,
        active: false,
        type: 'H',
        nom: '',
        joueur: '',
        region_id: null,
        commentaire: null,
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
      },
      {emitEvent: false},
    );
    this.armes.clear({emitEvent: false});
    this.armures.clear({emitEvent: false});
    this.langues.clear({emitEvent: false});
    this.carrieres.clear({emitEvent: false});
    this.traits.clear({emitEvent: false});
    this.syncArrays(this.armes, this.armures, this.langues, this.carrieres, this.traits);
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
        this.herosForm.controls.avatar.setValue(avatar);
        this.persistOrigines();
      }
    });
  }

  protected openRegionPicker(): void {
    const ref = this.dialog.open(HeroAdvancedRegionComponent, {
      width: 'min(1280px, 96vw)',
      maxWidth: '96vw',
      data: {
        id_region: this.herosForm.controls.region_id.value ?? undefined,
        nom: this.herosForm.controls.nom.value,
      },
    });

    ref.afterClosed().pipe(take(1)).subscribe((data: HeroAdvancedRegionDialogResult | null | undefined) => {
      if (!data?.region) {
        return;
      }

      this.herosForm.controls.region_id.setValue(Number(data.region.id));
      if (data.nom) {
        this.herosForm.controls.nom.setValue(data.nom);
      }
      this.persistOrigines();
    });
  }

  protected clearRegion(): void {
    this.herosForm.controls.region_id.setValue(null);
  }

  private persistOrigines(): void {
    const heroId = this.entityId();
    if (!heroId) {
      return;
    }

    const raw = this.herosForm.getRawValue();
    const origines: BolHerosOrigines = {
      avatar: raw.avatar,
      nom: raw.nom || null,
      joueur: raw.joueur || null,
      region_id: raw.region_id,
      commentaire: raw.commentaire,
      langues: (raw.langues as IdDraft[]).map((langue) => Number(langue.id)),
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
      (created) => this.pushTraitGroup({...trait, ...created}),
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
    ).subscribe(() => this.removeDraftById(this.traits, 'id', entry.id));
  }

  protected addCarriereEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createCarriere(heroId, {carriere_id: id, value: 0}),
      () => this.pushCarriereGroup(id, 0),
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
    ).subscribe(() => this.removeDraftById(this.carrieres, 'id', entry.id));
  }

  protected addArmeEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createArme(heroId, {arme_id: id}),
      () => this.pushIdGroup(this.armes, id),
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
    ).subscribe(() => this.removeDraftById(this.armes, 'id', entry.id));
  }

  protected addArmureEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createArmure(heroId, {armure_id: id}),
      () => this.pushIdGroup(this.armures, id),
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
    ).subscribe(() => this.removeDraftById(this.armures, 'id', entry.id));
  }

  protected addLangueEntry(id: number): void {
    this.persistCreate(
      (heroId) => this.herosService.createLangue(heroId, {langue_id: id}),
      () => this.pushIdGroup(this.langues, id),
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
    ).subscribe(() => this.removeDraftById(this.langues, 'id', entry.id));
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

  private pushIdGroup(array: FormArray, id: number, emitEvent = true): void {
    array.push(
      this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}),
      {emitEvent},
    );
  }

  private pushCarriereGroup(id: number, value: number, emitEvent = true): void {
    this.carrieres.push(
      this.formBuilder.group({
        id: this.formBuilder.control(Number(id), Validators.required),
        value: this.formBuilder.control(Number(value), carriereValidator),
      }),
      {emitEvent},
    );
  }

  private pushTraitGroup(trait: BolHerosTraitsModel, emitEvent = true): void {
    this.traits.push(
      this.formBuilder.group({
        id: this.formBuilder.control(trait.id ?? null),
        traitable_id: this.formBuilder.control(Number(trait.traitable_id), Validators.required),
        type: this.formBuilder.control<'A' | 'D'>(trait.type, Validators.required),
        detail: this.formBuilder.control(trait.detail ?? null),
        region_id: this.formBuilder.control(trait.region_id ?? null),
        carriere: this.formBuilder.control(Boolean(trait.carriere)),
      }),
      {emitEvent},
    );
  }

  private removeDraftById(array: FormArray, key: string, id: number): void {
    const index = array.controls.findIndex((control) => Number(control.get(key)?.value) === Number(id));
    if (index >= 0) {
      array.removeAt(index);
    }
  }

  private controlErrors(keys: readonly string[]): SectionMessage[] {
    const errors: SectionMessage[] = [];
    for (const key of keys) {
      const controlErrors = this.herosForm.get(key)?.errors;
      if (!controlErrors) {
        continue;
      }

      for (const errorKey of Object.keys(controlErrors)) {
        errors.push({
          control: HeroAdvancedCreateTools.translate(key),
          error: HeroAdvancedCreateTools.translate(errorKey),
        });
      }
    }

    return errors;
  }

  private carriereFromId(id: number): BolCarriereModel | null {
    return (this.carrieresList() ?? []).find((carriere) => Number(carriere.id) === Number(id)) ?? null;
  }
}
