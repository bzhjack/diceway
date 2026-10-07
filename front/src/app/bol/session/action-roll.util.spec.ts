import {describe, expect, it} from 'vitest';
import {
  ACTION_DIFFICULTIES,
  DEFAULT_ACTION_DIFFICULTY,
  actionModifierSum,
  actionResultTone,
  diceCountLabel,
  diceFromTotal,
  formatActionFormula,
  keepBestOrWorstTwo,
  netDiceModifier,
  signedModifier,
  suggestedActionResult,
} from './action-roll.util';

describe('suggestedActionResult', () => {
  it('returns echec on a natural 2, regardless of total', () => {
    expect(suggestedActionResult([1, 1], 20, 6)).toBe('echec');
  });

  it('returns heroique on a natural 12, regardless of total', () => {
    expect(suggestedActionResult([6, 6], -20, 12)).toBe('heroique');
  });

  it('returns reussite when the total meets the threshold', () => {
    expect(suggestedActionResult([4, 5], 0, 9)).toBe('reussite');
  });

  it('returns echec when the total is below the threshold', () => {
    expect(suggestedActionResult([2, 3], 0, 9)).toBe('echec');
  });
});

describe('diceFromTotal', () => {
  it('reconstructs (1,1) for a manually entered total of 2', () => {
    expect(diceFromTotal(2)).toEqual([1, 1]);
  });

  it('reconstructs (6,6) for a manually entered total of 12', () => {
    expect(diceFromTotal(12)).toEqual([6, 6]);
  });

  it('reconstructs a valid pair summing to the entered total', () => {
    const [a, b] = diceFromTotal(7);
    expect(a + b).toBe(7);
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(6);
    expect(b).toBeGreaterThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(6);
  });
});

describe('keepBestOrWorstTwo', () => {
  it('returns the pair as-is for a normal 2d6 roll', () => {
    expect(keepBestOrWorstTwo([3, 5], 0)).toEqual([3, 5]);
  });

  it('keeps the 2 best of 3 for a single avantage', () => {
    expect(keepBestOrWorstTwo([1, 4, 6], 1)).toEqual([4, 6]);
  });

  it('keeps the 2 worst of 4 for two désavantages', () => {
    expect(keepBestOrWorstTwo([1, 2, 5, 6], -2)).toEqual([1, 2]);
  });
});

describe('netDiceModifier', () => {
  it('cancels one avantage against one désavantage', () => {
    expect(netDiceModifier(1, 1)).toBe(0);
  });

  it('caps the net at +2 and −2', () => {
    expect(netDiceModifier(5, 0)).toBe(2);
    expect(netDiceModifier(0, 4)).toBe(-2);
  });
});

describe('diceCountLabel', () => {
  it('is empty for a plain roll', () => {
    expect(diceCountLabel(0, 0)).toBe('');
  });

  it('says the traits cancel out when both kinds are selected and net is 0', () => {
    expect(diceCountLabel(1, 1)).toBe("S'annulent — 2d6");
  });

  it('describes a bonus die', () => {
    expect(diceCountLabel(1, 0)).toBe('3d6, garde les 2 meilleurs');
  });

  it('describes two malus dice', () => {
    expect(diceCountLabel(0, 2)).toBe('4d6, garde les 2 moins bons');
  });
});

describe('signedModifier', () => {
  it('prefixes positive values with + and never writes +0', () => {
    expect(signedModifier(2)).toBe('+2');
    expect(signedModifier(0)).toBe('0');
    expect(signedModifier(-1)).toBe('-1');
  });
});

describe('actionModifierSum', () => {
  it('adds attribute, career, difficulty, equipment and free modifier', () => {
    expect(actionModifierSum({attribute: 2, carriere: 1, difficulty: -1, equipment: -1, modifier: 3})).toBe(4);
  });
});

describe('formatActionFormula', () => {
  it('lists every non-zero term before the roll', () => {
    expect(formatActionFormula({attribute: 2, carriere: 1, difficulty: -1, equipment: 0, modifier: 0}, null)).toBe(
      '2d6 + 2 + 1 − 1 ≥ 9',
    );
  });

  it('shows only 2d6 when every modifier is zero', () => {
    expect(formatActionFormula({attribute: 0, carriere: 0, difficulty: 0, equipment: 0, modifier: 0}, null)).toBe(
      '2d6 ≥ 9',
    );
  });

  it('replaces 2d6 by the kept dice once rolled', () => {
    expect(formatActionFormula({attribute: 2, carriere: 0, difficulty: -4, equipment: -1, modifier: 0}, [4, 5])).toBe(
      '4 + 5 + 2 − 1 − 4 ≥ 9',
    );
  });
});

describe('actionResultTone', () => {
  it('maps both failures to echec and both exceptional successes to heroique', () => {
    expect(actionResultTone('echec')).toBe('echec');
    expect(actionResultTone('echec_critique')).toBe('echec');
    expect(actionResultTone('reussite')).toBe('reussite');
    expect(actionResultTone('heroique')).toBe('heroique');
    expect(actionResultTone('legendaire')).toBe('heroique');
  });
});

describe('ACTION_DIFFICULTIES', () => {
  it('has eight levels and defaults to Moyenne (0)', () => {
    expect(ACTION_DIFFICULTIES).toHaveLength(8);
    expect(DEFAULT_ACTION_DIFFICULTY).toEqual({label: 'Moyenne', modifier: 0});
  });
});
