import {describe, expect, it} from 'vitest';
import {bestHealingCareer, isHealingCareer, medicalCareAmount, rescueDifficulty} from './rescue.util';

describe('rescueDifficulty', () => {
  it('starts from Moyenne and gets one level harder per negative point', () => {
    expect(rescueDifficulty(-1)).toEqual({label: 'Ardue', modifier: -1});
    expect(rescueDifficulty(-2)).toEqual({label: 'Difficile', modifier: -2});
    expect(rescueDifficulty(-3)).toEqual({label: 'Très difficile', modifier: -4});
    expect(rescueDifficulty(-5)).toEqual({label: 'Héroïque', modifier: -8});
  });

  it('never goes past the hardest level, nor below Moyenne', () => {
    expect(rescueDifficulty(-9).label).toBe('Héroïque');
    expect(rescueDifficulty(0).label).toBe('Moyenne');
  });
});

describe('healing careers', () => {
  it('spots a healer by its name', () => {
    expect(isHealingCareer('Médecin')).toBe(true);
    expect(isHealingCareer('Guérisseuse')).toBe(true);
    expect(isHealingCareer('Barbare')).toBe(false);
  });

  it('keeps the best-ranked healing career', () => {
    expect(bestHealingCareer([{label: 'Barbare', value: 3}, {label: 'Médecin', value: 1}, {label: 'Rebouteux', value: 2}])).toEqual({label: 'Rebouteux', value: 2});
    expect(bestHealingCareer([{label: 'Barbare', value: 3}])).toBeNull();
  });
});

describe('medicalCareAmount', () => {
  it('gives back the rank of the healer, up to the maximum', () => {
    expect(medicalCareAmount(4, 10, 2)).toBe(2);
    expect(medicalCareAmount(9, 10, 3)).toBe(1);
    expect(medicalCareAmount(10, 10, 2)).toBe(0);
    expect(medicalCareAmount(-3, 10, 2)).toBe(2);
  });
});
