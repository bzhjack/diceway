import {BolQuestProtagonistModel} from "./bol-quest.model";

export interface BolCreatureModel {
  id: string | null;
  user_id: string;
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  vitalite: number;
  attaque: number;
  defense: number;
  degats: string;
  protection: string;
  avatar: string | null;
  commentaire: string | null;
  id_taille: number;
  capacites: [
    {
      capacite: BolCreatureCapaciteModel;
      capacite_id: number;
      creature_id: string
      detail: string;
      id: number;
    }
  ],
  taille: BolCreatureTailleModel;
  currentQuest?: BolQuestProtagonistModel;
  type?: 'P' | 'C' | 'R'
}

export interface BolCreatureCapaciteModel {
  id: number;
  capacite: string;
  de_bonus: boolean;
  de_malus: boolean;
  description: string;
  detail?: string;
}

export interface BolCreatureTailleModel {
  id: number;
  taille: string;
  type: 'R' | 'P' | 'C';
  vigueur: number;
  vitalite: number;
  degats: string;
  deplacement: string;
}
