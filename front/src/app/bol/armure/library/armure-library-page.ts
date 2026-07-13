import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolArmureModel} from '../../models/bol-armure.model';
import {BolCatalogService} from '../../services/bol-catalog.service';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwBadgeComponent} from '../../../shared/dw-badge/dw-badge';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';

@Component({
  selector: 'bol-armure-library-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    DwTagComponent,
    DwBadgeComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
  ],
  templateUrl: './armure-library-page.html',
  styleUrl: './armure-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmureLibraryPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly catalogService = inject(BolCatalogService);
  private readonly dialog = inject(MatDialog);
  private readonly armors = refreshableResource(() => this.catalogService.armures());

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

  protected readonly filteredArmors = computed(() =>
    [...this.armors.data()]
      .filter((armor) => (this.onlyCreations() ? Boolean(armor.user_id) : true))
      .filter((armor) =>
        matchesTerm(this.searchTerm(), armor.armure, armor.protection, armor.malus, armor.pts_de_pouvoir),
      )
      .sort((left, right) => left.armure.localeCompare(right.armure)),
  );
  protected readonly armorCount = computed(() => this.filteredArmors().length);
  protected readonly totalArmorCount = computed(() => this.armors.data().length);
  protected readonly customArmorCount = computed(
    () => this.armors.data().filter((armor) => Boolean(armor.user_id)).length,
  );
  protected readonly canonicalArmorCount = computed(
    () => this.armors.data().filter((armor) => !armor.user_id).length,
  );
  protected readonly shieldCount = computed(
    () => this.armors.data().filter((armor) => armor.armure.toLocaleLowerCase().includes('bouclier')).length,
  );
  protected readonly formTitle = computed(() =>
    this.editingArmorId() ? 'Modifier l’armure' : 'Nouvelle armure',
  );
  protected readonly submitLabel = computed(() => (this.editingArmorId() ? 'Enregistrer' : 'Créer'));

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyCreations.set(false);
  }

  protected startCreate(): void {
    this.editingArmorId.set(null);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.armorForm.reset({armure: '', protection: '', malus: '', pts_de_pouvoir: ''});
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
    this.armorForm.reset({armure: '', protection: '', malus: '', pts_de_pouvoir: ''});
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
      ? this.catalogService.updateArmure(payload)
      : this.catalogService.createArmure(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.armors.refresh();
        this.cancelForm();
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(extractApiErrorMessage(error, 'Impossible d’enregistrer cette armure.'));
      },
    });
  }

  protected askDelete(armor: BolArmureModel): void {
    if (!this.canManage(armor)) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer l’armure',
        message: `Supprimer "${armor.armure}" du catalogue ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteArmor(armor);
      }
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

    this.catalogService.deleteArmure(armor.id).subscribe({
      next: () => {
        this.armors.refresh();

        if (this.editingArmorId() === armor.id) {
          this.cancelForm();
        }
      },
      error: (error) => {
        this.errorMessage.set(extractApiErrorMessage(error, 'Impossible de supprimer cette armure.'));
      },
    });
  }

  private nullableTrimmed(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
