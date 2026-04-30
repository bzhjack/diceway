export interface BolCarriereModel {
  id?: number;
  carriere: string;
  description: string;
  detail: string;
  donne_langue?: boolean;
}

export interface BolHerosCarriereModel {
  id?: number;
  carriere_id?: number;
  value: number;
  carriere?: BolCarriereModel;
}
