import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {ActionRollTone} from './action-roll.model';
import {InitiativeKind} from './initiative.model';

/** Données du dialogue de démarrage d'un combat. */
export interface StartCombatDialogData {
  readonly sessionId: string;
  /** Nouveau jet de réaction en plein combat : les rounds déjà joués sont conservés. */
  readonly reroll?: boolean;
}

/** Ce qui s'ajoute aux deux dés d'un jet de réaction (02-actions-combat.md) : l'esprit et l'initiative du héros, puis les
 * modificateurs communs à toute la rencontre. */
export interface ReactionParts {
  readonly esprit: number;
  readonly initiative: number;
  /** +2 si les héros tendent l'embuscade, −1 s'ils sont surpris, 0 sinon. */
  readonly embuscade: number;
  /** Plus haute initiative des rivaux et coriaces ennemis : elle est retranchée au jet. */
  readonly initiativeEnnemie: number;
}

/** Le verdict d'un jet de réaction : son titre, ce qu'il change au combat, et sa couleur. */
export interface ReactionVerdict {
  readonly title: string;
  readonly detail: string;
  readonly tone: ActionRollTone;
}

/** Un héros qui participe au combat, tel que l'ordre d'action en a besoin. */
export interface ReactionHero {
  readonly pivotId: number;
  readonly nom: string;
  readonly avatar: string | null;
  /** `null` tant qu'il n'a pas lancé. */
  readonly resultat: InitiativeResultat | null;
  /** Total de son jet (dés et modificateurs) — `null` s'il n'est pas connu. */
  readonly total: number | null;
}

/** Un PNJ, une créature ou un démon : pas de jet de réaction, son rang le place dans l'ordre d'action. */
export interface ReactionAdversary {
  readonly pivotId: number;
  readonly kind: Exclude<InitiativeKind, 'hero'>;
  readonly nom: string;
  readonly avatar: string | null;
  readonly rang: 'rival' | 'coriace' | 'pietaille';
  /** Dans le camp des héros. */
  readonly ally: boolean;
  /** Exclu de ce combat : il reste sur la table, mais ne joue pas. */
  readonly excluded: boolean;
}

/** Un jeton de l'ordre d'action : un médaillon, dont l'infobulle donne le nom et le détail. */
export interface ReactionToken {
  readonly kind: InitiativeKind;
  readonly pivotId: number;
  readonly nom: string;
  readonly avatar: string | null;
  /** Précision derrière le nom : « total 14 · légendaire » pour un héros qui a lancé, « allié » pour un allié des héros. Vide sinon. */
  readonly detail: string;
  readonly excluded: boolean;
}

/** Un bloc de l'ordre d'action : ses combattants, et s'il est bloqué au round 1. `attente` réunit les héros qui n'ont pas lancé. */
export interface ReactionLane {
  readonly id: 'attente' | 'heros' | 'rival' | 'coriace' | 'echec' | 'pietaille' | 'echec_critique';
  readonly title: string;
  readonly blocked: boolean;
  readonly tokens: readonly ReactionToken[];
}
