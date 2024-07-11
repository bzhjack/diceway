import {BolAvantageModel} from "./bol-avantage.model";
import {BolDesavantageModel} from "./bol-desavantage.model";

export interface BolRegionModel {
  id: number;
  region: string;
  noms: BolNomModel[];
  nomsFeminins: BolNomModel[];
  nomsMasculins: BolNomModel[];
  avantages: BolAvantageModel[],
  desavantages: BolDesavantageModel[],
}

export interface BolNomModel {
  id: number;
  nom: string;
  region_id: number;
  gender: "F" | "M",
}
