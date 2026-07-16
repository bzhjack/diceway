import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {openCombatantStatblock} from '../../combat-statblock.util';
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

/** Carte d'une entrée de catalogue dans le dialog de sélection : l'avatar ouvre le statbloc, le bouton ajoute (ou incrémente). */
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
  private readonly dialog = inject(MatDialog);
  protected readonly kindLabels = KIND_LABELS;

  protected add(): void {
    this.selection.add(this.entry().catalogId);
  }

  protected openStatblock(): void {
    openCombatantStatblock(this.dialog, this.entry());
  }
}
