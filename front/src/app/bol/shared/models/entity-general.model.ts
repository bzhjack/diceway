/** Une entrée de la liste qui classe une créature (taille) ou un démon (catégorie). */
export interface EntityGeneralOption {
  readonly id: number | null | undefined;
  readonly label: string;
}
