export interface BolArmureModel {
  id: number | null;
  armure: string;
  protection: string | null;
  malus: string | null;
  pts_de_pouvoir: string | null;
}

export interface BolHerosArmureModel {
  id?: number;
  armure_id: number;
  armure?: BolArmureModel;
}
