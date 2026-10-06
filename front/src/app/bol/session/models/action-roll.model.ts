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

export interface ActionDifficulty {
  readonly label: string;
  readonly modifier: number;
}

/** Les cinq termes ajoutés aux 2d6, dans l'ordre où la formule les affiche. */
export interface ActionRollParts {
  readonly attribute: number;
  readonly carriere: number;
  readonly equipment: number;
  readonly difficulty: number;
  readonly modifier: number;
}

export type ActionRollTone = 'echec' | 'reussite' | 'heroique';
