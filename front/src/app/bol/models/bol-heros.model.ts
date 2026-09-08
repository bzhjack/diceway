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
  equipement_effectif: BolEquipementEffectifModel;
  traits: BolHerosTraitsModel[];
  carrieres: BolHerosCarriereModel[];
  langues?: BolHerosLangueModel[] | number[];
  armures: BolHerosArmureModel[] | number[];
  armes: BolHerosArmeModel[] | number[];
}

export interface BolHerosCombat {
  initiative: number;
  initiative_effective: number;
  melee: number;
  tir: number;
  defense: number;
  defense_effective: number;
}

export interface BolHerosAttributs {
  vigueur: number;
  agilite: number;
  agilite_effective: number;
  esprit: number;
  aura: number;
}

/** Malus défensif du petit bouclier ("-1 à une attaque subie par round") — le grand bouclier est
 * déjà replié dans `combat.defense_effective`, il n'apparaît pas ici. */
export interface BolEquipementEffectifModel {
  bouclier_malus_attaque_subie: number;
  bouclier_malus_attaque_subie_portee: 'une' | 'toutes' | null;
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
