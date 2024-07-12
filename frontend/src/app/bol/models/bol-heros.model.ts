import {BolHerosCarriereModel} from "./bol-carriere.model";
import {BolHerosArmureModel} from "./bol-armure.model";
import {BolHerosArmeModel} from "./bol-arme.model";

export interface BolHerosModel {
  id: string | null;
  joueur: string;

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
  origines: {
    avatar: string | null,
    nom: string | null,
    region_id: number | null,
  },
  traits: any[],
  heroism_cost: number,
  carrieres: BolHerosCarriereModel[],
  armures: BolHerosArmureModel[] | number[],
  armes: BolHerosArmeModel[] | number[]
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
