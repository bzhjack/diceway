/** Données du dialogue de démarrage d'un combat. */
export interface StartCombatDialogData {
  readonly sessionId: string;
  /** Nouveau jet de réaction en plein combat : les rounds déjà joués sont conservés. */
  readonly reroll?: boolean;
}
