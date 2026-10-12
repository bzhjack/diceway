import {PlayToken} from './combat-play.model';
import {InitiativeTierKey} from './initiative.model';
import {TapisCard} from './tapis.model';

/** État d'un combat : le round, les cartes qui ont joué ce round, celles en défense totale, celles exclues. Gardé
 * dans la session (`etat_combat`) ; les clés sont celles des cartes (`{kind}-{pivotId}`). */
export interface EtatCombat {
  readonly round: number;
  readonly joues: readonly string[];
  readonly defense_totale: readonly string[];
  /** Cartes restées sur la table mais exclues de ce combat : elles ne jouent pas et ne sont pas visables. */
  readonly exclus: readonly string[];
}

/** Où en est une carte dans le round : c'est à elle, elle a joué, elle est sautée (hors combat ou
 * bloquée au round 1), ou son tour viendra. */
export type TurnStatus = 'active' | 'played' | 'skipped' | 'upcoming';

/** Une carte à sa place dans l'ordre de jeu : son palier d'initiative et son éventuel blocage au round 1. */
export interface OrderedCard {
  readonly card: TapisCard;
  readonly tier: InitiativeTierKey | null;
  /** Bloquée au round 1 (règle BoL calculée par `buildInitiativeOrderFrom`). */
  readonly lockedRound1: boolean;
}

/** Où en est le tour : le round, la carte active et le statut de chaque carte. */
export interface TurnState {
  readonly round: number;
  readonly activeKey: string | null;
  readonly statuses: ReadonlyMap<string, TurnStatus>;
}

/** Ce qu'il faut savoir d'un combattant pour l'ordonner dans le tour. */
export type TurnToken = Pick<PlayToken, 'kind' | 'pivotId' | 'tier' | 'lockedRound1'>;
