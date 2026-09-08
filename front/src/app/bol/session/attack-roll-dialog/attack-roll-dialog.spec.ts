import {describe, expect, it} from 'vitest';
import {computeAttackTotal} from './attack-roll-dialog';

describe('computeAttackTotal', () => {
  it('sums dice, attacker bonus and modifier, then subtracts target defense', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0)).toBe(4);
  });

  it('subtracts the petit bouclier malus when consumed', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 1)).toBe(3);
  });

  it('ignores the shield malus when not consumed (caller passes 0)', () => {
    expect(computeAttackTotal(7, 5, 8, 2, 0)).toBe(6);
  });
});
