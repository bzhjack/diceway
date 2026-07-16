import {MatDialog} from '@angular/material/dialog';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {CreatureStatblockComponent} from '../../creature/statblock/creature-statblock.component';
import {DemonStatblockComponent} from '../../demon/statblock/demon-statblock.component';
import {HeroStatblockComponent} from '../../hero/statblock/hero-statblock.component';
import {PnjStatblockComponent} from '../../pnj/statblock/pnj-statblock.component';
import {CombatCatalogEntry} from '../../services/combat-selection.service';

/** Ouvre le statbloc (héros/PNJ/créature/démon) correspondant à une entrée du catalogue de combat. */
export function openCombatantStatblock(dialog: MatDialog, entry: CombatCatalogEntry): void {
  switch (entry.kind) {
    case 'hero':
      openStatblockDialog(dialog, HeroStatblockComponent, {hero: entry.raw, imageSrc: entry.avatar});
      return;
    case 'pnj':
      openStatblockDialog(dialog, PnjStatblockComponent, {pnj: entry.raw, imageSrc: entry.avatar});
      return;
    case 'creature':
      openStatblockDialog(dialog, CreatureStatblockComponent, {creature: entry.raw, imageSrc: entry.avatar});
      return;
    case 'demon':
      openStatblockDialog(dialog, DemonStatblockComponent, {demon: entry.raw, imageSrc: entry.avatar});
  }
}
