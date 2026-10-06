import {InitiativeResultat} from '../../models/bol-fight-session.model';

/** Les types de personnages pris en compte dans l'ordre d'initiative. */
export type InitiativeKind = 'hero' | 'pnj' | 'creature' | 'demon';

/** Les 8 paliers d'ordre de réaction BoL (02-actions-combat.md), du premier au dernier à agir. */
export type InitiativeTierKey =
  | 'legendaire'
  | 'heroique'
  | 'reussite'
  | 'rival'
  | 'coriace'
  | 'echec'
  | 'pietaille'
  | 'echec_critique';

/** Un combattant à sa place dans l'ordre d'initiative : son palier, son résultat de réaction et son
 * éventuel blocage au round 1. */
export interface InitiativeEntry {
  readonly key: string;
  readonly kind: InitiativeKind;
  readonly nom: string;
  /** null = héros dont le résultat n'a pas encore été saisi. */
  readonly tier: InitiativeTierKey | null;
  readonly resultat: InitiativeResultat | null;
  readonly lockedRound1: boolean;
}

/** L'ordre d'initiative calculé, et le bonus légendaire de la rencontre. */
export interface InitiativeOrder {
  readonly entries: readonly InitiativeEntry[];
  /** true si un héros a obtenu un succès légendaire : +1 à tous les jets d'attaque toute la rencontre. */
  readonly legendaryActive: boolean;
}

/** Combattant générique, indépendant de sa source. */
export interface InitiativeSource {
  readonly key: string;
  readonly kind: InitiativeKind;
  readonly nom: string;
  /** Rang BoL fixe (rival/coriace/pietaille) — uniquement pour pnj/creature/demon. */
  readonly rang: 'rival' | 'coriace' | 'pietaille' | null;
  /** Résultat du jet de réaction — uniquement pour un héros. */
  readonly resultat: InitiativeResultat | null;
}
