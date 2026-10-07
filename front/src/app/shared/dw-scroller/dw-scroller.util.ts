import {ScrollState} from '../models/dw-scroller.model';

/** Tolérance (px) sur les positions de défilement : les navigateurs arrondissent `scrollLeft` et `scrollWidth`. */
const EDGE_TOLERANCE = 1;

/** État des chevrons d'une piste qui défile à l'horizontale. */
export function scrollState(scrollLeft: number, scrollWidth: number, clientWidth: number): ScrollState {
  const overflow = scrollWidth - clientWidth > EDGE_TOLERANCE;
  return {
    overflow,
    canBack: overflow && scrollLeft > EDGE_TOLERANCE,
    canForward: overflow && scrollLeft + clientWidth < scrollWidth - EDGE_TOLERANCE,
  };
}

/** Position cible d'un clic sur un chevron : le bord gauche de la carte suivante (`direction` 1) ou précédente
 * (-1), bornée aux deux extrémités. `offsets` : position de chaque carte, dans l'ordre, comptée depuis la
 * première (le retrait de la piste n'en fait donc pas un pas). */
export function scrollTarget(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  direction: -1 | 1,
  offsets: readonly number[],
): number {
  const max = Math.max(0, scrollWidth - clientWidth);
  if (max === 0) {
    return 0;
  }
  if (offsets.length === 0) {
    return Math.min(max, scrollLeft);
  }
  if (direction === 1) {
    const next = offsets.find((offset) => offset > scrollLeft + EDGE_TOLERANCE);
    return next === undefined ? max : Math.min(max, next);
  }
  const before = offsets.filter((offset) => offset < scrollLeft - EDGE_TOLERANCE);
  return before.length === 0 ? 0 : Math.max(0, before[before.length - 1]);
}