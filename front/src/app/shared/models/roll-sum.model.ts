/** Un terme de l'addition d'un jet. */
export interface DwRollSumTerm {
  readonly value: string;
  readonly caption: string;
  readonly tone: 'dice' | 'plus' | 'minus' | 'total';
  /** Effet du registre dont le terme vient : sa croix le retire. */
  readonly effetId?: string;
  /** Le terme se saisit à la main : la page fournit son contenu (`dwRollSumEditable`). */
  readonly editable?: boolean;
}
