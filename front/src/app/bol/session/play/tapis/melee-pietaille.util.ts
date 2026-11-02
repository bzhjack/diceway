import {EtatCombat} from '../../models/combat-turn.model';
import {MeleeCamps, MeleeDe, MeleeDisponibilite, MeleeJet, MeleeParCamp} from '../../models/melee-pietaille.model';
import {TapisCard} from '../../models/tapis.model';
import {rawDamage} from '../../combat-resolution.util';
import {isOut, PIETAILLE} from './combat-turn.util';

/** La piétaille encore debout de chaque camp (ni hors de combat, ni exclue), dans l'ordre des cartes reçues — l'ordre de jeu. Celle du camp
 * des héros, ce sont leurs suivants (04-pnj-creatures-demons.md, « Règle de horde » ; livre p. 132). */
export function pietailleDebout(cards: readonly TapisCard[], etat: EtatCombat): MeleeCamps {
  const debout = cards.filter((card) => card.rang === PIETAILLE && !isOut(card) && !etat.exclus.includes(card.key));
  return {
    heros: debout.filter((card) => card.camp === 'heros'),
    adversaires: debout.filter((card) => card.camp === 'adversaires'),
  };
}

/** « Mêlée de piétaille » : possible quand les deux camps ont de la piétaille debout, une fois par round. */
export function disponibiliteMelee(camps: MeleeCamps, etat: EtatCombat): MeleeDisponibilite {
  if (camps.heros.length === 0 || camps.adversaires.length === 0) {
    return 'absente';
  }
  return etat.melee === etat.round ? 'faite' : 'disponible';
}

/** Le dé de chaque camp (livre p. 132) : le plus nombreux tue d6M adversaires, l'autre lui inflige d3 pertes. À égalité, le livre ne dit
 * rien : chaque camp perd d3 (interprétation, 04-pnj-creatures-demons.md). */
export function desDeMelee(camps: MeleeCamps): Readonly<Record<keyof MeleeCamps, MeleeDe>> {
  const heros = camps.heros.length;
  const adversaires = camps.adversaires.length;
  return {
    heros: heros > adversaires ? 'd6M' : 'd3',
    adversaires: adversaires > heros ? 'd6M' : 'd3',
  };
}

/** Ce que perd chaque camp : ce que l'autre a tué (son jet), jamais plus que ce qu'il a debout. */
export function pertesDeMelee(camps: MeleeCamps, jets: MeleeParCamp): MeleeParCamp {
  return {
    heros: Math.min(Math.max(0, jets.adversaires), camps.heros.length),
    adversaires: Math.min(Math.max(0, jets.heros), camps.adversaires.length),
  };
}

/** Qui tombe, proposé d'office : les `pertes` dernières piétailles du camp dans l'ordre de jeu (le MJ peut en choisir d'autres). */
export function tombesParDefaut(cards: readonly TapisCard[], pertes: number): readonly string[] {
  return pertes <= 0 ? [] : cards.slice(-pertes).map((card) => card.key);
}

/** Ce que donnent les d6 lancés : le moins bon des deux pour un d6M, la moitié arrondie au supérieur d'un d6 pour un d3. */
export function jetDeMelee(de: MeleeDe, des: readonly number[]): MeleeJet {
  return {des, valeur: rawDamage(de === 'd6M' ? 'd6m' : 'd3', des)};
}

/** Nombre de d6 à lancer pour ce dé : deux pour un d6M, un pour un d3. */
export function nombreDeDes(de: MeleeDe): number {
  return de === 'd6M' ? 2 : 1;
}

/** Le résultat tapé (le dé lancé à table) : un entier de 1 à 6 pour un d6M, de 1 à 3 pour un d3 ; `null` sinon. */
export function lireJetDeMelee(raw: string, de: MeleeDe): number | null {
  const texte = raw.trim();
  if (!/^\d+$/.test(texte)) {
    return null;
  }
  const valeur = Number(texte);
  return valeur >= 1 && valeur <= (de === 'd6M' ? 6 : 3) ? valeur : null;
}
