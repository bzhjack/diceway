import {traitPayload} from './trait-entry.utils';

describe('traitPayload', () => {
  it('garde la marque « de carrière » d’un désavantage, sa précision et sa région', () => {
    expect(traitPayload({id: 17, type: 'D', detail: null, region_id: 4, carriere: true})).toEqual({
      id: 17,
      traitable_id: 17,
      type: 'D',
      detail: null,
      region_id: 4,
      carriere: true,
    });
  });

  it('un trait ajouté dans le formulaire n’est pas de carrière', () => {
    expect(traitPayload({id: 3, type: 'A'})).toEqual({id: 3, traitable_id: 3, type: 'A', detail: null, region_id: null, carriere: false});
  });
});
