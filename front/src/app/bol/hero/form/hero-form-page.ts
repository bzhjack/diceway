import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {applyEach, FieldTree, form, required} from '@angular/forms/signals';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolRegionModel} from '../../models/bol-region.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {AddMenuComponent, addMenuOptions} from '../../shared/add-menu/add-menu.component';
import {ArmeEntry, ArmeListComponent} from '../../shared/arme/list/arme-list.component';
import {ArmureEntry, ArmureListComponent} from '../../shared/armure/list/armure-list.component';
import {CarriereEntry, CarriereListComponent} from '../../shared/carriere/list/carriere-list.component';
import {BolSignalEntityFormPageBase} from '../../shared/form/entity-form-page-signal.base';
import {EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {IdDraft, RankedDraft, availableCatalog, referencedIds, selectedEntries} from '../../shared/form/form-selection';
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup, StatsGridFieldComponent} from '../../shared/stats-grid/stats-grid-field.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitDraft, traitEntriesSignal} from '../../shared/trait/trait-entry.utils';
import {HeroGeneralComponent} from './general/general.component';
import {HeroSummaryRailComponent} from './summary-rail/summary-rail.component';

/** Modèle de brouillon du formulaire héros (distinct de {@link BolHerosModel}, la forme persistée par l'API). */
export interface HeroFormModel {
  id: string | null;
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
  experience: number;
  pouvoir: number;
  foi: number;
  creation: number;
  armes: IdDraft[];
  armures: IdDraft[];
  carrieres: RankedDraft[];
  langues: IdDraft[];
  traits: TraitDraft[];
}

function heroFormDefaults(): HeroFormModel {
  return {
    id: null,
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
    experience: 0,
    pouvoir: 0,
    foi: 0,
    creation: 0,
    armes: [],
    armures: [],
    carrieres: [],
    langues: [],
    traits: [],
  };
}

const HERO_STAT_GROUPS: readonly StatGroup[] = [
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
    columns: 3,
    cells: [
      {control: 'vitalite', label: 'Vitalité', highlight: true},
      {control: 'heroisme', label: 'Héroïsme', highlight: true},
      {control: 'experience', label: 'Expérience'},
      {control: 'pouvoir', label: 'Pouvoir'},
      {control: 'foi', label: 'Foi'},
      {control: 'creation', label: 'Création'},
    ],
  },
];

const HERO_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouveau héros',
  editTitle: 'Modifier le héros',
  createEyebrow: 'Galerie BOL',
  editEyebrow: 'Édition galerie BOL',
  createSubmitLabel: 'Créer le brouillon',
  editSubmitLabel: 'Enregistrer',
  loadError: 'Le chargement du héros a échoué.',
  createError: 'La création du héros a échoué.',
  updateError: 'La mise à jour du héros a échoué.',
  unsavedChanges: 'Ce héros a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar du héros',
};

@Component({
  selector: 'bol-hero-form-page',
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
    HeroGeneralComponent,
    StatsGridFieldComponent,
    HeroSummaryRailComponent,
  ],
  templateUrl: './hero-form-page.html',
  styleUrl: './hero-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroFormPageComponent extends BolSignalEntityFormPageBase<BolHerosModel, HeroFormModel> {
  private readonly herosService = inject(BolHerosService);
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
  protected readonly regionList = this.herosStateService.regionList;

  protected readonly labels = HERO_FORM_LABELS;
  protected readonly heroStatGroups = HERO_STAT_GROUPS;

  protected readonly model = signal<HeroFormModel>(heroFormDefaults());
  protected readonly heroForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom requis'});
    required(fieldPath.joueur, {message: 'Nom du joueur requis'});
    required(fieldPath.region_id, {message: 'Région requise'});
    required(fieldPath.vigueur);
    required(fieldPath.agilite);
    required(fieldPath.esprit);
    required(fieldPath.aura);
    required(fieldPath.initiative);
    required(fieldPath.melee);
    required(fieldPath.tir);
    required(fieldPath.defense);
    required(fieldPath.vitalite);
    required(fieldPath.heroisme);
    required(fieldPath.experience);
    required(fieldPath.pouvoir);
    required(fieldPath.foi);
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
    return this.heroForm;
  }

  /** Vue castée pour bol-stats-grid-field, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.heroForm as unknown as FieldTree<Record<string, number>>;

  protected readonly activateDisabled = computed(
    () => this.pending() || this.loading() || this.heroForm().invalid() || this.model().active,
  );

  protected readonly avatarPreview = computed(() => this.model().avatar);
  protected readonly heroNom = computed(() => this.model().nom);
  protected readonly heroJoueur = computed(() => this.model().joueur);
  protected readonly heroVitalite = computed(() => this.model().vitalite);
  protected readonly heroHeroisme = computed(() => this.model().heroisme);

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
      rank: this.heroForm.carrieres[index].value,
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

  protected readonly selectedRegion = computed(() => {
    const regionId = this.model().region_id;
    if (regionId === null) {
      return null;
    }

    return (this.regionList() ?? []).find((region: BolRegionModel) => region.id === regionId) ?? null;
  });

  protected readonly showGeneralHint = computed(
    () =>
      this.fieldError(this.heroForm.joueur) ||
      this.fieldError(this.heroForm.nom) ||
      this.fieldError(this.heroForm.region_id),
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

  protected override save(): void {
    this.submit(false);
  }

  protected confirmActivation(): void {
    confirmDialog(this.dialog, {
      title: 'Activer le héros',
      message: 'Voulez-vous activer ce héros ?',
      confirmLabel: 'Oui, activer',
      cancelLabel: 'Non',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.submit(true);
      }
    });
  }

  private submit(activate: boolean): void {
    const payload = this.buildPayload();
    payload['active'] = activate || Boolean(payload['active']);

    this.performSave(payload, (hero) => {
      if (!this.editMode() && !activate && hero.id) {
        this.navigateToDraft(hero.id);
        return;
      }

      this.navigateBack(true);
    });
  }

  protected loadEntity(id: string): Observable<BolHerosModel> {
    return this.herosService.heros(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.createHeros(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.updateHeros(payload);
  }

  protected resetForm(): void {
    this.model.set(heroFormDefaults());
  }

  protected hydrateForm(hero: BolHerosModel): void {
    this.model.set({
      id: hero.id,
      active: hero.active,
      type: 'H',
      nom: hero.origines.nom ?? '',
      joueur: hero.origines.joueur ?? '',
      region_id: hero.origines.region_id,
      commentaire: hero.origines.commentaire ?? '',
      avatar: hero.origines.avatar ?? null,
      vigueur: hero.attributs.vigueur,
      agilite: hero.attributs.agilite,
      esprit: hero.attributs.esprit,
      aura: hero.attributs.aura,
      initiative: hero.combat.initiative,
      melee: hero.combat.melee,
      tir: hero.combat.tir,
      defense: hero.combat.defense,
      vitalite: hero.ressources.vitalite,
      heroisme: hero.ressources.heroisme,
      experience: hero.ressources.experience,
      pouvoir: hero.ressources.pouvoir,
      foi: hero.ressources.foi,
      creation: hero.ressources.creation,
      armes: referencedIds(hero.armes, (arme) => arme.arme_id).map((id) => ({id})),
      armures: referencedIds(hero.armures, (armure) => armure.armure_id).map((id) => ({id})),
      langues: referencedIds(hero.origines.langues, (langue) => langue.langue_id).map((id) => ({id})),
      carrieres: hero.carrieres.map((carriere) => ({
        id: carriere.carriere_id ?? 0,
        value: carriere.value,
      })),
      traits: hero.traits.map((trait) => ({
        id: trait.traitable_id,
        type: trait.type,
      })),
    });
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.model();
    const origines = {
      joueur: rawValue.joueur,
      nom: rawValue.nom,
      commentaire: rawValue.commentaire || null,
      region_id: rawValue.region_id,
      avatar: rawValue.avatar,
      langues: rawValue.langues.map((langue) => ({
        id: langue.id,
        langue_id: langue.id,
      })),
    };
    const attributs = {
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      aura: rawValue.aura,
    };
    const combat = {
      initiative: rawValue.initiative,
      melee: rawValue.melee,
      tir: rawValue.tir,
      defense: rawValue.defense,
    };
    const ressources = {
      vitalite: rawValue.vitalite,
      heroisme: rawValue.heroisme,
      experience: rawValue.experience,
      pouvoir: rawValue.pouvoir,
      foi: rawValue.foi,
      creation: rawValue.creation,
      vilenie: 0,
    };
    const carrieres = rawValue.carrieres.map((carriere) => ({
      id: carriere.id,
      carriere_id: carriere.id,
      value: carriere.value,
    }));
    const traits = rawValue.traits.map((trait) => ({
      id: trait.id,
      traitable_id: trait.id,
      type: trait.type,
      detail: null,
      region_id: null,
      carriere: false,
    }));
    const armes = rawValue.armes.map((arme) => ({
      id: arme.id,
      arme_id: arme.id,
    }));
    const armures = rawValue.armures.map((armure) => ({
      id: armure.id,
      armure_id: armure.id,
    }));
    const langues = rawValue.langues.map((langue) => ({
      id: langue.id,
      langue_id: langue.id,
    }));

    return {
      id: rawValue.id,
      active: Boolean(rawValue.active),
      type: rawValue.type,
      nom: origines.nom,
      joueur: origines.joueur,
      region_id: origines.region_id,
      commentaire: origines.commentaire,
      avatar: origines.avatar,
      vigueur: attributs.vigueur,
      agilite: attributs.agilite,
      esprit: attributs.esprit,
      aura: attributs.aura,
      initiative: combat.initiative,
      melee: combat.melee,
      tir: combat.tir,
      defense: combat.defense,
      vitalite: ressources.vitalite,
      heroisme: ressources.heroisme,
      experience: ressources.experience,
      pouvoir: ressources.pouvoir,
      foi: ressources.foi,
      creation: ressources.creation,
      origines,
      attributs,
      combat,
      ressources,
      armes,
      armures,
      carrieres,
      langues,
      traits,
    };
  }

  private navigateToDraft(heroId: string | number): void {
    void this.router.navigate(['/create/hero', heroId], {
      state: this.returnUrl() ? {returnUrl: this.returnUrl()!} : undefined,
    });
  }
}
