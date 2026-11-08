/** Ce que le dialogue d'un chapitre reçoit : son titre et son bouton, s'il nomme un nouveau scénario, si c'est un one shot (ni numéro ni
 * scénario), et les valeurs de départ. */
export interface ChapitreDialogData {
  readonly titre: string;
  readonly confirmLabel: string;
  /** Un nouveau scénario : le dialogue demande aussi son nom. */
  readonly nommerLeScenario: boolean;
  /** Le scénario du chapitre, affiché quand il n'est pas à nommer ; null pour un one shot. */
  readonly scenario: string | null;
  readonly oneShot: boolean;
  readonly numero: number | null;
  readonly chapitre: string;
  readonly pitch: string;
}

/** Ce que le dialogue renvoie : le nom du nouveau scénario (null sinon), le numéro du chapitre, son nom et son pitch. */
export interface ChapitreDialogResultat {
  readonly scenario: string | null;
  readonly numero: number | null;
  readonly titre: string;
  readonly pitch: string;
}
