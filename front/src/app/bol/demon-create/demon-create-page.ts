import {JsonPipe, Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {startWith, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {BolDemonModel} from '../models/bol-demon.model';
import {BolDemonStateService} from '../services/bol-demon-state.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DialogService} from 'primeng/dynamicdialog';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {PictureComponent} from '../../shared/picture/picture';

interface DemonPouvoirDraft {
  id: number;
  detail: string | null;
}

@Component({
  selector: 'bol-demon-create-page',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './demon-create-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DialogService],
})
export class DemonCreatePageComponent {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private hydratedCategorieId: number | null = null;

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly pouvoirsList = this.demonStateService.pouvoirList;
  protected readonly savedDemon = signal<BolDemonModel | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly loadingDemon = signal(false);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly demonId = computed(() => this.routeParamMap().get('id'));
  protected readonly editMode = computed(() => Boolean(this.demonId()));
  protected readonly pageTitle = computed(() =>
    this.editMode() ? 'Modifier le demon' : 'Nouveau demon',
  );
  protected readonly pageEyebrow = computed(() =>
    this.editMode() ? 'Edition infernale BOL' : 'Bestiaire infernal BOL',
  );
  protected readonly submitLabel = computed(() => {
    if (this.pending()) {
      return 'Enregistrement...';
    }

    return this.editMode() ? 'Mettre a jour le demon' : 'Enregistrer le demon';
  });
  protected readonly saveSuccessTitle = computed(() =>
    this.editMode() ? 'Demon mis a jour' : 'Demon cree',
  );
  protected readonly saveSuccessMessage = computed(() =>
    this.editMode()
      ? 'Les modifications ont bien ete enregistrees cote backend.'
      : 'Le demon a bien ete enregistre cote backend.',
  );

  protected readonly selectedPouvoirId = new FormControl<number | null>(null);
  protected readonly selectedPouvoirDetail = new FormControl<string>('', {
    nonNullable: true,
  });

  protected readonly demonForm = this.formBuilder.group({
    id: this.formBuilder.control<string | null>(null),
    nom: this.formBuilder.control('', Validators.required),
    id_categorie: this.formBuilder.control<number | null>(null, Validators.required),
    commentaire: this.formBuilder.control<string | null>(null),
    vigueur: this.formBuilder.control(0, Validators.required),
    agilite: this.formBuilder.control(0, Validators.required),
    esprit: this.formBuilder.control(0, Validators.required),
    aura: this.formBuilder.control(0, Validators.required),
    vitalite: this.formBuilder.control(0, Validators.required),
    melee: this.formBuilder.control(0, Validators.required),
    tir: this.formBuilder.control(0, Validators.required),
    defense: this.formBuilder.control(0, Validators.required),
    degats: this.formBuilder.control('0', Validators.required),
    avatar: this.formBuilder.control<string | null>(null),
    pouvoirs: this.formBuilder.array([]),
  });

  protected readonly categorieId = toSignal(this.demonForm.controls.id_categorie.valueChanges, {
    initialValue: this.demonForm.controls.id_categorie.value,
  });
  protected readonly avatarPreview = toSignal(
    this.demonForm.controls.avatar.valueChanges.pipe(startWith(this.demonForm.controls.avatar.value)),
    {
      initialValue: this.demonForm.controls.avatar.value,
    },
  );
  protected readonly selectedPouvoirs = toSignal(
    this.pouvoirs.valueChanges.pipe(startWith(this.pouvoirs.getRawValue())),
    {
      initialValue: this.pouvoirs.getRawValue(),
    },
  );
  protected readonly selectedCategorie = computed(() =>
    (this.categories() ?? []).find((categorie) => Number(categorie.id) === Number(this.categorieId())),
  );
  protected readonly filteredPouvoirs = computed(() => {
    const selectedIds = new Set(
      (this.selectedPouvoirs() ?? []).map((pouvoir: DemonPouvoirDraft) => Number(pouvoir.id)),
    );

    return (this.pouvoirsList() ?? []).filter((pouvoir) => !selectedIds.has(Number(pouvoir.id)));
  });
  protected readonly selectedPouvoirEntries = computed(() =>
    (this.selectedPouvoirs() ?? []).map((entry: DemonPouvoirDraft) => ({
      ...entry,
      definition: (this.pouvoirsList() ?? []).find(
        (pouvoir) => Number(pouvoir.id) === Number(entry.id),
      ),
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const demonId = this.demonId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);
      this.savedDemon.set(null);

      if (!demonId) {
        this.resetForm();
        return;
      }

      this.loadingDemon.set(true);
      const subscription = this.demonsService
        .demon(demonId)
        .pipe(finalize(() => this.loadingDemon.set(false)))
        .subscribe({
          next: (demon) => this.hydrateForm(demon),
          error: (error: unknown) => {
            this.errorMessage.set(this.extractErrorMessage(error, true));
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      const categorie = this.selectedCategorie();
      if (!categorie) {
        return;
      }

      if (
        this.hydratedCategorieId !== null &&
        Number(categorie.id) === this.hydratedCategorieId
      ) {
        this.hydratedCategorieId = null;
        return;
      }

      this.demonForm.patchValue(
        {
          vitalite: categorie.vitalite ?? 0,
          degats: categorie.degats ?? '0',
        },
        { emitEvent: false },
      );
    });
  }

  protected get pouvoirs(): FormArray {
    return this.demonForm.controls.pouvoirs as FormArray;
  }

  protected addPouvoir(): void {
    const pouvoirId = this.selectedPouvoirId.value;
    if (!pouvoirId) {
      return;
    }

    this.pouvoirs.push(
      this.formBuilder.group({
        id: this.formBuilder.control(pouvoirId, Validators.required),
        detail: this.formBuilder.control(this.selectedPouvoirDetail.value || null),
      }),
    );

    this.selectedPouvoirId.setValue(null);
    this.selectedPouvoirDetail.setValue('');
  }

  protected removePouvoir(index: number): void {
    this.pouvoirs.removeAt(index);
  }

  protected pickAvatar(): void {
    const ref = this.dialogService.open(PictureComponent, {
      header: 'Avatar du demon',
      modal: true,
      closable: false,
      width: 'min(960px, 92vw)',
    });

    ref?.onClose.pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.demonForm.controls.avatar.setValue(avatar);
      }
    });
  }

  protected saveDemon(): void {
    if (this.pending() || this.loadingDemon()) {
      return;
    }

    if (this.demonForm.invalid) {
      this.demonForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);
    this.savedDemon.set(null);

    const payload = this.buildDemonPayload();
    const action$ = this.editMode()
      ? this.demonsService.updateDemon(payload)
      : this.demonsService.createDemon(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (demon: BolDemonModel) => {
          this.savedDemon.set(demon);
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

  protected onError(controlName: keyof typeof this.demonForm.controls): boolean {
    const control = this.demonForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private resetForm(): void {
    this.hydratedCategorieId = null;
    this.demonForm.reset(
      {
        id: null,
        nom: '',
        id_categorie: null,
        commentaire: null,
        vigueur: 0,
        agilite: 0,
        esprit: 0,
        aura: 0,
        vitalite: 0,
        melee: 0,
        tir: 0,
        defense: 0,
        degats: '0',
        avatar: null,
      },
      { emitEvent: false },
    );
    this.pouvoirs.clear({ emitEvent: false });
    this.pouvoirs.updateValueAndValidity({ emitEvent: true });
    this.selectedPouvoirId.setValue(null);
    this.selectedPouvoirDetail.setValue('');
  }

  private hydrateForm(demon: BolDemonModel): void {
    this.hydratedCategorieId = Number(demon.id_categorie);
    this.selectedPouvoirId.setValue(null);
    this.selectedPouvoirDetail.setValue('');
    this.pouvoirs.clear({ emitEvent: false });

    for (const pouvoir of demon.pouvoirs) {
      this.pouvoirs.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(pouvoir.pouvoir_id), Validators.required),
          detail: this.formBuilder.control(pouvoir.detail || null),
        }),
        { emitEvent: false },
      );
    }

    this.demonForm.patchValue(
      {
        id: demon.id,
        nom: demon.nom,
        id_categorie: Number(demon.id_categorie),
        commentaire: demon.commentaire,
        vigueur: demon.vigueur,
        agilite: demon.agilite,
        esprit: demon.esprit,
        aura: demon.aura,
        vitalite: demon.vitalite,
        melee: demon.melee,
        tir: demon.tir,
        defense: demon.defense,
        degats: demon.degats,
        avatar: demon.avatar,
      },
      { emitEvent: true },
    );
    this.pouvoirs.updateValueAndValidity({ emitEvent: true });
  }

  private buildDemonPayload(): Record<string, unknown> {
    const rawValue = this.demonForm.getRawValue();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      id_categorie: rawValue.id_categorie,
      commentaire: rawValue.commentaire,
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      aura: rawValue.aura,
      vitalite: rawValue.vitalite,
      melee: rawValue.melee,
      tir: rawValue.tir,
      defense: rawValue.defense,
      degats: rawValue.degats,
      avatar: rawValue.avatar,
      pouvoirs: (rawValue.pouvoirs as DemonPouvoirDraft[]).map((pouvoir) => ({
        id: pouvoir.id,
        detail: pouvoir.detail,
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
      ? 'Le chargement du demon a echoue.'
      : this.editMode()
        ? 'La mise a jour du demon a echoue.'
        : 'La creation du demon a echoue.';
  }
}
