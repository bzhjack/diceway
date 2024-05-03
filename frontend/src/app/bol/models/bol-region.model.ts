import {BolAvantageModel} from "./bol-avantage.model";
import {BolDesavantageModel} from "./bol-desavantage.model";

export interface BolRegionModel {
  id: number;
  region: string;
  noms: string[];
  nomsFeminins: string[];
  nomsMasculins: string[];
  avantages: BolAvantageModel[],
  desavantages: BolDesavantageModel[],
}
