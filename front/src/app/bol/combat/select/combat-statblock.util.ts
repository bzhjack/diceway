import {MatDialog} from '@angular/material/dialog';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {CreatureStatblockComponent} from '../../creature/statblock/creature-statblock.component';
import {DemonStatblockComponent} from '../../demon/statblock/demon-statblock.component';
import {HeroStatblockComponent} from '../../hero/statblock/hero-statblock.component';
import {PnjStatblockComponent} from '../../pnj/statblock/pnj-statblock.component';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {CombatCatalogEntry} from '../../services/combat-selection.service';

/** Mapping rang BoL (cf. taille.type / categorie.type / BolHeros.type) → libellé affiché. */
const TYPE_RANK_LABELS: Record<string, string> = {
  P: 'Piétaille',
  C: 'Coriace',
  R: 'Rival',
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Libellé de rang affiché sur les cartes de combat : "Héros" pour un PJ, sinon rival/coriace/piétaille. */
export function combatantRankLabel(entry: CombatCatalogEntry): string {
  switch (entry.kind) {
    case 'hero':
      return 'Héros';
    case 'creature': {
      const creature = entry.raw as BolCreatureModel;
      return creature.rang ? capitalize(creature.rang) : (TYPE_RANK_LABELS[creature.type ?? ''] ?? 'Coriace');
    }
    case 'demon':
    case 'pnj': {
      const raw = entry.raw as BolDemonModel | BolHerosModel;
      return TYPE_RANK_LABELS[raw.type ?? ''] ?? 'Coriace';
    }
  }
}

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
