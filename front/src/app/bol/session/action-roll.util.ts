import {InitiativeResultat} from '../models/bol-fight-session.model';

export interface ActionRollCarriere {
  readonly label: string;
  readonly value: number;
}

/** Avantage/désavantage à dé de bonus/malus du héros (`de_bonus`/`de_malus` en base) — ne modifie pas
 * un attribut, change le mécanisme de lancer (cf. `netDiceModifier`/`keepBestOrWorstTwo`). */
export interface ActionRollDiceTrait {
  readonly label: string;
  readonly domaine: string | null;
  readonly kind: 'avantage' | 'desavantage';
}

export interface ActionRollData {
  readonly heroNom: string;
  readonly herosId: string;
  /** Héroïsme du héros au chargement — la valeur vivante est portée par le `model()` du composant. */
  readonly heroisme: number;
  readonly agilite: number;
  readonly vigueur: number;
  readonly esprit: number;
  readonly aura: number;
  /** Malus d'équipement (armure/casque) sur l'agilité — appliqué automatiquement quand cet attribut est sélectionné. */
  readonly equipementAgilite: number;
  /** Carrières du héros — `2d6 + attribut + carrière appropriée` (02-actions-combat.md), sélection manuelle. */
  readonly carrieres: readonly ActionRollCarriere[];
  /** Avantages/désavantages à dé de bonus/malus — sélection manuelle. Les traits à modificateur fixe
   * d'attribut sont exclus : déjà intégrés à la valeur stockée (décision du 2026-09-01). */
  readonly diceTraits: readonly ActionRollDiceTrait[];
}

export type ActionAttribute = 'agilite' | 'vigueur' | 'esprit' | 'aura';

export const ACTION_ATTRIBUTES: readonly ActionAttribute[] = ['agilite', 'vigueur', 'esprit', 'aura'];

export const ACTION_ATTRIBUTE_LABELS: Record<ActionAttribute, string> = {
  agilite: 'Agilité',
  vigueur: 'Vigueur',
  esprit: 'Esprit',
  aura: 'Aura',
};

export interface ActionDifficulty {
  readonly label: string;
  readonly modifier: number;
}

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

export const ACTION_RESULT_LABELS: Record<InitiativeResultat, string> = {
  echec_critique: 'Échec critique',
  echec: 'Échec',
  reussite: 'Réussite',
  heroique: 'Héroïque',
  legendaire: 'Légendaire',
};

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

/** Les cinq termes ajoutés aux 2d6, dans l'ordre où la formule les affiche. */
export interface ActionRollParts {
  readonly attribute: number;
  readonly carriere: number;
  readonly equipment: number;
  readonly difficulty: number;
  readonly modifier: number;
}

export function actionModifierSum(parts: ActionRollParts): number {
  return parts.attribute + parts.carriere + parts.equipment + parts.difficulty + parts.modifier;
}

/** Formule en clair : `2d6 + 2 + 1 − 1 ≥ 9`. Les termes nuls sont omis ; une fois les dés lancés,
 * `2d6` est remplacé par les deux dés gardés. */
export function formatActionFormula(parts: ActionRollParts, dice: readonly [number, number] | null): string {
  const head = dice ? `${dice[0]} + ${dice[1]}` : '2d6';
  const terms = [parts.attribute, parts.carriere, parts.equipment, parts.difficulty, parts.modifier]
    .filter((value) => value !== 0)
    .map((value) => (value > 0 ? ` + ${value}` : ` − ${Math.abs(value)}`))
    .join('');
  return `${head}${terms} ≥ ${ACTION_ROLL_THRESHOLD}`;
}

export type ActionRollTone = 'echec' | 'reussite' | 'heroique';

export function actionResultTone(result: InitiativeResultat): ActionRollTone {
  if (result === 'reussite') {
    return 'reussite';
  }
  return result === 'heroique' || result === 'legendaire' ? 'heroique' : 'echec';
}

