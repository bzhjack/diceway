import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {
  CombatantKind,
  CombatCatalogEntry,
  CombatSelectionService,
} from '../../../../services/combat-selection.service';

const KIND_LABELS: Record<CombatantKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Carte d'une entrée de catalogue dans le dialog de sélection : ajoute (ou incrémente) au clic. */
@Component({
  selector: 'bol-catalog-card',
  imports: [MatIconModule],
  templateUrl: './catalog-card.html',
  styleUrl: './catalog-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogCardComponent {
  readonly entry = input.required<CombatCatalogEntry>();

  protected readonly selection = inject(CombatSelectionService);
  protected readonly kindLabels = KIND_LABELS;

  protected add(): void {
    this.selection.add(this.entry().catalogId);
  }
}
