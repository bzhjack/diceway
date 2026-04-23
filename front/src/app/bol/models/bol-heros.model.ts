import {BolHerosCarriereModel} from "./bol-carriere.model";
import {BolHerosArmureModel} from "./bol-armure.model";
import {BolHerosArmeModel} from "./bol-arme.model";
import {BolHerosTraitsModel} from "./bol-trait.model";
import {BolHerosLangueModel} from "./bol-langue.model";
import {BolRegionModel} from "./bol-region.model";
export interface BolHerosModel {
  id: string | null;
  user_id: string | null;
  active: boolean;
  type: string;
  type_order?: number;
  combat: BolHerosCombat;
  attributs: BolHerosAttributs;
  origines: BolHerosOrigines;
  ressources: BolHerosRessources;
  traits: BolHerosTraitsModel[];
  carrieres: BolHerosCarriereModel[];
  langues?: BolHerosLangueModel[] | number[];
  armures: BolHerosArmureModel[] | number[];
  armes: BolHerosArmeModel[] | number[];
}

export interface BolHerosCombat {
  initiative: number;
  melee: number;
  tir: number;
  defense: number;
}

export interface BolHerosAttributs {
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
}

export interface BolHerosOrigines {
  nom: string | null;
  joueur: string | null;
  commentaire?: string | null;
  region_id: number | null;
  region?: BolRegionModel | null;
  avatar: string | null;
  langues: BolHerosLangueModel[] | number[];
}

export interface BolHerosRessources {
  vitalite: number;
  heroisme: number;
  foi: number;
  pouvoir: number;
  vilenie: number;
  creation: number;
  experience: number;
}
