import {describe, expect, it} from 'vitest';
import {BolFightSessionHerosModel, BolFightSessionModel} from '../../models/bol-fight-session.model';
import {applyTableChange} from './table-change.util';

function row(id: number, herosId: string, heroisme: number): BolFightSessionHerosModel {
  return {
    id,
    fight_session_id: 's',
    heros_id: herosId,
    camp: 'heros',
    initiative_resultat: null,
    vitalite_courante: 10,
    heros: {
      id: herosId,
      origines: {nom: herosId, avatar: null, joueur: null},
      ressources: {vitalite: 10, heroisme},
    },
  };
}

const session: BolFightSessionModel = {id: 's', titre: null, statut: 'libre', heros: [row(1, 'a', 3), row(2, 'b', 5)]};

describe('applyTableChange', () => {
  it('takes the session returned by the API as it is', () => {
    const returned: BolFightSessionModel = {id: 's', titre: 'Après', statut: 'combat'};

    expect(applyTableChange(session, {session: returned})).toBe(returned);
    expect(applyTableChange(null, {session: returned})).toBe(returned);
  });

  it('changes the heroism of that hero only', () => {
    const next = applyTableChange(session, {herosId: 'b', heroisme: 4});

    expect(next?.heros?.map((h) => h.heros?.ressources?.heroisme)).toEqual([3, 4]);
    expect(next?.heros?.[0]).toBe(session.heros?.[0]);
  });

  it('leaves the session alone when that hero is not at the table', () => {
    const next = applyTableChange(session, {herosId: 'z', heroisme: 1});

    expect(next?.heros?.map((h) => h.heros?.ressources?.heroisme)).toEqual([3, 5]);
  });

  it('has nothing to change while no session is loaded', () => {
    expect(applyTableChange(null, {herosId: 'a', heroisme: 1})).toBeNull();
  });
});
