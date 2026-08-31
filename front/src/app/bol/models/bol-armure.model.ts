export type BolArmureCategorie = 'armure' | 'bouclier' | 'casque';

export interface BolArmureModel {
  id: number | null;
  user_id?: string | null;
  armure: string;
  protection: string | null;
  malus: string | null;
  pts_de_pouvoir: string | null;
  categorie: BolArmureCategorie;
  malus_agilite: number;
  malus_initiative: number;
  malus_attaque_subie: number;
  malus_attaque_subie_portee: 'une' | 'toutes' | null;
}

export interface BolHerosArmureModel {
  id?: number;
  armure_id: number;
  equipee: boolean;
  armure?: BolArmureModel;
}
