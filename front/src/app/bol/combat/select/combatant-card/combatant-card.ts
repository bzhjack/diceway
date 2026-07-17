import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {combatantKindIcon, combatantRankLabel, openCombatantStatblock} from '../combat-statblock.util';
import {CombatCatalogEntry, CombatSelectionService, SelectedCombatant} from '../../../services/combat-selection.service';

/** Carte d'un combattant déjà ajouté : cliquer sur l'avatar ouvre son statbloc, quantité (créatures/démons) et retrait restent des actions séparées. */
@Component({
  selector: 'bol-combatant-card',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './combatant-card.html',
  styleUrl: './combatant-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantCardComponent {
  readonly entry = input.required<CombatCatalogEntry>();
  readonly combatant = input.required<SelectedCombatant>();

  protected readonly selection = inject(CombatSelectionService);
  private readonly dialog = inject(MatDialog);

  protected openStatblock(): void {
    openCombatantStatblock(this.dialog, this.entry());
  }

  protected readonly rankLabel = computed(() => combatantRankLabel(this.entry()));
  protected readonly kindIcon = computed(() => combatantKindIcon(this.entry().kind));
}
