import {BolDemonModel} from '../models/bol-demon.model';

/** Le portrait d'un démon : l'illustration du catalogue, sinon celui de la fiche, ou la silhouette vide. */
export function demonImage(demon: BolDemonModel): string {
  if (!demon.user_id) {
    return `/assets/bol/demon/${demon.id}.jpg`;
  }

  return demon.avatar || '/assets/bol/empty-avatar.jpg';
}
