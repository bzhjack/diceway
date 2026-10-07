import {CombatCamp} from '../../models/bol-fight-session.model';
import {InitiativeKind, InitiativeTierKey} from './initiative.model';

/**
 * Stats de combat d'un jeton. Pour un héros, rien n'est snapshoté côté session : ces champs
 * restent `null` et les vraies valeurs doivent être récupérées en direct via `BolHerosService`
 * (voir `sourceId`). Pour pnj/créature/démon, les valeurs viennent du snapshot de la session.
 */
export interface PlayCombatStats {
  readonly sourceId: string | null;
  readonly vigueur: number | null;
  readonly agilite: number | null;
  readonly melee: number | null;
  readonly tir: number | null;
  /** Bonus d'attaque combiné des créatures (remplace agilité+mêlée séparés). */
  readonly attaque: number | null;
  readonly defense: number | null;
  readonly degats: string | null;
  readonly protection: string | null;
}

/** Un combattant de la table, avec ce qu'il faut pour l'ordonner, l'afficher et le faire attaquer. */
export interface PlayToken {
  readonly key: string;
  readonly kind: InitiativeKind;
  readonly nom: string;
  readonly avatar: string;
  readonly camp: CombatCamp;
  readonly vitaliteMax: number | null;
  readonly vitaliteCourante: number | null;
  readonly tier: InitiativeTierKey | null;
  readonly lockedRound1: boolean;
  /** Id de la ligne fight-session (heros/pnj/creature/demon) — plusieurs jetons d'un même lot de créatures/démons partagent le même id. */
  readonly pivotId: number;
  /** Index de cette instance au sein du lot (creature/demon avec qty > 1) — null pour hero/pnj, toujours seuls dans leur ligne. */
  readonly instanceIndex: number | null;
  readonly combat: PlayCombatStats;
}

/** L'ensemble des combattants de la table, et le bonus légendaire de la rencontre. */
export interface PlayBoard {
  readonly tokens: readonly PlayToken[];
  readonly legendaryActive: boolean;
}
