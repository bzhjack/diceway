import {JsonPipe, Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {startWith, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {BolCreatureModel} from '../models/bol-creature.model';
import {BolCreatureStateService} from '../services/bol-creature-state.service';
import {BolCreaturesService} from '../services/bol-creatures.service';
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

interface CreatureCapaciteDraft {
  id: number;
  detail: string | null;
}

@Component({
  selector: 'bol-creature-form-page',
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
  templateUrl: './creature-form-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DialogService],
})
export class CreatureFormPageComponent {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private hydratedTailleId: number | null = null;

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly capacitesList = this.creatureStateService.capaciteList;
  protected readonly savedCreature = signal<BolCreatureModel | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly loadingCreature = signal(false);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly creatureId = computed(() => this.routeParamMap().get('id'));
  protected readonly editMode = computed(() => Boolean(this.creatureId()));
  protected readonly pageTitle = computed(() =>
    this.editMode() ? 'Modifier la créature' : 'Nouvelle créature',
  );
  protected readonly pageEyebrow = computed(() =>
    this.editMode() ? 'Édition bestiaire BOL' : 'Bestiaire BOL',
  );
  protected readonly submitLabel = computed(() => {
    if (this.pending()) {
      return 'Enregistrement...';
    }

    return this.editMode() ? 'Mettre à jour la créature' : 'Enregistrer la créature';
  });
  protected readonly saveSuccessTitle = computed(() =>
    this.editMode() ? 'Créature mise à jour' : 'Créature créée',
  );
  protected readonly saveSuccessMessage = computed(() =>
    this.editMode()
      ? 'Les modifications ont bien été enregistrées côté backend.'
      : 'La créature a bien été enregistrée côté backend.',
  );

  protected readonly selectedCapaciteId = new FormControl<number | null>(null);
  protected readonly selectedCapaciteDetail = new FormControl<string>('', {
    nonNullable: true,
  });

  protected readonly creatureForm = this.formBuilder.group({
    id: this.formBuilder.control<string | null>(null),
    nom: this.formBuilder.control('', Validators.required),
    id_taille: this.formBuilder.control<number | null>(null, Validators.required),
    commentaire: this.formBuilder.control<string | null>(null),
    vigueur: this.formBuilder.control(0, Validators.required),
    agilite: this.formBuilder.control(0, Validators.required),
    esprit: this.formBuilder.control(0, Validators.required),
    vitalite: this.formBuilder.control(0, Validators.required),
    attaque: this.formBuilder.control(0, Validators.required),
    defense: this.formBuilder.control(0, Validators.required),
    degats: this.formBuilder.control('0', Validators.required),
    protection: this.formBuilder.control('0', Validators.required),
    avatar: this.formBuilder.control<string | null>(null),
    capacites: this.formBuilder.array([]),
  });

  protected readonly tailleId = toSignal(this.creatureForm.controls.id_taille.valueChanges, {
    initialValue: this.creatureForm.controls.id_taille.value,
  });
  protected readonly avatarPreview = toSignal(
    this.creatureForm.controls.avatar.valueChanges.pipe(
      startWith(this.creatureForm.controls.avatar.value),
    ),
    {
      initialValue: this.creatureForm.controls.avatar.value,
    },
  );
  protected readonly selectedCapacites = toSignal(
    this.capacites.valueChanges.pipe(startWith(this.capacites.getRawValue())),
    {
      initialValue: this.capacites.getRawValue(),
    },
  );
  protected readonly selectedTaille = computed(() =>
    (this.tailles() ?? []).find((taille) => Number(taille.id) === Number(this.tailleId())),
  );
  protected readonly filteredCapacites = computed(() => {
    const selectedIds = new Set(
      (this.selectedCapacites() ?? []).map((capacite: CreatureCapaciteDraft) => Number(capacite.id)),
    );

    return (this.capacitesList() ?? []).filter((capacite) => !selectedIds.has(Number(capacite.id)));
  });
  protected readonly selectedCapaciteEntries = computed(() =>
    (this.selectedCapacites() ?? []).map((entry: CreatureCapaciteDraft) => ({
      ...entry,
      definition: (this.capacitesList() ?? []).find(
        (capacite) => Number(capacite.id) === Number(entry.id),
      ),
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const creatureId = this.creatureId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);
      this.savedCreature.set(null);

      if (!creatureId) {
        this.resetForm();
        return;
      }

      this.loadingCreature.set(true);
      const subscription = this.creaturesService
        .creature(creatureId)
        .pipe(finalize(() => this.loadingCreature.set(false)))
        .subscribe({
          next: (creature) => this.hydrateForm(creature),
          error: (error: unknown) => {
            this.errorMessage.set(this.extractErrorMessage(error, true));
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      const taille = this.selectedTaille();
      if (!taille) {
        return;
      }

      if (this.hydratedTailleId !== null && Number(taille.id) === this.hydratedTailleId) {
        this.hydratedTailleId = null;
        return;
      }

      this.creatureForm.patchValue(
        {
          vigueur: taille.vigueur ?? 0,
          vitalite: taille.vitalite ?? 0,
          degats: taille.degats ?? '0',
        },
        { emitEvent: false },
      );
    });
  }

  protected get capacites(): FormArray {
    return this.creatureForm.controls.capacites as FormArray;
  }

  protected addCapacite(): void {
    const capaciteId = this.selectedCapaciteId.value;
    if (!capaciteId) {
      return;
    }

    this.capacites.push(
      this.formBuilder.group({
        id: this.formBuilder.control(capaciteId, Validators.required),
        detail: this.formBuilder.control(this.selectedCapaciteDetail.value || null),
      }),
    );

    this.selectedCapaciteId.setValue(null);
    this.selectedCapaciteDetail.setValue('');
  }

  protected removeCapacite(index: number): void {
    this.capacites.removeAt(index);
  }

  protected pickAvatar(): void {
    const ref = this.dialogService.open(PictureComponent, {
      header: 'Avatar de la créature',
      modal: true,
      closable: false,
      width: 'min(960px, 92vw)',
    });

    ref?.onClose.pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.creatureForm.controls.avatar.setValue(avatar);
      }
    });
  }

  protected clearAvatar(): void {
    this.creatureForm.controls.avatar.setValue(null);
  }

  protected saveCreature(): void {
    if (this.pending() || this.loadingCreature()) {
      return;
    }

    if (this.creatureForm.invalid) {
      this.creatureForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);
    this.savedCreature.set(null);

    const payload = this.buildCreaturePayload();
    const action$ = this.editMode()
      ? this.creaturesService.updateCreature(payload)
      : this.creaturesService.createCreature(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (creature: BolCreatureModel) => {
          this.savedCreature.set(creature);
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

  protected onError(controlName: keyof typeof this.creatureForm.controls): boolean {
    const control = this.creatureForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private resetForm(): void {
    this.hydratedTailleId = null;
    this.creatureForm.reset(
      {
        id: null,
        nom: '',
        id_taille: null,
        commentaire: null,
        vigueur: 0,
        agilite: 0,
        esprit: 0,
        vitalite: 0,
        attaque: 0,
        defense: 0,
        degats: '0',
        protection: '0',
        avatar: null,
      },
      { emitEvent: false },
    );
    this.capacites.clear({ emitEvent: false });
    this.capacites.updateValueAndValidity({ emitEvent: true });
    this.selectedCapaciteId.setValue(null);
    this.selectedCapaciteDetail.setValue('');
  }

  private hydrateForm(creature: BolCreatureModel): void {
    this.hydratedTailleId = Number(creature.id_taille);
    this.selectedCapaciteId.setValue(null);
    this.selectedCapaciteDetail.setValue('');
    this.capacites.clear({ emitEvent: false });

    for (const capacite of creature.capacites) {
      this.capacites.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(capacite.capacite_id), Validators.required),
          detail: this.formBuilder.control(capacite.detail || null),
        }),
        { emitEvent: false },
      );
    }

    this.creatureForm.patchValue(
      {
        id: creature.id,
        nom: creature.nom,
        id_taille: Number(creature.id_taille),
        commentaire: creature.commentaire,
        vigueur: creature.vigueur,
        agilite: creature.agilite,
        esprit: creature.esprit,
        vitalite: creature.vitalite,
        attaque: creature.attaque,
        defense: creature.defense,
        degats: creature.degats,
        protection: creature.protection,
        avatar: creature.avatar,
      },
      { emitEvent: true },
    );
    this.capacites.updateValueAndValidity({ emitEvent: true });
  }

  private buildCreaturePayload(): Record<string, unknown> {
    const rawValue = this.creatureForm.getRawValue();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      id_taille: rawValue.id_taille,
      commentaire: rawValue.commentaire,
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      vitalite: rawValue.vitalite,
      attaque: rawValue.attaque,
      defense: rawValue.defense,
      degats: rawValue.degats,
      protection: rawValue.protection,
      avatar: rawValue.avatar,
      capacites: (rawValue.capacites as CreatureCapaciteDraft[]).map((capacite) => ({
        id: capacite.id,
        detail: capacite.detail,
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
      ? 'Le chargement de la créature a échoué.'
      : this.editMode()
        ? 'La mise à jour de la créature a échoué.'
        : 'La création de la créature a échoué.';
  }
}
