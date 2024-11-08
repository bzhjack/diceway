import {BolQuestProtagonistModel} from "./bol-quest.model";

export interface BolDemonModel {
  id: string | null;
  user_id: string;
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

  pouvoirs: [
    {
      pouvoir: BolDemonPouvoirModel;
      pouvoir_id: number;
      demon_id: string;
      detail: string;
      id: number;
    }
  ];
  categorie: BolDemonCategorieModel;
  currentQuest?: BolQuestProtagonistModel;
  type?: 'P' | 'C' | 'R'
}

export interface BolDemonPouvoirModel {
  id: number;
  pouvoir: string;
  description: string;
  detail?: string;
}

export interface BolDemonCategorieModel {
  id: number;
  categorie: string;
  type: 'P' | 'C' | 'R';
  pouvoirs: number;
  vitalite: number;
  degats: string;
}
