import {BolAvantageModel} from "./bol-avantage.model";
import {BolDesavantageModel} from "./bol-desavantage.model";

export interface BolHerosTraitsModel {
  id?: number;
  traitable_id: number;
  type: 'A' | 'D';
  detail: string | null;
  region_id: number | null;
  carriere: boolean | null;
  traitable?: BolAvantageModel | BolDesavantageModel;
}
