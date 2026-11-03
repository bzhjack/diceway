/** Un scénario de l'accueil : seulement de quoi l'afficher et l'ouvrir. */
export interface BolAccueilScenario {
  id: string;
  titre: string;
}

/** Une scène du scénario de la table ouverte. */
export interface BolAccueilScene {
  id: string;
  titre: string;
}

/** La table ouverte de l'accueil, avec le scénario qu'elle joue (null : on improvise) et où en est ce chapitre. */
export interface BolAccueilTable {
  id: string;
  titre: string | null;
  /** `combat` : la clore termine d'abord le combat. */
  statut: 'libre' | 'combat';
  scenario_id: string | null;
  /** La scène chargée sur la table. */
  scene_id: string | null;
  /** Les scènes de son scénario, dans leur ordre (aucune sans scénario). */
  scenes: BolAccueilScene[];
  /** Celles de ces scènes déjà passées sur la table. */
  scenes_jouees: string[];
  created_at: string;
}

/** Un héros à table (la table ouverte, sinon la dernière), pour la compagnie. */
export interface BolAccueilHeros {
  id: string;
  nom: string;
  avatar: string | null;
}

/** Le nombre de fiches de chaque bibliothèque, telles que le compte les voit (catalogue compris pour les PNJ, créatures, démons, armes et
 * armures). */
export interface BolAccueilComptes {
  heros: number;
  pnjs: number;
  creatures: number;
  demons: number;
  armes: number;
  armures: number;
  sessions: number;
}

/** Réponse de `GET /api/bol/accueil` : tout ce que le tableau de bord affiche, en une requête. */
export interface BolAccueilModel {
  table: BolAccueilTable | null;
  scenarios: BolAccueilScenario[];
  /** Ids des scénarios déjà joués sur une table du compte. */
  scenarios_joues: string[];
  /** Id du scénario de la table la plus récente (ouverte ou non), s'il y en a un. */
  scenario_recent_id: string | null;
  /** Ids des héros de la dernière table. */
  derniers_heros: string[];
  /** Les héros de la table ouverte (sinon de la dernière), avec leur nom et leur portrait. */
  compagnie: BolAccueilHeros[];
  comptes: BolAccueilComptes;
}
