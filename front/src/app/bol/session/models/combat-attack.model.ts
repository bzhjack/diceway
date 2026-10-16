import {TapisCard} from './tapis.model';

/** Dé de dégâts d'une arme ou d'une créature : d3, d6, d6 de malus (garder le moins bon de 2d6) ou de bonus. */
export type DamageDie = 'd3' | 'd6' | 'd6m' | 'd6b';

/** Des dégâts lus en entier : un dé, multiplié pour les grandes créatures (« d6Bx2 »), avec un modificateur (« d6-2 ») — ou une valeur
 * fixe (« 1 »), sans jet. */
export interface DamageSpec {
  readonly die: DamageDie;
  /** 1, ou 2 à 4 pour les grandes créatures : le résultat du dé est multiplié. */
  readonly multiplier: number;
  readonly modifier: number;
  /** Dégâts fixes, sans jet de dé ; `null` quand il y a un dé à lancer. */
  readonly fixed: number | null;
}

/** Stats de combat entièrement résolues (héros récupéré en direct si besoin), prêtes à préremplir le dialog d'attaque. */
export interface ResolvedCombatStats {
  /** Agilité effective : équipement compris. */
  readonly agilite: number;
  /** Malus d'agilité de l'équipement porté (armure, grand bouclier), déjà compris dans `agilite` : 0 ou négatif. */
  readonly equipementAgilite?: number;
  readonly vigueur: number;
  readonly melee: number;
  readonly tir: number;
  /** Bonus d'attaque combiné des créatures (remplace agilité+mêlée). */
  readonly attaque: number | null;
  readonly defense: number;
  readonly degats: string;
  readonly protection: number;
  /** Protection telle que le livre l'écrit (« d6-1 (3) », avec « +1 » si un casque est équipé) ; `null` sans protection. */
  readonly protectionText: string | null;
  /** Malus du petit bouclier ("-1 à une attaque subie par round") — 0 si absent ou déjà replié
   * dans `defense` (cas du grand bouclier, portée "toutes"). Consommé manuellement par le dialog
   * d'attaque, l'app ne suivant pas de round. */
  readonly bouclierMalusUneAttaque: number;
  /** Ce qu'un grand bouclier ajoute déjà à `defense` : retranché quand la carte perd le bénéfice de son bouclier. */
  readonly bouclierDefenseToutes: number;
  /** null pour pnj/créature/démon — l'héroïsme (Faveur divine, options héroïques) n'existe que pour un héros. */
  readonly herosId: string | null;
  readonly heroisme: number | null;
  /** Capacités ou pouvoirs d'une créature ou d'un démon qui donnent un dé de bonus ou de malus à toutes ses attaques. */
  readonly attaqueAvantages?: readonly string[];
  readonly attaqueDesavantages?: readonly string[];
}

/** La vitalité d'une carte corrigée à la main sur son cœur : ce qu'elle gagne (positif) ou perd (négatif). */
export interface VitaliteChange {
  readonly card: TapisCard;
  readonly delta: number;
}

/** Un coup porté, une fois ses dégâts appliqués : de quoi l'écrire au journal. */
export interface AppliedHit {
  readonly target: TapisCard;
  readonly damage: number;
  /** Porté à mains nues : ces dégâts se récupèrent en totalité après le combat. */
  readonly unarmed: boolean;
  /** Paré in extremis par la cible (1 point d'héroïsme) : ce qu'elle a interposé, et qui est brisé. */
  readonly parried?: 'bouclier' | 'arme';
  /** « Juste une égratignure » (1 point d'héroïsme) : le d6 lancé, et la vitalité rendue (plafonnée aux dégâts du coup). */
  readonly scratch?: {readonly die: number; readonly healed: number};
}

/** Des points d'héroïsme dépensés (négatif) ou gagnés par une carte qui n'est pas l'attaquant : la cible qui pare ou encaisse. */
export interface HeroismeChange {
  readonly card: TapisCard;
  readonly delta: number;
}

/** Un facteur de portée d'une arme à distance (02-actions-combat.md, « Portée des armes à distance ») et son modificateur. */
export interface RangeFactor {
  readonly label: string;
  readonly modifier: number;
}
