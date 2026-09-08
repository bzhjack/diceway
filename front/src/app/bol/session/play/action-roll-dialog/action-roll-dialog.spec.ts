import {describe, expect, it} from 'vitest';
import {diceFromTotal, keepBestOrWorstTwo, suggestedActionResult} from './action-roll-dialog';

describe('suggestedActionResult', () => {
  it('returns echec on a natural 2, regardless of total', () => {
    expect(suggestedActionResult([1, 1], 20, 6)).toBe('echec');
  });

  it('returns heroique on a natural 12, regardless of total', () => {
    expect(suggestedActionResult([6, 6], -20, 12)).toBe('heroique');
  });

  it('returns reussite when the total meets the threshold', () => {
    expect(suggestedActionResult([4, 5], 0, 9)).toBe('reussite');
  });

  it('returns echec when the total is below the threshold', () => {
    expect(suggestedActionResult([2, 3], 0, 9)).toBe('echec');
  });
});

describe('diceFromTotal', () => {
  it('reconstructs (1,1) for a manually entered total of 2, so the natural-2 absolute rule still fires', () => {
    expect(diceFromTotal(2)).toEqual([1, 1]);
  });

  it('reconstructs (6,6) for a manually entered total of 12, so the natural-12 absolute rule still fires', () => {
    expect(diceFromTotal(12)).toEqual([6, 6]);
  });

  it('reconstructs a valid pair summing to the entered total for a mid-range value', () => {
    const [a, b] = diceFromTotal(7);
    expect(a + b).toBe(7);
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(6);
    expect(b).toBeGreaterThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(6);
  });
});

describe('keepBestOrWorstTwo', () => {
  it('returns the pair as-is for a normal 2d6 roll (net 0)', () => {
    expect(keepBestOrWorstTwo([3, 5], 0)).toEqual([3, 5]);
  });

  it('keeps the 2 best of 3 for a single avantage (net 1)', () => {
    expect(keepBestOrWorstTwo([1, 4, 6], 1)).toEqual([4, 6]);
  });

  it('keeps the 2 best of 4 for two avantages (net 2)', () => {
    expect(keepBestOrWorstTwo([1, 2, 5, 6], 2)).toEqual([5, 6]);
  });

  it('keeps the 2 worst of 3 for a single désavantage (net -1)', () => {
    expect(keepBestOrWorstTwo([1, 4, 6], -1)).toEqual([1, 4]);
  });

  it('keeps the 2 worst of 4 for two désavantages (net -2)', () => {
    expect(keepBestOrWorstTwo([1, 2, 5, 6], -2)).toEqual([1, 2]);
  });
});
