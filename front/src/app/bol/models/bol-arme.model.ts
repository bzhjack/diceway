/** Une arme du catalogue : dégâts, portée et type (`M` mêlée, `T` tir). */
export interface BolArmeModel {
  id: number | null;
  user_id?: string | null;
  arme: string;
  type: 'T' | 'M';
  degats: string | null;
  portee: string | null;
  notes: string | null;
  /** Se tient à deux mains : elle ne peut pas servir en combat à deux armes. Absent pour ce qui n'est pas une arme du catalogue (mains nues, copie d'un PNJ à la table). */
  deux_mains?: boolean;
}

/** Une arme possédée par un personnage, et si elle est équipée. */
export interface BolHerosArmeModel {
  id?: number;
  arme_id: number;
  /** Arme équipée — absent pour une arme sans notion d'équipement (mains nues…), qui compte comme équipée. */
  equipee?: boolean;
  arme?: BolArmeModel;
}
