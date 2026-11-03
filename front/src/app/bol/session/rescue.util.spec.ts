import {describe, expect, it} from 'vitest';
import {CARRIERE_MEDECIN_ID} from '../bol-rules.constants';
import {bestHealingCareer, medicalCareAmount, peutSecourir, rescueDifficulty} from './rescue.util';
import {TapisCard} from './models/tapis.model';

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
  it('recognizes the healing career by its id, whatever its name', () => {
    const medecin = {id: CARRIERE_MEDECIN_ID, label: 'Rebouteux', value: 2};

    expect(bestHealingCareer([{id: 2, label: 'Barbare', value: 3}, medecin])).toEqual(medecin);
    expect(bestHealingCareer([{id: 2, label: 'Médecin', value: 3}])).toBeNull();
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

describe('peutSecourir', () => {
  const carte = (kind: TapisCard['kind'], camp: TapisCard['camp']): Pick<TapisCard, 'kind' | 'camp'> => ({kind, camp});

  it('a hero or a PNJ of the heroes’ camp can rescue a dying hero, or tend the wounded after the fight', () => {
    expect(peutSecourir(carte('hero', 'heros'))).toBe(true);
    expect(peutSecourir(carte('pnj', 'heros'))).toBe(true);
  });

  it('not their adversaries, nor a creature or a demon', () => {
    expect(peutSecourir(carte('pnj', 'adversaires'))).toBe(false);
    expect(peutSecourir(carte('hero', 'adversaires'))).toBe(false);
    expect(peutSecourir(carte('creature', 'heros'))).toBe(false);
    expect(peutSecourir(carte('demon', 'heros'))).toBe(false);
  });
});
