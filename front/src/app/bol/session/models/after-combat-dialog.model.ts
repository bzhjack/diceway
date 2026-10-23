import {ActionRollCarriere} from './action-roll.model';
import {InitiativeKind} from './initiative.model';

/** Un héros qui peut soigner : sa meilleure carrière de soins. */
export interface AfterCombatHealer {
  readonly nom: string;
  readonly carriere: ActionRollCarriere;
}

/** Les traits qui changent la récupération d'après combat (01-creation-heros.md) : Récupération rapide (1 point de plus) et Souffreteux
 * (rien par le repos, seulement par des soins). */
export interface RecoveryTraits {
  readonly recuperationRapide?: boolean;
  readonly souffreteux?: boolean;
}

/** Un blessé du camp des héros à la fin du combat. */
interface AfterCombatWounded extends RecoveryTraits {
  readonly kind: InitiativeKind;
  readonly pivotId: number;
  readonly nom: string;
  readonly vitalite: number;
  readonly vitaliteMax: number;
  /** Vitalité au début du combat : le repos ne rend que la moitié de ce qui a été perdu depuis. */
  readonly vitaliteDepart: number;
  /** Dégâts encaissés à mains nues pendant le combat : ils reviennent en totalité au repos. */
  readonly mainsNues: number;
  /** Pourquoi il est hors combat (« mourant », « stabilisé »…), `null` s'il tient debout. */
  readonly etat: string | null;
}

/** Données du dialogue « Après combat » : les blessés, et les soigneurs possibles. */
export interface AfterCombatDialogData {
  readonly wounded: readonly AfterCombatWounded[];
  readonly healers: readonly AfterCombatHealer[];
}

/** Ce qu'un blessé récupère en tout, repos et soins compris. */
export interface AfterCombatGain {
  readonly kind: InitiativeKind;
  readonly pivotId: number;
  readonly nom: string;
  readonly amount: number;
}
