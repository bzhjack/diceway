import {describe, expect, it} from 'vitest';
import {resolveAddCombatantCamp} from './add-combatant-dialog';

describe('resolveAddCombatantCamp', () => {
  it('forces heros camp for a hero entry even when the toggle is set to adversaires', () => {
    expect(resolveAddCombatantCamp('hero', 'adversaires')).toBe('heros');
  });

  it('keeps the toggle camp for a hero entry when it is already set to heros', () => {
    expect(resolveAddCombatantCamp('hero', 'heros')).toBe('heros');
  });

  it('respects the toggle camp for non-hero kinds', () => {
    expect(resolveAddCombatantCamp('pnj', 'adversaires')).toBe('adversaires');
    expect(resolveAddCombatantCamp('pnj', 'heros')).toBe('heros');
    expect(resolveAddCombatantCamp('creature', 'adversaires')).toBe('adversaires');
    expect(resolveAddCombatantCamp('demon', 'heros')).toBe('heros');
  });
});
