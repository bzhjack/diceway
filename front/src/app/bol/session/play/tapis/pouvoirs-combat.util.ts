import {hasPouvoir} from '../../combat-play.util';
import {EtatCombat} from '../../models/combat-turn.model';
import {CardPouvoirs, PouvoirCopie, Regeneration} from '../../models/pouvoirs-combat.model';
import {TapisCard} from '../../models/tapis.model';

/** Taille « Moyenne » au référentiel (`bol_taille`) : le poison d'un démon paralyse cette taille ou moins. */
const TAILLE_MOYENNE = 4;

/** Ce que les pouvoirs d'un démon changent en combat (04-pnj-creatures-demons.md, « Pouvoirs démoniaques »). Les drapeaux recopiés à la
 * table (`regeneration`, `intangible`, `avertissement_combat`) font foi ; une copie faite avant eux est lue au nom du pouvoir, sans
 * accents ni casse. Poison et Vulnérabilité n'ont pas de drapeau : leur nom suffit. */
export function pouvoirsDeCombat(pouvoirs: readonly PouvoirCopie[] | null | undefined): CardPouvoirs {
  const liste = (pouvoirs ?? []).filter((p): p is PouvoirCopie & {pouvoir: string} => !!p.pouvoir);
  const nomme = (p: {pouvoir: string}, nom: string): boolean => hasPouvoir([p.pouvoir], nom);
  const vulnerable = liste.find((p) => nomme(p, 'vulnerabilite'));
  return {
    regeneration: liste.some((p) => p.regeneration === true || nomme(p, 'regeneration')),
    intangible: liste.some((p) => p.intangible === true || nomme(p, 'intangible')),
    poison: liste.some((p) => nomme(p, 'poison')),
    vulnerabilite: vulnerable ? {element: vulnerable.detail?.trim() || null} : null,
    avertissements: liste
      .filter((p) => (p.avertissement_combat === true || nomme(p, 'poison') || nomme(p, 'intangible')) && !nomme(p, 'vulnerabilite'))
      .map((p) => p.pouvoir.trim()),
  };
}

/** La faiblesse d'un démon vulnérable, sur sa carte : « Vulnérable : feu (dégâts doublés) », ou sans élément dit. */
export function libelleVulnerabilite(vulnerabilite: {readonly element: string | null}): string {
  return vulnerabilite.element ? `Vulnérable : ${vulnerabilite.element} (dégâts doublés)` : 'Vulnérable (dégâts doublés)';
}

/** Le nom de la vitalité d'une carte : « Force vitale » pour un mort-vivant (Bestiaire, p. 127), « Vitalité » sinon. */
export function libelleVitalite(card: Pick<TapisCard, 'mortVivant'>): string {
  return card.mortVivant ? 'Force vitale' : 'Vitalité';
}

/** Les démons qui se régénèrent au début d'un round (« Régénération » : 1 point de vitalité par round), sans dépasser leur maximum : ceux
 * qui sont debout et encore au combat (ni exclus, ni enfuis). Un démon tombé à 0 est hors de combat : il ne se relève pas seul
 * (interprétation). */
export function regenerationsDuRound(cards: readonly TapisCard[], etat: EtatCombat): readonly Regeneration[] {
  return cards
    .filter((card) => card.pouvoirs?.regeneration && !etat.exclus.includes(card.key) && !etat.fuis.includes(card.key))
    .filter((card) => card.vitaliteCourante !== null && card.vitaliteMax !== null && card.vitaliteCourante > 0 && card.vitaliteCourante < card.vitaliteMax)
    .map((card) => ({card, vitalite: Math.min(card.vitaliteMax!, card.vitaliteCourante! + 1)}));
}

/** Le poison d'un démon paralyse une créature de taille moyenne ou moins (« Poison ») : un héros ou un PNJ est de taille moyenne, une
 * créature et un démon ont la leur (un démon posé avant qu'elle soit notée compte comme moyen). */
export function poisonPossible(attaquant: TapisCard, cible: TapisCard | null): boolean {
  if (!attaquant.pouvoirs?.poison || !cible) {
    return false;
  }
  return (cible.taille ?? TAILLE_MOYENNE) <= TAILLE_MOYENNE;
}

/** Les dégâts d'un coup contre un démon vulnérable à ce qui le frappe : doublés quand le MJ coche la faiblesse. */
export function degatsDoubles(degats: number | null, doubles: boolean): number | null {
  return degats !== null && doubles ? degats * 2 : degats;
}
