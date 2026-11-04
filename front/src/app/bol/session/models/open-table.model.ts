import {BolAccueilModel} from '../../models/bol-accueil.model';

/** Ce que le dialogue « Nouvelle partie » reçoit : le chapitre de départ demandé (null : à choisir) et, ouvert depuis l'accueil, ce que
 * l'accueil a déjà lu (les scénarios), pour ne pas le relire. */
export interface OpenTableData {
  readonly scenarioId: string | null;
  readonly accueil?: BolAccueilModel | null;
}
