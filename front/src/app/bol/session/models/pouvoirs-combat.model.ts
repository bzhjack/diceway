import {TapisCard} from './tapis.model';

/** Un pouvoir de démon tel que la table le recopie (`bol_fight_session_demon.pouvoirs`). Les drapeaux de combat manquent aux copies faites
 * avant qu'on les recopie : le nom du pouvoir en tient lieu. */
export interface PouvoirCopie {
  readonly pouvoir: string | null;
  readonly detail: string | null;
  readonly regeneration?: boolean;
  readonly intangible?: boolean;
  /** Pouvoir à prévenir en combat (Poison, Intangible). */
  readonly avertissement_combat?: boolean;
}

/** Ce que les pouvoirs d'un démon changent en combat (04-pnj-creatures-demons.md, « Pouvoirs démoniaques »). */
export interface CardPouvoirs {
  /** Régénération : +1 de vitalité à chaque round ; un coup précis s'en va au bout de 2 rounds. */
  readonly regeneration: boolean;
  /** Intangible : seules la sorcellerie et l'alchimie le blessent. */
  readonly intangible: boolean;
  /** Poison : son contact paralyse une créature de taille moyenne ou moins. */
  readonly poison: boolean;
  /** Vulnérabilité : l'élément qui lui fait des dégâts doublés (le détail du pouvoir, `null` s'il n'est pas dit) ; `null` sans faiblesse. */
  readonly vulnerabilite: {readonly element: string | null} | null;
  /** Les pouvoirs à prévenir en combat (`avertissement_combat`), par leur nom ; la vulnérabilité a sa propre ligne. */
  readonly avertissements: readonly string[];
}

/** Ce qu'un démon qui se régénère retrouve au début d'un round : sa carte, et sa vitalité une fois le point repris. */
export interface Regeneration {
  readonly card: TapisCard;
  readonly vitalite: number;
}
