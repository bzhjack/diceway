import {BolHerosCarriereModel} from "./bol-carriere.model";
import {BolHerosArmureModel} from "./bol-armure.model";
import {BolHerosArmeModel} from "./bol-arme.model";

export interface BolHerosModel {
  id: string | null;
  joueur: string;
  avatar: string | null;
  nom: string;

  vitalite: number,
  heroisme: number,

  combat: {
    initiative: number,
    melee: number,
    tir: number,
    defense: number,
  },
  attributs: {
    vigueur: number,
    aura: number,
    esprit: number,
    agilite: number
  },
  region_id: number | null,
  region: string | null,

  traits: any[],
  heroism_cost: number,
  carrieres: BolHerosCarriereModel[],
  armures: BolHerosArmureModel[],
  armes: BolHerosArmeModel[]
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
