/** Une carrière du héros, proposée comme bonus de son jet d'action. */
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

/** Tout ce dont le panneau de jet d'action a besoin pour un héros : attributs, carrières, traits à dé et
 * héroïsme. */
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

/** Les quatre attributs qu'on peut choisir pour un jet d'action. */
export type ActionAttribute = 'agilite' | 'vigueur' | 'esprit' | 'aura';

/** Un niveau de difficulté d'un jet d'action et son modificateur. */
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

/** Le nom de chaque terme de la formule, entre parenthèses derrière sa valeur : « + 1 (agi) ». Un terme sans nom
 * s'affiche seul. */
export type ActionRollLabels = Partial<Record<keyof ActionRollParts, string>>;

/** Couleur du résultat d'un jet : échec, réussite ou héroïque (héroïque et légendaire). */
export type ActionRollTone = 'echec' | 'reussite' | 'heroique';
