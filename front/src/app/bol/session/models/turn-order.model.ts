import {TurnStatus} from './combat-turn.model';
import {TapisKind} from './tapis.model';

/** Une pastille de la bande d'ordre de jeu : le personnage et où il en est dans le round. */
export interface TurnOrderEntry {
  readonly key: string;
  readonly nom: string;
  readonly kind: TapisKind;
  readonly status: TurnStatus;
}
