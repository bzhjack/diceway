import {describe, expect, it} from 'vitest';
import {canTarget} from './combat-play.util';
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
