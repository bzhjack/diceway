export type CombatCamp = 'heros' | 'adversaires';

export interface BolFightSessionModel {
  id: string | null;
  user_id?: string | null;
  titre: string | null;
  statut: string;
  heros?: BolFightSessionHerosModel[];
  creatures?: BolFightSessionCreatureModel[];
  demons?: BolFightSessionDemonModel[];
  pnjs?: BolFightSessionPnjModel[];
}

export interface BolFightSessionHerosModel {
  id: number;
  fight_session_id: string;
  heros_id: string;
  camp: CombatCamp;
  heros?: {
    id: string | null;
    origines: {nom: string | null; avatar: string | null; joueur: string | null};
    ressources?: {vitalite: number; heroisme: number};
  };
}

export interface BolFightSessionCapaciteModel {
  capacite_id: number;
  capacite: string | null;
  de_bonus: boolean;
  de_malus: boolean;
  detail: string | null;
}

export interface BolFightSessionCreatureModel {
  id: number;
  fight_session_id: string;
  creature_id: string | null;
  camp: CombatCamp;
  qty: number;
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
  capacites: BolFightSessionCapaciteModel[] | null;
}

export interface BolFightSessionPouvoirModel {
  pouvoir_id: number;
  pouvoir: string | null;
  detail: string | null;
}

export interface BolFightSessionDemonModel {
  id: number;
  fight_session_id: string;
  demon_id: string | null;
  camp: CombatCamp;
  qty: number;
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
  pouvoirs: BolFightSessionPouvoirModel[] | null;
}

export interface BolFightSessionArmeModel {
  nom: string | null;
  degats: string | null;
  type: 'M' | 'T' | null;
}

export interface BolFightSessionPnjModel {
  id: number;
  fight_session_id: string;
  pnj_id: string | null;
  camp: CombatCamp;
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
  armes: BolFightSessionArmeModel[] | null;
}

/** Payload d'envoi pour créer une fight-session (les stats sont snapshotées côté back). */
export interface BolFightSessionCreatePayload {
  titre?: string | null;
  heros: {heroId: string; camp: CombatCamp}[];
  pnjs: {pnjId: string; camp: CombatCamp}[];
  creatures: {creatureId: string; camp: CombatCamp; qty: number}[];
  demons: {demonId: string; camp: CombatCamp; qty: number}[];
}
