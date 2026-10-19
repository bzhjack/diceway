import {describe, expect, it} from 'vitest';
import {ArmeEntry} from '../models/arme-list.model';
import {etoilesArmeFavorite} from './arme-favorite.util';

const arme = (id: number, label: string): ArmeEntry => ({id, label, degats: 'd6', portee: null, notes: null, equipee: true});
const KRISS = arme(23, 'Kriss');
const DAGUE = arme(3, 'Dague');
const EPEE_VAL = arme(24, 'Épée valgardienne');
const HALAKH = 3;

describe('etoilesArmeFavorite', () => {
  it('sans l’avantage « Arme favorite » : pas d’étoile', () => {
    expect(etoilesArmeFavorite([KRISS, DAGUE], null, HALAKH)).toBeNull();
  });

  it('avantage général : l’étoile va sur l’arme nommée, et peut aller sur toute arme permise', () => {
    expect(etoilesArmeFavorite([KRISS, DAGUE], {arme: 'Dague', regionId: null}, HALAKH)).toEqual([
      {active: false, raison: null},
      {active: true, raison: null},
    ]);
  });

  it('une arme régionale d’une autre région ne peut pas être l’arme favorite (Mythic+)', () => {
    expect(etoilesArmeFavorite([EPEE_VAL], {arme: null, regionId: null}, HALAKH)).toEqual([
      {active: false, raison: 'Arme régionale réservée aux héros de Valgard.'},
    ]);
  });

  it('sans région (un PNJ) : pas de restriction', () => {
    expect(etoilesArmeFavorite([EPEE_VAL], {arme: null, regionId: null}, null)).toEqual([{active: false, raison: null}]);
  });

  it('avantage régional : l’arme est imposée, l’étoile ne bouge pas', () => {
    expect(etoilesArmeFavorite([KRISS, DAGUE], {arme: 'Kriss', regionId: HALAKH}, HALAKH)).toEqual([
      {active: true, raison: 'Imposée par l’avantage régional.'},
      {active: false, raison: 'Imposée par l’avantage régional : Kriss.'},
    ]);
  });
});
