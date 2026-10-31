import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {CombatantKind} from '../../../models/combat-selection.model';
import {CatalogCardComponent} from './catalog-card/catalog-card';
import {CombatantPickerDialogData} from '../../models/combatant-picker-dialog.model';

type CatalogFilter = CombatantKind | 'all';

/** Dialog de sélection d'un combattant à ajouter à la fight-session en préparation. */
@Component({
  selector: 'bol-combatant-picker-dialog',
  imports: [FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, CatalogCardComponent],
  templateUrl: './combatant-picker-dialog.html',
  styleUrl: './combatant-picker-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantPickerDialogComponent {
  protected readonly ref = inject(MatDialogRef<CombatantPickerDialogComponent>);
  protected readonly selection = inject(CombatSelectionService);
  private readonly data = inject<CombatantPickerDialogData | null>(MAT_DIALOG_DATA, {optional: true});

  protected readonly lockKind = this.data?.lockKind ?? null;
  protected readonly activeType = signal<CatalogFilter>(this.lockKind ?? 'all');
  protected readonly query = signal('');
  protected readonly queryField = form(this.query);

  protected readonly filteredCatalog = computed(() => {
    const type = this.lockKind ?? this.activeType();
    const query = this.query().trim().toLowerCase();

    return this.selection
      .catalog()
      .filter((entry) => (type === 'all' || entry.kind === type) && (!query || entry.nom.toLowerCase().includes(query)));
  });

  constructor() {
    this.selection.loadCatalog();
  }

  protected setType(type: CatalogFilter): void {
    this.activeType.set(type);
  }

  protected close(): void {
    this.ref.close();
  }
}
