import {matchesTerm, ownFirstThenLabel} from './list.utils';

describe('matchesTerm', () => {
  it('matche tout quand le terme est vide ou blanc', () => {
    expect(matchesTerm('', 'Dague')).toBe(true);
    expect(matchesTerm('   ', 'Dague')).toBe(true);
  });

  it('cherche sans tenir compte de la casse, sur plusieurs champs', () => {
    expect(matchesTerm('dague', 'Dague', null)).toBe(true);
    expect(matchesTerm('LAME', 'Dague', 'Grande lame')).toBe(true);
    expect(matchesTerm('hache', 'Dague', 'Grande lame')).toBe(false);
  });

  it('ignore les champs null/undefined', () => {
    expect(matchesTerm('x', null, undefined)).toBe(false);
  });
});

describe('ownFirstThenLabel', () => {
  interface Item {
    mine: boolean;
    nom: string;
  }

  const compare = ownFirstThenLabel<Item>((item) => item.mine, (item) => item.nom);

  it('place mes créations avant, puis trie par libellé', () => {
    const items: Item[] = [
      {mine: false, nom: 'Bronyx'},
      {mine: true, nom: 'Zombie'},
      {mine: false, nom: 'Anguille'},
      {mine: true, nom: 'Aigle'},
    ];

    const sorted = [...items].sort(compare);
    expect(sorted.map((item) => item.nom)).toEqual(['Aigle', 'Zombie', 'Anguille', 'Bronyx']);
  });
});
