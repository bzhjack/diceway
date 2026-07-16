import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {CombatantKind, CombatSelectionService} from '../../../services/combat-selection.service';

type CatalogFilter = CombatantKind | 'all';

const KIND_LABELS: Record<CombatantKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Dialog de sélection d'un combattant à ajouter à la fight-session en préparation. */
@Component({
  selector: 'bol-combatant-picker-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './combatant-picker-dialog.html',
  styleUrl: './combatant-picker-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantPickerDialogComponent {
  protected readonly ref = inject(MatDialogRef<CombatantPickerDialogComponent>);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly activeType = signal<CatalogFilter>('all');
  protected readonly query = signal('');
  protected readonly kindLabels = KIND_LABELS;

  protected readonly filteredCatalog = computed(() => {
    const type = this.activeType();
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

  protected addEntry(catalogId: string): void {
    this.selection.add(catalogId);
  }

  protected close(): void {
    this.ref.close();
  }
}
