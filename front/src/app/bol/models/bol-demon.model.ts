import {BolCreatureTailleModel} from './bol-creature.model';
import {BolFicheScenario} from './bol-fiche-scenario.model';

/** Un démon : attributs, vitalité, dégâts et pouvoirs. */
export interface BolDemonModel {
  id: string | null;
  user_id: string | null;
  nom: string;
  avatar: string | null;
  commentaire: string | null;

  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;

  vitalite: number;

  melee: number;
  tir: number;
  defense: number;
  degats: string;

  id_categorie: number;
  /** Sa taille (`bol_taille`), Moyenne par défaut : elle compte en combat (renversement, poison). */
  id_taille: number;

  pouvoirs: {
    pouvoir: BolDemonPouvoirModel;
    pouvoir_id: number;
    demon_id: string;
    detail: string;
    id: number;
  }[];
  categorie: BolDemonCategorieModel;
  taille?: BolCreatureTailleModel;
  type?: 'P' | 'C' | 'R';
  /** Les scénarios du compte qui l'ont créé ou le citent (liste des démons seulement). */
  scenarios?: BolFicheScenario[]
}

/** Pouvoir d'un démon. */
export interface BolDemonPouvoirModel {
  id: number;
  pouvoir: string;
  description: string;
  detail?: string;
}

/** Catégorie de démon (référentiel) : rang, nombre de pouvoirs, vitalité et dégâts. */
export interface BolDemonCategorieModel {
  id: number;
  categorie: string;
  type: 'P' | 'C' | 'R';
  pouvoirs: number;
  vitalite: number;
  degats: string;
}
