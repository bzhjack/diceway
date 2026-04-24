export interface BolScenarioModel {
  id: string | null;
  user_id?: string | null;
  titre: string;
  pitch: string | null;
  pj?: BolScenarioPjModel[];
  creatures?: BolScenarioCreatureModel[];
  demons?: BolScenarioDemonModel[];
  pnjs?: BolScenarioPnjModel[];
}

export interface BolScenarioCapaciteModel {
  capacite_id: number;
  capacite: string | null;
  de_bonus: boolean;
  de_malus: boolean;
  detail: string | null;
}

export interface BolScenarioCreatureModel {
  id: number;
  scenario_id: string;
  creature_id: string | null;
  surnom: string | null;
  rang: 'rival' | 'coriace' | 'pietaille';
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  vitalite_max: number;
  vitalite_courante: number;
  attaque: number;
  defense: number;
  degats: string | null;
  protection: string | null;
  id_taille: number;
  capacites: BolScenarioCapaciteModel[] | null;
}

export interface BolScenarioPouvoirModel {
  pouvoir_id: number;
  pouvoir: string | null;
  detail: string | null;
}

export interface BolScenarioDemonModel {
  id: number;
  scenario_id: string;
  demon_id: string | null;
  surnom: string | null;
  rang: 'rival' | 'coriace' | 'pietaille';
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  melee: number;
  tir: number;
  defense: number;
  vitalite_max: number;
  vitalite_courante: number;
  degats: string | null;
  pouvoirs: BolScenarioPouvoirModel[] | null;
}

export interface BolScenarioPnjArmeModel {
  nom: string | null;
  degats: string | null;
  type: 'M' | 'T' | null;
}

export interface BolScenarioPnjModel {
  id: number;
  scenario_id: string;
  pnj_id: string | null;
  surnom: string | null;
  rang: 'rival' | 'coriace' | 'pietaille';
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  melee: number;
  tir: number;
  defense: number;
  vitalite_max: number;
  vitalite_courante: number;
  armes: BolScenarioPnjArmeModel[] | null;
}

export interface BolScenarioPjModel {
  id: number;
  scenario_id: string;
  heros_id: string;
  heros?: {
    id: string | null;
    origines: {nom: string | null; avatar: string | null; joueur: string | null};
    ressources?: {vitalite: number};
    combat?: {defense: number};
  };
}
