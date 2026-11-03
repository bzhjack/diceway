import {TapisCard} from './tapis.model';

/** La puissance d'un sort (livre p. 149-153) : 0 pour un charme, puis les trois cercles. */
export type CercleSort = 0 | 1 | 2 | 3;

/** Un dé de foi accorde un dé de bonus, ou impose un dé de malus (livre p. 146). */
export type SensDeFoi = 'bonus' | 'malus';

/** Les points qu'une carte dépense en magie : sa foi (prêtre, druide), son pouvoir (sorcier). */
export type RessourceMagique = 'foi' | 'pouvoir';

/** Un cran de l'échelle des difficultés ; `valeur` est `null` pour « automatique » (un charme, sans jet). */
export interface DifficulteSort {
  readonly slug: string;
  readonly label: string;
  readonly valeur: number | null;
}

/** Ce que le livre dit d'une puissance de sort (table p. 151) : son coût, son coût minimum, ses difficultés habituelles, ses dégâts. */
export interface CercleSortInfo {
  readonly cercle: CercleSort;
  readonly label: string;
  readonly coutBase: number;
  readonly coutMin: number;
  /** Les difficultés que le livre lui donne, la première par défaut. */
  readonly difficultes: readonly string[];
  /** Les dégâts d'un sort de cette puissance destiné à blesser. */
  readonly degats: string;
  /** Les conditions d'incantation du livre, en bref, pour l'infobulle. */
  readonly conditions: string;
}

/** Ce que le MJ règle pour un sort : sa puissance, sa difficulté, les conditions remplies, s'il blesse, s'il touche l'esprit de la cible. */
export interface SortSaisie {
  readonly cercle: CercleSort;
  readonly difficulte: string;
  /** Conditions d'incantation remplies, la première (obligatoire) comprise ; sans objet pour un charme. */
  readonly conditions: number;
  /** Coût d'un charme : 1 ou 2 points. */
  readonly coutCharme: number;
  readonly blessant: boolean;
  /** Le sort agit sur l'esprit de la cible : son esprit est un malus au jet. */
  readonly espritCible: boolean;
}

/** Le coût d'un sort en points de pouvoir : la base de sa puissance, ce que retirent les conditions en plus, le surcoût de l'armure. */
export interface CoutSort {
  readonly base: number;
  readonly reduction: number;
  readonly armure: number;
  readonly total: number;
}

/** Ce qu'il faut savoir de la magie d'une carte : son esprit, sa foi et son pouvoir (`null` : elle n'en a pas), son rang de sorcier
 * (`null` : pas sorcier), le surcoût en pouvoir de son armure, et deux avantages. */
export interface RessourcesMagiques {
  readonly esprit: number;
  readonly foi: number | null;
  readonly pouvoir: number | null;
  readonly sorcier: number | null;
  readonly surcoutArmure: number;
  /** « Magie des Rois-Sorciers » : un dé de bonus pour lancer des sortilèges (livre p. 42). */
  readonly magieRoisSorciers: boolean;
  /** « Résistant à la magie » : visé par un sort, il lance un d6 ; sur 6, le sort est sans effet (livre p. 42). */
  readonly resistantMagie: boolean;
}

/** Des points de foi ou de pouvoir dépensés (négatif) ou rendus par une carte. */
export interface RessourceChange {
  readonly card: TapisCard;
  readonly ressource: RessourceMagique;
  readonly delta: number;
}

/** Ce que la trace « sort payé » de l'état du combat dit d'une carte : les points de pouvoir payés pour son sort de ce round (0 sans trace),
 * les identifiants des traces à retirer quand le sort est remboursé, perdu ou repayé, les réglages du sort (`null` si la trace ne les dit
 * pas) et le libellé de la dernière trace. */
export interface SortPaye {
  readonly points: number;
  readonly ids: readonly string[];
  readonly reglages: SortSaisie | null;
  readonly libelle: string | null;
}
