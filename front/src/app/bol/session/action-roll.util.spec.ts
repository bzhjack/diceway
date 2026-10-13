import {describe, expect, it} from 'vitest';
import {
  ACTION_DIFFICULTIES,
  DEFAULT_ACTION_DIFFICULTY,
  actionDiceTarget,
  actionDiceTargetLabel,
  actionModifierSum,
  actionResultTone,
  actionSuccessChance,
  actionVerdict,
  chanceRingDash,
  diceCountLabel,
  diceFromTotal,
  formatActionFormula,
  keepBestOrWorstTwo,
  keptDiceDistribution,
  keptDiceIndexes,
  netDiceModifier,
  parseDiceTotal,
  signedModifier,
  suggestedActionResult,
} from './action-roll.util';

describe('suggestedActionResult', () => {
  it('returns echec on a natural 2, regardless of total', () => {
    expect(suggestedActionResult([1, 1], 20, 6)).toBe('echec');
  });

  it('returns heroique on a natural 12 when lesser dice could have succeeded', () => {
    expect(suggestedActionResult([6, 6], 0, 9)).toBe('heroique');
    expect(suggestedActionResult([6, 6], -2, 9)).toBe('heroique');
  });

  it('returns a plain reussite on a natural 12 when only the double 6 could succeed', () => {
    expect(suggestedActionResult([6, 6], -3, 9)).toBe('reussite');
    expect(suggestedActionResult([6, 6], -8, 9)).toBe('reussite');
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

  it('names each term in parentheses when labels are given', () => {
    expect(
      formatActionFormula({attribute: 1, carriere: 2, difficulty: -4, equipment: 0, modifier: 1}, null, {
        attribute: 'agi', carriere: 'chasseur', difficulty: 'très difficile', modifier: 'modificateur',
      }),
    ).toBe('2d6 + 1 (agi) + 2 (chasseur) − 4 (très difficile) + 1 (modificateur) ≥ 9');
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
    expect(actionResultTone('legendaire')).toBe('legendaire');
  });
});

describe('ACTION_DIFFICULTIES', () => {
  it('has eight levels and defaults to Moyenne (0)', () => {
    expect(ACTION_DIFFICULTIES).toHaveLength(8);
    expect(DEFAULT_ACTION_DIFFICULTY).toEqual({label: 'Moyenne', modifier: 0});
  });
});

describe('keptDiceDistribution', () => {
  const sum = (p: readonly number[]) => p.reduce((a, b) => a + b, 0);

  it('is the 2d6 curve without bonus or malus die', () => {
    const p = keptDiceDistribution(0);
    expect(p[2]).toBeCloseTo(1 / 36);
    expect(p[7]).toBeCloseTo(6 / 36);
    expect(p[12]).toBeCloseTo(1 / 36);
    expect(sum(p)).toBeCloseTo(1);
  });

  it('shifts towards high totals with a bonus die (3d6, keep the two best)', () => {
    const p = keptDiceDistribution(1);
    expect(p[12]).toBeCloseTo(16 / 216);
    expect(p[2]).toBeCloseTo(1 / 216);
    expect(sum(p)).toBeCloseTo(1);
  });

  it('mirrors it with a malus die (3d6, keep the two worst)', () => {
    const p = keptDiceDistribution(-1);
    expect(p[2]).toBeCloseTo(16 / 216);
    expect(p[12]).toBeCloseTo(1 / 216);
  });

  it('still sums to 1 with two bonus or two malus dice', () => {
    expect(sum(keptDiceDistribution(2))).toBeCloseTo(1);
    expect(sum(keptDiceDistribution(-2))).toBeCloseTo(1);
  });
});

describe('actionSuccessChance', () => {
  it('is the chance of 9 or more on 2d6 without modifier', () => {
    expect(actionSuccessChance(0, 0, 9)).toBeCloseTo(10 / 36);
  });

  it('counts the modifiers: +3 means 6 or more on the dice', () => {
    expect(actionSuccessChance(0, 3, 9)).toBeCloseTo(26 / 36);
  });

  it('never reaches 100 %: a double 1 always fails', () => {
    expect(actionSuccessChance(0, 7, 9)).toBeCloseTo(35 / 36);
    expect(actionSuccessChance(0, 20, 9)).toBeCloseTo(35 / 36);
  });

  it('never reaches 0 %: a double 6 always succeeds', () => {
    expect(actionSuccessChance(0, -3, 9)).toBeCloseTo(1 / 36);
    expect(actionSuccessChance(0, -20, 9)).toBeCloseTo(1 / 36);
  });

  it('rises with a bonus die and drops with a malus die', () => {
    expect(actionSuccessChance(1, 0, 9)).toBeGreaterThan(actionSuccessChance(0, 0, 9));
    expect(actionSuccessChance(-1, 0, 9)).toBeLessThan(actionSuccessChance(0, 0, 9));
  });
});

describe('actionDiceTarget', () => {
  it('is the threshold minus the modifiers', () => {
    expect(actionDiceTarget(0, 9)).toEqual({kind: 'seuil', value: 9});
    expect(actionDiceTarget(3, 9)).toEqual({kind: 'seuil', value: 6});
    expect(actionDiceTarget(-2, 9)).toEqual({kind: 'seuil', value: 11});
  });

  it('says that everything succeeds but the double 1 when 3 or less is enough', () => {
    expect(actionDiceTarget(6, 9).kind).toBe('tout');
    expect(actionDiceTarget(12, 9).kind).toBe('tout');
  });

  it('says that only the double 6 succeeds when 12 or more is needed', () => {
    expect(actionDiceTarget(-3, 9).kind).toBe('double-six');
    expect(actionDiceTarget(-8, 9).kind).toBe('double-six');
  });
});

describe('actionDiceTargetLabel', () => {
  it('spells out what the dice must show', () => {
    expect(actionDiceTargetLabel(actionDiceTarget(2, 9))).toEqual({big: '7+', small: 'aux dés'});
    expect(actionDiceTargetLabel(actionDiceTarget(8, 9))).toEqual({big: 'Tout', small: 'sauf le double 1'});
    expect(actionDiceTargetLabel(actionDiceTarget(-5, 9))).toEqual({big: '6·6', small: 'seul le double 6'});
  });
});

describe('chanceRingDash', () => {
  it('draws an arc proportional to the chance, over the whole ring', () => {
    expect(chanceRingDash(0)).toBe('0.0 169.6');
    expect(chanceRingDash(50)).toBe('84.8 169.6');
    expect(chanceRingDash(100)).toBe('169.6 169.6');
  });
});

describe('keptDiceIndexes', () => {
  it('keeps both dice of a plain roll', () => {
    expect(keptDiceIndexes([3, 5], 0)).toEqual([0, 1]);
  });

  it('keeps the two best with a bonus die, the two worst with a malus die', () => {
    expect(keptDiceIndexes([2, 6, 4], 1)).toEqual([1, 2]);
    expect(keptDiceIndexes([2, 6, 4], -1)).toEqual([0, 2]);
    expect(keptDiceIndexes([6, 1, 3, 5], 2)).toEqual([0, 3]);
  });

  it('keeps two distinct dice when values are tied', () => {
    const kept = keptDiceIndexes([5, 5, 5], 1);
    expect(kept[0]).not.toBe(kept[1]);
  });
});

describe('actionVerdict', () => {
  it('tells by how much a roll succeeds or fails', () => {
    expect(actionVerdict('reussite', [6, 4], 12, 9)).toEqual({title: 'Réussite', detail: 'réussi de 3'});
    expect(actionVerdict('reussite', [4, 5], 9, 9)).toEqual({title: 'Réussite', detail: 'tout juste'});
    expect(actionVerdict('echec', [3, 2], 7, 9)).toEqual({title: 'Échec', detail: 'il manquait 2'});
  });

  it('names the automatic failure of a double 1, whatever the total', () => {
    expect(actionVerdict('echec', [1, 1], 14, 9)).toEqual({title: 'Échec automatique', detail: 'Double 1 : c’est raté, quel que soit le bonus.'});
    expect(actionVerdict('echec_critique', [1, 1], 14, 9).title).toBe('Échec critique');
  });

  it('tells a heroic success from a double 6 apart from a bought one', () => {
    expect(actionVerdict('heroique', [6, 6], 14, 9).detail).toBe('Double 6 : réussite automatique, avec un effet supérieur.');
    expect(actionVerdict('heroique', [5, 4], 11, 9).detail).toBe('Réussite transformée pour 1 point d’héroïsme.');
    expect(actionVerdict('legendaire', [6, 6], 14, 9).title).toBe('Succès légendaire');
  });

  it('tells a double 6 that was the only way to succeed is a plain success', () => {
    expect(actionVerdict('reussite', [6, 6], 6, 9)).toEqual({title: 'Réussite', detail: 'Double 6 : seul lui pouvait réussir, c’est une réussite normale.'});
    expect(actionVerdict('heroique', [6, 6], 6, 9).detail).toBe('Réussite transformée pour 1 point d’héroïsme.');
  });
});

describe('parseDiceTotal', () => {
  it('reads a total of two dice, from 2 to 12', () => {
    expect(parseDiceTotal('2')).toBe(2);
    expect(parseDiceTotal('9')).toBe(9);
    expect(parseDiceTotal('10')).toBe(10);
    expect(parseDiceTotal(' 12 ')).toBe(12);
  });

  it('waits for the second digit after a 1', () => {
    expect(parseDiceTotal('1')).toBeNull();
  });

  it('rejects anything else', () => {
    expect(parseDiceTotal('')).toBeNull();
    expect(parseDiceTotal('0')).toBeNull();
    expect(parseDiceTotal('13')).toBeNull();
    expect(parseDiceTotal('07')).toBeNull();
    expect(parseDiceTotal('7.5')).toBeNull();
    expect(parseDiceTotal('abc')).toBeNull();
  });
});
