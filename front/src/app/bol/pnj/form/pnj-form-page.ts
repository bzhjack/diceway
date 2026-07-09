import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {startWith, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {BolArmureModel} from '../../models/bol-armure.model';
import {BolArmeModel} from '../../models/bol-arme.model';
import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolCarriereModel} from '../../models/bol-carriere.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolLangueModel} from '../../models/bol-langue.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {MatDialog} from '@angular/material/dialog';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {DwBadgeComponent} from '../../../shared/dw-badge/dw-badge';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {PictureComponent} from '../../../shared/picture/picture';

interface PnjSimpleDraft {
  id: number;
}

interface PnjCarriereDraft extends PnjSimpleDraft {
  value: number;
}

interface PnjTraitDraft extends PnjSimpleDraft {
  type: 'A' | 'D';
}

interface PnjTraitDetail {
  readonly title: string;
  readonly description: string | null;
}

interface PnjTraitEntry extends PnjTraitDraft {
  readonly label: string;
  readonly details: readonly PnjTraitDetail[];
}

interface PnjSelectedCarriereEntry extends PnjCarriereDraft {
  readonly definition: BolCarriereModel;
}

@Component({
  selector: 'bol-pnj-form-page',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DwBadgeComponent,
    DwTagComponent,
  ],
  templateUrl: './pnj-form-page.html',
  styleUrl: './pnj-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjFormPageComponent {
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

  protected readonly typeOptions = [
    { label: 'Piétaille', value: 'P' },
    { label: 'Coriace', value: 'C' },
    { label: 'Rival', value: 'R' },
  ];

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

  protected readonly compareById = (a: number | string | null, b: number | string | null): boolean =>
    Number(a) === Number(b);

  protected readonly selectedArmeId = new FormControl<number | null>(null);
  protected readonly selectedArmureId = new FormControl<number | null>(null);
  protected readonly selectedCarriereId = new FormControl<number | null>(null);
  protected readonly selectedLangueId = new FormControl<number | null>(null);
  protected readonly selectedAvantageId = new FormControl<number | null>(null);
  protected readonly selectedDesavantageId = new FormControl<number | null>(null);

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

  protected readonly avatarPreview = toSignal(
    this.pnjForm.controls.avatar.valueChanges.pipe(startWith(this.pnjForm.controls.avatar.value)),
    {
      initialValue: this.pnjForm.controls.avatar.value,
    },
  );
  protected readonly selectedArmesDraft = toSignal(
    this.armes.valueChanges.pipe(startWith(this.armes.getRawValue())),
    { initialValue: this.armes.getRawValue() },
  );
  protected readonly selectedArmuresDraft = toSignal(
    this.armures.valueChanges.pipe(startWith(this.armures.getRawValue())),
    { initialValue: this.armures.getRawValue() },
  );
  protected readonly selectedCarrieresDraft = toSignal(
    this.carrieres.valueChanges.pipe(startWith(this.carrieres.getRawValue())),
    { initialValue: this.carrieres.getRawValue() },
  );
  protected readonly selectedLanguesDraft = toSignal(
    this.langues.valueChanges.pipe(startWith(this.langues.getRawValue())),
    { initialValue: this.langues.getRawValue() },
  );
  protected readonly selectedTraitsDraft = toSignal(
    this.traits.valueChanges.pipe(startWith(this.traits.getRawValue())),
    { initialValue: this.traits.getRawValue() },
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
    return (this.avantagesList() ?? []).filter((avantage) => !ids.has(Number(avantage.id)));
  });
  protected readonly filteredDesavantages = computed(() => {
    const ids = new Set(
      (this.selectedTraitsDraft() ?? [])
        .filter((item: PnjTraitDraft) => item.type === 'D')
        .map((item: PnjTraitDraft) => Number(item.id)),
    );
    return (this.desavantagesList() ?? []).filter((desavantage) => !ids.has(Number(desavantage.id)));
  });

  protected readonly selectedArmes = computed(() =>
    (this.selectedArmesDraft() ?? [])
      .map((entry: PnjSimpleDraft) =>
        (this.armesList() ?? []).find((arme: BolArmeModel) => Number(arme.id) === Number(entry.id)),
      )
      .filter((arme: BolArmeModel | undefined): arme is BolArmeModel => Boolean(arme)),
  );
  protected readonly selectedArmures = computed(() =>
    (this.selectedArmuresDraft() ?? [])
      .map((entry: PnjSimpleDraft) =>
        (this.armuresList() ?? []).find((armure: BolArmureModel) => Number(armure.id) === Number(entry.id)),
      )
      .filter((armure: BolArmureModel | undefined): armure is BolArmureModel => Boolean(armure)),
  );
  protected readonly selectedCarrieres = computed(() =>
    (this.selectedCarrieresDraft() ?? [])
      .map((entry: PnjCarriereDraft) => ({
        ...entry,
        definition: (this.carrieresList() ?? []).find(
          (carriere: BolCarriereModel) => Number(carriere.id) === Number(entry.id),
        ),
      }))
      .filter(
        (
          entry: PnjCarriereDraft & {definition?: BolCarriereModel},
        ): entry is PnjSelectedCarriereEntry => Boolean(entry.definition),
      ),
  );
  protected readonly selectedLangues = computed(() =>
    (this.selectedLanguesDraft() ?? [])
      .map((entry: PnjSimpleDraft) =>
        (this.languesList() ?? []).find((langue: BolLangueModel) => Number(langue.id) === Number(entry.id)),
      )
      .filter((langue: BolLangueModel | undefined): langue is BolLangueModel => Boolean(langue)),
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
      }))
      .filter(
        (
          entry: PnjTraitDraft & {label?: string; details: readonly PnjTraitDetail[]},
        ): entry is PnjTraitEntry => Boolean(entry.label),
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
            this.errorMessage.set(this.extractErrorMessage(error, true));
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
      }
    });
  }

  protected addArme(): void {
    const id = this.selectedArmeId.value;
    if (!id) {
      return;
    }

    this.armes.push(this.formBuilder.group({ id: this.formBuilder.control(Number(id), Validators.required) }));
    this.selectedArmeId.setValue(null);
  }

  protected addArmure(): void {
    const id = this.selectedArmureId.value;
    if (!id) {
      return;
    }

    this.armures.push(
      this.formBuilder.group({ id: this.formBuilder.control(Number(id), Validators.required) }),
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
      this.formBuilder.group({ id: this.formBuilder.control(Number(id), Validators.required) }),
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
        next: () => this.navigateBack(true),
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error, false));
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
      { emitEvent: false },
    );
    this.armes.clear({ emitEvent: false });
    this.armures.clear({ emitEvent: false });
    this.carrieres.clear({ emitEvent: false });
    this.langues.clear({ emitEvent: false });
    this.traits.clear({ emitEvent: false });
    this.selectedArmeId.setValue(null);
    this.selectedArmureId.setValue(null);
    this.selectedCarriereId.setValue(null);
    this.selectedLangueId.setValue(null);
    this.selectedAvantageId.setValue(null);
    this.selectedDesavantageId.setValue(null);
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
          { emitEvent: false },
        );
      }
    }

    for (const armure of pnj.armures) {
      if (typeof armure === 'object') {
        this.armures.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(armure.armure_id), Validators.required),
          }),
          { emitEvent: false },
        );
      }
    }

    for (const carriere of pnj.carrieres) {
      this.carrieres.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(carriere.carriere_id), Validators.required),
          value: this.formBuilder.control(Number(carriere.value), Validators.required),
        }),
        { emitEvent: false },
      );
    }

    for (const langue of pnj.origines.langues) {
      if (typeof langue === 'object') {
        this.langues.push(
          this.formBuilder.group({
            id: this.formBuilder.control(Number(langue.langue_id), Validators.required),
          }),
          { emitEvent: false },
        );
      }
    }

    for (const trait of pnj.traits) {
      this.traits.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(trait.traitable_id), Validators.required),
          type: this.formBuilder.control<'A' | 'D'>(trait.type, Validators.required),
        }),
        { emitEvent: false },
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
      { emitEvent: true },
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
      armes: (rawValue.armes as PnjSimpleDraft[]).map((arme) => ({ id: Number(arme.id) })),
      armures: (rawValue.armures as PnjSimpleDraft[]).map((armure) => ({ id: Number(armure.id) })),
      carrieres: (rawValue.carrieres as PnjCarriereDraft[]).map((carriere) => ({
        id: Number(carriere.id),
        value: Number(carriere.value),
      })),
      langues: (rawValue.langues as PnjSimpleDraft[]).map((langue) => ({ id: Number(langue.id) })),
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
      ? 'Le chargement du PNJ a échoué.'
      : this.editMode()
        ? 'La mise à jour du PNJ a échoué.'
        : 'La création du PNJ a échoué.';
  }

  private traitDetails(entry: PnjTraitDraft): readonly PnjTraitDetail[] {
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

    const details: PnjTraitDetail[] = [];
    if ('de_bonus' in source && source.de_bonus) {
      details.push({ title: 'Dé bonus', description: source.de_bonus_domaine });
    }
    if ('de_malus' in source && source.de_malus) {
      details.push({ title: 'Dé malus', description: source.de_malus_domaine });
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
      details.push({ title: 'Détails', description: source.description });
    }

    return details;
  }

  private syncSelectionArrays(): void {
    this.armes.updateValueAndValidity({ emitEvent: true });
    this.armures.updateValueAndValidity({ emitEvent: true });
    this.carrieres.updateValueAndValidity({ emitEvent: true });
    this.langues.updateValueAndValidity({ emitEvent: true });
    this.traits.updateValueAndValidity({ emitEvent: true });
  }
}
