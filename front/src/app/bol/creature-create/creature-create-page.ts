import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { startWith } from 'rxjs';
import { BolCreatureModel } from '../models/bol-creature.model';
import { BolCreatureCapaciteModel } from '../models/bol-creature.model';
import { BolCreatureStateService } from '../services/bol-creature-state.service';
import { BolCreaturesService } from '../services/bol-creatures.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogService } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { PictureComponent } from '../../shared/picture/picture';

interface CreatureCapaciteDraft {
  id: number;
  detail: string | null;
}

@Component({
  selector: 'bol-creature-create-page',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './creature-create-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DialogService],
})
export class CreatureCreatePageComponent {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly capacitesList = this.creatureStateService.capaciteList;
  protected readonly payloadPreview = signal<Record<string, unknown> | null>(null);
  protected readonly createdCreature = signal<BolCreatureModel | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);

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
    effect(() => {
      const taille = this.selectedTaille();
      if (!taille) {
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

  protected preparePayload(): void {
    if (this.creatureForm.invalid) {
      this.creatureForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.payloadPreview.set(this.buildCreatePayload());
  }

  protected saveCreature(): void {
    if (this.pending()) {
      return;
    }

    if (this.creatureForm.invalid) {
      this.creatureForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);
    this.createdCreature.set(null);

    const payload = this.buildCreatePayload();
    this.payloadPreview.set(payload);

    this.creaturesService
      .createCreature(payload)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (creature: BolCreatureModel) => {
          this.createdCreature.set(creature);
          void this.router.navigateByUrl('/');
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error));
        },
      });
  }

  protected onError(controlName: keyof typeof this.creatureForm.controls): boolean {
    const control = this.creatureForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private buildCreatePayload(): Record<string, unknown> {
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

  private extractErrorMessage(error: unknown): string {
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

    return 'La création de la créature a échoué.';
  }
}
