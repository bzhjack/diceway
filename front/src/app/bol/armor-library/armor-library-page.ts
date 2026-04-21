import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ConfirmationService} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {IconFieldModule} from 'primeng/iconfield';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {startWith, switchMap} from 'rxjs';
import {BolArmureModel} from '../models/bol-armure.model';
import {BolHerosService} from '../services/bol-heros.service';

@Component({
  selector: 'bol-armor-library-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmPopupModule,
    IconFieldModule,
    IftaLabelModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './armor-library-page.html',
  styleUrl: './armor-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class ArmorLibraryPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosService = inject(BolHerosService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly refreshTrigger = signal(0);
  private readonly armors = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.herosService.armures()),
    ),
    {initialValue: [] as BolArmureModel[]},
  );

  protected readonly searchTerm = signal('');
  protected readonly onlyCreations = signal(false);
  protected readonly formVisible = signal(false);
  protected readonly editingArmorId = signal<number | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly armorForm = this.formBuilder.nonNullable.group({
    armure: ['', [Validators.required, Validators.maxLength(255)]],
    protection: ['', [Validators.required, Validators.maxLength(255)]],
    malus: ['', [Validators.maxLength(255)]],
    pts_de_pouvoir: ['', [Validators.maxLength(50)]],
  });

  protected readonly filteredArmors = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();

    return [...this.armors()]
      .filter((armor) => (this.onlyCreations() ? Boolean(armor.user_id) : true))
      .filter((armor) => {
        if (!term) {
          return true;
        }

        return [
          armor.armure,
          armor.protection,
          armor.malus,
          armor.pts_de_pouvoir,
        ].some((value) => value?.toLocaleLowerCase().includes(term));
      })
      .sort((left, right) => left.armure.localeCompare(right.armure));
  });
  protected readonly armorCount = computed(() => this.filteredArmors().length);
  protected readonly totalArmorCount = computed(() => this.armors().length);
  protected readonly customArmorCount = computed(() => this.armors().filter((armor) => Boolean(armor.user_id)).length);
  protected readonly canonicalArmorCount = computed(() =>
    this.armors().filter((armor) => !armor.user_id).length,
  );
  protected readonly shieldCount = computed(() =>
    this.armors().filter((armor) => armor.armure.toLocaleLowerCase().includes('bouclier')).length,
  );
  protected readonly formTitle = computed(() => (this.editingArmorId() ? 'Modifier l’armure' : 'Nouvelle armure'));
  protected readonly submitLabel = computed(() => (this.editingArmorId() ? 'Enregistrer' : 'Créer'));

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyCreations.set(false);
  }

  protected startCreate(): void {
    this.editingArmorId.set(null);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.armorForm.reset({
      armure: '',
      protection: '',
      malus: '',
      pts_de_pouvoir: '',
    });
  }

  protected startEdit(armor: BolArmureModel): void {
    if (!this.canManage(armor)) {
      return;
    }

    this.editingArmorId.set(armor.id);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.armorForm.reset({
      armure: armor.armure,
      protection: armor.protection ?? '',
      malus: armor.malus ?? '',
      pts_de_pouvoir: armor.pts_de_pouvoir ?? '',
    });
  }

  protected cancelForm(): void {
    this.formVisible.set(false);
    this.editingArmorId.set(null);
    this.errorMessage.set('');
    this.armorForm.reset({
      armure: '',
      protection: '',
      malus: '',
      pts_de_pouvoir: '',
    });
  }

  protected submitForm(): void {
    if (this.submitting()) {
      return;
    }

    if (this.armorForm.invalid) {
      this.armorForm.markAllAsTouched();
      return;
    }

    const payload: BolArmureModel = {
      id: this.editingArmorId(),
      armure: this.armorForm.controls.armure.getRawValue().trim(),
      protection: this.armorForm.controls.protection.getRawValue().trim(),
      malus: this.nullableTrimmed(this.armorForm.controls.malus.getRawValue()),
      pts_de_pouvoir: this.nullableTrimmed(this.armorForm.controls.pts_de_pouvoir.getRawValue()),
    };

    this.submitting.set(true);
    this.errorMessage.set('');

    const request$ = this.editingArmorId()
      ? this.herosService.updateArmureCatalog(payload)
      : this.herosService.createArmureCatalog(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.refreshTrigger.update((value) => value + 1);
        this.cancelForm();
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error, 'Impossible d’enregistrer cette armure.'));
      },
    });
  }

  protected confirmDelete(event: Event, armor: BolArmureModel): void {
    if (!this.canManage(armor)) {
      return;
    }

    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Supprimer ${armor.armure} du catalogue ?`,
      icon: 'pi pi-info-circle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.deleteArmor(armor),
    });
  }

  protected onError(controlName: keyof typeof this.armorForm.controls): boolean {
    const control = this.armorForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected canManage(armor: BolArmureModel): boolean {
    return Boolean(armor.user_id);
  }

  private deleteArmor(armor: BolArmureModel): void {
    if (!armor.id) {
      return;
    }

    this.herosService.deleteArmureCatalog(armor.id).subscribe({
      next: () => {
        this.refreshTrigger.update((value) => value + 1);

        if (this.editingArmorId() === armor.id) {
          this.cancelForm();
        }
      },
      error: (error) => {
        this.errorMessage.set(this.resolveErrorMessage(error, 'Impossible de supprimer cette armure.'));
      },
    });
  }

  private nullableTrimmed(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }

      const errors = error.error?.errors;
      if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0 && typeof firstError[0] === 'string') {
          return firstError[0];
        }
      }
    }

    return fallback;
  }
}
