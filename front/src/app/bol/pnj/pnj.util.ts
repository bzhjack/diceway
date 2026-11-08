import {BolHerosModel} from '../models/bol-heros.model';
import {BolStatblockChip} from '../shared/models/bol-statblock.model';

/** Le portrait d'un PNJ : l'illustration du catalogue, sinon celui de la fiche, ou la silhouette vide. */
export function pnjImage(pnj: BolHerosModel): string {
  if (!pnj.user_id && pnj.id) {
    return `/assets/bol/pnj/${pnj.id}.jpg`;
  }

  return pnj.origines.avatar || '/assets/bol/empty-avatar.jpg';
}

const RANGS: Record<string, string> = {C: 'Coriace', R: 'Rival', P: 'Piétaille'};

/** La puce du rang d'un PNJ, pour son statbloc. */
export function pnjBadge(pnj: BolHerosModel): BolStatblockChip | null {
  const label = RANGS[pnj.type];
  if (!label) {
    return null;
  }
  return {label, variant: pnj.type === 'C' ? 'amber' : pnj.type === 'R' ? 'rose' : 'slate'};
}
