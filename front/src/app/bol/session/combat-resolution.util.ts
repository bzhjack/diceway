import {ResolvedCombatStats} from './models/combat-attack.model';

/** Dé de dégâts d'une arme ou d'une créature : d3, d6, d6 de malus (garder le moins bon de 2d6) ou de bonus. */
export type DamageDie = 'd3' | 'd6' | 'd6m' | 'd6b';

/** Seuil de réussite d'un jet d'attaque BoL (02-actions-combat.md). */
export const ATTACK_THRESHOLD = 9;

/** Option de succès héroïque en combat (02-actions-combat.md). Seul « Coup dévastateur » change le calcul : +6 dégâts. */
export interface HeroicOption {
  readonly slug: 'carnage' | 'devastateur' | 'precis' | 'desarmement' | 'pietaille' | 'renversement';
  readonly label: string;
  readonly effect: string;
}

export const HEROIC_OPTIONS: readonly HeroicOption[] = [
  {slug: 'carnage', label: 'Carnage', effect: 'Nouvelle attaque immédiate, sans dépenser de PH.'},
  {slug: 'devastateur', label: 'Coup dévastateur', effect: '+6 dégâts.'},
  {slug: 'precis', label: 'Coup précis', effect: 'Dégâts normaux et un dé de malus imposé à la cible.'},
  {slug: 'desarmement', label: 'Désarmement', effect: "L'adversaire perd son arme, au lieu de subir des dégâts."},
  {slug: 'pietaille', label: 'Massacrer la piétaille', effect: 'Les dégâts sont le nombre de piétaille mis hors combat.'},
  {slug: 'renversement', label: 'Renversement', effect: "L'adversaire est jeté à terre."},
];

/** Bonus de dégâts du coup dévastateur. */
const DEVASTATING_BONUS = 6;

/** Dé de dégâts d'une chaîne d'arme BoL (« d6M », « d6B », « d3 », « d6 »). */
export function damageDie(degats: string | null | undefined): DamageDie {
  const s = (degats ?? '').toLowerCase();
  if (s.includes('d3')) {
    return 'd3';
  }
  if (s.includes('m')) {
    return 'd6m';
  }
  if (s.includes('b')) {
    return 'd6b';
  }
  return 'd6';
}

/** Nombre de d6 à lancer pour ce dé de dégâts : deux pour un dé de malus ou de bonus. */
export function damageDiceCount(die: DamageDie): number {
  return die === 'd6m' || die === 'd6b' ? 2 : 1;
}

/** Dégâts bruts d'un jet : le moins bon de deux dés (d6M), le meilleur (d6B), la moitié arrondie au supérieur (d3). */
export function rawDamage(die: DamageDie, values: readonly number[]): number {
  if (die === 'd6m') {
    return Math.min(...values);
  }
  if (die === 'd6b') {
    return Math.max(...values);
  }
  return die === 'd3' ? Math.ceil(values[0] / 2) : values[0];
}

/** Bonus au jet d'attaque : celui d'une créature, sinon agilité + mêlée (ou tir). */
export function attackBonus(stats: ResolvedCombatStats, useTir: boolean): number {
  return stats.attaque ?? stats.agilite + (useTir ? stats.tir : stats.melee);
}

/** Bonus de vigueur aux dégâts : vigueur en mêlée, la moitié (arrondie à l'inférieur) à distance. */
export function vigueurBonus(stats: ResolvedCombatStats, useTir: boolean): number {
  return useTir && stats.attaque === null ? Math.floor(stats.vigueur / 2) : stats.vigueur;
}

/** Dégâts finaux : dégâts bruts + vigueur (+ coup dévastateur) − protection de la cible, jamais négatifs. */
export function finalDamage(raw: number, vigueur: number, protection: number, devastating: boolean): number {
  return Math.max(0, raw + vigueur + (devastating ? DEVASTATING_BONUS : 0) - protection);
}

/** Un d6 aléatoire. */
export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}
