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
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolArmeModel} from '../../models/bol-arme.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwBadgeComponent} from '../../../shared/dw-badge/dw-badge';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';

interface WeaponTypeOption {
  readonly label: string;
  readonly value: 'M' | 'T';
}

@Component({
  selector: 'bol-arme-library-page',
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
    MatSelectModule,
    MatTooltipModule,
    DwTagComponent,
    DwBadgeComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
  ],
  templateUrl: './arme-library-page.html',
  styleUrl: './arme-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmeLibraryPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly weapons = refreshableResource(() => this.herosService.armes());

  protected readonly weaponTypeOptions: WeaponTypeOption[] = [
    {label: 'Mêlée', value: 'M'},
    {label: 'Tir', value: 'T'},
  ];
  protected readonly searchTerm = signal('');
  protected readonly onlyCreations = signal(false);
  protected readonly formVisible = signal(false);
  protected readonly editingWeaponId = signal<number | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly weaponForm = this.formBuilder.nonNullable.group({
    arme: ['', [Validators.required, Validators.maxLength(255)]],
    type: ['M' as 'M' | 'T', [Validators.required]],
    degats: ['', [Validators.required, Validators.maxLength(50)]],
    portee: ['', [Validators.maxLength(50)]],
    notes: ['', [Validators.maxLength(65535)]],
  });

  protected readonly filteredWeapons = computed(() =>
    [...this.weapons.data()]
      .filter((weapon) => (this.onlyCreations() ? Boolean(weapon.user_id) : true))
      .filter((weapon) =>
        matchesTerm(
          this.searchTerm(),
          weapon.arme,
          this.weaponTypeLabel(weapon.type),
          weapon.degats,
          weapon.portee,
          weapon.notes,
        ),
      )
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type.localeCompare(right.type);
        }

        return left.arme.localeCompare(right.arme);
      }),
  );
  protected readonly weaponCount = computed(() => this.filteredWeapons().length);
  protected readonly totalWeaponCount = computed(() => this.weapons.data().length);
  protected readonly customWeaponCount = computed(
    () => this.weapons.data().filter((weapon) => Boolean(weapon.user_id)).length,
  );
  protected readonly canonicalWeaponCount = computed(
    () => this.weapons.data().filter((weapon) => !weapon.user_id).length,
  );
  protected readonly meleeCount = computed(() => this.weapons.data().filter((weapon) => weapon.type === 'M').length);
  protected readonly rangedCount = computed(() => this.weapons.data().filter((weapon) => weapon.type === 'T').length);
  protected readonly formTitle = computed(() => (this.editingWeaponId() ? 'Modifier l’arme' : 'Nouvelle arme'));
  protected readonly submitLabel = computed(() => (this.editingWeaponId() ? 'Enregistrer' : 'Créer'));

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyCreations.set(false);
  }

  protected startCreate(): void {
    this.editingWeaponId.set(null);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.weaponForm.reset({arme: '', type: 'M', degats: '', portee: '', notes: ''});
  }

  protected startEdit(weapon: BolArmeModel): void {
    if (!this.canManage(weapon)) {
      return;
    }

    this.editingWeaponId.set(weapon.id);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.weaponForm.reset({
      arme: weapon.arme,
      type: weapon.type,
      degats: weapon.degats ?? '',
      portee: weapon.portee ?? '',
      notes: weapon.notes ?? '',
    });
  }

  protected cancelForm(): void {
    this.formVisible.set(false);
    this.editingWeaponId.set(null);
    this.errorMessage.set('');
    this.weaponForm.reset({arme: '', type: 'M', degats: '', portee: '', notes: ''});
  }

  protected submitForm(): void {
    if (this.submitting()) {
      return;
    }

    if (this.weaponForm.invalid) {
      this.weaponForm.markAllAsTouched();
      return;
    }

    const payload: BolArmeModel = {
      id: this.editingWeaponId(),
      arme: this.weaponForm.controls.arme.getRawValue().trim(),
      type: this.weaponForm.controls.type.getRawValue(),
      degats: this.weaponForm.controls.degats.getRawValue().trim(),
      portee: this.nullableTrimmed(this.weaponForm.controls.portee.getRawValue()),
      notes: this.nullableTrimmed(this.weaponForm.controls.notes.getRawValue()),
    };

    this.submitting.set(true);
    this.errorMessage.set('');

    const request$ = this.editingWeaponId()
      ? this.herosService.updateArmeCatalog(payload)
      : this.herosService.createArmeCatalog(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.weapons.refresh();
        this.cancelForm();
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(extractApiErrorMessage(error, 'Impossible d’enregistrer cette arme.'));
      },
    });
  }

  protected askDelete(weapon: BolArmeModel): void {
    if (!this.canManage(weapon)) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer l’arme',
        message: `Supprimer "${weapon.arme}" du catalogue ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteWeapon(weapon);
      }
    });
  }

  protected weaponTypeLabel(type: BolArmeModel['type']): string {
    return type === 'M' ? 'Mêlée' : 'Tir';
  }

  protected canManage(weapon: BolArmeModel): boolean {
    return Boolean(weapon.user_id);
  }

  protected onError(controlName: keyof typeof this.weaponForm.controls): boolean {
    const control = this.weaponForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private deleteWeapon(weapon: BolArmeModel): void {
    if (!weapon.id) {
      return;
    }

    this.herosService.deleteArmeCatalog(weapon.id).subscribe({
      next: () => {
        this.weapons.refresh();

        if (this.editingWeaponId() === weapon.id) {
          this.cancelForm();
        }
      },
      error: (error) => {
        this.errorMessage.set(extractApiErrorMessage(error, 'Impossible de supprimer cette arme.'));
      },
    });
  }

  private nullableTrimmed(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
