import {Signal} from '@angular/core';

/** Données du gestionnaire de scènes : la session et l'état de la table qu'il doit suivre. */
export interface SceneManagerDialogData {
  readonly sessionId: string;
  /** Signaux, pas des valeurs figées à l'ouverture : charger une scène depuis le dialogue change la
   * scène courante et le nombre de personnages sur la table, et la liste doit le voir (marqueur « en
   * cours », question « Remplacer ou Ajouter » au chargement suivant). */
  readonly currentSceneId: Signal<string | null>;
  readonly nonHeroCount: Signal<number>;
  /** Appelé à chaque opération qui a modifié la session (scène chargée, renommée, supprimée…). */
  readonly onChanged: () => void;
}
