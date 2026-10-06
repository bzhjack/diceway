import {CombatCamp} from '../../models/bol-fight-session.model';

/** Le type de personnage d'une carte du tapis. */
export type TapisKind = 'hero' | 'pnj' | 'creature' | 'demon';

/** Une carte du tapis : une ligne de session (héros, PNJ, créature ou démon), avec sa face déjà
 * calculée. Un lot (`qty > 1`) est une seule carte, avec la vitalité de chaque exemplaire. */
export interface TapisCard {
  /** `{kind}-{pivotId}`, sans index d'exemplaire. */
  readonly key: string;
  readonly kind: TapisKind;
  readonly camp: CombatCamp;
  readonly pivotId: number;
  /** Id de la fiche en bibliothèque — null si elle a été supprimée depuis. */
  readonly sourceId: string | null;
  readonly nom: string;
  readonly avatar: string;
  /** Étiquette de la face : « ×N », « Allié », le rang, ou rien pour un héros. */
  readonly badge: string | null;
  /** Rang en clair (« Coriace »…) — null pour un héros. */
  readonly rang: string | null;
  readonly degats: string;
  readonly defense: string;
  readonly vitaliteCourante: number | null;
  readonly vitaliteMax: number | null;
  /** Vitalité de chaque exemplaire d'un lot — null hors lot. */
  readonly instances: readonly number[] | null;
  readonly qty: number;
}

/** Les cartes du tapis rangées en deux rangs : les présents du haut, les héros et alliés du bas. */
export interface TapisRows {
  /** Rang du haut, « Présents dans la scène ». */
  readonly presents: TapisCard[];
  /** Rang du bas, « Héros et alliés ». */
  readonly heros: TapisCard[];
}

/** Un réglage de vitalité sur une carte dépliée : un par exemplaire pour un lot. */
export interface VitaliteStepper {
  /** Index d'exemplaire à passer à l'API — null pour un PNJ. */
  readonly index: number | null;
  readonly label: string;
  readonly value: number;
}

/** Une statistique de combat de l'en-tête de la carte d'un héros dépliée. */
export interface HeroHeaderStat {
  readonly label: string;
  readonly value: string;
}

/** Une carrière d'un héros et son rang, pour le popover des carrières. */
export interface HeroDetailCarriere {
  readonly label: string;
  readonly value: number;
}

/** Une arme d'un héros pour le popover des armes ; `equipee` dit si elle est proposée à l'attaque. */
export interface HeroDetailArme {
  /** Id de l'arme au catalogue, pour l'équiper. */
  readonly id: number;
  readonly label: string;
  readonly degats: string | null;
  readonly portee: string | null;
  readonly equipee: boolean;
}

/** Un trait d'un héros avec son détail, pour le popover des traits. */
export interface HeroDetailTrait {
  readonly label: string;
  readonly detail: string | null;
  readonly kind: 'avantage' | 'desavantage';
}

/** Informations sur le héros : joueur, région, commentaire, fiche en cours — pour la ligne sous son nom et
 * le popover d'informations. */
export interface HeroDetailInfos {
  readonly joueur: string | null;
  readonly region: string | null;
  readonly commentaire: string | null;
  /** Fiche encore en cours de création (« En cours »). */
  readonly enCours: boolean;
}

/** Une armure d'un héros pour le popover des armures ; `equipee` dit si elle est portée. */
export interface HeroDetailArmure {
  /** Id de l'armure au catalogue, pour l'équiper. */
  readonly id: number;
  readonly label: string;
  readonly protection: string | null;
  readonly malus: string | null;
  readonly categorie: string;
  readonly equipee: boolean;
}

/** Le détail de l'équipement et des carrières d'un héros, pour les popovers de l'en-tête de sa carte. */
export interface HeroDetails {
  readonly traits: readonly HeroDetailTrait[];
  readonly infos: HeroDetailInfos;
  /** Page d'édition de la fiche — null pour un héros sans id. */
  readonly editRoute: readonly [string, string] | null;
  readonly carrieres: readonly HeroDetailCarriere[];
  readonly armes: readonly HeroDetailArme[];
  readonly armures: readonly HeroDetailArmure[];
}
