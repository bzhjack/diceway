import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CombatCatalogEntry, CombatSelectionService, SelectedCombatant} from '../../../services/combat-selection.service';

/** Carte d'un combattant déjà ajouté à un camp : quantité (créatures/démons), bascule de camp, retrait. */
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
}
