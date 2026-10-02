import {describe, expect, it} from 'vitest';
import {defaultTokenPosition, MIN_TOKEN_SPACING_PX} from './token-layout.util';

function px(percent: number, mapWidth: number): number {
  return (percent / 100) * mapWidth;
}

describe('defaultTokenPosition', () => {
  it('keeps tokens of the same row at least one token width apart on a narrow map', () => {
    const width = 672;
    for (const camp of ['heros', 'adversaires'] as const) {
      const first = defaultTokenPosition(0, 4, camp, `${camp}-a`, width);
      const second = defaultTokenPosition(1, 4, camp, `${camp}-b`, width);
      expect(Math.abs(px(first.x, width) - px(second.x, width))).toBeGreaterThanOrEqual(MIN_TOKEN_SPACING_PX);
    }
  });

  it('wraps to a new row instead of squeezing a third column into a narrow map', () => {
    const width = 672;
    const first = defaultTokenPosition(0, 3, 'heros', 'hero-1', width);
    const third = defaultTokenPosition(2, 3, 'heros', 'hero-3', width);
    expect(third.y).toBeGreaterThan(first.y + 10);
  });

  it('uses three columns per camp on a wide map', () => {
    const width = 1600;
    const xs = [0, 1, 2].map((i) => px(defaultTokenPosition(i, 3, 'heros', `hero-${i}`, width).x, width));
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(MIN_TOKEN_SPACING_PX);
    expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(MIN_TOKEN_SPACING_PX);
  });

  it('puts heroes on the left half and adversaries on the right half', () => {
    for (const width of [672, 1000, 1600]) {
      for (let i = 0; i < 6; i++) {
        expect(defaultTokenPosition(i, 6, 'heros', `h-${i}`, width).x).toBeLessThan(50);
        expect(defaultTokenPosition(i, 6, 'adversaires', `a-${i}`, width).x).toBeGreaterThan(50);
      }
    }
  });

  it('stays inside the map, including when the map width is not known yet', () => {
    for (const width of [0, 300, 672, 1600]) {
      for (let i = 0; i < 9; i++) {
        const {x, y} = defaultTokenPosition(i, 9, i % 2 ? 'heros' : 'adversaires', `t-${i}`, width);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('is deterministic for a given token', () => {
    expect(defaultTokenPosition(1, 3, 'heros', 'hero-7', 900)).toEqual(defaultTokenPosition(1, 3, 'heros', 'hero-7', 900));
  });
});
