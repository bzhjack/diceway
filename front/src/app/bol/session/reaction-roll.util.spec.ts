import {describe, expect, it} from 'vitest';
import {ReactionAdversary, ReactionHero, ReactionParts} from './models/start-combat-dialog.model';
import {reactionLanes, reactionModifier, reactionResult, reactionSumTerms, reactionVerdict} from './reaction-roll.util';

const parts = (overrides: Partial<ReactionParts> = {}): ReactionParts => ({esprit: 0, initiative: 0, embuscade: 0, initiativeEnnemie: 0, ...overrides});

const hero = (pivotId: number, resultat: ReactionHero['resultat'], total: number | null = null): ReactionHero => ({
  pivotId,
  nom: `Héros ${pivotId}`,
  avatar: null,
  resultat,
  total,
});

const adversary = (pivotId: number, rang: ReactionAdversary['rang'], overrides: Partial<ReactionAdversary> = {}): ReactionAdversary => ({
  pivotId,
  kind: 'pnj',
  nom: `Adversaire ${pivotId}`,
  avatar: null,
  rang,
  ally: false,
  excluded: false,
  ...overrides,
});

describe('reactionModifier', () => {
  it('adds esprit, initiative and the ambush, and takes the enemy initiative away', () => {
    expect(reactionModifier(parts({esprit: 1, initiative: 2, initiativeEnnemie: 1}))).toBe(2);
    expect(reactionModifier(parts({esprit: 1, initiative: 2, embuscade: 2}))).toBe(5);
    expect(reactionModifier(parts({embuscade: -1, initiativeEnnemie: 3}))).toBe(-4);
  });
});

describe('reactionResult', () => {
  it('succeeds when dice plus modifiers reach 9', () => {
    expect(reactionResult(7, 2)).toBe('reussite');
    expect(reactionResult(6, 2)).toBe('echec');
  });

  it('makes a double 1 a failure whatever the bonus, critical only if the hero takes it', () => {
    expect(reactionResult(2, 20)).toBe('echec');
    expect(reactionResult(2, 20, true)).toBe('echec_critique');
  });

  it('makes a double 6 a heroic success, legendary only if the hero pays for it', () => {
    expect(reactionResult(12, 0)).toBe('heroique');
    expect(reactionResult(12, -2, true)).toBe('legendaire');
  });

  it('makes a double 6 a plain success when only the double 6 could succeed', () => {
    expect(reactionResult(12, -3)).toBe('reussite');
    expect(reactionResult(12, -20, true)).toBe('reussite');
  });

  it('ignores the heroism choice on any other roll', () => {
    expect(reactionResult(9, 0, true)).toBe('reussite');
    expect(reactionResult(5, 0, true)).toBe('echec');
  });
});

describe('reactionVerdict', () => {
  it('names the result and tells what it changes in the fight', () => {
    expect(reactionVerdict('reussite', 8)).toEqual({title: 'Réussite', detail: 'Agit avant tous les adversaires.', tone: 'reussite'});
    expect(reactionVerdict('echec', 5).detail).toBe('Agit après les coriaces, avant la piétaille.');
    expect(reactionVerdict('heroique', 12).tone).toBe('heroique');
    expect(reactionVerdict('legendaire', 12).detail).toContain('+1 à ses jets d’attaque');
    expect(reactionVerdict('echec_critique', 2).detail).toContain('interdit');
  });

  it('recalls the double 1 behind a plain failure', () => {
    expect(reactionVerdict('echec', 2).detail).toBe('Double 1. Agit après les coriaces, avant la piétaille.');
  });
});

describe('reactionSumTerms', () => {
  it('announces the roll before the dice: 2d6, the non-zero terms, then the threshold', () => {
    expect(reactionSumTerms(null, parts({esprit: 1, initiative: 2, initiativeEnnemie: 1}))).toEqual([
      {value: '2d6', caption: 'dés', tone: 'dice'},
      {value: '+1', caption: 'esprit', tone: 'plus'},
      {value: '+2', caption: 'init.', tone: 'plus'},
      {value: '−1', caption: 'ennemi', tone: 'minus'},
      {value: '≥ 9', caption: 'seuil', tone: 'total'},
    ]);
  });

  it('adds up once the dice are known', () => {
    const terms = reactionSumTerms(8, parts({esprit: 1, initiative: 2, initiativeEnnemie: 1}));
    expect(terms[0]).toEqual({value: '8', caption: 'dés', tone: 'dice'});
    expect(terms[terms.length - 1]).toEqual({value: '= 10', caption: 'pour 9', tone: 'total'});
  });

  it('names the ambush by its side, and shows a negative attribute as a malus', () => {
    expect(reactionSumTerms(null, parts({embuscade: 2}))[1]).toEqual({value: '+2', caption: 'embusc.', tone: 'plus'});
    expect(reactionSumTerms(null, parts({embuscade: -1}))[1]).toEqual({value: '−1', caption: 'surpris', tone: 'minus'});
    expect(reactionSumTerms(null, parts({esprit: -1}))[1]).toEqual({value: '−1', caption: 'esprit', tone: 'minus'});
  });

  it('adds the rank of a useful career granted by the GM', () => {
    const withCareer = parts({esprit: 1, initiative: 0, carriere: {label: 'Chasseur', value: 3}});
    expect(reactionModifier(withCareer)).toBe(4);
    expect(reactionSumTerms(null, withCareer).map((term) => `${term.value} ${term.caption}`)).toEqual(['2d6 dés', '+1 esprit', '+3 chasseur', '≥ 9 seuil']);
  });

  it('shows the helmet malus apart from the initiative it lowers', () => {
    const terms = reactionSumTerms(null, parts({esprit: 0, initiative: 0, equipement: -1}));
    expect(terms.map((term) => `${term.value} ${term.caption}`)).toEqual(['2d6 dés', '+1 init.', '−1 équipement', '≥ 9 seuil']);
  });
});

describe('reactionLanes', () => {
  it('follows the order of the book: heroes, rivals, coriaces, failed heroes, rabble, critical failures', () => {
    const lanes = reactionLanes(
      [hero(1, 'echec', 4), hero(2, 'reussite', 10), hero(3, 'echec_critique', 2)],
      [adversary(1, 'pietaille'), adversary(2, 'coriace'), adversary(3, 'rival')],
    );
    expect(lanes.map((lane) => lane.id)).toEqual(['heros', 'rival', 'coriace', 'echec', 'pietaille', 'echec_critique']);
    expect(lanes.map((lane) => lane.title)).toEqual(['Héros', 'Rivaux', 'Coriaces', 'Héros en échec', 'Piétaille', 'Échec critique']);
  });

  it('puts the heroes who have not rolled yet first, and leaves out the empty lanes', () => {
    const lanes = reactionLanes([hero(1, null), hero(2, 'reussite', 9)], [adversary(1, 'coriace')]);
    expect(lanes.map((lane) => lane.id)).toEqual(['attente', 'heros', 'coriace']);
    expect(lanes[0].tokens.map((token) => token.nom)).toEqual(['Héros 1']);
  });

  it('sorts the first lane: legendary, heroic, then plain success', () => {
    const lanes = reactionLanes([hero(1, 'reussite', 11), hero(2, 'legendaire', 14), hero(3, 'heroique', 13)], [adversary(1, 'rival')]);
    expect(lanes[0].tokens.map((token) => token.detail)).toEqual(['total 14 · légendaire', 'total 13 · héroïque', 'total 11']);
  });

  it('blocks coriaces and rabble on round 1 as soon as a hero is heroic or legendary', () => {
    const adversaries = [adversary(1, 'rival'), adversary(2, 'coriace'), adversary(3, 'pietaille')];
    const blocked = (heroes: readonly ReactionHero[]) =>
      reactionLanes(heroes, adversaries)
        .filter((lane) => lane.blocked)
        .map((lane) => lane.id);
    expect(blocked([hero(1, 'reussite', 9)])).toEqual([]);
    expect(blocked([hero(1, 'heroique', 12)])).toEqual(['coriace', 'pietaille']);
    expect(blocked([hero(1, 'legendaire', 12)])).toEqual(['coriace', 'pietaille']);
  });

  it('keeps an excluded adversary in its lane, marked, and flags the allies', () => {
    const lanes = reactionLanes([], [adversary(1, 'coriace', {excluded: true}), adversary(2, 'coriace', {ally: true, kind: 'creature'})]);
    expect(lanes[0].tokens).toEqual([
      {kind: 'pnj', pivotId: 1, nom: 'Adversaire 1', avatar: null, detail: '', excluded: true},
      {kind: 'creature', pivotId: 2, nom: 'Adversaire 2', avatar: null, detail: 'allié', excluded: false},
    ]);
  });
});
