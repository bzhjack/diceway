import {BolAvantageModel} from "./bol-avantage.model";
import {BolCarriereModel} from "./bol-carriere.model";
import {BolDesavantageModel} from "./bol-desavantage.model";
import {BolLangueModel} from "./bol-langue.model";

export interface BolRegionModel {
  id: number;
  region: string;
  noms: BolNomModel[];
  nomsFeminins: BolNomModel[];
  nomsMasculins: BolNomModel[];
  avantages: BolAvantageModel[];
  desavantages: BolDesavantageModel[];
  langue_native_id?: number | null;
  premiere_carriere_id?: number | null;
  carrieres_requises?: number[] | null;
  carrieres_interdites?: number[] | null;
  langue_native?: BolLangueModel | null;
  premiere_carriere?: BolCarriereModel | null;
}

export interface BolNomModel {
  id: number;
  nom: string;
  region_id: number;
  gender: "F" | "M";
}
