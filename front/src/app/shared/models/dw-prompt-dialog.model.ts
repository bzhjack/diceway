/** Données du dialogue de saisie d'un texte : titre, libellé du champ, valeur initiale et longueur
 * maximale. */
export interface DwPromptDialogData {
  title: string;
  label: string;
  value?: string;
  maxLength?: number;
  confirmLabel?: string;
}
