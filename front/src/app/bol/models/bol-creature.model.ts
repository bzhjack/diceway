/** Une créature du bestiaire : attributs, vitalité, attaque, taille et capacités. */
export interface BolCreatureModel {
  id: string | null;
  user_id: string | null;
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
  capacites: {
    capacite: BolCreatureCapaciteModel;
    capacite_id: number;
    creature_id: string;
    detail: string;
    id: number;
  }[];
  taille: BolCreatureTailleModel;
  type?: 'P' | 'C' | 'R';
  rang?: 'rival' | 'coriace' | 'pietaille';
}

/** Capacité spéciale d'une créature, avec ses éventuels dés de bonus ou de malus. */
export interface BolCreatureCapaciteModel {
  id: number;
  capacite: string;
  de_bonus: boolean;
  de_malus: boolean;
  description: string;
  detail?: string;
}

/** Taille d'une créature (référentiel) : vigueur, vitalité, dégâts et déplacement de base. */
export interface BolCreatureTailleModel {
  id: number;
  taille: string;
  type: 'R' | 'P' | 'C';
  vigueur: number;
  vitalite: number;
  degats: string;
  deplacement: string;
}
