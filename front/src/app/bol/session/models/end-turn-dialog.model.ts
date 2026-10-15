/** Données du dialogue qui retient « Fin du tour » quand un coup qui a touché n'est pas appliqué. */
export interface EndTurnDialogData {
  readonly attackerNom: string;
  readonly targetNom: string;
  /** Les dégâts prêts à être appliqués ; `null` s'ils ne sont pas encore saisis, ou pour un désarmement (pas de dégâts). */
  readonly damage: number | null;
  /** Le coup peut être conclu tout de suite : ses dégâts sont saisis, ou c'est un désarmement. */
  readonly canApply: boolean;
}

/** Le choix du MJ : conclure le coup puis finir le tour, ou finir sans le conclure. Fermer le dialogue garde le tour. */
export type EndTurnChoice = 'apply' | 'skip';
