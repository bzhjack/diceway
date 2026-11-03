import {describe, expect, it} from 'vitest';
import {BolAccueilScenario} from '../models/bol-accueil.model';
import {findScenario} from './scenario.util';

const S: BolAccueilScenario[] = [
  {id: 'p2', titre: "Perle du Beshaar — 2. De sable et d'eau"},
  {id: 'p1', titre: 'Perle du Beshaar — 1. Sacrilège à Satarla'},
];

describe('findScenario', () => {
  it('trouve le scénario par son id', () => {
    expect(findScenario(S, 'p2')).toBe(S[0]);
  });

  it('renvoie null pour un id inconnu ou absent', () => {
    expect(findScenario(S, 'zz')).toBeNull();
    expect(findScenario(S, null)).toBeNull();
  });
});
