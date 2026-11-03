import {DiceRowDie} from '../../../shared/models/dice-row.model';
import {DwRollSumTerm} from '../../../shared/models/roll-sum.model';
import {ActionDiceTargetLabel, ActionRollTone} from './action-roll.model';
import {TapisCard} from './tapis.model';

/** Un choix sur l'échelle des postures : son nom, ce qu'il change à l'attaque et à la défense, sa note. */
export interface PostureChoice {
  readonly slug: string;
  readonly name: string;
  readonly effect: string;
  readonly hint: string;
}

/** Un mode du combat à deux armes, et s'il est interdit pour l'instant. */
export interface DualChoice {
  readonly slug: string;
  readonly name: string;
  readonly hint: string;
  readonly interdit: boolean;
}

/** Les popovers de l'assistant : les effets en cours de l'attaquant. */
export type TurnPopover = 'effets';

/** Où en est une des trois cases du coup : pas encore son tour, à jouer, ou faite. */
export type StationState = 'todo' | 'cur' | 'done';

/** Un chiffre de combat et son libellé : dans la ligne de l'attaquant, ou en tuile sur la fiche de la cible. */
export interface StatTile {
  readonly label: string;
  readonly value: string;
  /** Les réglages du coup améliorent (`up`) ou dégradent (`down`) ce chiffre ; `hot` : des dégâts. */
  readonly tone?: 'up' | 'down' | 'hot';
  /** D'où vient le chiffre, en infobulle. */
  readonly hint?: string;
  /** Ce que le chiffre ne dit pas (le dé de bonus de l'arme favorite) : une étoile au coin de la tuile le signale, l'infobulle le dit, et
   * un lecteur d'écran le lit. */
  readonly note?: string;
  /** Le dé qui peut remplacer le chiffre (protection « d6−2 »), en petit sous lui. */
  readonly sub?: string;
}

/** Ce qu'il faut aux dés pour toucher, et les chances d'y arriver. */
export interface AttackGoal extends ActionDiceTargetLabel {
  readonly chance: number;
}

/** Le verdict du jet d'attaque : son titre, l'écart au seuil, sa couleur. */
export interface AttackVerdict {
  readonly title: string;
  readonly detail: string;
  readonly tone: ActionRollTone;
}

/** La barre de vie d'une carte, en pourcentages : ce qu'il lui reste, et ce que le coup en cours va lui retirer. */
export interface LifeBar {
  readonly rest: number;
  readonly loss: number;
  readonly low: boolean;
}

/** Les cibles possibles d'une même fiche (les squelettes ensemble) : leur nom commun, leur camp, et leurs chances quand ce sont les mêmes
 * pour toutes ; chacune avec son numéro et sa vie. */
export interface TargetGroup {
  readonly key: string;
  readonly nom: string;
  readonly foe: boolean;
  readonly odds: string | null;
  readonly members: readonly TargetMember[];
}

export interface TargetMember {
  readonly card: TapisCard;
  /** Son numéro d'exemplaire (« 3 » pour « Squelette #3 »). */
  readonly num: string;
  readonly life: LifeBar;
  /** Ses chances, quand ce ne sont pas celles du groupe. */
  readonly odds: string | null;
}

/** Le coup joué, figé quand il se conclut (dégâts appliqués, parade, bouclier humain) : les lignes du coup et de l'attaque le montrent
 * jusqu'à la fin du tour, même quand la cible, tombée, n'est plus à viser. */
export interface PlayedAttack {
  readonly target: TapisCard;
  /** L'arme choisie, `null` pour une carte qui frappe avec ses seuls dégâts. */
  readonly arme: string | null;
  readonly degats: string;
  readonly options: readonly string[];
  readonly goal: AttackGoal | null;
  readonly dice: readonly DiceRowDie[] | null;
  readonly total: number | null;
  readonly slots: number;
  readonly sum: readonly DwRollSumTerm[];
  readonly verdict: AttackVerdict;
  /** Les options prises sur un succès héroïque ou légendaire, en clair. */
  readonly picks: string | null;
}

/** Ce qu'il faut savoir du coup pour dire si une option de succès héroïque est possible : qui frappe, qui est visé, et si la cible tient une
 * arme (`undefined` : on ne sait pas). */
export interface OptionHeroiqueContexte {
  readonly attaquant: TapisCard;
  readonly cible: TapisCard | null;
  readonly cibleArme: boolean | undefined;
}
