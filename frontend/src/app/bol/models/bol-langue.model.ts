export interface BolLangueModel {
  id?: number;
  langue: string;
  description: string;
}

export interface BolHerosLangueModel {
  id?: number,
  langue_id?: number,
  langue?: BolLangueModel,
}
