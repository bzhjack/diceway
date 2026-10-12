import {InitiativeResultat} from '../models/bol-fight-session.model';
import {ActionAttribute, ActionDiceTarget, ActionDiceTargetLabel, ActionDifficulty, ActionRollLabels, ActionRollParts, ActionRollTone, ActionVerdict} from './models/action-roll.model';

export const ACTION_ATTRIBUTES: readonly ActionAttribute[] = ['agilite', 'vigueur', 'esprit', 'aura'];

/** Nom court d'un attribut, pour le détail de la formule : « + 1 (agi) ». */
export const ACTION_ATTRIBUTE_SHORT: Record<ActionAttribute, string> = {
  agilite: 'agi',
  vigueur: 'vig',
  esprit: 'esp',
  aura: 'aura',
};

export const ACTION_ATTRIBUTE_LABELS: Record<ActionAttribute, string> = {
  agilite: 'Agilité',
  vigueur: 'Vigueur',
  esprit: 'Esprit',
  aura: 'Aura',
};

/** Seuil fixe de réussite d'un jet d'action BoL (02-actions-combat.md) — la difficulté agit en modificateur, jamais sur le seuil. */
export const ACTION_ROLL_THRESHOLD = 9;

/** Échelle de difficulté officielle BoL (02-actions-combat.md), appliquée en modificateur au jet. */
export const ACTION_DIFFICULTIES: readonly ActionDifficulty[] = [
  {label: 'Très facile', modifier: 2},
  {label: 'Facile', modifier: 1},
  {label: 'Moyenne', modifier: 0},
  {label: 'Ardue', modifier: -1},
  {label: 'Difficile', modifier: -2},
  {label: 'Très difficile', modifier: -4},
  {label: 'Impossible', modifier: -6},
  {label: 'Héroïque', modifier: -8},
];

export const DEFAULT_ACTION_DIFFICULTY: ActionDifficulty = ACTION_DIFFICULTIES[2];

/** Résultat suggéré d'un jet d'action : 2/12 naturels priment sur le seuil (même règle absolue que l'initiative). */
export function suggestedActionResult(
  dice: readonly [number, number],
  modifierSum: number,
  threshold: number,
): InitiativeResultat {
  const [a, b] = dice;
  if (a === 1 && b === 1) {
    return 'echec';
  }
  if (a === 6 && b === 6) {
    return 'heroique';
  }
  return a + b + modifierSum >= threshold ? 'reussite' : 'echec';
}

/** Résout un dé de bonus/malus (02-actions-combat.md, p. 16-17 du livre) : `net` positif garde les 2
 * meilleurs des dés lancés, négatif garde les 2 moins bons, 0 = lancer normal. */
export function keepBestOrWorstTwo(values: readonly number[], net: number): readonly [number, number] {
  if (values.length <= 2) {
    return [values[0], values[1]];
  }
  const sorted = [...values].sort((a, b) => a - b);
  return net < 0 ? [sorted[0], sorted[1]] : [sorted[sorted.length - 2], sorted[sorted.length - 1]];
}

/** Indices des deux dés gardés parmi ceux lancés (les deux meilleurs pour un dé de bonus, les deux moins bons pour un dé de malus),
 * dans l'ordre du lancer : les autres dés s'affichent écartés. */
export function keptDiceIndexes(values: readonly number[], net: number): readonly [number, number] {
  if (values.length <= 2) {
    return [0, 1];
  }
  const byValue = values.map((_, index) => index).sort((a, b) => values[a] - values[b]);
  const kept = net < 0 ? byValue.slice(0, 2) : byValue.slice(-2);
  return [Math.min(kept[0], kept[1]), Math.max(kept[0], kept[1])];
}

/** Probabilité de chaque total des deux dés gardés (l'indice est le total, de 2 à 12) pour 2 dés plus `net` dés de bonus
 * (positif) ou de malus (négatif) : toutes les combinaisons sont comptées, le résultat est exact. */
export function keptDiceDistribution(net: number): readonly number[] {
  const count = 2 + Math.abs(net);
  const combinations = 6 ** count;
  const distribution = new Array<number>(13).fill(0);
  for (let combination = 0; combination < combinations; combination++) {
    const values: number[] = [];
    let rest = combination;
    for (let die = 0; die < count; die++) {
      values.push((rest % 6) + 1);
      rest = Math.floor(rest / 6);
    }
    const [a, b] = keepBestOrWorstTwo(values, net);
    distribution[a + b] += 1 / combinations;
  }
  return distribution;
}

/** Chance de réussir un jet, entre 0 et 1 : le double 6 réussit toujours, le double 1 échoue toujours, et entre les deux il faut
 * que total + modificateurs atteigne le seuil (02-actions-combat.md). */
export function actionSuccessChance(net: number, modifierSum: number, threshold: number): number {
  const distribution = keptDiceDistribution(net);
  let chance = distribution[12];
  for (let total = 3; total <= 11; total++) {
    if (total + modifierSum >= threshold) {
      chance += distribution[total];
    }
  }
  return chance;
}

/** Ce qu'il faut obtenir aux dés pour réussir : le seuil moins les modificateurs. À 3 ou moins tout réussit sauf le double 1 ; à 12 ou
 * plus, seul le double 6 réussit. */
export function actionDiceTarget(modifierSum: number, threshold: number): ActionDiceTarget {
  const value = threshold - modifierSum;
  return {kind: value <= 3 ? 'tout' : value >= 12 ? 'double-six' : 'seuil', value};
}

/** Ce qu'il faut obtenir aux dés, en clair : « 7+ aux dés », « Tout sauf le double 1 », « 6·6 seul le double 6 ». */
export function actionDiceTargetLabel(target: ActionDiceTarget): ActionDiceTargetLabel {
  if (target.kind === 'tout') {
    return {big: 'Tout', small: 'sauf le double 1'};
  }
  return target.kind === 'double-six' ? {big: '6·6', small: 'seul le double 6'} : {big: `${target.value}+`, small: 'aux dés'};
}

/** Circonférence de l'anneau des chances (rayon 27 dans une vue de 64). */
const RING_LENGTH = 2 * Math.PI * 27;

/** Tracé de l'arc doré de l'anneau des chances (`stroke-dasharray`) pour un pourcentage de 0 à 100. */
export function chanceRingDash(percent: number): string {
  return `${((percent / 100) * RING_LENGTH).toFixed(1)} ${RING_LENGTH.toFixed(1)}`;
}

/** Le verdict en clair : le titre, puis l'écart au seuil (le total se lit dans l'addition du plateau). `result` est le résultat retenu (après les choix d'héroïsme), `dice` les deux dés gardés. */
export function actionVerdict(result: InitiativeResultat, dice: readonly [number, number], total: number, threshold: number): ActionVerdict {
  const natural12 = dice[0] === 6 && dice[1] === 6;
  switch (result) {
    case 'echec_critique':
      return {title: 'Échec critique', detail: 'Tu décris une issue franchement défavorable, et tu gagnes 1 point d’héroïsme.'};
    case 'legendaire':
      return {title: 'Succès légendaire', detail: 'Double 6, et 1 point d’héroïsme dépensé.'};
    case 'heroique':
      return {
        title: 'Succès héroïque',
        detail: natural12 ? 'Double 6 : réussite automatique, avec un effet supérieur.' : 'Réussite transformée pour 1 point d’héroïsme.',
      };
    case 'reussite':
      return {title: 'Réussite', detail: total > threshold ? `réussi de ${total - threshold}` : 'tout juste'};
    case 'echec':
      return dice[0] === 1 && dice[1] === 1
        ? {title: 'Échec automatique', detail: 'Double 1 : c’est raté, quel que soit le bonus.'}
        : {title: 'Échec', detail: `il manquait ${threshold - total}`};
  }
}

/** Reconstruit une paire de dés valide à partir d'un total 2d6 saisi à la main — un total de 2 ou 12
 * n'est atteignable que par (1,1) ou (6,6), donc la règle absolue reste correcte. */
export function diceFromTotal(total: number): readonly [number, number] {
  const a = Math.max(1, Math.min(6, total - 6));
  return [a, total - a];
}

/** Solde net de dés de bonus/malus, plafonné à ±2 (02-actions-combat.md) : un avantage et un
 * désavantage contradictoires s'annulent. */
export function netDiceModifier(avantages: number, desavantages: number): number {
  return Math.max(-2, Math.min(2, avantages - desavantages));
}

export function diceCountLabel(avantages: number, desavantages: number): string {
  const net = netDiceModifier(avantages, desavantages);
  if (net === 0) {
    return avantages > 0 && desavantages > 0 ? "S'annulent — 2d6" : '';
  }
  const count = 2 + Math.abs(net);
  return net > 0 ? `${count}d6, garde les 2 meilleurs` : `${count}d6, garde les 2 moins bons`;
}

/** Formate un modificateur avec son signe — jamais de "+0" (zéro n'est ni un bonus ni un malus). */
export function signedModifier(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function actionModifierSum(parts: ActionRollParts): number {
  return parts.attribute + parts.carriere + parts.equipment + parts.difficulty + parts.modifier;
}

const FORMULA_TERMS = ['attribute', 'carriere', 'equipment', 'difficulty', 'modifier'] as const;

/** Formule en clair : `2d6 + 2 (agi) + 1 (chasseur) − 1 (ardue) ≥ 9`. Les termes nuls sont omis ; une fois les dés
 * lancés, `2d6` est remplacé par les deux dés gardés. `labels` donne le nom de chaque terme, entre parenthèses. */
export function formatActionFormula(
  parts: ActionRollParts,
  dice: readonly [number, number] | null,
  labels: ActionRollLabels = {},
): string {
  const head = dice ? `${dice[0]} + ${dice[1]}` : '2d6';
  const terms = FORMULA_TERMS.filter((term) => parts[term] !== 0)
    .map((term) => {
      const value = parts[term];
      const label = labels[term] ? ` (${labels[term]})` : '';
      return `${value > 0 ? ' + ' : ' − '}${Math.abs(value)}${label}`;
    })
    .join('');
  return `${head}${terms} ≥ ${ACTION_ROLL_THRESHOLD}`;
}

export function actionResultTone(result: InitiativeResultat): ActionRollTone {
  if (result === 'reussite') {
    return 'reussite';
  }
  return result === 'heroique' || result === 'legendaire' ? 'heroique' : 'echec';
}

