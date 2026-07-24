/** Erreur de validation, indépendante du framework de formulaire (testable sans Signal Forms). */
export interface ValidationIssue {
  readonly kind: string;
  readonly message: string;
}

/** R-ATTR-1 : un attribut est compris entre -1 et 3. */
export function attributRangeErrors(value: number): ValidationIssue | null {
  if (value < -1) {
    return {kind: 'tooSmallAttr', message: 'ne doit pas etre inferieur a -1.'};
  }
  if (value > 3) {
    return {kind: 'tooBigAttr', message: 'ne doit pas etre superieur a 3.'};
  }
  return null;
}

/** R-CARR-1 : un rang de carrière est compris entre 0 et 3. */
export function carriereRangeErrors(value: number): ValidationIssue | null {
  if (value < 0) {
    return {kind: 'tooSmallAttr', message: 'ne doit pas etre inferieur a 0.'};
  }
  if (value > 3) {
    return {kind: 'tooBigAttr', message: 'ne doit pas etre superieur a 3.'};
  }
  return null;
}

export interface AttributsValues {
  readonly vigueur: number;
  readonly agilite: number;
  readonly esprit: number;
  readonly aura: number;
}

/** R-ATTR-2/3 : somme des 4 attributs ≤ 4, un seul peut descendre à -1. */
export function attributsBudgetErrors(values: AttributsValues): readonly ValidationIssue[] {
  const numbers = [values.vigueur, values.agilite, values.esprit, values.aura];
  const errors: ValidationIssue[] = [];

  if (numbers.filter((value) => value === -1).length > 1) {
    errors.push({kind: 'attrTooManyNegative', message: 'Un seul attribut peut descendre à -1.'});
  }
  if (numbers.reduce((sum, value) => sum + value, 0) > 4) {
    errors.push({kind: 'attrSumExceeded', message: 'La somme des attributs ne doit pas dépasser 4.'});
  }

  return errors;
}

export interface CombatValues {
  readonly initiative: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
}

/** R-COMBAT-1/2/3 : somme des aptitudes de combat ≤ budget, une seule peut descendre à -1. */
export function combatBudgetErrors(values: CombatValues, budget: number): readonly ValidationIssue[] {
  const numbers = [values.initiative, values.melee, values.tir, values.defense];
  const errors: ValidationIssue[] = [];

  if (numbers.filter((value) => value === -1).length > 1) {
    errors.push({kind: 'aptTooManyNegative', message: 'Une seule aptitude de combat peut descendre à -1.'});
  }
  if (numbers.reduce((sum, value) => sum + value, 0) > budget) {
    errors.push({
      kind: 'aptSumExceeded',
      message: `La somme des aptitudes de combat ne doit pas dépasser ${budget}.`,
    });
  }

  return errors;
}

/** R-CARR-2/3 : somme des rangs de carrières ≤ budget (4 normalement, 6 si Non-combattant). */
export function carrieresBudgetErrors(values: readonly number[], budget: number): readonly ValidationIssue[] {
  const sum = values.reduce((total, value) => total + value, 0);
  return sum > budget
    ? [{kind: 'carrSumExceeded', message: `La somme des carrières ne doit pas dépasser ${budget}.`}]
    : [];
}
