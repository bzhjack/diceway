// Ids des entrées de référence portant des règles spéciales de création BoL.
// Les données viennent des seeders backend (cf. /doc/resources/) ; ces ids sont stables.

/** Alchimiste — au-dessus du rang 2, chaque rang exige un désavantage ; points de création = rang. */
export const CARRIERE_ALCHIMISTE_ID = 1;
/** Prêtre/Druide — points de foi = rang. */
export const CARRIERE_PRETRE_ID = 21;
/** Sorcier — au-dessus du rang 1, chaque rang exige un désavantage ; points de pouvoir = 10 + rang. */
export const CARRIERE_SORCIER_ID = 24;

/** E11 — Non-combattant : budget combat 4 → 2, budget carrières 4 → 6. */
export const DESAVANTAGE_NON_COMBATTANT_ID = 33;

/** E12 — avantages exigeant un désavantage général supplémentaire. */
export const AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID = 30;
export const AVANTAGE_POUVOIR_DU_NEANT_ID = 44;
