import {describe, expect, it} from 'vitest';
import {computeAttackTotal, resolvePostureAttackModifier, suggestedAttackResult} from './attack-roll-dialog';

describe('computeAttackTotal', () => {
  it('sums dice, attacker bonus and modifier, then subtracts target defense', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 0, 0)).toBe(4);
  });

  it('subtracts the petit bouclier malus when consumed', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 1, 0, 0)).toBe(3);
  });

  it('ignores the shield malus when not consumed (caller passes 0)', () => {
    expect(computeAttackTotal(7, 5, 8, 2, 0, 0, 0)).toBe(6);
  });

  it('adds the legendary +1 bonus when the attacker got a legendary initiative this encounter', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 1, 0)).toBe(5);
  });

  it('adds the posture attack modifier (positive for offensive/intrepid)', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 0, 1)).toBe(5);
  });

  it('subtracts the posture attack modifier (negative for defensive/armor-chink)', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 0, -2)).toBe(2);
  });
});

describe('resolvePostureAttackModifier', () => {
  it('is 0 when no posture is chosen', () => {
    expect(resolvePostureAttackModifier(null, 3)).toBe(0);
  });

  it('uses the posture fixed modifier for offensive/intrepid/defensive', () => {
    expect(resolvePostureAttackModifier({label: 'Posture offensive', slug: 'offensive', modificateur: 1}, 3)).toBe(1);
    expect(resolvePostureAttackModifier({label: 'Posture défensive', slug: 'defensive', modificateur: -1}, 3)).toBe(-1);
  });

  it('uses minus the target fixed protection for armor-chink, ignoring its own modificateur', () => {
    expect(resolvePostureAttackModifier({label: "Défaut de l'armure", slug: 'armor-chink', modificateur: 0}, 2)).toBe(-2);
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
