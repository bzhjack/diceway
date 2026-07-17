import {MatDialog} from '@angular/material/dialog';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {CreatureStatblockComponent} from '../../creature/statblock/creature-statblock.component';
import {DemonStatblockComponent} from '../../demon/statblock/demon-statblock.component';
import {HeroStatblockComponent} from '../../hero/statblock/hero-statblock.component';
import {PnjStatblockComponent} from '../../pnj/statblock/pnj-statblock.component';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {CombatantKind, CombatCatalogEntry} from '../../services/combat-selection.service';

/** Icône Material par type de combattant (même mapping que les liens de navigation entre bibliothèques). */
const KIND_ICONS: Record<CombatantKind, string> = {
  hero: 'sword',
  pnj: 'group',
  creature: 'pets',
  demon: 'bolt',
};

/** Icône Material identifiant le type (héros/PNJ/créature/démon) d'une entrée du catalogue de combat. */
export function combatantKindIcon(kind: CombatantKind): string {
  return KIND_ICONS[kind];
}

/** Icônes SVG enregistrées (MatIconRegistry) parmi KIND_ICONS — nécessitent `[svgIcon]` plutôt qu'une ligature en contenu. */
const SVG_KIND_ICONS: ReadonlySet<string> = new Set(['sword']);

export function combatantKindIconIsSvg(kind: CombatantKind): boolean {
  return SVG_KIND_ICONS.has(KIND_ICONS[kind]);
}

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
