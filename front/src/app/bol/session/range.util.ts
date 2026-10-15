import {RangeFactor} from './models/combat-attack.model';

/** Les facteurs de portée, du plus proche au plus lointain (livre p. 62) : la portée de l'arme est celle du bout portant, et chaque
 * multiple au-delà descend d'un cran. */
export const RANGE_FACTORS: readonly RangeFactor[] = [
  {label: 'Bout portant', modifier: 1},
  {label: 'Courte', modifier: 0},
  {label: 'Moyenne', modifier: -1},
  {label: 'Longue', modifier: -2},
  {label: 'Très longue', modifier: -4},
  {label: 'Extrême', modifier: -6},
  {label: 'Maximale', modifier: -8},
];

/** Rang de « Courte » : la portée retenue d'office. */
export const DEFAULT_RANGE_INDEX = 1;

/** La portée de base d'une arme en mètres, lue dans le catalogue : « 3 m », « 1,5 m », ou « 9 m / 18 m » (fronde à une main / à deux
 * mains : la première). `null` pour une arme sans portée (« - », vide). */
export function baseRangeMeters(portee: string | null | undefined): number | null {
  const match = portee?.match(/(\d+(?:[.,]\d+)?)\s*m/);
  return match ? Number(match[1].replace(',', '.')) : null;
}

/** Jusqu'où va un facteur de portée : la portée de base fois son rang (bout portant = 1, courte = 2…). */
export function rangeReach(base: number, index: number): number {
  return base * (index + 1);
}

/** Des mètres à la française : « 4,5 m », « 12 m ». */
export function formatMeters(meters: number): string {
  return `${String(Math.round(meters * 10) / 10).replace('.', ',')} m`;
}
