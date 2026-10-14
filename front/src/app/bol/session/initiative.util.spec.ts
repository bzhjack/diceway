import {describe, expect, it} from 'vitest';
import {buildInitiativeOrderFrom} from './initiative.util';
import {InitiativeSource} from './models/initiative.model';

const hero = (key: string, resultat: InitiativeSource['resultat'], agilite?: number | null): InitiativeSource => ({
  key,
  kind: 'hero',
  nom: key,
  rang: null,
  resultat,
  ...(agilite === undefined ? {} : {agilite}),
});

const adversary = (key: string, rang: NonNullable<InitiativeSource['rang']>): InitiativeSource => ({key, kind: 'pnj', nom: key, rang, resultat: null});

const keys = (sources: readonly InitiativeSource[]): string[] => buildInitiativeOrderFrom(sources).entries.map((entry) => entry.key);

describe('buildInitiativeOrderFrom', () => {
  it('follows the reaction order of the book', () => {
    expect(
      keys([adversary('pietaille', 'pietaille'), hero('echec', 'echec'), adversary('coriace', 'coriace'), hero('critique', 'echec_critique'), adversary('rival', 'rival'), hero('reussite', 'reussite'), hero('legendaire', 'legendaire'), hero('heroique', 'heroique')]),
    ).toEqual(['legendaire', 'heroique', 'reussite', 'rival', 'coriace', 'echec', 'pietaille', 'critique']);
  });

  it('lets the highest agility act first among heroes with the same result', () => {
    expect(keys([hero('lent', 'reussite', 0), hero('vif', 'reussite', 3), hero('moyen', 'reussite', 1)])).toEqual(['vif', 'moyen', 'lent']);
  });

  it('never lets agility overtake a better result', () => {
    expect(keys([hero('vif en échec', 'echec', 4), hero('lent en réussite', 'reussite', 0)])).toEqual(['lent en réussite', 'vif en échec']);
  });

  it('keeps the table order between equal agilities, and puts an unknown agility last', () => {
    expect(keys([hero('a', 'reussite', 2), hero('sans fiche', 'reussite', null), hero('b', 'reussite', 2), hero('c', 'reussite', 3)])).toEqual(['c', 'a', 'b', 'sans fiche']);
  });

  it('keeps adversaries of the same rank in the table order', () => {
    expect(keys([adversary('premier', 'coriace'), adversary('second', 'coriace')])).toEqual(['premier', 'second']);
  });

  it('blocks coriaces and rabble on round 1 against a heroic success, and a critical failure whatever happens', () => {
    const order = buildInitiativeOrderFrom([hero('h', 'heroique', 1), hero('c', 'echec_critique', 1), adversary('rival', 'rival'), adversary('coriace', 'coriace')]);
    expect(order.entries.filter((entry) => entry.lockedRound1).map((entry) => entry.key)).toEqual(['coriace', 'c']);
    expect(order.legendaryActive).toBe(false);
  });
});
