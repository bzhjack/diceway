/** Ce qu'un effet modifie : le jet d'attaque, la défense, les dégâts, la protection, ou l'action suivante (dé de malus, action perdue). */
export type EffectStat = 'attaque' | 'defense' | 'degats' | 'protection' | 'action';

/** Contre quoi l'effet joue : quand son porteur attaque, ou quand il est attaqué. */
export type EffectWhen = 'attaque' | 'subie';

/** Quand l'effet s'éteint. */
export type EffectDuration =
  /** N attaques subies ; `expireAuTour` l'éteint aussi au début du prochain tour du porteur. */
  | {readonly type: 'usages'; readonly restants: number; readonly expireAuTour?: boolean}
  | {readonly type: 'fin-round'}
  | {readonly type: 'debut-tour-porteur'}
  | {readonly type: 'action-porteur'}
  | {readonly type: 'combat'};

/** Un effet en cours, gardé dans `etat_combat.effets`. Un effet de valeur 0 est une trace (« bouclier dépensé ce round ») : jamais affichée en puce. */
export interface CombatEffect {
  readonly id: string;
  /** D'où il vient : `defense-totale`, `posture-defensive`, `bouclier-depense`… */
  readonly origine: string;
  /** Clé de la carte qui le porte (`{kind}-{pivotId}`). */
  readonly porteur: string;
  readonly stat: EffectStat;
  readonly valeur: number;
  readonly quand: EffectWhen;
  readonly duree: EffectDuration;
  /** Ajouté à la main par le MJ. */
  readonly manuel: boolean;
  /** Limite l'effet à un adversaire précis (clé de carte). */
  readonly cible?: string;
  /** Libellé libre, pour les effets ajoutés à la main. */
  readonly libelle?: string;
}

/** Un effet à créer : l'identifiant est attribué par `appliquerEvenement`. */
export type NewEffect = Omit<CombatEffect, 'id'>;

/** Ce qui fait évoluer le registre. */
export type EffectEvent =
  | {readonly type: 'debut-tour'; readonly carte: string}
  | {readonly type: 'fin-tour'; readonly carte: string; readonly crees: readonly NewEffect[]}
  | {readonly type: 'jet-attaque'; readonly attaquant: string; readonly cible: string}
  | {readonly type: 'nouveau-round'}
  | {readonly type: 'ajout-manuel'; readonly effet: NewEffect}
  | {readonly type: 'retrait-manuel'; readonly id: string}
  | {readonly type: 'carte-retiree'; readonly carte: string};

/** Le jet pour lequel on cherche les modificateurs. `bouclier` : malus du petit bouclier de la cible lu sur sa fiche (0 si aucun). */
export interface RollContext {
  readonly jet: 'attaque' | 'degats';
  readonly attaquant: string;
  readonly cible: string;
  readonly bouclier: number;
  /** Ce qu'un grand bouclier de la cible ajoute déjà à sa défense : rendu à l'attaquant si la cible perd le bénéfice de son bouclier. */
  readonly bouclierToutes: number;
  /** Noms des cartes (clé → nom), pour dire à qui est un effet dans la puce. */
  readonly noms?: Readonly<Record<string, string>>;
}

/** Une puce de jet issue du registre. `effetId` est `null` pour ce qui vient de la fiche (le petit bouclier). */
export interface ModifierTerm {
  readonly effetId: string | null;
  readonly label: string;
  /** Contribution au total du jet, signée. */
  readonly valeur: number;
  readonly tone: 'plus' | 'minus';
}

/** Ce que la carte active a choisi pour son tour et qui dure : la posture (slug du référentiel) et la défense totale. */
export interface TurnChoice {
  readonly posture: string | null;
  readonly defenseTotale: boolean;
}
