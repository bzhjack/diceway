export interface BolArmeModel {
  id: number | null;
  user_id?: string | null;
  arme: string;
  type: 'T' | 'M';
  degats: string | null;
  portee: string | null;
  notes: string | null;
}

export interface BolHerosArmeModel {
  id?: number;
  arme_id: number;
  /** Arme équipée — absent pour une arme sans notion d'équipement (mains nues…), qui compte comme équipée. */
  equipee?: boolean;
  arme?: BolArmeModel;
}
