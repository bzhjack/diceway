import {TurnStatus} from './combat-turn.model';
import {TapisKind} from './tapis.model';

export interface TurnOrderEntry {
  readonly key: string;
  readonly nom: string;
  readonly kind: TapisKind;
  readonly status: TurnStatus;
}
