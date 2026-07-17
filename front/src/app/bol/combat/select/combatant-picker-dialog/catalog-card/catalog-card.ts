import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel, openCombatantStatblock} from '../../combat-statblock.util';
import {CombatCatalogEntry, CombatSelectionService} from '../../../../services/combat-selection.service';

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
  protected readonly rankLabel = computed(() => combatantRankLabel(this.entry()));
  protected readonly kindIcon = computed(() => combatantKindIcon(this.entry().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.entry().kind));

  protected add(): void {
    this.selection.add(this.entry().catalogId);
  }

  protected openStatblock(): void {
    openCombatantStatblock(this.dialog, this.entry());
  }
}
