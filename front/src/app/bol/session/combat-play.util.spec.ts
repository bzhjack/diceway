import {describe, expect, it} from 'vitest';
import {canTarget, postCombatRecoveryAmount} from './combat-play.util';
import {PlayToken} from './combat-play.util';

function token(key: string, camp: PlayToken['camp']): PlayToken {
  return {
    key,
    kind: 'hero',
    nom: key,
    avatar: '',
    camp,
    vitaliteMax: 10,
    vitaliteCourante: 10,
    tier: null,
    lockedRound1: false,
    pivotId: 1,
    instanceIndex: null,
    combat: {
      sourceId: null,
      vigueur: null,
      agilite: null,
      melee: null,
      tir: null,
      attaque: null,
      defense: null,
      degats: null,
      protection: null,
    },
  };
}

describe('canTarget', () => {
  it('rejects the attacker targeting itself', () => {
    expect(canTarget(token('hero-1', 'heros'), 'hero-1')).toBe(false);
  });

  it('allows targeting a token of the opposite camp', () => {
    expect(canTarget(token('creature-1', 'adversaires'), 'hero-1')).toBe(true);
  });

  it('allows targeting a token of the same camp (friendly fire allowed)', () => {
    expect(canTarget(token('hero-2', 'heros'), 'hero-1')).toBe(true);
  });

  it('rejects everything when there is no active attacker', () => {
    expect(canTarget(token('hero-2', 'heros'), null)).toBe(false);
  });
});

describe('postCombatRecoveryAmount', () => {
  it('recovers half the vitality lost, rounded up, when above 0 (02-actions-combat.md, "Récupération")', () => {
    expect(postCombatRecoveryAmount(6, 10)).toBe(2); // 4 lost -> 2
    expect(postCombatRecoveryAmount(5, 10)).toBe(3); // 5 lost -> 2.5 -> 3
  });

  it('recovers half the vitality lost when exactly at 0 (assumed able to rest post-combat)', () => {
    expect(postCombatRecoveryAmount(0, 10)).toBe(5);
  });

  it('recovers nothing once already at max', () => {
    expect(postCombatRecoveryAmount(10, 10)).toBe(0);
  });

  it('grants no automatic recovery while still dying (negative vitality) — needs "secourir un mourant" instead', () => {
    expect(postCombatRecoveryAmount(-3, 10)).toBe(0);
  });

  it('recovers nothing when vitality tracking is unknown (never damaged, or no vitality stat)', () => {
    expect(postCombatRecoveryAmount(null, 10)).toBe(0);
    expect(postCombatRecoveryAmount(5, null)).toBe(0);
  });
});
