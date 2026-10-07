import {BolCreatureModel} from './bol-creature.model';
import {BolDemonModel} from './bol-demon.model';
import {BolHerosModel} from './bol-heros.model';

/** Les quatre types de personnages qu'on peut poser à la table. */
export type CombatantKind = 'hero' | 'pnj' | 'creature' | 'demon';

/** Un personnage de la bibliothèque, prêt à être choisi pour un combat ou posé à la table. */
export interface CombatCatalogEntry {
  readonly catalogId: string;
  readonly kind: CombatantKind;
  readonly sourceId: string;
  readonly nom: string;
  readonly vitalite: number;
  readonly avatar: string;
  /** Modèle complet, conservé pour alimenter le statbloc sans le recharger. */
  readonly raw: BolHerosModel | BolCreatureModel | BolDemonModel;
}

/** Un choix de la sélection de combat : l'entrée du catalogue et le nombre d'exemplaires. */
export interface SelectedCombatant {
  readonly catalogId: string;
  readonly qty: number;
}

/** Modificateur d'embuscade au jet de réaction (02-actions-combat.md) : +2 si les héros surprennent, −1 s'ils sont surpris. */
export type AmbushState = 'heroes_ambush' | 'heroes_ambushed' | null;
