/** Données du dialogue de chargement d'une scène : son titre et le nombre de personnages déjà à table. */
export interface SceneLoadDialogData {
  readonly titre: string;
  /** Nombre de PNJ / créatures / démons actuellement sur la table. */
  readonly nonHeroCount: number;
}
