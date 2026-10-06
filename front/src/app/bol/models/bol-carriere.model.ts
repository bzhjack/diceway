/** Une carrière du catalogue, avec sa description. */
export interface BolCarriereModel {
  id?: number;
  carriere: string;
  description: string;
  detail: string;
  donne_langue?: boolean;
}

/** Une carrière d'un personnage et son rang. */
export interface BolHerosCarriereModel {
  id?: number;
  carriere_id?: number;
  value: number;
  carriere?: BolCarriereModel;
}
