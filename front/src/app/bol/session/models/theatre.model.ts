import {BolSceneModel} from '../../models/bol-scene.model';
import {TapisCard} from './tapis.model';

/** Où en est une scène de la frise : déjà jouée sur cette table, en cours, ou à venir. */
export type ActeStatut = 'jouee' | 'en-cours' | 'a-venir';

/** Un acte de la frise : une scène du scénario affiché, son numéro dans l'ordre du scénario et son statut. */
export interface SceneActe {
  readonly scene: BolSceneModel;
  readonly numero: number;
  readonly statut: ActeStatut;
}


/** Une valeur d'ambiance (moment, météo, attitude…) avec son libellé et son icône Material. */
export interface AmbianceOption<T> {
  readonly value: T;
  readonly label: string;
  readonly icon: string;
}

/** Le rideau du plateau : ouvert, ou fermé pendant un changement de scène. */
export type RideauEtat = 'ouvert' | 'ferme';

/** D'où part la brûlure : du bas, ou du bord gauche pour une surface large et basse. */
export type RideauSens = 'montant' | 'lateral';

/** Les durées du rideau, en millisecondes : la brûlure, l'effacement du titre, puis la brûlure qui se lève. */
export interface RideauRythme {
  readonly fondu: number;
  readonly effacement: number;
  readonly ouverture: number;
}

/** Le carton du rideau, montré rideau fermé : le titre de la scène qui se charge. */
export interface SceneCarton {
  readonly titre: string;
}

/** Taille d'une carte de personnage : selon son rang. */
export type TroupeTaille = 'rival' | 'coriace' | 'pietaille';

/** Le compte d'un camp dans l'aperçu d'une scène : « 5 alliés », « 12 adversaires ». */
export interface CampCompte {
  readonly allie: boolean;
  readonly texte: string;
}

/** Une carte de la troupe et sa taille. */
export interface TroupeCard {
  readonly card: TapisCard;
  readonly taille: TroupeTaille;
}

/** La brûlure du rideau : le champ de bruit qui décide dans quel ordre la scène brûle, et les deux calques où on la peint
 * (la flamme, puis sa lueur floue). */
export interface RideauBrulure {
  readonly champ: Float32Array;
  readonly largeur: number;
  readonly hauteur: number;
  readonly image: ImageData;
  readonly flamme: CanvasRenderingContext2D;
  readonly lueur: CanvasRenderingContext2D;
}

/** Les braises qui montent devant la brûlure : `front` est la ligne de feu (0 en haut, 1 en bas ; `lateral` : 0 à gauche, 1 à droite), `rate` le nombre de
 * braises par seconde, `alpha` leur opacité. */
export interface RideauBraises {
  front: number;
  lateral: boolean;
  rate: number;
  alpha: number;
  stop(): void;
}
