import {CombatCamp} from '../../../models/bol-fight-session.model';

/** Écart horizontal minimal entre deux jetons voisins : largeur maximale du nom sous le jeton
 * (`.cp-token-name`, 6rem + marges). En dessous, les jetons se recouvrent. */
export const MIN_TOKEN_SPACING_PX = 112;

const MAX_COLS = 3;
/** Écart entre colonnes sur une carte large, en fraction de la largeur de la carte. */
const COL_STEP_RATIO = 0.08;
/** Bord extérieur d'un camp et limite côté centre, en fraction de la largeur de la carte. */
const CAMP_EDGE_RATIO = 0.06;
const CAMP_LIMIT_RATIO = 0.48;
const ZONE_Y = {min: 16, max: 84};
const JITTER_RATIO = 0.18;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Petit décalage déterministe (basé sur la clé du jeton) pour éviter un alignement trop rigide sur la carte. */
function jitter(key: string): {jx: number; jy: number} {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const jx = ((hash % 1000) / 1000) * 2 - 1;
  const jy = (((hash >> 8) % 1000) / 1000) * 2 - 1;
  return {jx, jy};
}

/**
 * Position par défaut (en % de la carte) d'un jeton jamais déplacé : héros à gauche, adversaires à
 * droite, en colonnes partant du bord extérieur. Le nombre de colonnes s'adapte à la largeur de la
 * carte (réserve ou fiche du jeton ouvertes) pour que deux jetons voisins ne se recouvrent jamais ;
 * les jetons en trop passent à la ligne. `mapWidth` à 0 = largeur pas encore mesurée.
 */
export function defaultTokenPosition(
  indexInCamp: number,
  campCount: number,
  camp: CombatCamp,
  key: string,
  mapWidth: number,
): {x: number; y: number} {
  const known = mapWidth > 0;
  // Tout est calculé en fraction de la largeur ; sans largeur connue, on garde l'écart nominal.
  const step = known ? Math.max(COL_STEP_RATIO, MIN_TOKEN_SPACING_PX / mapWidth) : COL_STEP_RATIO;
  const cols = clamp(Math.floor((CAMP_LIMIT_RATIO - CAMP_EDGE_RATIO) / step), 1, MAX_COLS);
  const rows = Math.max(1, Math.ceil(campCount / cols));

  const col = indexInCamp % cols;
  const row = Math.floor(indexInCamp / cols);
  const rowHeight = (ZONE_Y.max - ZONE_Y.min) / rows;

  // Le décalage horizontal ne consomme que la marge au-delà de l'écart minimal.
  const slack = known ? Math.max(0, step - MIN_TOKEN_SPACING_PX / mapWidth) / 2 : step * JITTER_RATIO;
  const {jx, jy} = jitter(key);
  const fromEdge = CAMP_EDGE_RATIO + step * (col + 0.5) + jx * Math.min(step * JITTER_RATIO, slack);
  const x = (camp === 'heros' ? fromEdge : 1 - fromEdge) * 100;
  const y = ZONE_Y.min + rowHeight * (row + 0.5) + jy * rowHeight * JITTER_RATIO;

  return {x: clamp(x, 0, 100), y: clamp(y, ZONE_Y.min, ZONE_Y.max)};
}
