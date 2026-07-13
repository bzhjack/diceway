import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, Signal, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormControl, PristineChangeEvent, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, filter, map, startWith, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {BolArmureModel} from '../../models/bol-armure.model';
import {BolArmeModel} from '../../models/bol-arme.model';
import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolCarriereModel} from '../../models/bol-carriere.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolLangueModel} from '../../models/bol-langue.model';
import {BolRegionModel} from '../../models/bol-region.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {HasPendingChanges} from '../../../core/pending-changes.guard';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {PictureComponent} from '../../../shared/picture/picture';
import {ArmeAddMenuComponent} from '../../shared/arme/add-menu/arme-add-menu.component';
import {ArmeEntry, ArmeListComponent} from '../../shared/arme/list/arme-list.component';
import {ArmureAddMenuComponent} from '../../shared/armure/add-menu/armure-add-menu.component';
import {ArmureEntry, ArmureListComponent} from '../../shared/armure/list/armure-list.component';
import {CarriereAddMenuComponent} from '../../shared/carriere/add-menu/carriere-add-menu.component';
import {CarriereEntry, CarriereListComponent} from '../../shared/carriere/list/carriere-list.component';
import {HeroGeneralComponent} from './general/general.component';
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {HeroSummaryRailComponent} from './summary-rail/summary-rail.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitDetail, TraitEntry} from '../../shared/trait/list/trait-list.component';
import {TraitIcon, traitIconType} from '../../shared/trait-icon';

interface HeroSimpleDraft {
  id: number;
}

interface HeroCarriereDraft extends HeroSimpleDraft {
  value: number;
}

interface HeroTraitDraft extends HeroSimpleDraft {
  type: 'A' | 'D';
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

@Component({
  selector: 'bol-hero-form-page',
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
export class HeroFormPageComponent implements HasPendingChanges {
  private readonly herosService = inject(BolHerosService);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly armesList = this.herosStateService.armeList;
  protected readonly armuresList = this.herosStateService.armureList;
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly languesList = this.herosStateService.langueList;
  protected readonly avantagesList = this.herosStateService.avantagesList;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;
  protected readonly regionList = this.herosStateService.regionList;

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly loadingHero = signal(false);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly heroId = computed(() => this.routeParamMap().get('id'));
  protected readonly editMode = computed(() => Boolean(this.heroId()));
  protected readonly pageTitle = computed(() =>
    this.editMode() ? 'Modifier le héros' : 'Nouveau héros',
  );
  protected readonly pageEyebrow = computed(() =>
    this.editMode() ? 'Édition galerie BOL' : 'Galerie BOL',
  );
  protected readonly submitLabel = computed(() => {
    if (this.pending()) {
      return 'Enregistrement...';
    }

    return this.editMode() ? 'Enregistrer' : 'Créer le brouillon';
  });
  protected readonly activateDisabled = computed(
    () => this.pending() || this.loadingHero() || this.heroForm.invalid || this.heroForm.controls.active.value,
  );

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

  protected readonly compareById = (a: number | string | null, b: number | string | null): boolean =>
    Number(a) === Number(b);

  protected readonly heroStatGroups = HERO_STAT_GROUPS;

  private controlValueSignal<T>(control: FormControl<T>): Signal<T> {
    return toSignal(control.valueChanges.pipe(startWith(control.value)), {initialValue: control.value});
  }

  protected readonly avatarPreview = this.controlValueSignal(this.heroForm.controls.avatar);
  protected readonly heroNom = this.controlValueSignal(this.heroForm.controls.nom);
  protected readonly heroJoueur = this.controlValueSignal(this.heroForm.controls.joueur);
  protected readonly heroVitalite = this.controlValueSignal(this.heroForm.controls.vitalite);
  protected readonly heroHeroisme = this.controlValueSignal(this.heroForm.controls.heroisme);

  protected readonly formDirty = toSignal(
    this.heroForm.events.pipe(
      filter((event): event is PristineChangeEvent => event instanceof PristineChangeEvent),
      map((event) => !event.pristine),
    ),
    {initialValue: false},
  );
  protected readonly selectedArmesDraft = toSignal(
    this.armes.valueChanges.pipe(startWith(this.armes.getRawValue())),
    {initialValue: this.armes.getRawValue()},
  );
  protected readonly selectedArmuresDraft = toSignal(
    this.armures.valueChanges.pipe(startWith(this.armures.getRawValue())),
    {initialValue: this.armures.getRawValue()},
  );
  protected readonly selectedCarrieresDraft = toSignal(
    this.carrieres.valueChanges.pipe(startWith(this.carrieres.getRawValue())),
    {initialValue: this.carrieres.getRawValue()},
  );
  protected readonly selectedLanguesDraft = toSignal(
    this.langues.valueChanges.pipe(startWith(this.langues.getRawValue())),
    {initialValue: this.langues.getRawValue()},
  );
  protected readonly selectedTraitsDraft = toSignal(
    this.traits.valueChanges.pipe(startWith(this.traits.getRawValue())),
    {initialValue: this.traits.getRawValue()},
  );

  protected readonly filteredArmes = computed(() => {
    const ids = new Set((this.selectedArmesDraft() ?? []).map((item: HeroSimpleDraft) => Number(item.id)));
    return (this.armesList() ?? []).filter((arme: BolArmeModel) => !ids.has(Number(arme.id)));
  });
  protected readonly filteredArmures = computed(() => {
    const ids = new Set((this.selectedArmuresDraft() ?? []).map((item: HeroSimpleDraft) => Number(item.id)));
    return (this.armuresList() ?? []).filter((armure: BolArmureModel) => !ids.has(Number(armure.id)));
  });
  protected readonly filteredCarrieres = computed(() => {
    const ids = new Set((this.selectedCarrieresDraft() ?? []).map((item: HeroCarriereDraft) => Number(item.id)));
    return (this.carrieresList() ?? []).filter((carriere: BolCarriereModel) => !ids.has(Number(carriere.id)));
  });
  protected readonly filteredLangues = computed(() => {
    const ids = new Set((this.selectedLanguesDraft() ?? []).map((item: HeroSimpleDraft) => Number(item.id)));
    return (this.languesList() ?? []).filter((langue: BolLangueModel) => !ids.has(Number(langue.id)));
  });
  protected readonly filteredAvantages = computed(() => {
    const ids = new Set(
      (this.selectedTraitsDraft() ?? [])
        .filter((item: HeroTraitDraft) => item.type === 'A')
        .map((item: HeroTraitDraft) => Number(item.id)),
    );
    return (this.avantagesList() ?? []).filter((avantage: BolAvantageModel) => !ids.has(Number(avantage.id)));
  });
  protected readonly filteredDesavantages = computed(() => {
    const ids = new Set(
      (this.selectedTraitsDraft() ?? [])
        .filter((item: HeroTraitDraft) => item.type === 'D')
        .map((item: HeroTraitDraft) => Number(item.id)),
    );
    return (this.desavantagesList() ?? []).filter(
      (desavantage: BolDesavantageModel) => !ids.has(Number(desavantage.id)),
    );
  });

  protected readonly selectedArmes = computed(() =>
    (this.selectedArmesDraft() ?? [])
      .map((entry: HeroSimpleDraft) =>
        (this.armesList() ?? []).find((arme: BolArmeModel) => Number(arme.id) === Number(entry.id)),
      )
      .filter((arme: BolArmeModel | undefined): arme is BolArmeModel => Boolean(arme))
      .map((arme: BolArmeModel): ArmeEntry => ({
        id: Number(arme.id),
        label: arme.arme,
        degats: arme.degats,
        portee: arme.portee,
        notes: arme.notes,
      })),
  );
  protected readonly selectedArmures = computed(() =>
    (this.selectedArmuresDraft() ?? [])
      .map((entry: HeroSimpleDraft) =>
        (this.armuresList() ?? []).find((armure: BolArmureModel) => Number(armure.id) === Number(entry.id)),
      )
      .filter((armure: BolArmureModel | undefined): armure is BolArmureModel => Boolean(armure))
      .map((armure: BolArmureModel): ArmureEntry => ({
        id: Number(armure.id),
        label: armure.armure,
        protection: armure.protection,
        malus: armure.malus,
        ptsDePouvoir: armure.pts_de_pouvoir,
      })),
  );
  protected readonly selectedCarrieres = computed(() =>
    (this.selectedCarrieresDraft() ?? [])
      .map((entry: HeroCarriereDraft, index: number) => {
        const definition = (this.carrieresList() ?? []).find(
          (carriere: BolCarriereModel) => Number(carriere.id) === Number(entry.id),
        );

        if (!definition) {
          return null;
        }

        return {
          id: Number(entry.id),
          label: definition.carriere,
          description: definition.description || null,
          rank: this.carrieres.at(index).get('value') as FormControl<number>,
        };
      })
      .filter((entry: CarriereEntry | null): entry is CarriereEntry => entry !== null),
  );
  protected readonly selectedLangues = computed(() =>
    (this.selectedLanguesDraft() ?? [])
      .map((entry: HeroSimpleDraft) =>
        (this.languesList() ?? []).find((langue: BolLangueModel) => Number(langue.id) === Number(entry.id)),
      )
      .filter((langue: BolLangueModel | undefined): langue is BolLangueModel => Boolean(langue))
      .map((langue: BolLangueModel): LangueEntry => ({
        id: Number(langue.id),
        label: langue.langue,
        description: langue.description || null,
        estLemurienne: Boolean(langue.est_lemurienne),
      })),
  );
  protected readonly selectedTraitEntries = computed(() =>
    (this.selectedTraitsDraft() ?? [])
      .map((entry: HeroTraitDraft) => ({
        ...entry,
        label:
          entry.type === 'A'
            ? (this.avantagesList() ?? []).find(
                (avantage: BolAvantageModel) => Number(avantage.id) === Number(entry.id),
              )?.avantage
            : (this.desavantagesList() ?? []).find(
                (desavantage: BolDesavantageModel) => Number(desavantage.id) === Number(entry.id),
              )?.desavantage,
        details: this.traitDetails(entry),
        icon: this.traitIcon(entry),
      }))
      .filter(
        (
          entry: HeroTraitDraft & {label?: string; details: readonly TraitDetail[]; icon: TraitIcon},
        ): entry is TraitEntry => Boolean(entry.label),
      ),
  );
  private readonly regionIdValue = toSignal(
    this.heroForm.controls.region_id.valueChanges.pipe(startWith(this.heroForm.controls.region_id.value)),
    {initialValue: this.heroForm.controls.region_id.value},
  );
  protected readonly selectedRegion = computed(() => {
    const regionId = this.regionIdValue();
    if (regionId === null) {
      return null;
    }

    return (this.regionList() ?? []).find(
      (region: BolRegionModel) => Number(region.id) === Number(regionId),
    ) ?? null;
  });

  constructor() {
    effect((onCleanup) => {
      const heroId = this.heroId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);

      if (!heroId) {
        this.resetForm();
        return;
      }

      this.loadingHero.set(true);
      const subscription = this.herosService
        .heros(heroId)
        .pipe(finalize(() => this.loadingHero.set(false)))
        .subscribe({
          next: (hero) => this.hydrateForm(hero),
          error: (error: unknown) => {
            this.errorMessage.set(extractApiErrorMessage(error, 'Le chargement du héros a échoué.'));
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

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

  protected pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: 'Avatar du héros'},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.heroForm.controls.avatar.setValue(avatar);
        this.heroForm.controls.avatar.markAsDirty();
      }
    });
  }

  protected addArmeEntry(id: number): void {
    this.armes.push(this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}));
    this.armes.markAsDirty();
  }

  protected addArmureEntry(id: number): void {
    this.armures.push(
      this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}),
    );
    this.armures.markAsDirty();
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

  protected addLangueEntry(id: number): void {
    this.langues.push(
      this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}),
    );
    this.langues.markAsDirty();
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

  protected removeItem(items: FormArray, index: number): void {
    items.removeAt(index);
    items.markAsDirty();
  }

  protected saveHero(): void {
    this.submit(false);
  }

  protected confirmActivation(): void {
    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Activer le héros',
        message: 'Voulez-vous activer ce héros ?',
        confirmLabel: 'Oui, activer',
        cancelLabel: 'Non',
      },
    });

    ref.afterClosed().pipe(take(1)).subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.submit(true);
      }
    });
  }

  private submit(activate: boolean): void {
    if (this.pending() || this.loadingHero()) {
      return;
    }

    if (this.heroForm.invalid) {
      this.heroForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);

    const payload = this.buildHeroPayload();
    payload['active'] = activate || Boolean(payload['active']);
    const action$ = this.editMode()
      ? this.herosService.updateHeros(payload)
      : this.herosService.createHeros(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (hero: BolHerosModel) => {
          this.heroForm.markAsPristine();

          if (!this.editMode() && !activate && hero.id) {
            this.navigateToDraft(hero.id);
            return;
          }

          this.navigateBack(true);
        },
        error: (error: unknown) => {
          this.errorMessage.set(extractApiErrorMessage(error, this.saveErrorFallback()));
        },
      });
  }

  protected goBack(): void {
    this.navigateBack(false);
  }

  protected onError(controlName: keyof typeof this.heroForm.controls): boolean {
    const control = this.heroForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.formDirty()) {
      return true;
    }

    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Modifications non enregistrées',
        message: 'Ce héros a des changements non sauvegardés. Quitter sans enregistrer ?',
        confirmLabel: 'Quitter sans sauver',
        cancelLabel: 'Annuler',
      },
    });

    return ref.afterClosed().pipe(map((confirmed: boolean | undefined) => Boolean(confirmed)));
  }

  protected onSaveShortcut(event: Event): void {
    event.preventDefault();
    this.saveHero();
  }

  private resetForm(): void {
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
    this.syncSelectionArrays();
  }

  private hydrateForm(hero: BolHerosModel): void {
    this.resetForm();

    for (const arme of hero.armes) {
      if (typeof arme === 'object') {
        this.armes.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(arme.arme_id), Validators.required),
          }),
          {emitEvent: false},
        );
      }
    }

    for (const armure of hero.armures) {
      if (typeof armure === 'object') {
        this.armures.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(armure.armure_id), Validators.required),
          }),
          {emitEvent: false},
        );
      }
    }

    for (const carriere of hero.carrieres) {
      this.carrieres.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(carriere.carriere_id), Validators.required),
          value: this.formBuilder.control(Number(carriere.value), Validators.required),
        }),
        {emitEvent: false},
      );
    }

    for (const langue of hero.origines.langues) {
      if (typeof langue === 'object') {
        this.langues.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(langue.langue_id), Validators.required),
          }),
          {emitEvent: false},
        );
      }
    }

    for (const trait of hero.traits) {
      this.traits.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(trait.traitable_id), Validators.required),
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
        region_id: hero.origines.region_id !== null ? Number(hero.origines.region_id) : null,
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
    this.syncSelectionArrays();
  }

  private buildHeroPayload(): Record<string, unknown> {
    const rawValue = this.heroForm.getRawValue();
    const origines = {
      joueur: rawValue.joueur,
      nom: rawValue.nom,
      commentaire: rawValue.commentaire,
      region_id: rawValue.region_id !== null ? Number(rawValue.region_id) : null,
      avatar: rawValue.avatar,
      langues: (rawValue.langues as HeroSimpleDraft[]).map((langue) => ({
        id: Number(langue.id),
        langue_id: Number(langue.id),
      })),
    };
    const attributs = {
      vigueur: Number(rawValue.vigueur),
      agilite: Number(rawValue.agilite),
      esprit: Number(rawValue.esprit),
      aura: Number(rawValue.aura),
    };
    const combat = {
      initiative: Number(rawValue.initiative),
      melee: Number(rawValue.melee),
      tir: Number(rawValue.tir),
      defense: Number(rawValue.defense),
    };
    const ressources = {
      vitalite: Number(rawValue.vitalite),
      heroisme: Number(rawValue.heroisme),
      experience: Number(rawValue.experience),
      pouvoir: Number(rawValue.pouvoir),
      foi: Number(rawValue.foi),
      creation: Number(rawValue.creation),
      vilenie: 0,
    };
    const carrieres = (rawValue.carrieres as HeroCarriereDraft[]).map((carriere) => ({
      id: Number(carriere.id),
      carriere_id: Number(carriere.id),
      value: Number(carriere.value),
    }));
    const traits = (rawValue.traits as HeroTraitDraft[]).map((trait) => ({
      id: Number(trait.id),
      traitable_id: Number(trait.id),
      type: trait.type,
      detail: null,
      region_id: null,
      carriere: false,
    }));
    const armes = (rawValue.armes as HeroSimpleDraft[]).map((arme) => ({
      id: Number(arme.id),
      arme_id: Number(arme.id),
    }));
    const armures = (rawValue.armures as HeroSimpleDraft[]).map((armure) => ({
      id: Number(armure.id),
      armure_id: Number(armure.id),
    }));
    const langues = (rawValue.langues as HeroSimpleDraft[]).map((langue) => ({
      id: Number(langue.id),
      langue_id: Number(langue.id),
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

  private navigateBack(afterSave: boolean): void {
    const returnUrl = this.returnUrl();
    if (returnUrl) {
      void this.router.navigateByUrl(returnUrl);
      return;
    }

    if (!afterSave && typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/');
  }

  private navigateToDraft(heroId: string | number): void {
    void this.router.navigate(['/create/hero', heroId], {
      state: this.returnUrl() ? {returnUrl: this.returnUrl()!} : undefined,
    });
  }

  private readReturnUrl(): string | null {
    if (typeof history === 'undefined') {
      return null;
    }

    const state = history.state as Record<string, unknown> | null;
    return typeof state?.['returnUrl'] === 'string' ? state['returnUrl'] : null;
  }

  private saveErrorFallback(): string {
    return this.editMode() ? 'La mise à jour du héros a échoué.' : 'La création du héros a échoué.';
  }

  private traitSource(entry: HeroTraitDraft): BolAvantageModel | BolDesavantageModel | undefined {
    return entry.type === 'A'
      ? (this.avantagesList() ?? []).find(
          (avantage: BolAvantageModel) => Number(avantage.id) === Number(entry.id),
        )
      : (this.desavantagesList() ?? []).find(
          (desavantage: BolDesavantageModel) => Number(desavantage.id) === Number(entry.id),
        );
  }

  private traitIcon(entry: HeroTraitDraft): TraitIcon {
    return traitIconType(this.traitSource(entry));
  }

  private traitDetails(entry: HeroTraitDraft): readonly TraitDetail[] {
    const source = this.traitSource(entry);

    if (!source) {
      return [];
    }

    const details: TraitDetail[] = [];
    if ('de_bonus' in source && source.de_bonus) {
      details.push({title: 'Dé bonus', description: source.de_bonus_domaine});
    }
    if ('de_malus' in source && source.de_malus) {
      details.push({title: 'Dé malus', description: source.de_malus_domaine});
    }
    if (source.attribut) {
      const attributeValue =
        'attribut_bonus' in source ? source.attribut_bonus : 'attribut_malus' in source ? source.attribut_malus : null;
      details.push({
        title: 'Attribut',
        description: `${source.attribut}${attributeValue !== null ? `(${attributeValue})` : ''}`,
      });
    }
    if (source.description) {
      details.push({title: 'Détails', description: source.description});
    }

    return details;
  }

  private syncSelectionArrays(): void {
    this.armes.updateValueAndValidity({emitEvent: true});
    this.armures.updateValueAndValidity({emitEvent: true});
    this.carrieres.updateValueAndValidity({emitEvent: true});
    this.langues.updateValueAndValidity({emitEvent: true});
    this.traits.updateValueAndValidity({emitEvent: true});
  }
}
