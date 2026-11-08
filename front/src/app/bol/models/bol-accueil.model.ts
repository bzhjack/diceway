import {BolCompagnieModel} from './bol-compagnie.model';
import {BolScenarioSaga} from './bol-scenario.model';

/** Un chapitre de l'accueil : son nom, son numéro et son scénario (null pour un one shot), de quoi l'afficher et l'ouvrir. */
export interface BolAccueilScenario {
  id: string;
  titre: string;
  numero: number | null;
  saga: BolScenarioSaga | null;
}

/** Une scène du chapitre d'une partie. */
export interface BolAccueilScene {
  id: string;
  titre: string;
}

/** Un héros d'une partie, pour sa carte et le bandeau. */
export interface BolAccueilHeros {
  id: string;
  nom: string;
  avatar: string | null;
}

/** Une partie de l'accueil : une table, sa compagnie (`titre`, null pour une ancienne partie sans nom), son chapitre courant (null :
 * partie improvisée) et ce qu'elle en a joué. */
export interface BolAccueilPartie {
  id: string;
  /** Sa compagnie ; null pour une table créée sans (les scripts de test). */
  compagnie_id: string | null;
  titre: string | null;
  statut: 'libre' | 'combat';
  /** La dernière fois qu'on est entré à la table (ISO 8601). */
  jouee_le: string | null;
  scenario_id: string | null;
  /** La scène chargée sur la table. */
  scene_id: string | null;
  /** Les scènes de son chapitre, dans leur ordre (aucune sans chapitre). */
  scenes: BolAccueilScene[];
  /** Celles de ces scènes déjà passées sur cette table. */
  scenes_jouees: string[];
  /** Les chapitres que cette partie a joués : quittés pour un autre, ou toutes leurs scènes passées sur cette table. */
  chapitres_joues: string[];
  /** Le MJ a dit que cette partie a fini son scénario. */
  scenario_termine: boolean;
  /** Ses héros (du compte, du camp des héros), dans l'ordre où ils ont été posés. */
  heros: BolAccueilHeros[];
  /** Ses adversaires à la table : ce qu'un changement de chapitre retirerait. */
  figurants: number;
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
  compagnies: number;
  /** Les scénarios du compte : ses sagas et ses one shots. */
  scenarios: number;
}

/** Réponse de `GET /api/bol/accueil` : tout ce que le tableau de bord affiche, en une requête. */
export interface BolAccueilModel {
  /** La partie jouée en dernier, pour le bandeau ; null sans partie. */
  derniere: string | null;
  /** Toutes les parties, de la plus récemment jouée à la plus ancienne. */
  parties: BolAccueilPartie[];
  compagnies: BolCompagnieModel[];
  scenarios: BolAccueilScenario[];
  comptes: BolAccueilComptes;
}
