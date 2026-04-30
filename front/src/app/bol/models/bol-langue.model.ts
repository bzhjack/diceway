export interface BolLangueModel {
  id?: number;
  langue: string;
  description: string;
  est_lemurienne?: boolean;
}

export interface BolHerosLangueModel {
  id?: number;
  langue_id: number;
  langue?: BolLangueModel;
}
