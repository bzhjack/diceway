import {PostureChoice} from '../../models/turn-assistant.model';
import {postureEnClair, postureEnPhrase} from './tas-phrase.util';

const choix = (slug: string, name: string, attaque: number | null, defense: number): PostureChoice => ({slug, name, effect: '', hint: '', attaque, defense});

describe('la phrase du tour', () => {
  it('dit la posture comme on la dirait à table', () => {
    expect(postureEnPhrase(choix('none', 'Aucune', 0, 0))).toBe('sans posture');
    expect(postureEnPhrase(choix('total', 'Déf. totale', null, 2))).toBe('en défense totale');
    expect(postureEnPhrase(choix('offensive', 'Offensive', 1, -1))).toBe('en posture offensive');
    expect(postureEnPhrase(null)).toBe('sans posture');
  });

  it('dit ce que fait chaque posture, sans chiffres à déchiffrer', () => {
    expect(postureEnClair(choix('none', 'Aucune', 0, 0))).toBe('ni bonus ni malus');
    expect(postureEnClair(choix('offensive', 'Offensive', 1, -1))).toBe('+1 pour toucher, −1 en défense');
    expect(postureEnClair(choix('defensive', 'Défensive', -1, 1))).toBe('−1 pour toucher, +1 en défense');
    expect(postureEnClair(choix('total', 'Déf. totale', null, 2))).toBe('pas d’attaque ; +2 en défense jusqu’à son prochain tour');
  });
});
