import {BolAvantageModel} from "./bol-avantage.model";
import {BolDesavantageModel} from "./bol-desavantage.model";

/** Un trait d'un personnage — avantage (`A`) ou désavantage (`D`) —, avec son détail libre et sa fiche du
 * catalogue. */
export interface BolHerosTraitsModel {
  id?: number;
  traitable_id: number;
  type: 'A' | 'D';
  detail: string | null;
  region_id: number | null;
  carriere: boolean | null;
  traitable?: BolAvantageModel | BolDesavantageModel;
}
