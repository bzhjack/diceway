import {CombatEffect} from './combat-effect.model';
import {PlayToken} from './combat-play.model';
import {InitiativeTierKey} from './initiative.model';
import {TapisCard} from './tapis.model';

/** État d'un combat : le round, les cartes qui ont joué ce round, les effets en cours, celles exclues. Gardé
 * dans la session (`etat_combat`) ; les clés sont celles des cartes (`{kind}-{pivotId}`). */
export interface EtatCombat {
  readonly round: number;
  readonly joues: readonly string[];
  /** Effets en cours (postures, défense totale, petit bouclier dépensé…), cf. `combat-effects.util.ts`. */
  readonly effets: readonly CombatEffect[];
  /** Cartes restées sur la table mais exclues de ce combat : elles ne jouent pas et ne sont pas visables. */
  readonly exclus: readonly string[];
  /** Vitalité de chaque carte au début du combat, notée par le serveur au démarrage : le repos d'après combat rend la moitié des
   * points perdus pendant ce combat, pas des blessures plus anciennes. Une carte absente est entrée au maximum. */
  readonly depart: Readonly<Record<string, number>>;
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

/** L'issue d'un combat dont un camp n'a plus personne debout : les adversaires sont tombés, ou les héros et leurs alliés. */
export type CombatOutcome = 'victoire' | 'defaite';
