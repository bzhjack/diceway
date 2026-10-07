/** Une case de la grille de caractéristiques : son champ de formulaire et son libellé. */
interface StatCell {
  readonly control: string;
  readonly label: string;
  readonly highlight?: boolean;
  /** Champ texte (notation de dés, « d6B ») au lieu d'un stepper numérique. */
  readonly text?: boolean;
}

/** Un groupe de cases de la grille — attributs, combat ou ressources — et son nombre de colonnes. */
export interface StatGroup {
  readonly key: 'attr' | 'combat' | 'res';
  readonly label: string;
  readonly columns: 1 | 2 | 3 | 4;
  readonly cells: readonly StatCell[];
}
