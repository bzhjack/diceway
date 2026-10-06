/** Catégorie d'équipement défensif : une seule pièce peut être équipée par catégorie. */
export type BolArmureCategorie = 'armure' | 'bouclier' | 'casque';

/** Une armure, un bouclier ou un casque du catalogue, avec sa protection et ses malus. */
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

/** Une armure possédée par un personnage, et si elle est équipée. */
export interface BolHerosArmureModel {
  id?: number;
  armure_id: number;
  equipee: boolean;
  armure?: BolArmureModel;
}
