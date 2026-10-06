import {BolHerosCarriereModel} from "./bol-carriere.model";
import {BolHerosArmureModel} from "./bol-armure.model";
import {BolHerosArmeModel} from "./bol-arme.model";
import {BolHerosTraitsModel} from "./bol-trait.model";
import {BolHerosLangueModel} from "./bol-langue.model";
import {BolRegionModel} from "./bol-region.model";

/** Une fiche de personnage telle que l'API la renvoie : un héros ou un PNJ (même modèle, distingués par
 * `type`), avec ses attributs, son combat, ses ressources, son équipement, ses traits et ses carrières. */
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

/** Valeurs de combat d'un personnage ; les valeurs `*_effective` incluent les malus de l'équipement. */
export interface BolHerosCombat {
  initiative: number;
  initiative_effective: number;
  melee: number;
  tir: number;
  defense: number;
  defense_effective: number;
}

/** Les quatre attributs d'un personnage ; `agilite_effective` inclut le malus des armures. */
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

/** Identité d'un personnage : nom, joueur, région d'origine, avatar et langues. */
export interface BolHerosOrigines {
  nom: string | null;
  joueur: string | null;
  commentaire?: string | null;
  region_id: number | null;
  region?: BolRegionModel | null;
  avatar: string | null;
  langues: BolHerosLangueModel[] | number[];
}

/** Compteurs d'un personnage : vitalité, héroïsme, foi, pouvoir, vilenie, points de création et
 * d'expérience. */
export interface BolHerosRessources {
  vitalite: number;
  heroisme: number;
  foi: number;
  pouvoir: number;
  vilenie: number;
  creation: number;
  experience: number;
}
