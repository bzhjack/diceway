// Ids des entrées de référence portant des règles spéciales de création BoL.
// Les données viennent des seeders backend (cf. /doc/bol/resources/) ; ces ids sont stables.

/** Alchimiste — au-dessus du rang 2, chaque rang exige un désavantage ; points de création = rang. */
export const CARRIERE_ALCHIMISTE_ID = 1;
/** Prêtre/Druide — points de foi = rang. */
export const CARRIERE_PRETRE_ID = 21;
/** Sorcier — au-dessus du rang 1, chaque rang exige un désavantage ; points de pouvoir = 10 + rang. */
export const CARRIERE_SORCIER_ID = 24;
/** Forgeron — avec l'avantage Maître artisan (Mythic+), points de création = rang. */
export const CARRIERE_FORGERON_ID = 10;
/** Médecin (guérisseur, rebouteux) — sa carrière soigne et secourt. */
export const CARRIERE_MEDECIN_ID = 14;
const CARRIERE_TENTATRICE_ID = 25;

/** E11 — Non-combattant : budget combat 4 → 2, budget carrières 4 → 6. */
export const DESAVANTAGE_NON_COMBATTANT_ID = 33;

/** E12 — avantages exigeant un désavantage général supplémentaire. */
export const AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID = 30;
export const AVANTAGE_POUVOIR_DU_NEANT_ID = 44;

/** Peau dure — +1 en protection, même sans armure. */
export const AVANTAGE_PEAU_DURE_ID = 39;

/** Armure lourde (catalogue, catégorie `armure`) — interdite avec une vigueur négative (livre p. 52). */
export const ARMURE_LOURDE_ID = 4;

/** Illettré — « vous ne savez ni lire ni écrire, et ne pouvez pas choisir de carrière exigeant d'être lettré » (livre p. 44). */
export const DESAVANTAGE_ILLETTRE_ID = 17;
/** Carrières que le livre dit lettrées, et elles seules : « les carrières spécifiquement désignées comme étant des carrières de lettré
 * (scribe, médecin, alchimiste, prêtre, etc.) » (p. 47, Déchiffrer un texte). Le sorcier n'y est pas : il n'en serait que par déduction
 * (carrière interdite aux Céruléens, sans écriture, p. 21), qui ne suffit pas à bloquer un illettré. */
export const CARRIERES_LETTREES: readonly number[] = [
  CARRIERE_ALCHIMISTE_ID, // p. 47
  CARRIERE_MEDECIN_ID, // p. 47 ; p. 32 : « tous se doivent bien sûr de savoir lire et écrire »
  CARRIERE_PRETRE_ID, // p. 47 ; p. 36 : « ce sont des lettrés »
  22, // Scribe — p. 47 ; p. 36 : « il va sans dire que les scribes savent lire et écrire »
];

/** Récupération rapide — 1 point de vitalité de plus récupéré après un combat. */
export const AVANTAGE_RECUPERATION_RAPIDE_ID = 45;
/** Souffreteux — ne récupère sa vitalité que par des soins médicaux, jamais par le repos. */
export const DESAVANTAGE_SOUFFRETEUX_ID = 41;

/** Vigilant — un dé de bonus au jet de réaction. */
export const AVANTAGE_VIGILANT_ID = 56;
/** Lent à la détente — un dé de malus au jet de réaction. */
export const DESAVANTAGE_LENT_A_LA_DETENTE_ID = 24;

/** Arme favorite — dé de bonus avec l'arme nommée par sa précision (régionale : l'arme régionale). */
export const AVANTAGE_ARME_FAVORITE_ID = 6;

/** Armes régionales (Mythic+) : seul un héros de leur région peut en faire son arme favorite. Région = `bol_region.id`. */
export const ARMES_REGIONALES: readonly {readonly arme: string; readonly regionId: number; readonly region: string}[] = [
  {arme: 'Kriss', regionId: 3, region: 'Halakh'},
  {arme: 'Khastok', regionId: 7, region: 'Malakut'},
  {arme: 'Fronde de l’Axos', regionId: 10, region: 'Montagnes de l’Axos'},
  {arme: 'Hache d’abordage de Parsool', regionId: 12, region: 'Parsool'},
  {arme: 'Arc de guerre de Tyrus', regionId: 17, region: 'Tyrus'},
  {arme: 'Épée valgardienne', regionId: 19, region: 'Valgard'},
];

/** Carrières réservées à une origine : seuls les Satarlans peuvent être pilotes des airs (livre p. 21). Région = `bol_region.id`. */
export const CARRIERES_RESERVEES: readonly {readonly carriereId: number; readonly regionId: number; readonly region: string}[] = [
  {carriereId: 20, regionId: 14, region: 'Satarla'},
];

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
