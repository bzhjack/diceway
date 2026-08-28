import {describe, expect, it} from 'vitest';
import {suggestedSkillResult} from './skill-check-dialog';

describe('suggestedSkillResult', () => {
  it('returns echec on a natural 2, regardless of total', () => {
    expect(suggestedSkillResult([1, 1], 20, 6)).toBe('echec');
  });

  it('returns heroique on a natural 12, regardless of total', () => {
    expect(suggestedSkillResult([6, 6], -20, 12)).toBe('heroique');
  });

  it('returns reussite when the total meets the threshold', () => {
    expect(suggestedSkillResult([4, 5], 0, 9)).toBe('reussite');
  });

  it('returns echec when the total is below the threshold', () => {
    expect(suggestedSkillResult([2, 3], 0, 9)).toBe('echec');
  });
});
