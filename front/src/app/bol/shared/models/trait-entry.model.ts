/** Entrée de FormArray référençant un avantage ('A') ou un désavantage ('D'). */
export interface TraitDraft {
  id: number;
  type: 'A' | 'D';
  /** Précision du trait (l'arme d'« Arme favorite »…), gardée telle quelle à la sauvegarde. */
  detail?: string | null;
  /** Région qui a proposé le trait (avantage régional) ; `null` pour un trait général. */
  region_id?: number | null;
}
