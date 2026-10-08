import {TurnStatus} from './combat-turn.model';
import {InitiativeTierKey} from './initiative.model';
import {TapisKind} from './tapis.model';

/** Un combattant de la frise d'initiative : qui il est, son rang de réaction et où il en est dans le round. */
export interface TurnOrderEntry {
  readonly key: string;
  readonly nom: string;
  readonly kind: TapisKind;
  readonly avatar: string;
  readonly status: TurnStatus;
  /** Rang de réaction (8 paliers BoL) ; `null` pour un héros dont le jet n'est pas encore connu. */
  readonly tier: InitiativeTierKey | null;
  /** Bloqué au round 1 (un héros a obtenu un succès héroïque ou mieux). */
  readonly locked: boolean;
}

/** Un bloc de la frise : un ou plusieurs rangs de réaction regroupés sous un titre. */
export interface TurnOrderGroup {
  readonly id: string;
  readonly title: string;
  readonly entries: readonly TurnOrderEntry[];
  readonly blocked: boolean;
}
