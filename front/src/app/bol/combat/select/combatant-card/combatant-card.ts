import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {openStatblockDialog} from '../../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {CreatureStatblockComponent} from '../../../creature/statblock/creature-statblock.component';
import {DemonStatblockComponent} from '../../../demon/statblock/demon-statblock.component';
import {HeroStatblockComponent} from '../../../hero/statblock/hero-statblock.component';
import {PnjStatblockComponent} from '../../../pnj/statblock/pnj-statblock.component';
import {CombatCatalogEntry, CombatSelectionService, SelectedCombatant} from '../../../services/combat-selection.service';

/** Carte d'un combattant déjà ajouté : cliquer dessus ouvre son statbloc, quantité (créatures/démons) et retrait restent des actions séparées. */
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
    const entry = this.entry();

    switch (entry.kind) {
      case 'hero':
        openStatblockDialog(this.dialog, HeroStatblockComponent, {hero: entry.raw, imageSrc: entry.avatar});
        return;
      case 'pnj':
        openStatblockDialog(this.dialog, PnjStatblockComponent, {pnj: entry.raw, imageSrc: entry.avatar});
        return;
      case 'creature':
        openStatblockDialog(this.dialog, CreatureStatblockComponent, {creature: entry.raw, imageSrc: entry.avatar});
        return;
      case 'demon':
        openStatblockDialog(this.dialog, DemonStatblockComponent, {demon: entry.raw, imageSrc: entry.avatar});
    }
  }
}
