import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {TurnStatus} from './combat-turn.model';

/** La couleur de l'anneau d'un médaillon : le résultat du jet de réaction d'un héros (`attente` s'il n'a pas lancé), sinon son camp. */
export type OrdreFriseTone = InitiativeResultat | 'attente' | 'adversaire' | 'allie';

/** Un médaillon de la frise de l'ordre d'action, dans l'ordre où les combattants jouent. */
export interface OrdreFriseStep {
  readonly key: string;
  /** Son nom : l'initiale remplace le portrait qui manque. */
  readonly nom: string;
  readonly avatar: string | null;
  /** Un héros est un carré arrondi ; les autres sont des cercles. */
  readonly hero: boolean;
  readonly tone: OrdreFriseTone;
  /** Son nom accessible : ce qu'il faut en savoir pour un lecteur d'écran. */
  readonly label: string;
  readonly tooltip: string;
  /** Le trait qui le relie au suivant : court dans un même groupe, long entre deux groupes, aucun pour le dernier. */
  readonly link: 'court' | 'long' | null;
  /** Il ne joue pas au round 1 : anneau en pointillés, médaillon hachuré. */
  readonly blocked: boolean;
  /** Un clic sur le médaillon fait quelque chose (`stepClicked`) ; sinon ce n'est pas un bouton. */
  readonly clickable: boolean;
  /** L'état d'un médaillon bascule (`aria-pressed`) ; `null` pour un simple bouton. */
  readonly pressed: boolean | null;
  /** Où il en est dans le round, pendant le combat ; `null` avant. */
  readonly status: TurnStatus | null;
  /** Visé par le tour en cours : cerclé de rouge. */
  readonly target: boolean;
  /** Hors de combat : éteint, anneau en pointillés. */
  readonly down: boolean;
  /** Porte des effets : un point doré au coin. */
  readonly effects: boolean;
  /** Exclu de ce combat : éteint et barré, à sa place, pour pouvoir le réintégrer. */
  readonly excluded: boolean;
}
