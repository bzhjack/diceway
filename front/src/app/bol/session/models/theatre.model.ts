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

/** Taille d'une carte sur le plateau : selon le rang dans la troupe, plus petite pour un allié. */
export type TroupeTaille = 'rival' | 'coriace' | 'pietaille' | 'allie';

/** Une carte de la troupe et sa taille. */
export interface TroupeCard {
  readonly card: TapisCard;
  readonly taille: TroupeTaille;
}

/** Un portrait de la distribution d'une scène, pour son aperçu : nom, avatar et nombre d'exemplaires. */
export interface ScenePortrait {
  readonly nom: string;
  readonly avatar: string | null;
  readonly qty: number;
}
