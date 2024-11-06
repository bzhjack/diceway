export interface BolCarriereModel {
  id?: number;
  carriere: string;
  description: string;
  detail: string;
}

export interface BolHerosCarriereModel {
  id?: number;
  carriere_id?: number;
  value: number;
  carriere?: BolCarriereModel;
}
