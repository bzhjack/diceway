/** Erreur de validation, indépendante du framework de formulaire (testable sans Signal Forms). */
export interface ValidationIssue {
  readonly kind: string;
  readonly message: string;
}

export interface AttributsValues {
  readonly vigueur: number;
  readonly agilite: number;
  readonly esprit: number;
  readonly aura: number;
}

export interface CombatValues {
  readonly initiative: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
}
