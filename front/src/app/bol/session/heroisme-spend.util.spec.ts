import {describe, expect, it} from 'vitest';
import {egratignure, heroismeGems} from './heroisme-spend.util';

describe('heroismeGems', () => {
  it('shows the five gems of a starting hero, lit up to the points left', () => {
    expect(heroismeGems(5)).toEqual([true, true, true, true, true]);
    expect(heroismeGems(2)).toEqual([true, true, false, false, false]);
    expect(heroismeGems(0)).toEqual([false, false, false, false, false]);
  });

  it('adds gems when a hero has more than five points (bonus of a critical failure)', () => {
    expect(heroismeGems(7)).toHaveLength(7);
    expect(heroismeGems(7).every((lit) => lit)).toBe(true);
  });

  it('treats a negative or fractional value as whole points, never below zero', () => {
    expect(heroismeGems(-2)).toEqual([false, false, false, false, false]);
    expect(heroismeGems(2.9)).toEqual([true, true, false, false, false]);
  });
});

describe('egratignure', () => {
  it('garde le meilleur des deux dés (d6B, Mythic+) et rend autant de vitalité', () => {
    expect(egratignure([2, 5], 7)).toEqual({die: 5, healed: 5});
  });

  it('ne rend jamais plus que les dégâts du coup', () => {
    expect(egratignure([6, 3], 4)).toEqual({die: 6, healed: 4});
  });

  it('prend tel quel le dé gardé, tapé après un jet à table', () => {
    expect(egratignure([3], 7)).toEqual({die: 3, healed: 3});
  });
});
