import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {ActionRollTone} from './action-roll.model';
import {InitiativeKind} from './initiative.model';

/** Ce que la page de démarrage d'un combat lit de sa route : la session (`session/:id/combat`) et `?reroll=1`. */
export interface StartCombatContext {
  readonly sessionId: string;
  /** Nouveau jet de réaction en plein combat : les rounds déjà joués sont conservés. */
  readonly reroll?: boolean;
}

/** Ce qui s'ajoute aux deux dés d'un jet de réaction (02-actions-combat.md) : l'esprit et l'initiative du héros, puis les
 * modificateurs communs à toute la rencontre. */
export interface ReactionParts {
  readonly esprit: number;
  /** Initiative effective : malus de l'équipement compris. */
  readonly initiative: number;
  /** Malus d'initiative de l'équipement (casque), déjà compris dans `initiative` : 0 ou négatif. Montré à part dans l'addition. */
  readonly equipement?: number;
  /** +2 si les héros tendent l'embuscade, −1 s'ils sont surpris, 0 sinon. */
  readonly embuscade: number;
  /** Plus haute initiative des rivaux et coriaces ennemis : elle est retranchée au jet. */
  readonly initiativeEnnemie: number;
  /** Une carrière utile accordée par le MJ : son rang s'ajoute au jet (02-actions-combat.md, « Modificateurs au jet de réaction »). */
  readonly carriere?: {readonly label: string; readonly value: number} | null;
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
  /** La fiche d'où il vient (PNJ, créature ou démon) : les exemplaires d'une même fiche se regroupent dans l'ordre d'action. `null`
   * pour un combattant sans fiche, qui reste seul. */
  readonly sourceId: string | null;
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
  /** Le total du jet de réaction d'un héros qui a lancé ; absent pour un adversaire. */
  readonly total?: number | null;
  /** Le résultat du jet d'un héros ; absent pour un adversaire. */
  readonly resultat?: InitiativeResultat | null;
}

/** Des jetons de l'ordre d'action montrés en un seul médaillon : les exemplaires d'une même fiche, du même camp (cinq « Sergent du
 * guet »), ou un combattant seul. `nom` est celui de la fiche, sans le numéro d'exemplaire. */
export interface ReactionGroup {
  readonly key: string;
  readonly nom: string;
  readonly tokens: readonly ReactionToken[];
}

/** Un bloc de l'ordre d'action : ses combattants, et s'il est bloqué au round 1. `attente` réunit les héros qui n'ont pas lancé. */
export interface ReactionLane {
  readonly id: 'attente' | 'heros' | 'rival' | 'coriace' | 'echec' | 'pietaille' | 'echec_critique';
  readonly title: string;
  readonly blocked: boolean;
  readonly tokens: readonly ReactionToken[];
  /** Les mêmes combattants, regroupés par fiche, dans l'ordre de `tokens` (un héros est toujours seul). */
  readonly groups: readonly ReactionGroup[];
}

/** Un cercle de la frise de l'ordre d'action : un combattant, dans l'ordre où ils jouent. */
export interface ReactionFriseStep {
  readonly token: ReactionToken;
  /** La couleur de son anneau : le résultat du jet d'un héros, sinon son camp. */
  readonly tone: InitiativeResultat | 'adversaire' | 'allie';
  /** Son nom et ce qu'il faut en savoir, en infobulle et pour les lecteurs d'écran. */
  readonly label: string;
  /** Il ne joue pas au round 1. */
  readonly blocked: boolean;
  /** Le trait qui le relie au suivant : court dans un même groupe, long entre deux groupes, aucun pour le dernier. */
  readonly link: 'court' | 'long' | null;
}
