import {describe, expect, it} from 'vitest';
import {postCombatRecoveryAmount} from './combat-play.util';

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
