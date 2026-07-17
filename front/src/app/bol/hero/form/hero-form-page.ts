import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormArray, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
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
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {IdDraft, RankedDraft, availableCatalog, referencedIds, selectedEntries} from '../../shared/form/form-selection';
import {controlValueSignal, formArrayValueSignal, formDirtySignal} from '../../shared/form/form-signals';
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitDraft, traitEntriesSignal} from '../../shared/trait/trait-entry.utils';
import {HeroGeneralComponent} from './general/general.component';
import {HeroSummaryRailComponent} from './summary-rail/summary-rail.component';

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
    ReactiveFormsModule,
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
    StatsGridComponent,
    HeroSummaryRailComponent,
  ],
  templateUrl: './hero-form-page.html',
  styleUrl: './hero-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroFormPageComponent extends BolEntityFormPageBase<BolHerosModel> {
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

  protected readonly heroForm = this.formBuilder.group({
    id: this.formBuilder.control<string | null>(null),
    active: this.formBuilder.control(false, Validators.required),
    type: this.formBuilder.control<'H'>('H', Validators.required),
    nom: this.formBuilder.control('', Validators.required),
    joueur: this.formBuilder.control('', Validators.required),
    region_id: this.formBuilder.control<number | null>(null, Validators.required),
    commentaire: this.formBuilder.control<string | null>(null),
    avatar: this.formBuilder.control<string | null>(null),
    vigueur: this.formBuilder.control(0, Validators.required),
    agilite: this.formBuilder.control(0, Validators.required),
    esprit: this.formBuilder.control(0, Validators.required),
    aura: this.formBuilder.control(0, Validators.required),
    initiative: this.formBuilder.control(0, Validators.required),
    melee: this.formBuilder.control(0, Validators.required),
    tir: this.formBuilder.control(0, Validators.required),
    defense: this.formBuilder.control(0, Validators.required),
    vitalite: this.formBuilder.control(10, Validators.required),
    heroisme: this.formBuilder.control(5, Validators.required),
    experience: this.formBuilder.control(0, Validators.required),
    pouvoir: this.formBuilder.control(0, Validators.required),
    foi: this.formBuilder.control(0, Validators.required),
    creation: this.formBuilder.control(0, Validators.required),
    armes: this.formBuilder.array([]),
    armures: this.formBuilder.array([]),
    carrieres: this.formBuilder.array([]),
    langues: this.formBuilder.array([]),
    traits: this.formBuilder.array([]),
  });

  protected get entityForm() {
    return this.heroForm;
  }

  protected readonly formDirty = formDirtySignal(this.heroForm);

  protected readonly activateDisabled = computed(
    () => this.pending() || this.loading() || this.heroForm.invalid || this.heroForm.controls.active.value,
  );

  protected readonly avatarPreview = controlValueSignal(this.heroForm.controls.avatar);
  protected readonly heroNom = controlValueSignal(this.heroForm.controls.nom);
  protected readonly heroJoueur = controlValueSignal(this.heroForm.controls.joueur);
  protected readonly heroVitalite = controlValueSignal(this.heroForm.controls.vitalite);
  protected readonly heroHeroisme = controlValueSignal(this.heroForm.controls.heroisme);

  protected readonly selectedArmesDraft = formArrayValueSignal<IdDraft>(this.armes);
  protected readonly selectedArmuresDraft = formArrayValueSignal<IdDraft>(this.armures);
  protected readonly selectedCarrieresDraft = formArrayValueSignal<RankedDraft>(this.carrieres);
  protected readonly selectedLanguesDraft = formArrayValueSignal<IdDraft>(this.langues);
  protected readonly selectedTraitsDraft = formArrayValueSignal<TraitDraft>(this.traits);

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
      rank: this.carrieres.at(index).get('value') as FormControl<number>,
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

  private readonly regionIdValue = controlValueSignal(this.heroForm.controls.region_id);
  protected readonly selectedRegion = computed(() => {
    const regionId = this.regionIdValue();
    if (regionId === null) {
      return null;
    }

    return (this.regionList() ?? []).find((region: BolRegionModel) => region.id === regionId) ?? null;
  });

  protected get armes(): FormArray {
    return this.heroForm.controls.armes as FormArray;
  }

  protected get armures(): FormArray {
    return this.heroForm.controls.armures as FormArray;
  }

  protected get carrieres(): FormArray {
    return this.heroForm.controls.carrieres as FormArray;
  }

  protected get langues(): FormArray {
    return this.heroForm.controls.langues as FormArray;
  }

  protected get traits(): FormArray {
    return this.heroForm.controls.traits as FormArray;
  }

  protected addArmeEntry(id: number): void {
    this.addIdEntry(this.armes, id);
  }

  protected addArmureEntry(id: number): void {
    this.addIdEntry(this.armures, id);
  }

  protected addLangueEntry(id: number): void {
    this.addIdEntry(this.langues, id);
  }

  protected addCarriereEntry(id: number): void {
    this.carrieres.push(
      this.formBuilder.group({
        id: this.formBuilder.control(id, Validators.required),
        value: this.formBuilder.control(0, Validators.required),
      }),
    );
    this.carrieres.markAsDirty();
  }

  protected addTraitEntry(entry: TraitAddEvent): void {
    this.traits.push(
      this.formBuilder.group({
        id: this.formBuilder.control(entry.id, Validators.required),
        type: this.formBuilder.control<'A' | 'D'>(entry.type, Validators.required),
      }),
    );
    this.traits.markAsDirty();
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
    this.heroForm.reset(
      {
        id: null,
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
        experience: 0,
        pouvoir: 0,
        foi: 0,
        creation: 0,
      },
      {emitEvent: false},
    );
    this.armes.clear({emitEvent: false});
    this.armures.clear({emitEvent: false});
    this.carrieres.clear({emitEvent: false});
    this.langues.clear({emitEvent: false});
    this.traits.clear({emitEvent: false});
    this.syncArrays(this.armes, this.armures, this.carrieres, this.langues, this.traits);
  }

  protected hydrateForm(hero: BolHerosModel): void {
    this.resetForm();

    this.pushIdGroups(this.armes, referencedIds(hero.armes, (arme) => arme.arme_id));
    this.pushIdGroups(this.armures, referencedIds(hero.armures, (armure) => armure.armure_id));
    this.pushIdGroups(this.langues, referencedIds(hero.origines.langues, (langue) => langue.langue_id));

    for (const carriere of hero.carrieres) {
      this.carrieres.push(
        this.formBuilder.group({
          id: this.formBuilder.control(carriere.carriere_id ?? null, Validators.required),
          value: this.formBuilder.control(carriere.value, Validators.required),
        }),
        {emitEvent: false},
      );
    }

    for (const trait of hero.traits) {
      this.traits.push(
        this.formBuilder.group({
          id: this.formBuilder.control(trait.traitable_id, Validators.required),
          type: this.formBuilder.control<'A' | 'D'>(trait.type, Validators.required),
        }),
        {emitEvent: false},
      );
    }

    this.heroForm.patchValue(
      {
        id: hero.id,
        active: hero.active,
        type: 'H',
        nom: hero.origines.nom ?? '',
        joueur: hero.origines.joueur ?? '',
        region_id: hero.origines.region_id,
        commentaire: hero.origines.commentaire ?? null,
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
      },
      {emitEvent: true},
    );
    this.syncArrays(this.armes, this.armures, this.carrieres, this.langues, this.traits);
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.heroForm.getRawValue();
    const origines = {
      joueur: rawValue.joueur,
      nom: rawValue.nom,
      commentaire: rawValue.commentaire,
      region_id: rawValue.region_id,
      avatar: rawValue.avatar,
      langues: (rawValue.langues as IdDraft[]).map((langue) => ({
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
    const carrieres = (rawValue.carrieres as RankedDraft[]).map((carriere) => ({
      id: carriere.id,
      carriere_id: carriere.id,
      value: carriere.value,
    }));
    const traits = (rawValue.traits as TraitDraft[]).map((trait) => ({
      id: trait.id,
      traitable_id: trait.id,
      type: trait.type,
      detail: null,
      region_id: null,
      carriere: false,
    }));
    const armes = (rawValue.armes as IdDraft[]).map((arme) => ({
      id: arme.id,
      arme_id: arme.id,
    }));
    const armures = (rawValue.armures as IdDraft[]).map((armure) => ({
      id: armure.id,
      armure_id: armure.id,
    }));
    const langues = (rawValue.langues as IdDraft[]).map((langue) => ({
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
