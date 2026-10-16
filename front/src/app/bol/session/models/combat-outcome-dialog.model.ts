import {CombatOutcome} from './combat-turn.model';

/** Données du dialogue de fin de combat : l'issue, et les héros encore mourants qu'on peut secourir avant de terminer. */
export interface CombatOutcomeDialogData {
  readonly outcome: CombatOutcome;
  readonly mourants: readonly string[];
}
