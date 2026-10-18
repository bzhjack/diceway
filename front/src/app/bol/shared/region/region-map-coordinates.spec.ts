import {positionSurCarteHd} from './region-map-coordinates';

describe('positionSurCarteHd', () => {
  it('place un point de carte.jpg sur la carte HD, qui l’entoure de son cadre', () => {
    const coin = positionSurCarteHd({x: 0, y: 0});
    expect(coin.x).toBeCloseTo((55 / 1248) * 100, 3);
    expect(coin.y).toBeCloseTo((109 / 1741) * 100, 3);
    const oppose = positionSurCarteHd({x: 100, y: 100});
    expect(oppose.x).toBeCloseTo(((1137 + 55) / 1248) * 100, 3);
    expect(oppose.y).toBeCloseTo(((1491 + 109) / 1741) * 100, 3);
  });

  it('convertit une région (Jungle de Qo et jungle de Qush)', () => {
    const qush = positionSurCarteHd({x: 26.4, y: 59});
    expect(qush.x).toBeCloseTo(28.459, 2);
    expect(qush.y).toBeCloseTo(56.789, 2);
  });
});
