/** Une langue du catalogue (`est_lemurienne` : langue de Lémurie). */
export interface BolLangueModel {
  id?: number;
  langue: string;
  description: string;
  est_lemurienne?: boolean;
}

/** Une langue connue d'un personnage. */
export interface BolHerosLangueModel {
  id?: number;
  langue_id: number;
  langue?: BolLangueModel;
}
