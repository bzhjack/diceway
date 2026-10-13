import {describe, expect, it} from 'vitest';
import {attackBonus, damageDie, damageDiceCount, damageDieMax, damageRange, finalDamage, rawDamage, vigueurBonus, computeAttackTotal, resolvePostureAttackModifier, suggestedAttackResult, shouldPromptDefierLaMort} from './combat-resolution.util';
import {ResolvedCombatStats} from './models/combat-attack.model';

const STATS: ResolvedCombatStats = {
  agilite: 2, vigueur: 3, melee: 1, tir: 2, attaque: null, defense: 0, degats: 'd6', protection: 0, protectionText: null, bouclierMalusUneAttaque: 0, bouclierDefenseToutes: 0, herosId: null, heroisme: null,
};

describe('damageDie', () => {
  it('reads the die of a weapon string', () => {
    expect(damageDie('d3')).toBe('d3');
    expect(damageDie('d6M')).toBe('d6m');
    expect(damageDie('d6B')).toBe('d6b');
    expect(damageDie('d6')).toBe('d6');
    expect(damageDie(null)).toBe('d6');
  });

  it('rolls two dice for a bonus or malus die', () => {
    expect(damageDiceCount('d6m')).toBe(2);
    expect(damageDiceCount('d6b')).toBe(2);
    expect(damageDiceCount('d6')).toBe(1);
  });
});

describe('rawDamage', () => {
  it('keeps the worst, the best, or half of a d3', () => {
    expect(rawDamage('d6m', [2, 5])).toBe(2);
    expect(rawDamage('d6b', [2, 5])).toBe(5);
    expect(rawDamage('d3', [5])).toBe(3);
    expect(rawDamage('d6', [4])).toBe(4);
  });
});

describe('attack and damage bonuses', () => {
  it('adds agility and melee, or tir', () => {
    expect(attackBonus(STATS, false)).toBe(3);
    expect(attackBonus(STATS, true)).toBe(4);
    expect(attackBonus({...STATS, attaque: 5}, false)).toBe(5);
  });

  it('halves vigueur at range, rounding down', () => {
    expect(vigueurBonus(STATS, false)).toBe(3);
    expect(vigueurBonus(STATS, true)).toBe(1);
  });
});

describe('finalDamage', () => {
  it('subtracts protection and never goes below zero', () => {
    expect(finalDamage(4, 3, 1, false)).toBe(6);
    expect(finalDamage(1, 0, 3, false)).toBe(0);
  });

  it('adds 6 for a devastating blow', () => {
    expect(finalDamage(4, 3, 1, true)).toBe(12);
  });
});

describe('damageRange', () => {
  it('knows the highest face of each damage die', () => {
    expect(damageDieMax('d3')).toBe(3);
    expect(damageDieMax('d6')).toBe(6);
    expect(damageDieMax('d6m')).toBe(6);
    expect(damageDieMax('d6b')).toBe(6);
  });

  it('goes from the lowest to the highest face, with vigueur and protection', () => {
    expect(damageRange('d6', 3, 1, false)).toEqual([3, 8]);
    expect(damageRange('d3', 0, 0, false)).toEqual([1, 3]);
  });

  it('never announces negative damage', () => {
    expect(damageRange('d6', 0, 4, false)).toEqual([0, 2]);
  });

  it('adds the devastating blow', () => {
    expect(damageRange('d6m', 3, 0, true)).toEqual([10, 15]);
  });
});

describe('computeAttackTotal', () => {
  it('sums dice, attacker bonus and modifier, then subtracts target defense', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 0)).toBe(4);
  });

  it('adds the modifiers of the effects (a shield malus arrives as a negative modifier)', () => {
    expect(computeAttackTotal(7, 5, 8, -1, 0, 0)).toBe(3);
    expect(computeAttackTotal(7, 5, 8, 2, 0, 0)).toBe(6);
  });

  it('adds the legendary +1 bonus when the attacker got a legendary initiative this encounter', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 1, 0)).toBe(5);
  });

  it('adds the posture attack modifier (positive for offensive/intrepid)', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, 1)).toBe(5);
  });

  it('subtracts the posture attack modifier (negative for defensive/armor-chink)', () => {
    expect(computeAttackTotal(7, 5, 8, 0, 0, -2)).toBe(2);
  });
});

describe('resolvePostureAttackModifier', () => {
  it('is 0 when no posture is chosen', () => {
    expect(resolvePostureAttackModifier(null, 3)).toBe(0);
  });

  it('uses the posture fixed modifier for offensive/intrepid/defensive', () => {
    expect(resolvePostureAttackModifier({slug: 'offensive', modificateur: 1}, 3)).toBe(1);
    expect(resolvePostureAttackModifier({slug: 'defensive', modificateur: -1}, 3)).toBe(-1);
  });

  it('uses minus the target fixed protection for armor-chink, ignoring its own modificateur', () => {
    expect(resolvePostureAttackModifier({slug: 'armor-chink', modificateur: 0}, 2)).toBe(-2);
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

describe('shouldPromptDefierLaMort', () => {
  it('proposes it when a hit makes the hero fall below 0', () => {
    expect(shouldPromptDefierLaMort(3, -2)).toBe(true);
    expect(shouldPromptDefierLaMort(0, -1)).toBe(true);
  });

  it('proposes it again when a hit takes the hero below −5', () => {
    expect(shouldPromptDefierLaMort(-3, -7)).toBe(true);
  });

  it('does not repeat it for a hero who is already dying and stays in the same band', () => {
    expect(shouldPromptDefierLaMort(-2, -4)).toBe(false);
    expect(shouldPromptDefierLaMort(-7, -9)).toBe(false);
  });

  it('does nothing while the hero stays at 0 or above', () => {
    expect(shouldPromptDefierLaMort(5, 0)).toBe(false);
    expect(shouldPromptDefierLaMort(4, 2)).toBe(false);
  });
});
