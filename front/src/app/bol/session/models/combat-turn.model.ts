import {PlayToken} from './combat-play.model';
import {InitiativeTierKey} from './initiative.model';
import {TapisCard} from './tapis.model';

/** État d'un combat : le round, les cartes qui ont joué ce round, celles en défense totale. Gardé
 * dans la session (`etat_combat`) ; les clés sont celles des cartes (`{kind}-{pivotId}`). */
export interface EtatCombat {
  readonly round: number;
  readonly joues: readonly string[];
  readonly defense_totale: readonly string[];
}

/** Où en est une carte dans le round : c'est à elle, elle a joué, elle est sautée (hors combat ou
 * bloquée au round 1), ou son tour viendra. */
export type TurnStatus = 'active' | 'played' | 'skipped' | 'upcoming';

export interface OrderedCard {
  readonly card: TapisCard;
  readonly tier: InitiativeTierKey | null;
  /** Bloquée au round 1 (règle BoL calculée par `buildInitiativeOrderFrom`). */
  readonly lockedRound1: boolean;
}

export interface TurnState {
  readonly round: number;
  readonly activeKey: string | null;
  readonly statuses: ReadonlyMap<string, TurnStatus>;
}

/** Ce qu'une carte affiche de l'état du combat. */
export interface CardCombatState {
  readonly status: TurnStatus;
  readonly targetable: boolean;
  readonly defenseTotale: boolean;
  readonly out: boolean;
  readonly locked: boolean;
}

export type TurnToken = Pick<PlayToken, 'kind' | 'pivotId' | 'tier' | 'lockedRound1'>;
