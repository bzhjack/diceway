import {BolAccueilModel} from '../../models/bol-accueil.model';

/** Ce que le dialogue « Nouvelle partie » reçoit : le chapitre de départ demandé (null : à choisir) et, ouvert depuis l'accueil, ce que
 * l'accueil a déjà lu (les compagnies, les scénarios, les parties), pour ne pas le relire. */
export interface OpenTableData {
  readonly scenarioId: string | null;
  readonly accueil?: BolAccueilModel | null;
}

/** Comment le dialogue se ferme : `true` si la partie est créée ; `'compagnie'` s'il faut d'abord créer une compagnie. */
export type OpenTableResultat = boolean | 'compagnie';
