import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {startWith, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {ConfirmationService} from 'primeng/api';
import {BolArmureModel} from '../models/bol-armure.model';
import {BolArmeModel} from '../models/bol-arme.model';
import {BolAvantageModel} from '../models/bol-avantage.model';
import {BolCarriereModel} from '../models/bol-carriere.model';
import {BolDesavantageModel} from '../models/bol-desavantage.model';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolLangueModel} from '../models/bol-langue.model';
import {BolRegionModel} from '../models/bol-region.model';
import {BolHerosStateService} from '../services/bol-heros-state.service';
import {BolHerosService} from '../services/bol-heros.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {MatDialog} from '@angular/material/dialog';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {PictureComponent} from '../../shared/picture/picture';

interface HeroSimpleDraft {
  id: number;
}

interface HeroCarriereDraft extends HeroSimpleDraft {
  value: number;
}

interface HeroTraitDraft extends HeroSimpleDraft {
  type: 'A' | 'D';
}

interface HeroTraitDetail {
  readonly title: string;
  readonly description: string | null;
}

interface HeroTraitEntry extends HeroTraitDraft {
  readonly label: string;
  readonly details: readonly HeroTraitDetail[];
}

interface HeroSelectedCarriereEntry extends HeroCarriereDraft {
  readonly definition: BolCarriereModel;
}

@Component({
  selector: 'bol-hero-form-page',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ConfirmPopupModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './hero-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class HeroFormPageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirmationService = inject(ConfirmationService);
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

  protected readonly selectedArmeId = new FormControl<number | null>(null);
  protected readonly selectedArmureId = new FormControl<number | null>(null);
  protected readonly selectedCarriereId = new FormControl<number | null>(null);
  protected readonly selectedLangueId = new FormControl<number | null>(null);
  protected readonly selectedAvantageId = new FormControl<number | null>(null);
  protected readonly selectedDesavantageId = new FormControl<number | null>(null);

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

  protected readonly avatarPreview = toSignal(
    this.heroForm.controls.avatar.valueChanges.pipe(startWith(this.heroForm.controls.avatar.value)),
    {initialValue: this.heroForm.controls.avatar.value},
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
      .filter((arme: BolArmeModel | undefined): arme is BolArmeModel => Boolean(arme)),
  );
  protected readonly selectedArmures = computed(() =>
    (this.selectedArmuresDraft() ?? [])
      .map((entry: HeroSimpleDraft) =>
        (this.armuresList() ?? []).find((armure: BolArmureModel) => Number(armure.id) === Number(entry.id)),
      )
      .filter((armure: BolArmureModel | undefined): armure is BolArmureModel => Boolean(armure)),
  );
  protected readonly selectedCarrieres = computed(() =>
    (this.selectedCarrieresDraft() ?? [])
      .map((entry: HeroCarriereDraft) => ({
        ...entry,
        definition: (this.carrieresList() ?? []).find(
          (carriere: BolCarriereModel) => Number(carriere.id) === Number(entry.id),
        ),
      }))
      .filter(
        (
          entry: HeroCarriereDraft & {definition?: BolCarriereModel},
        ): entry is HeroSelectedCarriereEntry => Boolean(entry.definition),
      ),
  );
  protected readonly selectedLangues = computed(() =>
    (this.selectedLanguesDraft() ?? [])
      .map((entry: HeroSimpleDraft) =>
        (this.languesList() ?? []).find((langue: BolLangueModel) => Number(langue.id) === Number(entry.id)),
      )
      .filter((langue: BolLangueModel | undefined): langue is BolLangueModel => Boolean(langue)),
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
      }))
      .filter(
        (
          entry: HeroTraitDraft & {label?: string; details: readonly HeroTraitDetail[]},
        ): entry is HeroTraitEntry => Boolean(entry.label),
      ),
  );
  protected readonly selectedRegion = computed(() => {
    const regionId = this.heroForm.controls.region_id.value;
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
            this.errorMessage.set(this.extractErrorMessage(error, true));
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
      }
    });
  }

  protected addArme(): void {
    const id = this.selectedArmeId.value;
    if (!id) {
      return;
    }

    this.armes.push(this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}));
    this.selectedArmeId.setValue(null);
  }

  protected addArmure(): void {
    const id = this.selectedArmureId.value;
    if (!id) {
      return;
    }

    this.armures.push(
      this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}),
    );
    this.selectedArmureId.setValue(null);
  }

  protected addCarriere(): void {
    const id = this.selectedCarriereId.value;
    if (!id) {
      return;
    }

    this.carrieres.push(
      this.formBuilder.group({
        id: this.formBuilder.control(Number(id), Validators.required),
        value: this.formBuilder.control(0, Validators.required),
      }),
    );
    this.selectedCarriereId.setValue(null);
  }

  protected addLangue(): void {
    const id = this.selectedLangueId.value;
    if (!id) {
      return;
    }

    this.langues.push(
      this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}),
    );
    this.selectedLangueId.setValue(null);
  }

  protected addTrait(type: 'A' | 'D'): void {
    const control = type === 'A' ? this.selectedAvantageId : this.selectedDesavantageId;
    const id = control.value;
    if (!id) {
      return;
    }

    this.traits.push(
      this.formBuilder.group({
        id: this.formBuilder.control(Number(id), Validators.required),
        type: this.formBuilder.control<'A' | 'D'>(type, Validators.required),
      }),
    );
    control.setValue(null);
  }

  protected removeItem(items: FormArray, index: number): void {
    items.removeAt(index);
  }

  protected saveHero(): void {
    this.submit(false);
  }

  protected confirmActivation(event: Event): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous activer ce héros ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.submit(true),
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
          if (!this.editMode() && !activate && hero.id) {
            this.navigateToDraft(hero.id);
            return;
          }

          this.navigateBack(true);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error, false));
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

  protected armeOption(id: number | null | undefined): BolArmeModel | null {
    if (!id) {
      return null;
    }

    return (this.armesList() ?? []).find((arme: BolArmeModel) => Number(arme.id) === Number(id)) ?? null;
  }

  protected armureOption(id: number | null | undefined): BolArmureModel | null {
    if (!id) {
      return null;
    }

    return (this.armuresList() ?? []).find((armure: BolArmureModel) => Number(armure.id) === Number(id)) ?? null;
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
    this.selectedArmeId.setValue(null);
    this.selectedArmureId.setValue(null);
    this.selectedCarriereId.setValue(null);
    this.selectedLangueId.setValue(null);
    this.selectedAvantageId.setValue(null);
    this.selectedDesavantageId.setValue(null);
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

  private extractErrorMessage(error: unknown, loading: boolean): string {
    if (typeof error === 'object' && error !== null) {
      if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const apiError = error.error as Record<string, unknown>;
        if (typeof apiError['message'] === 'string') {
          return apiError['message'];
        }
      }

      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }

    return loading
      ? 'Le chargement du héros a échoué.'
      : this.editMode()
        ? 'La mise à jour du héros a échoué.'
        : 'La création du héros a échoué.';
  }

  private traitDetails(entry: HeroTraitDraft): readonly HeroTraitDetail[] {
    const source =
      entry.type === 'A'
        ? (this.avantagesList() ?? []).find(
            (avantage: BolAvantageModel) => Number(avantage.id) === Number(entry.id),
          )
        : (this.desavantagesList() ?? []).find(
            (desavantage: BolDesavantageModel) => Number(desavantage.id) === Number(entry.id),
          );

    if (!source) {
      return [];
    }

    const details: HeroTraitDetail[] = [];
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
