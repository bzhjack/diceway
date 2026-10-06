/** Données du dialogue « Défier la mort », proposé quand la vitalité d'un héros passe sous zéro. */
export interface DefierLaMortDialogData {
  readonly heroNom: string;
  /** Toujours négative — c'est ce qui déclenche l'ouverture de ce dialog. */
  readonly vitaliteCourante: number;
  readonly heroisme: number;
}
