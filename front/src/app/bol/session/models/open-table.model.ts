import {BolAccueilModel} from '../../models/bol-accueil.model';

/** Ce que le dialogue « Ouvrir une table » reçoit : le chapitre choisi (null : on improvise) et, ouvert depuis l'accueil, ce que l'accueil a
 * déjà lu (la table ouverte, les scénarios, la dernière compagnie), pour ne pas le relire. */
export interface OpenTableData {
  readonly scenarioId: string | null;
  readonly accueil?: BolAccueilModel | null;
}

/** Les deux temps du dialogue : choisir l'histoire et les héros, puis, quand une autre table est ouverte, confirmer qu'elle se clôt. */
export type OpenTableEtape = 'choix' | 'confirmation';
