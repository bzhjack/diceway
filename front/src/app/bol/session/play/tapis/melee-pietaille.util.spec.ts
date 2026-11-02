import {describe, expect, it} from 'vitest';
import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard} from '../../models/tapis.model';
import {desDeMelee, disponibiliteMelee, jetDeMelee, lireJetDeMelee, pertesDeMelee, pietailleDebout, tombesParDefaut} from './melee-pietaille.util';

function mook(id: number, camp: TapisCard['camp'], extra: Partial<TapisCard> = {}): TapisCard {
  return {
    key: `pnj-${id}`,
    kind: 'pnj',
    camp,
    pivotId: id,
    sourceId: 'src',
    nom: `Sbire ${id}`,
    avatar: '',
    badge: null,
    rang: 'Piétaille',
    degats: 'd3',
    defense: '0',
    vitaliteCourante: 2,
    vitaliteMax: 2,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
    ...extra,
  };
}

function etat(over: Partial<EtatCombat> = {}): EtatCombat {
  return {round: 2, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null, ...over};
}

const SUIVANT_1 = mook(1, 'heros');
const SUIVANT_2 = mook(2, 'heros');
const BANDIT_1 = mook(11, 'adversaires');
const BANDIT_2 = mook(12, 'adversaires');
const BANDIT_3 = mook(13, 'adversaires');

describe('pietailleDebout', () => {
  it('splits the standing mooks by camp, in turn order', () => {
    const camps = pietailleDebout([BANDIT_2, SUIVANT_1, BANDIT_1, SUIVANT_2], etat());

    expect(camps.heros.map((c) => c.key)).toEqual(['pnj-1', 'pnj-2']);
    expect(camps.adversaires.map((c) => c.key)).toEqual(['pnj-12', 'pnj-11']);
  });

  it('leaves out heroes, rivals and coriaces, mooks out of the fight and excluded ones', () => {
    const hero = {...mook(20, 'heros'), kind: 'hero' as const, key: 'hero-20', rang: null};
    const coriace = mook(21, 'adversaires', {rang: 'Coriace'});
    const tombe = mook(22, 'adversaires', {vitaliteCourante: 0});
    const exclu = mook(23, 'adversaires');

    const camps = pietailleDebout([hero, coriace, tombe, exclu, BANDIT_1, SUIVANT_1], etat({exclus: ['pnj-23']}));

    expect(camps.heros.map((c) => c.key)).toEqual(['pnj-1']);
    expect(camps.adversaires.map((c) => c.key)).toEqual(['pnj-11']);
  });

  it('counts creatures and demons of rank piétaille too', () => {
    const loup = {...mook(5, 'adversaires'), kind: 'creature' as const, key: 'creature-5'};

    expect(pietailleDebout([loup], etat()).adversaires.map((c) => c.key)).toEqual(['creature-5']);
  });
});

describe('disponibiliteMelee', () => {
  it('is absent unless both camps have a standing mook', () => {
    expect(disponibiliteMelee({heros: [], adversaires: [BANDIT_1]}, etat())).toBe('absente');
    expect(disponibiliteMelee({heros: [SUIVANT_1], adversaires: []}, etat())).toBe('absente');
  });

  it('is available once per round', () => {
    const camps = {heros: [SUIVANT_1], adversaires: [BANDIT_1]};

    expect(disponibiliteMelee(camps, etat({round: 2, melee: null}))).toBe('disponible');
    expect(disponibiliteMelee(camps, etat({round: 2, melee: 1}))).toBe('disponible');
    expect(disponibiliteMelee(camps, etat({round: 2, melee: 2}))).toBe('faite');
  });
});

describe('desDeMelee', () => {
  it('gives d6M to the bigger camp and d3 to the smaller one (book p. 132)', () => {
    expect(desDeMelee({heros: [SUIVANT_1], adversaires: [BANDIT_1, BANDIT_2]})).toEqual({heros: 'd3', adversaires: 'd6M'});
    expect(desDeMelee({heros: [SUIVANT_1, SUIVANT_2], adversaires: [BANDIT_1]})).toEqual({heros: 'd6M', adversaires: 'd3'});
  });

  it('gives d3 to both camps on a tie (interpretation)', () => {
    expect(desDeMelee({heros: [SUIVANT_1, SUIVANT_2], adversaires: [BANDIT_1, BANDIT_2]})).toEqual({heros: 'd3', adversaires: 'd3'});
  });
});

describe('pertesDeMelee', () => {
  it('makes each camp lose what the other one rolled', () => {
    const camps = {heros: [SUIVANT_1, SUIVANT_2], adversaires: [BANDIT_1, BANDIT_2, BANDIT_3]};

    expect(pertesDeMelee(camps, {heros: 1, adversaires: 2})).toEqual({heros: 2, adversaires: 1});
  });

  it('never kills more mooks than a camp has standing', () => {
    const camps = {heros: [SUIVANT_1], adversaires: [BANDIT_1, BANDIT_2, BANDIT_3]};

    expect(pertesDeMelee(camps, {heros: 3, adversaires: 5})).toEqual({heros: 1, adversaires: 3});
  });
});

describe('tombesParDefaut', () => {
  it('proposes the last mooks in turn order', () => {
    expect(tombesParDefaut([BANDIT_1, BANDIT_2, BANDIT_3], 2)).toEqual(['pnj-12', 'pnj-13']);
  });

  it('proposes nobody for no loss, and everybody past the camp size', () => {
    expect(tombesParDefaut([BANDIT_1, BANDIT_2], 0)).toEqual([]);
    expect(tombesParDefaut([BANDIT_1, BANDIT_2], 5)).toEqual(['pnj-11', 'pnj-12']);
  });
});

describe('jetDeMelee', () => {
  it('keeps the lower of two d6 for a d6M', () => {
    expect(jetDeMelee('d6M', [3, 2])).toEqual({des: [3, 2], valeur: 2});
    expect(jetDeMelee('d6M', [6, 6])).toEqual({des: [6, 6], valeur: 6});
  });

  it('halves a d6, rounded up, for a d3', () => {
    expect(jetDeMelee('d3', [1])).toEqual({des: [1], valeur: 1});
    expect(jetDeMelee('d3', [4])).toEqual({des: [4], valeur: 2});
    expect(jetDeMelee('d3', [6])).toEqual({des: [6], valeur: 3});
  });
});

describe('lireJetDeMelee', () => {
  it('reads a typed result within the die range', () => {
    expect(lireJetDeMelee('2', 'd3')).toBe(2);
    expect(lireJetDeMelee(' 6 ', 'd6M')).toBe(6);
  });

  it('refuses an empty, non-numeric or out of range result', () => {
    expect(lireJetDeMelee('', 'd3')).toBeNull();
    expect(lireJetDeMelee('x', 'd3')).toBeNull();
    expect(lireJetDeMelee('4', 'd3')).toBeNull();
    expect(lireJetDeMelee('0', 'd6M')).toBeNull();
    expect(lireJetDeMelee('7', 'd6M')).toBeNull();
    expect(lireJetDeMelee('1.5', 'd6M')).toBeNull();
  });
});
