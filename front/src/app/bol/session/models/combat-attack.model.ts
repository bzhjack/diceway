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
  readonly agilite: number;
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
}
