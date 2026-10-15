import {describe, expect, it} from 'vitest';
import {baseRangeMeters, formatMeters, RANGE_FACTORS, rangeReach} from './range.util';

describe('range factors', () => {
  it('reads the base range of a weapon', () => {
    expect(baseRangeMeters('6 m')).toBe(6);
    expect(baseRangeMeters('1,5 m')).toBe(1.5);
    expect(baseRangeMeters('9 m / 18 m')).toBe(9);
    expect(baseRangeMeters('-')).toBeNull();
    expect(baseRangeMeters(null)).toBeNull();
  });

  it('follows the book: a spear (6 m) at 15 m is at medium range, −1', () => {
    const index = RANGE_FACTORS.findIndex((_, i) => 15 <= rangeReach(6, i));
    expect(RANGE_FACTORS[index]).toEqual({label: 'Moyenne', modifier: -1});
    expect(rangeReach(3, 0)).toBe(3); // dague de jet : bout portant jusqu'à 3 m
    expect(rangeReach(3, 1)).toBe(6); // courte jusqu'à 6 m
  });

  it('writes meters the French way', () => {
    expect(formatMeters(4.5)).toBe('4,5 m');
    expect(formatMeters(12)).toBe('12 m');
  });
});
