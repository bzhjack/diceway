import {describe, expect, it} from 'vitest';
import {attackBonus, damageDie, damageDiceCount, finalDamage, rawDamage, vigueurBonus} from './combat-resolution.util';
import {ResolvedCombatStats} from './models/combat-attack.model';

const STATS: ResolvedCombatStats = {
  agilite: 2, vigueur: 3, melee: 1, tir: 2, attaque: null, defense: 0, degats: 'd6', protection: 0, bouclierMalusUneAttaque: 0, herosId: null, heroisme: null,
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
