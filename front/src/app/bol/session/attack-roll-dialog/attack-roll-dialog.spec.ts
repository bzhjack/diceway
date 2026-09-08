import {describe, expect, it} from 'vitest';
import {computeAttackTotal, suggestedAttackResult} from './attack-roll-dialog';

describe('computeAttackTotal', () => {
  it('sums dice, attacker bonus and modifier, then subtracts target defense', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 0)).toBe(4);
  });

  it('subtracts the petit bouclier malus when consumed', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 1, 0)).toBe(3);
  });

  it('ignores the shield malus when not consumed (caller passes 0)', () => {
    expect(computeAttackTotal(7, 5, 8, 2, 0, 0)).toBe(6);
  });

  it('adds the legendary +1 bonus when the attacker got a legendary initiative this encounter', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 1)).toBe(5);
  });
});

describe('suggestedAttackResult', () => {
  it('is echec on a natural 2, regardless of the total', () => {
    expect(suggestedAttackResult([1, 1], 15, 9)).toBe('echec');
  });

  it('is heroique on a natural 12, regardless of the total', () => {
    expect(suggestedAttackResult([6, 6], 2, 9)).toBe('heroique');
  });

  it('is reussite when the total meets the threshold', () => {
    expect(suggestedAttackResult([4, 5], 9, 9)).toBe('reussite');
  });

  it('is echec when the total is below the threshold', () => {
    expect(suggestedAttackResult([2, 3], 8, 9)).toBe('echec');
  });
});
