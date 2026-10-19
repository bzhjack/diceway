// Ids des entrées de référence portant des règles spéciales de création BoL.
// Les données viennent des seeders backend (cf. /doc/resources/) ; ces ids sont stables.

/** Alchimiste — au-dessus du rang 2, chaque rang exige un désavantage ; points de création = rang. */
export const CARRIERE_ALCHIMISTE_ID = 1;
/** Prêtre/Druide — points de foi = rang. */
export const CARRIERE_PRETRE_ID = 21;
/** Sorcier — au-dessus du rang 1, chaque rang exige un désavantage ; points de pouvoir = 10 + rang. */
export const CARRIERE_SORCIER_ID = 24;
/** Forgeron — avec l'avantage Maître artisan (Mythic+), points de création = rang. */
export const CARRIERE_FORGERON_ID = 10;
const CARRIERE_MEDECIN_ID = 14;
const CARRIERE_TENTATRICE_ID = 25;

/** E11 — Non-combattant : budget combat 4 → 2, budget carrières 4 → 6. */
export const DESAVANTAGE_NON_COMBATTANT_ID = 33;

/** E12 — avantages exigeant un désavantage général supplémentaire. */
export const AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID = 30;
export const AVANTAGE_POUVOIR_DU_NEANT_ID = 44;

/** Arme favorite — dé de bonus avec l'arme nommée par sa précision (régionale : l'arme régionale). */
export const AVANTAGE_ARME_FAVORITE_ID = 6;

/** Mythic+ — Maître artisan : points de création comme un alchimiste, au rang de forgeron. */
export const AVANTAGE_MAITRE_ARTISAN_ID = 60;
const AVANTAGE_MAINS_GUERISSEUSES_ID = 31;
const AVANTAGE_ENVOUTANT_ID = 62;

/** Avantages qui exigent une carrière : Mains guérisseuses (médecin), Maître artisan et Envoûtant (Mythic+ : forgeron, tentatrice). */
export const CARRIERE_EXIGEE_PAR_AVANTAGE: Readonly<Record<number, number>> = {
  [AVANTAGE_MAINS_GUERISSEUSES_ID]: CARRIERE_MEDECIN_ID,
  [AVANTAGE_MAITRE_ARTISAN_ID]: CARRIERE_FORGERON_ID,
  [AVANTAGE_ENVOUTANT_ID]: CARRIERE_TENTATRICE_ID,
};
