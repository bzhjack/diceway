import {BolHerosCarriereModel} from "./bol-carriere.model";
import {BolHerosArmureModel} from "./bol-armure.model";
import {BolHerosArmeModel} from "./bol-arme.model";
import {BolHerosTraitsModel} from "./bol-trait.model";
import {BolHerosLangueModel} from "./bol-langue.model";

export interface BolHerosModel {
  id: string | null;
  joueur: string;

  combat: BolHerosCombat,
  attributs: BolHerosAttributs,
  origines: BolHerosOrigines,
  ressources: BolHerosRessources,
  traits: BolHerosTraitsModel[],
  carrieres: BolHerosCarriereModel[],
  armures: BolHerosArmureModel[] | number[],
  armes: BolHerosArmeModel[] | number[],
  langues: BolHerosLangueModel[] | number[]

}

export interface BolHerosCombat {
  initiative: number,
  melee: number,
  tir: number,
  defense: number,
}
export interface BolHerosAttributs {
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
}
export interface BolHerosOrigines {
  nom: string | null;
  region_id: number | null;
  avatar: string | null;
}
export interface BolHerosRessources {
  vitalite: number;
  heroisme: number;
}

