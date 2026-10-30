import {describe, expect, it} from 'vitest';
import {armeFamille} from './arme-icon.util';

describe('armeFamille', () => {
  it.each([
    ['Épée', 'epee'],
    ['Rapière', 'epee'],
    ['Sabre à l’hippocampe', 'epee'],
    ['Épée / hache à 2 mains', 'hache'],
    ['Kriss halakhi damasquiné', 'dague'],
    ['Poignard d\'acolyte', 'dague'],
    ['Arme d’hast', 'lance'],
    ['Javelot / fléchette', 'lance'],
    ['Arbalète lourde', 'arbalete'],
    ['Arc de guerre de Tyrus', 'arc'],
    ['Fronde / bâton-fronde', 'fronde'],
    ['Bâton-sceptre de Jaoor', 'baton'],
    ['Morgenstern', 'masse'],
    ['Fléau', 'masse'],
    ['Mains nues', 'poing'],
    ['Poings d\'Angus', 'poing'],
    ['Morsure de slorth', 'morsure'],
    ['Arme improvisée', 'improvisee'],
    ['Armes diverses (piétaille)', 'diverses'],
    [null, 'diverses'],
  ] as const)('%s → %s', (nom, famille) => {
    expect(armeFamille(nom)).toBe(famille);
  });
});
