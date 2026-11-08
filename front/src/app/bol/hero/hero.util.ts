import {BolHerosModel} from '../models/bol-heros.model';
import {BolStatblockChip} from '../shared/models/bol-statblock.model';

/** Le portrait d'un héros, ou la silhouette vide. */
export function heroImage(hero: BolHerosModel): string {
  return hero.origines.avatar || '/assets/bol/empty-avatar.jpg';
}

/** La puce d'un héros encore en cours de création, pour son statbloc ; rien pour un héros actif. */
export function heroBadge(hero: BolHerosModel): BolStatblockChip | null {
  return hero.active ? null : {label: 'En cours', variant: 'amber'};
}
