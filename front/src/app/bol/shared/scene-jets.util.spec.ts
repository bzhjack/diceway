import {ACTION_DIFFICULTIES} from '../session/action-roll.util';
import {actionDifficultyDu, attributsEnClair, JET_ATTRIBUTS, JET_DIFFICULTES, libelleDifficulte} from './scene-jets.util';

describe('scene-jets.util', () => {
  it('chaque slug donne le libellé et le modificateur du panneau de jet', () => {
    expect(JET_DIFFICULTES.map((d) => [d.label, d.modifier])).toEqual(ACTION_DIFFICULTIES.map((d) => [d.label, d.modifier]));
    expect(JET_DIFFICULTES.map((d) => d.cle)).toEqual(['tres-facile', 'facile', 'moyenne', 'ardue', 'difficile', 'tres-difficile', 'impossible', 'heroique']);
    for (const difficulte of JET_DIFFICULTES) {
      expect(actionDifficultyDu(difficulte.cle)).toBe(ACTION_DIFFICULTIES.find((d) => d.label === difficulte.label));
    }
  });

  it('dit la difficulté avec son modificateur, sans signe pour Moyenne', () => {
    expect(libelleDifficulte('ardue')).toBe('Ardue −1');
    expect(libelleDifficulte('moyenne')).toBe('Moyenne');
    expect(libelleDifficulte('tres-facile')).toBe('Très facile +2');
    expect(libelleDifficulte('heroique')).toBe('Héroïque −8');
  });

  it('dit les attributs en clair, dans l’ordre du jet', () => {
    expect(JET_ATTRIBUTS.map((a) => a.label)).toEqual(['Vigueur', 'Agilité', 'Esprit', 'Aura']);
    expect(attributsEnClair(['vigueur', 'agilite'])).toBe('Vigueur ou Agilité');
    expect(attributsEnClair([])).toBe('');
  });
});
