/** Où en est une règle de création : respectée, des points restent à répartir, dépassée, ou une valeur s'écarte de son calcul. */
export type DemonRegleEtat = 'ok' | 'reste' | 'depasse' | 'ecart';

/** Une ligne du panneau « Selon le livre » : ce qui est compté, contre ce que permet la catégorie, et ce qu'on en dit. */
export interface DemonRegleLigne {
  readonly cle: 'attributs' | 'aptitudes' | 'pouvoirs' | 'vitalite';
  readonly libelle: string;
  readonly valeur: number;
  readonly attendu: number;
  readonly etat: DemonRegleEtat;
  /** « 2 points à répartir », « 1 point de trop », « 20 + vigueur 3 »… */
  readonly detail: string;
}

/** Ce que le livre dit du démon en cours (p. 129-130) : une ligne par budget, les écarts particuliers, et la vitalité qu'il devrait avoir. */
export interface DemonConformite {
  readonly lignes: readonly DemonRegleLigne[];
  readonly avertissements: readonly string[];
  readonly vitaliteAttendue: number;
}

/** Les valeurs du démon qui comptent dans les règles. */
export interface DemonValeurs {
  readonly vigueur: number;
  readonly agilite: number;
  readonly esprit: number;
  readonly aura: number;
  readonly melee: number;
  readonly tir: number;
  readonly defense: number;
  readonly vitalite: number;
}
