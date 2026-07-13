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
import {LangueEntry} from '../../shared/langue/list/langue-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {TraitAddEvent} from '../../shared/trait/add-menu/trait-add-menu.component';
import {TraitDetail, TraitEntry} from '../../shared/trait/list/trait-list.component';
import {TraitIcon, traitIconType} from '../../shared/trait-icon';
import {PnjGeneralComponent, PnjTypeOption} from './general/pnj-general.component';
import {PnjSummaryRailComponent} from './summary-rail/pnj-summary-rail.component';

interface PnjSimpleDraft {
  id: number;
}

interface PnjCarriereDraft extends PnjSimpleDraft {
  value: number;
}

interface PnjTraitDraft extends PnjSimpleDraft {
  type: 'A' | 'D';
}

const PNJ_TYPE_OPTIONS: readonly PnjTypeOption[] = [
  {label: 'Piétaille', value: 'P'},
  {label: 'Coriace', value: 'C'},
  {label: 'Rival', value: 'R'},
];

const PNJ_TYPE_LABELS: Readonly<Record<'P' | 'C' | 'R', string>> = {
  P: 'Piétaille',
  C: 'Coriace',
  R: 'Rival',
};

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
export class PnjFormPageComponent implements HasPendingChanges {
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

  protected readonly typeOptions = PNJ_TYPE_OPTIONS;
  protected readonly pnjStatGroups = PNJ_STAT_GROUPS;

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly loadingPnj = signal(false);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly pnjId = computed(() => this.routeParamMap().get('id'));
  protected readonly editMode = computed(() => Boolean(this.pnjId()));
  protected readonly pageTitle = computed(() =>
    this.editMode() ? 'Modifier le PNJ' : 'Nouveau PNJ',
  );
  protected readonly pageEyebrow = computed(() =>
    this.editMode() ? 'Édition galerie BOL' : 'Galerie BOL',
  );
  protected readonly submitLabel = computed(() => {
    if (this.pending()) {
      return 'Enregistrement...';
    }

    return this.editMode() ? 'Mettre à jour le PNJ' : 'Enregistrer le PNJ';
  });

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

  private controlValueSignal<T>(control: FormControl<T>): Signal<T> {
    return toSignal(control.valueChanges.pipe(startWith(control.value)), {initialValue: control.value});
  }

  protected readonly avatarPreview = this.controlValueSignal(this.pnjForm.controls.avatar);
  protected readonly pnjNom = this.controlValueSignal(this.pnjForm.controls.nom);
  protected readonly pnjType = this.controlValueSignal(this.pnjForm.controls.type);
  protected readonly pnjVitalite = this.controlValueSignal(this.pnjForm.controls.vitalite);
  protected readonly pnjTypeLabel = computed(() => PNJ_TYPE_LABELS[this.pnjType() ?? 'P']);

  protected readonly formDirty = toSignal(
    this.pnjForm.events.pipe(
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
    const ids = new Set((this.selectedArmesDraft() ?? []).map((item: PnjSimpleDraft) => Number(item.id)));
    return (this.armesList() ?? []).filter((arme: BolArmeModel) => !ids.has(Number(arme.id)));
  });
  protected readonly filteredArmures = computed(() => {
    const ids = new Set((this.selectedArmuresDraft() ?? []).map((item: PnjSimpleDraft) => Number(item.id)));
    return (this.armuresList() ?? []).filter((armure: BolArmureModel) => !ids.has(Number(armure.id)));
  });
  protected readonly filteredCarrieres = computed(() => {
    const ids = new Set((this.selectedCarrieresDraft() ?? []).map((item: PnjCarriereDraft) => Number(item.id)));
    return (this.carrieresList() ?? []).filter((carriere: BolCarriereModel) => !ids.has(Number(carriere.id)));
  });
  protected readonly filteredLangues = computed(() => {
    const ids = new Set((this.selectedLanguesDraft() ?? []).map((item: PnjSimpleDraft) => Number(item.id)));
    return (this.languesList() ?? []).filter((langue: BolLangueModel) => !ids.has(Number(langue.id)));
  });
  protected readonly filteredAvantages = computed(() => {
    const ids = new Set(
      (this.selectedTraitsDraft() ?? [])
        .filter((item: PnjTraitDraft) => item.type === 'A')
        .map((item: PnjTraitDraft) => Number(item.id)),
    );
    return (this.avantagesList() ?? []).filter((avantage: BolAvantageModel) => !ids.has(Number(avantage.id)));
  });
  protected readonly filteredDesavantages = computed(() => {
    const ids = new Set(
      (this.selectedTraitsDraft() ?? [])
        .filter((item: PnjTraitDraft) => item.type === 'D')
        .map((item: PnjTraitDraft) => Number(item.id)),
    );
    return (this.desavantagesList() ?? []).filter(
      (desavantage: BolDesavantageModel) => !ids.has(Number(desavantage.id)),
    );
  });

  protected readonly selectedArmes = computed(() =>
    (this.selectedArmesDraft() ?? [])
      .map((entry: PnjSimpleDraft) =>
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
      .map((entry: PnjSimpleDraft) =>
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
      .map((entry: PnjCarriereDraft, index: number) => {
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
      .map((entry: PnjSimpleDraft) =>
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
      .map((entry: PnjTraitDraft) => ({
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
          entry: PnjTraitDraft & {label?: string; details: readonly TraitDetail[]; icon: TraitIcon},
        ): entry is TraitEntry => Boolean(entry.label),
      ),
  );

  constructor() {
    effect((onCleanup) => {
      const pnjId = this.pnjId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);

      if (!pnjId) {
        this.resetForm();
        return;
      }

      this.loadingPnj.set(true);
      const subscription = this.herosService
        .pnj(pnjId)
        .pipe(finalize(() => this.loadingPnj.set(false)))
        .subscribe({
          next: (pnj) => this.hydrateForm(pnj),
          error: (error: unknown) => {
            this.errorMessage.set(extractApiErrorMessage(error, 'Le chargement du PNJ a échoué.'));
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

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

  protected pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: 'Avatar du PNJ'},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.pnjForm.controls.avatar.setValue(avatar);
        this.pnjForm.controls.avatar.markAsDirty();
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

  protected savePnj(): void {
    if (this.pending() || this.loadingPnj()) {
      return;
    }

    if (this.pnjForm.invalid) {
      this.pnjForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);

    const payload = this.buildPnjPayload();
    const action$ = this.editMode()
      ? this.herosService.quickUpdate(payload)
      : this.herosService.quickCreate(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.pnjForm.markAsPristine();
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

  protected onError(controlName: keyof typeof this.pnjForm.controls): boolean {
    const control = this.pnjForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.formDirty()) {
      return true;
    }

    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Modifications non enregistrées',
        message: 'Ce PNJ a des changements non sauvegardés. Quitter sans enregistrer ?',
        confirmLabel: 'Quitter sans sauver',
        cancelLabel: 'Annuler',
      },
    });

    return ref.afterClosed().pipe(map((confirmed: boolean | undefined) => Boolean(confirmed)));
  }

  protected onSaveShortcut(event: Event): void {
    event.preventDefault();
    this.savePnj();
  }

  private resetForm(): void {
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
    this.syncSelectionArrays();
  }

  private hydrateForm(pnj: BolHerosModel): void {
    this.resetForm();

    for (const arme of pnj.armes) {
      if (typeof arme === 'object') {
        this.armes.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(arme.arme_id), Validators.required),
          }),
          {emitEvent: false},
        );
      }
    }

    for (const armure of pnj.armures) {
      if (typeof armure === 'object') {
        this.armures.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(armure.armure_id), Validators.required),
          }),
          {emitEvent: false},
        );
      }
    }

    for (const carriere of pnj.carrieres) {
      this.carrieres.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(carriere.carriere_id), Validators.required),
          value: this.formBuilder.control(Number(carriere.value), Validators.required),
        }),
        {emitEvent: false},
      );
    }

    for (const langue of pnj.origines.langues) {
      if (typeof langue === 'object') {
        this.langues.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(langue.langue_id), Validators.required),
          }),
          {emitEvent: false},
        );
      }
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
    this.syncSelectionArrays();
  }

  private buildPnjPayload(): Record<string, unknown> {
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
      armes: (rawValue.armes as PnjSimpleDraft[]).map((arme) => ({id: Number(arme.id)})),
      armures: (rawValue.armures as PnjSimpleDraft[]).map((armure) => ({id: Number(armure.id)})),
      carrieres: (rawValue.carrieres as PnjCarriereDraft[]).map((carriere) => ({
        id: Number(carriere.id),
        value: Number(carriere.value),
      })),
      langues: (rawValue.langues as PnjSimpleDraft[]).map((langue) => ({id: Number(langue.id)})),
      traits: (rawValue.traits as PnjTraitDraft[]).map((trait) => ({
        id: Number(trait.id),
        type: trait.type,
      })),
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

  private readReturnUrl(): string | null {
    if (typeof history === 'undefined') {
      return null;
    }

    const state = history.state as Record<string, unknown> | null;
    return typeof state?.['returnUrl'] === 'string' ? state['returnUrl'] : null;
  }

  private saveErrorFallback(): string {
    return this.editMode() ? 'La mise à jour du PNJ a échoué.' : 'La création du PNJ a échoué.';
  }

  private traitSource(entry: PnjTraitDraft): BolAvantageModel | BolDesavantageModel | undefined {
    return entry.type === 'A'
      ? (this.avantagesList() ?? []).find(
          (avantage: BolAvantageModel) => Number(avantage.id) === Number(entry.id),
        )
      : (this.desavantagesList() ?? []).find(
          (desavantage: BolDesavantageModel) => Number(desavantage.id) === Number(entry.id),
        );
  }

  private traitIcon(entry: PnjTraitDraft): TraitIcon {
    return traitIconType(this.traitSource(entry));
  }

  private traitDetails(entry: PnjTraitDraft): readonly TraitDetail[] {
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
