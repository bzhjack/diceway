import {MatDialog} from '@angular/material/dialog';
import {openStatblockDialog} from '../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {BolStatblockComponent} from '../shared/statblock/bol-statblock.component';
import {
  creatureStatblockData,
  demonStatblockData,
  heroStatblockData,
  pnjStatblockData,
} from '../shared/statblock/bol-statblock.builders';
import {BolCreatureModel} from '../models/bol-creature.model';
import {BolDemonModel} from '../models/bol-demon.model';
import {BolHerosModel} from '../models/bol-heros.model';
import {CombatantKind, CombatCatalogEntry} from '../services/combat-selection.service';

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

/** Rang BoL brut (utilisé pour trier l'initiative) — null pour un héros, qui n'a pas de rang fixe. */
export type CombatantRankKey = 'pietaille' | 'coriace' | 'rival';

/** Mapping rang BoL (cf. taille.type / categorie.type / BolHeros.type) → clé de rang / libellé affiché. */
const TYPE_RANK_KEYS: Record<string, CombatantRankKey> = {
  P: 'pietaille',
  C: 'coriace',
  R: 'rival',
};

const RANK_KEY_LABELS: Record<CombatantRankKey, string> = {
  pietaille: 'Piétaille',
  coriace: 'Coriace',
  rival: 'Rival',
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Rang BoL brut (rival/coriace/pietaille) d'une entrée du catalogue de combat — null pour un héros. */
export function combatantRankKey(entry: CombatCatalogEntry): CombatantRankKey | null {
  switch (entry.kind) {
    case 'hero':
      return null;
    case 'creature': {
      const creature = entry.raw as BolCreatureModel;
      return (creature.rang as CombatantRankKey | undefined) ?? TYPE_RANK_KEYS[creature.type ?? ''] ?? 'coriace';
    }
    case 'demon':
    case 'pnj': {
      const raw = entry.raw as BolDemonModel | BolHerosModel;
      return TYPE_RANK_KEYS[raw.type ?? ''] ?? 'coriace';
    }
  }
}

/** Libellé de rang affiché sur les cartes de combat : "Héros" pour un PJ, sinon rival/coriace/piétaille. */
export function combatantRankLabel(entry: CombatCatalogEntry): string {
  if (entry.kind === 'hero') {
    return 'Héros';
  }

  if (entry.kind === 'creature') {
    const creature = entry.raw as BolCreatureModel;
    if (creature.rang) {
      return capitalize(creature.rang);
    }
  }

  return RANK_KEY_LABELS[combatantRankKey(entry)!];
}

/** Ouvre le statbloc (héros/PNJ/créature/démon) correspondant à une entrée du catalogue de combat. */
export function openCombatantStatblock(dialog: MatDialog, entry: CombatCatalogEntry): void {
  const data = (() => {
    switch (entry.kind) {
      case 'hero':
        return heroStatblockData(entry.raw as BolHerosModel);
      case 'pnj':
        return pnjStatblockData(entry.raw as BolHerosModel);
      case 'creature':
        return creatureStatblockData(entry.raw as BolCreatureModel);
      case 'demon':
        return demonStatblockData(entry.raw as BolDemonModel);
    }
  })();

  openStatblockDialog(dialog, BolStatblockComponent, {data, imageSrc: entry.avatar});
}
