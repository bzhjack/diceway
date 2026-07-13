import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormArray, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {ArmeAddMenuComponent} from '../../shared/arme/add-menu/arme-add-menu.component';
import {ArmeEntry, ArmeListComponent} from '../../shared/arme/list/arme-list.component';
import {ArmureAddMenuComponent} from '../../shared/armure/add-menu/armure-add-menu.component';
import {ArmureEntry, ArmureListComponent} from '../../shared/armure/list/armure-list.component';
import {CarriereAddMenuComponent} from '../../shared/carriere/add-menu/carriere-add-menu.component';
import {CarriereEntry, CarriereListComponent} from '../../shared/carriere/list/carriere-list.component';
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {IdDraft, RankedDraft, availableCatalog, referencedIds, selectedEntries} from '../../shared/form/form-selection';
import {controlValueSignal, formArrayValueSignal, formDirtySignal} from '../../shared/form/form-signals';
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitDraft, traitEntriesSignal} from '../../shared/trait/trait-entry.utils';
import {PnjGeneralComponent, PnjTypeOption} from './general/pnj-general.component';
import {PnjSummaryRailComponent} from './summary-rail/pnj-summary-rail.component';

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
    ReactiveFormsModule,
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatIconModule,
    DwTagComponent,
    ArmeAddMenuComponent,
    ArmeListComponent,
    ArmureAddMenuComponent,
    ArmureListComponent,
    CarriereAddMenuComponent,
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
export class PnjFormPageComponent extends BolEntityFormPageBase<BolHerosModel> {
  private readonly herosService = inject(BolHerosService);
  private readonly herosStateService = inject(BolHerosStateService);

  protected readonly armesList = this.herosStateService.armeList;
  protected readonly armuresList = this.herosStateService.armureList;
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly languesList = this.herosStateService.langueList;
  protected readonly avantagesList = this.herosStateService.avantagesList;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;

  protected readonly labels = PNJ_FORM_LABELS;
  protected readonly typeOptions = PNJ_TYPE_OPTIONS;
  protected readonly pnjStatGroups = PNJ_STAT_GROUPS;

  protected readonly pnjForm = this.formBuilder.group({
    id: this.formBuilder.control<string | null>(null),
    nom: this.formBuilder.control('', Validators.required),
    type: this.formBuilder.control<'P' | 'C' | 'R'>('P', Validators.required),
    joueur: this.formBuilder.control('master', Validators.required),
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
    vitalite: this.formBuilder.control(0, Validators.required),
    pouvoir: this.formBuilder.control(0, Validators.required),
    foi: this.formBuilder.control(0, Validators.required),
    vilenie: this.formBuilder.control(0, Validators.required),
    creation: this.formBuilder.control(0, Validators.required),
    armes: this.formBuilder.array([]),
    armures: this.formBuilder.array([]),
    carrieres: this.formBuilder.array([]),
    langues: this.formBuilder.array([]),
    traits: this.formBuilder.array([]),
  });

  protected get entityForm() {
    return this.pnjForm;
  }

  protected readonly formDirty = formDirtySignal(this.pnjForm);

  protected readonly avatarPreview = controlValueSignal(this.pnjForm.controls.avatar);
  protected readonly pnjNom = controlValueSignal(this.pnjForm.controls.nom);
  protected readonly pnjType = controlValueSignal(this.pnjForm.controls.type);
  protected readonly pnjVitalite = controlValueSignal(this.pnjForm.controls.vitalite);
  protected readonly pnjTypeLabel = computed(() => PNJ_TYPE_LABELS[this.pnjType() ?? 'P']);

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

  protected readonly selectedArmes = selectedEntries(
    this.selectedArmesDraft,
    this.armesList,
    (arme): ArmeEntry => ({
      id: Number(arme.id),
      label: arme.arme,
      degats: arme.degats,
      portee: arme.portee,
      notes: arme.notes,
    }),
  );
  protected readonly selectedArmures = selectedEntries(
    this.selectedArmuresDraft,
    this.armuresList,
    (armure): ArmureEntry => ({
      id: Number(armure.id),
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
      id: Number(entry.id),
      label: definition.carriere,
      description: definition.description || null,
      rank: this.carrieres.at(index).get('value') as FormControl<number>,
    }),
  );
  protected readonly selectedLangues = selectedEntries(
    this.selectedLanguesDraft,
    this.languesList,
    (langue): LangueEntry => ({
      id: Number(langue.id),
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

  protected get armes(): FormArray {
    return this.pnjForm.controls.armes as FormArray;
  }

  protected get armures(): FormArray {
    return this.pnjForm.controls.armures as FormArray;
  }

  protected get carrieres(): FormArray {
    return this.pnjForm.controls.carrieres as FormArray;
  }

  protected get langues(): FormArray {
    return this.pnjForm.controls.langues as FormArray;
  }

  protected get traits(): FormArray {
    return this.pnjForm.controls.traits as FormArray;
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
        id: this.formBuilder.control(Number(id), Validators.required),
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

  protected loadEntity(id: string): Observable<BolHerosModel> {
    return this.herosService.pnj(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.quickCreate(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.quickUpdate(payload);
  }

  protected resetForm(): void {
    this.pnjForm.reset(
      {
        id: null,
        nom: '',
        type: 'P',
        joueur: 'master',
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
        vitalite: 0,
        pouvoir: 0,
        foi: 0,
        vilenie: 0,
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

  protected hydrateForm(pnj: BolHerosModel): void {
    this.resetForm();

    this.pushIdGroups(this.armes, referencedIds(pnj.armes, (arme) => arme.arme_id));
    this.pushIdGroups(this.armures, referencedIds(pnj.armures, (armure) => armure.armure_id));
    this.pushIdGroups(this.langues, referencedIds(pnj.origines.langues, (langue) => langue.langue_id));

    for (const carriere of pnj.carrieres) {
      this.carrieres.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(carriere.carriere_id), Validators.required),
          value: this.formBuilder.control(Number(carriere.value), Validators.required),
        }),
        {emitEvent: false},
      );
    }

    for (const trait of pnj.traits) {
      this.traits.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(trait.traitable_id), Validators.required),
          type: this.formBuilder.control<'A' | 'D'>(trait.type, Validators.required),
        }),
        {emitEvent: false},
      );
    }

    this.pnjForm.patchValue(
      {
        id: pnj.id,
        nom: pnj.origines.nom ?? '',
        type: (pnj.type as 'P' | 'C' | 'R') ?? 'P',
        joueur: pnj.origines.joueur ?? 'master',
        commentaire: pnj.origines.commentaire ?? null,
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
      },
      {emitEvent: true},
    );
    this.syncArrays(this.armes, this.armures, this.carrieres, this.langues, this.traits);
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.pnjForm.getRawValue();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      type: rawValue.type,
      joueur: rawValue.joueur,
      commentaire: rawValue.commentaire,
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
      armes: (rawValue.armes as IdDraft[]).map((arme) => ({id: Number(arme.id)})),
      armures: (rawValue.armures as IdDraft[]).map((armure) => ({id: Number(armure.id)})),
      carrieres: (rawValue.carrieres as RankedDraft[]).map((carriere) => ({
        id: Number(carriere.id),
        value: Number(carriere.value),
      })),
      langues: (rawValue.langues as IdDraft[]).map((langue) => ({id: Number(langue.id)})),
      traits: (rawValue.traits as TraitDraft[]).map((trait) => ({
        id: Number(trait.id),
        type: trait.type,
      })),
    };
  }
}
