/** Erreur de validation, indépendante du framework de formulaire (testable sans Signal Forms). */
export interface ValidationIssue {
  readonly kind: string;
  readonly message: string;
}

/** Les quatre attributs d'un héros, pour les validations de la création. */
export interface AttributsValues {
  readonly vigueur: number;
  readonly agilite: number;
  readonly esprit: number;
  readonly aura: number;
}

/** Les valeurs de combat d'un héros, pour les validations de la création. */
export interface CombatValues {
  readonly initiative: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
}
