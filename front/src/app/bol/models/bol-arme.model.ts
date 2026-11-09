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
  /** Ignore les boucliers de la cible (le fléau, livre p. 50). */
  ignore_bouclier?: boolean;
  /** Peut assommer sans tuer, au choix de l'attaquant (le gourdin, livre p. 50). */
  non_letal?: boolean;
  /** Rounds complets pour la recharger après un tir (l'arbalète : 1, l'arbalète lourde : 2) ; `null` ou absent : aucun. */
  rechargement?: number | null;
}

/** Une arme possédée par un personnage, et si elle est équipée. */
export interface BolHerosArmeModel {
  id?: number;
  arme_id: number;
  /** Arme équipée — absent pour une arme sans notion d'équipement (mains nues…), qui compte comme équipée. */
  equipee?: boolean;
  arme?: BolArmeModel;
}
