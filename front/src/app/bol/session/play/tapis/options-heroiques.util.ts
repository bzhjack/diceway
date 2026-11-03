import {HeroicSlug} from '../../models/combat-resolution.model';
import {ObjetDeParade, ResolvedCombatStats} from '../../models/combat-attack.model';
import {TapisCard} from '../../models/tapis.model';
import {OptionHeroiqueContexte} from '../../models/turn-assistant.model';
import {isOut, PIETAILLE} from './combat-turn.util';

/** Les tailles du référentiel (`bol_taille`), dans l'ordre de leur id : 4 = Moyenne. */
const TAILLES: readonly string[] = ['Minuscule', 'Très petite', 'Petite', 'Moyenne', 'Grande', 'Très grande', 'Énorme', 'Massive', 'Colossale', 'Gigantesque', 'Immense', 'Monstrueuse'];

/** Taille Moyenne : celle d'un héros, d'un PNJ ou d'un démon, dont la taille n'est pas notée. */
const TAILLE_MOYENNE = 4;

function tailleDe(card: TapisCard): number {
  return card.taille ?? TAILLE_MOYENNE;
}

function nomDeTaille(taille: number): string {
  return TAILLES[taille - 1] ?? `taille ${taille}`;
}

/** Pourquoi une option de succès héroïque n'est pas possible contre cette cible, en clair ; `null` si elle l'est (02-actions-combat.md,
 * livre p. 59) :
 * - Renversement : la cible peut dépasser la taille de l'attaquant d'une catégorie au plus ;
 * - Désarmement : la cible doit avoir une arme en main (ce qu'on ne sait pas ne bloque pas) ;
 * - Massacrer la piétaille : la cible doit être de la piétaille. */
export function optionHeroiqueBloquee(slug: HeroicSlug, contexte: OptionHeroiqueContexte): string | null {
  const {attaquant, cible} = contexte;
  if (!cible) {
    return null;
  }
  switch (slug) {
    case 'renversement':
      return tailleDe(cible) > tailleDe(attaquant) + 1
        ? `Renversement impossible : ${cible.nom} (${nomDeTaille(tailleDe(cible))}) dépasse ${attaquant.nom} (${nomDeTaille(tailleDe(attaquant))}) de plus d’une catégorie de taille.`
        : null;
    case 'desarmement':
      return contexte.cibleArme === false ? `Désarmement impossible : ${cible.nom} n’a pas d’arme en main.` : null;
    case 'pietaille':
      return cible.rang !== PIETAILLE ? `Massacrer la piétaille : ${cible.nom} n’est pas de la piétaille.` : null;
    default:
      return null;
  }
}

/** Qui peut tomber sous un « Massacrer la piétaille » : la cible d'abord, puis les autres piétailles encore debout de son camp, dans
 * l'ordre reçu. */
export function candidatsMassacre(cible: TapisCard, cartes: readonly TapisCard[]): readonly TapisCard[] {
  const autres = cartes.filter((card) => card.key !== cible.key && card.camp === cible.camp && card.rang === PIETAILLE && !isOut(card));
  return [cible, ...autres];
}

/** Qui tombe, proposé d'office : les dégâts du coup sont le nombre de piétailles mises hors de combat (livre p. 59), les premières
 * candidates, jamais plus qu'il n'y en a. */
export function tombesMassacre(candidats: readonly TapisCard[], degats: number): readonly string[] {
  return candidats.slice(0, Math.max(0, degats)).map((card) => card.key);
}

/** Ce que la cible peut interposer dans une parade in extremis : son bouclier (proposé d'abord) et son arme. Sans bouclier, ni rien de
 * connu, c'est son arme. */
export function objetsDeParade(
  stats: Pick<ResolvedCombatStats, 'bouclier' | 'arme' | 'bouclierMalusUneAttaque' | 'bouclierDefenseToutes'> | null,
): readonly ObjetDeParade[] {
  const bouclier = !!stats && (stats.bouclier === true || stats.bouclierMalusUneAttaque > 0 || stats.bouclierDefenseToutes > 0);
  if (!bouclier) {
    return ['arme'];
  }
  return stats?.arme === false ? ['bouclier'] : ['bouclier', 'arme'];
}
