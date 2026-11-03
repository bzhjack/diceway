import {describe, expect, it} from 'vitest';
import {BolAccueilScenario} from '../models/bol-accueil.model';
import {findScenario, libelleDeChapitre, titreDeChapitre} from './scenario.util';
import {chapitre} from './chapitre.testing';

const S: BolAccueilScenario[] = [
  chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau"),
  chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'),
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

describe('libelleDeChapitre', () => {
  it('nomme le chapitre par son numéro, l’introduction par son nom, et un chapitre sans numéro tel quel', () => {
    expect(libelleDeChapitre(1, 'Sacrilège à Satarla')).toBe('1. Sacrilège à Satarla');
    expect(libelleDeChapitre(0, 'La colère de Nemmereth')).toBe('Introduction : La colère de Nemmereth');
    expect(libelleDeChapitre(0, 'Introduction')).toBe('Introduction');
    expect(libelleDeChapitre(null, 'Mariage amer')).toBe('Mariage amer');
  });
});

describe('titreDeChapitre', () => {
  it('écrit le chapitre d’un seul tenant avec son scénario, et un one shot seul', () => {
    expect(titreDeChapitre({titre: 'Sacrilège à Satarla', numero: 1, saga: {id: 's', titre: 'Perle du Beshaar'}})).toBe(
      'Perle du Beshaar — 1. Sacrilège à Satarla',
    );
    expect(titreDeChapitre({titre: 'mon premier scénario', numero: null, saga: null})).toBe('mon premier scénario');
    expect(titreDeChapitre({titre: 'Ancien format'})).toBe('Ancien format');
  });
});
