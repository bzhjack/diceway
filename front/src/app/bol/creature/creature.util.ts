import {BolCreatureModel} from '../models/bol-creature.model';

/** Le portrait d'une créature : l'illustration du bestiaire pour le catalogue, sinon celui de la fiche, ou la silhouette vide. */
export function creatureImage(creature: BolCreatureModel): string {
  if (!creature.user_id) {
    return `/assets/bol/bestiary/${creature.id}.jpg`;
  }

  return creature.avatar || '/assets/bol/empty-avatar.jpg';
}
