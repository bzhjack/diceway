import {InitiativeResultat} from '../models/bol-fight-session.model';
import {DamageDie, DamageSpec, ResolvedCombatStats} from './models/combat-attack.model';
import {HeroicSlug} from './models/combat-resolution.model';

/** Seuil de réussite d'un jet d'attaque BoL (02-actions-combat.md). */
export const ATTACK_THRESHOLD = 9;

interface HeroicOption {
  readonly slug: HeroicSlug;
  readonly label: string;
  readonly effect: string;
}

export const HEROIC_OPTIONS: readonly HeroicOption[] = [
  {slug: 'carnage', label: 'Carnage', effect: 'Nouvelle attaque immédiate, sans dépenser de PH.'},
  {slug: 'devastateur', label: 'Coup dévastateur', effect: '+6 dégâts.'},
  {slug: 'precis', label: 'Coup précis', effect: 'Dégâts normaux et un dé de malus imposé à la cible, jusqu’à la fin du combat.'},
  {slug: 'desarmement', label: 'Désarmement', effect: "L'adversaire perd son arme, au lieu de subir des dégâts."},
  {slug: 'pietaille', label: 'Massacrer la piétaille', effect: 'Les dégâts sont le nombre de piétaille mis hors combat.'},
  {slug: 'renversement', label: 'Renversement', effect: "L'adversaire est jeté à terre : un dé de malus à sa prochaine action."},
];

/** Nombre d'options de succès héroïque que donne un résultat : une pour un succès héroïque, deux pour un succès légendaire. */
export function heroicPicksAllowed(result: InitiativeResultat): number {
  return result === 'legendaire' ? 2 : result === 'heroique' ? 1 : 0;
}

/** Un clic sur une option : elle s'ajoute tant qu'il reste un choix (la même peut être prise deux fois) ; tous les choix faits, un clic
 * sur une option prise la retire, un clic sur une autre remplace le choix le plus ancien. */
export function toggleHeroicPick(picks: readonly HeroicSlug[], slug: HeroicSlug, max: number): readonly HeroicSlug[] {
  if (max <= 0) {
    return [];
  }
  if (picks.length < max) {
    return [...picks, slug];
  }
  return picks.includes(slug) ? picks.filter((pick) => pick !== slug) : [...picks.slice(1), slug];
}

/** Bonus de dégâts du coup dévastateur. */
const DEVASTATING_BONUS = 6;

const DICE: Readonly<Record<string, DamageDie>> = {d3: 'd3', d6: 'd6', d6m: 'd6m', d6b: 'd6b'};

/** Lit des dégâts écrits comme dans le livre : un dé (« d3 », « d6 », « d6M », « d6B »), suivi d'un multiplicateur pour les grandes
 * créatures (« d6Bx2 » : le résultat du dé multiplié par 2, livre p. 108) et d'un modificateur (« d6-2 », « d6 + 3 ») ; ou une valeur
 * fixe (« 1 », « 0 »). Sans dégâts écrits, un d6. `null` pour ce qui ne se lit pas (« spécial ») : le profil les décrit, le MJ tape
 * le total. */
export function parseDamage(degats: string | null | undefined): DamageSpec | null {
  const text = (degats ?? '').replace(/\s+/g, '').toLowerCase();
  if (text === '') {
    return {die: 'd6', multiplier: 1, modifier: 0, fixed: null};
  }
  if (/^-?\d+$/.test(text)) {
    return {die: 'd6', multiplier: 1, modifier: 0, fixed: Number(text)};
  }
  const match = text.match(/^(d3|d6[mb]?)(?:[x×]([1-9]))?([+-]\d+)?$/);
  if (!match) {
    return null;
  }
  return {die: DICE[match[1]], multiplier: Number(match[2] ?? 1), modifier: Number(match[3] ?? 0), fixed: null};
}

const POLYVALENTE = /^\s*(\S+)\s+ou\s+(\S+)\s*$/i;

/** Arme maniée à une ou deux mains (Mythic+ : épée valgardienne, hache d'abordage de Parsool), aux dégâts écrits « d6 ou d6B ». */
export function estPolyvalente(degats: string | null | undefined): boolean {
  return POLYVALENTE.test(degats ?? '');
}

/** Les dégâts d'une arme dans la main : pour une arme polyvalente, le premier dé à une main, le second à deux mains ; les autres
 * dégâts tels quels. */
export function degatsEnMain(degats: string | null, deuxMains: boolean): string | null {
  const match = (degats ?? '').match(POLYVALENTE);
  return match ? match[deuxMains ? 2 : 1] : degats;
}

/** Les dégâts bruts d'un jet, avant la vigueur et la protection : la valeur fixe, ou le dé multiplié puis modifié. */
export function scaleDamage(spec: DamageSpec, face: number): number {
  return spec.fixed ?? face * spec.multiplier + spec.modifier;
}

/** Nombre de d6 à lancer pour ce dé de dégâts : deux pour un dé de malus ou de bonus. */
export function damageDiceCount(die: DamageDie): number {
  return die === 'd6m' || die === 'd6b' ? 2 : 1;
}

/** Ce que donne le dé de dégâts : le moins bon de deux dés (d6M), le meilleur (d6B), la moitié arrondie au supérieur (d3). */
export function rawDamage(die: DamageDie, values: readonly number[]): number {
  if (die === 'd6m') {
    return Math.min(...values);
  }
  if (die === 'd6b') {
    return Math.max(...values);
  }
  return die === 'd3' ? Math.ceil(values[0] / 2) : values[0];
}

/** Bonus au jet d'attaque : celui d'une créature, sinon agilité + mêlée (ou tir). En bagarre à mains nues, le MJ peut faire jouer la
 * vigueur à la place de l'agilité (`brawl`, livre p. 62). */
export function attackBonus(stats: ResolvedCombatStats, useTir: boolean, brawl = false): number {
  return stats.attaque ?? (brawl ? stats.vigueur : stats.agilite) + (useTir ? stats.tir : stats.melee);
}

/** Bonus de vigueur aux dégâts : vigueur en mêlée, la moitié (arrondie à l'inférieur) à distance et à mains nues, même en mêlée
 * (table des dégâts, 02-actions-combat.md). Une créature (attaque combinée) n'en a aucun : ses aptitudes de combat incorporent déjà
 * tous ses modificateurs, on n'ajoute pas sa vigueur aux dégâts (04-pnj-creatures-demons.md, « Règles d'application »). */
export function vigueurBonus(stats: ResolvedCombatStats, useTir: boolean, unarmed = false): number {
  if (stats.attaque !== null) {
    return 0;
  }
  return useTir || unarmed ? Math.floor(stats.vigueur / 2) : stats.vigueur;
}

/** Ce qu'ajoutent aux dégâts `count` coups dévastateurs (deux pour un succès légendaire qui le prend deux fois). */
export function devastatingBonus(count: number): number {
  return count * DEVASTATING_BONUS;
}

/** Dégâts finaux : dégâts bruts + vigueur (+ 6 par coup dévastateur) − protection de la cible, jamais négatifs. */
export function finalDamage(raw: number, vigueur: number, protection: number, devastating: number): number {
  return Math.max(0, raw + vigueur + devastatingBonus(devastating) - protection);
}

/** Plus grande face que peut montrer le dé de dégâts : 3 pour un d3, 6 sinon. */
export function damageDieMax(die: DamageDie): number {
  return die === 'd3' ? 3 : 6;
}

/** Fourchette des dégâts finaux, annoncée avant le jet : ce que donnent la plus petite et la plus grande face du dé, multipliées et
 * modifiées comme les dégâts l'indiquent. */
export function damageRange(spec: DamageSpec, vigueur: number, protection: number, devastating: number): readonly [number, number] {
  return [
    finalDamage(scaleDamage(spec, 1), vigueur, protection, devastating),
    finalDamage(scaleDamage(spec, damageDieMax(spec.die)), vigueur, protection, devastating),
  ];
}

/** Un d6 aléatoire. */
export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/** Résout le modificateur d'attaque réellement appliqué par la posture choisie. "Attaque au défaut
 * de l'armure" n'a pas de malus fixe en base (`modificateur_armor: true`) : son malus est la valeur
 * de protection fixe de la cible (−1/−2/−3 légère/moyenne/lourde, doc/rules/02-actions-combat.md). */
export function resolvePostureAttackModifier(posture: {readonly slug: string; readonly modificateur: number} | null, targetProtection: number): number {
  if (!posture) {
    return 0;
  }
  return posture.slug === 'armor-chink' ? -targetProtection : posture.modificateur;
}

/** Total du jet d'attaque : 2d6 + bonus attaquant − défense cible + modificateurs (effets en cours : bouclier, postures, défense totale…) +
 * bonus +1 légendaire personnel (si actif pour la rencontre) + modificateur de posture (offensive/intrépide/défensive/défaut de l'armure). */
export function computeAttackTotal(
  diceSum: number,
  attackerBonus: number,
  targetDefense: number,
  modifier: number,
  legendaryBonus: number,
  postureModifier: number,
): number {
  return diceSum + attackerBonus - targetDefense + modifier + legendaryBonus + postureModifier;
}

/** Résultat suggéré d'un jet d'attaque : 2/12 naturels priment sur le seuil (même règle absolue que
 * pour tout jet d'action, 02-actions-combat.md) — `total` est déjà le résultat de `computeAttackTotal`. Le double 6 est un succès
 * héroïque, sauf si lui seul pouvait toucher (son total ne dépasse pas le seuil) : le coup touche alors normalement (livre p. 56). */
export function suggestedAttackResult(
  dice: readonly [number, number],
  total: number,
  threshold: number,
): InitiativeResultat {
  const [a, b] = dice;
  if (a === 1 && b === 1) {
    return 'echec';
  }
  if (a === 6 && b === 6) {
    return total > threshold ? 'heroique' : 'reussite';
  }
  return total >= threshold ? 'reussite' : 'echec';
}

/** « Défier la mort » se propose quand un coup fait franchir un seuil : la vitalité passe sous 0 (le héros est mourant) ou sous −5
 * (il n'est plus seulement inconscient). Un héros déjà mourant qui encaisse un nouveau coup sans changer de seuil n'est pas relancé. */
export function shouldPromptDefierLaMort(before: number, after: number): boolean {
  return (before >= 0 && after < 0) || (before >= -5 && after < -5);
}
