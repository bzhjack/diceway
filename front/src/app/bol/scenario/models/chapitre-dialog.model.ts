/** Ce que le dialogue d'un chapitre reçoit : son titre et son bouton, le nom de son scénario, et les valeurs de départ. */
export interface ChapitreDialogData {
  readonly titre: string;
  readonly confirmLabel: string;
  readonly scenario: string;
  readonly numero: number | null;
  readonly chapitre: string;
  readonly pitch: string;
}

/** Ce que le dialogue renvoie : le numéro du chapitre, son nom et son pitch. */
export interface ChapitreDialogResultat {
  readonly numero: number | null;
  readonly titre: string;
  readonly pitch: string;
}
