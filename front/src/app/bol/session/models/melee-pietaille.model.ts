import {CombatCamp} from '../../models/bol-fight-session.model';
import {TapisCard} from './tapis.model';

/** La piétaille encore debout de chaque camp, dans l'ordre de jeu : celle des héros (leurs suivants) et celle de leurs adversaires. */
export type MeleeCamps = Readonly<Record<CombatCamp, readonly TapisCard[]>>;

/** Le dé qu'un camp lance pour savoir combien il tue en face : d6M pour le plus nombreux, d3 pour l'autre (et pour les deux à égalité). */
export type MeleeDe = 'd6M' | 'd3';

/** Un nombre par camp : ce qu'il tue en face (son jet), ou ce qu'il perd. */
export type MeleeParCamp = Readonly<Record<CombatCamp, number>>;

/** Un jet de mêlée : les d6 lancés (deux pour un d6M, un pour un d3) et ce qu'ils donnent. */
export interface MeleeJet {
  readonly des: readonly number[];
  readonly valeur: number;
}

/** Le bouton « Mêlée de piétaille » : absent sans piétaille debout des deux côtés, grisé une fois la mêlée de ce round résolue. */
export type MeleeDisponibilite = 'absente' | 'disponible' | 'faite';
