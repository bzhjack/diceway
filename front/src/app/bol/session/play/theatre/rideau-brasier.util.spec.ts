import {champDeBrulure, frontDeFeu} from './rideau-brasier.util';

describe('champDeBrulure', () => {
  const LARGEUR = 200;
  const HAUTEUR = 40;
  const moyenne = (champ: Float32Array, garde: (x: number, y: number) => boolean): number => {
    const valeurs = [...champ].filter((_, i) => garde(i % LARGEUR, Math.floor(i / LARGEUR)));
    return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
  };

  it('brûle le bas d’abord, par défaut', () => {
    const champ = champDeBrulure(LARGEUR, HAUTEUR);

    expect(moyenne(champ, (_, y) => y > 34)).toBeLessThan(moyenne(champ, (_, y) => y < 5));
  });

  it('brûle la gauche d’abord dans le sens latéral, et reste dans ses bornes', () => {
    const champ = champDeBrulure(LARGEUR, HAUTEUR, 'lateral');

    expect(moyenne(champ, (x) => x < 20)).toBeLessThan(moyenne(champ, (x) => x > 180) - 0.5);
    expect(Math.min(...champ)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...champ)).toBeLessThanOrEqual(1);
  });
});

describe('frontDeFeu', () => {
  it('monte du bas vers le haut, ou avance de gauche à droite', () => {
    expect(frontDeFeu(0.2, 'montant')).toBeGreaterThan(frontDeFeu(0.6, 'montant'));
    expect(frontDeFeu(0.2, 'lateral')).toBeLessThan(frontDeFeu(0.6, 'lateral'));
  });
});
