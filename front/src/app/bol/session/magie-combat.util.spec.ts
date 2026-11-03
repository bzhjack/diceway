import {describe, expect, it} from 'vitest';
import {BolHerosModel} from '../models/bol-heros.model';
import {TapisCard} from './models/tapis.model';
import {SortSaisie} from './models/magie-combat.model';
import {
  cartesVisibles,
  CERCLES_SORT,
  changerCercle,
  coutSort,
  degatsSort,
  difficulteSort,
  issueSort,
  DIFFICULTES_SORT,
  modificateurSort,
  pouvoirSuffisant,
  ressourcesMagiques,
  saisieSortParDefaut,
  sortSansJet,
  surcoutArmure,
} from './magie-combat.util';

function saisie(over: Partial<SortSaisie> = {}): SortSaisie {
  return {...saisieSortParDefaut(), ...over};
}

describe('les cercles et les difficultés du livre (p. 151)', () => {
  it('gives each circle its base cost, its minimum and its typical difficulties', () => {
    expect(CERCLES_SORT.map((c) => [c.cercle, c.coutBase, c.coutMin, c.difficultes])).toEqual([
      [0, 1, 1, ['automatique', 'tres-facile', 'facile']],
      [1, 5, 2, ['moyenne', 'ardue']],
      [2, 10, 6, ['difficile', 'tres-difficile']],
      [3, 15, 11, ['impossible', 'heroique']],
    ]);
  });

  it('follows the ladder of difficulties, automatic having no roll', () => {
    expect(DIFFICULTES_SORT.map((d) => d.valeur)).toEqual([null, 2, 1, 0, -1, -2, -4, -6, -8]);
    expect(difficulteSort('ardue').valeur).toBe(-1);
    expect(difficulteSort('inconnue').slug).toBe('moyenne');
  });
});

describe('saisieSortParDefaut / changerCercle', () => {
  it('starts on a 1st circle spell, Moyenne, with its one compulsory condition, harmless', () => {
    expect(saisieSortParDefaut()).toEqual({cercle: 1, difficulte: 'moyenne', conditions: 1, coutCharme: 1, blessant: false, espritCible: false});
  });

  it('takes the first typical difficulty of the new circle', () => {
    expect(changerCercle(saisie(), 2)).toMatchObject({cercle: 2, difficulte: 'difficile', conditions: 1});
    expect(changerCercle(saisie({conditions: 3}), 0)).toMatchObject({cercle: 0, difficulte: 'facile'});
  });
});

describe('coutSort', () => {
  it('costs the base of the circle with its first condition', () => {
    expect(coutSort(saisie(), 0)).toEqual({base: 5, reduction: 0, armure: 0, total: 5});
  });

  it('takes 1 point off per extra condition, down to the minimum of the circle (Methyn Sarr: 1st circle, 2 conditions = 4)', () => {
    expect(coutSort(saisie({conditions: 2}), 0).total).toBe(4);
    expect(coutSort(saisie({conditions: 9}), 0)).toEqual({base: 5, reduction: 3, armure: 0, total: 2});
    // Methyn Sarr, 2nd circle with 4 conditions (p. 152) : 7 points.
    expect(coutSort(saisie({cercle: 2, conditions: 4}), 0).total).toBe(7);
    // Vulkfind, 3rd circle with 2 conditions (p. 153) : 14 points ; never under 11.
    expect(coutSort(saisie({cercle: 3, conditions: 2}), 0).total).toBe(14);
    expect(coutSort(saisie({cercle: 3, conditions: 12}), 0).total).toBe(11);
  });

  it('adds the armour surcharge on top (p. 148), after the minimum', () => {
    expect(coutSort(saisie({conditions: 9}), 3)).toEqual({base: 5, reduction: 3, armure: 3, total: 5});
  });

  it('costs a charm 1 or 2 points, without conditions', () => {
    expect(coutSort(saisie({cercle: 0, coutCharme: 2, conditions: 4}), 1)).toEqual({base: 2, reduction: 0, armure: 1, total: 3});
  });
});

describe('modificateurSort', () => {
  it('adds esprit, the sorcerer rank and the difficulty', () => {
    expect(modificateurSort({esprit: 2, sorcier: 1, difficulte: -1, espritCible: null})).toBe(2);
  });

  it("takes the target's esprit off a mind-affecting spell (p. 148)", () => {
    expect(modificateurSort({esprit: 2, sorcier: 1, difficulte: 0, espritCible: 3})).toBe(0);
    expect(modificateurSort({esprit: 2, sorcier: 1, difficulte: 0, espritCible: -1})).toBe(4);
  });
});

describe('degatsSort', () => {
  it('hurts for d6 at the 1st circle (p. 150), 1 for a charm (Douleur), and d6 ×2 or ×3 above (interpretation)', () => {
    expect([0, 1, 2, 3].map((c) => degatsSort(c as 0 | 1 | 2 | 3))).toEqual(['1', 'd6', 'd6x2', 'd6x3']);
  });
});

describe('sortSansJet / pouvoirSuffisant', () => {
  it('needs no roll for an automatic charm only', () => {
    expect(sortSansJet(saisie({cercle: 0, difficulte: 'automatique'}))).toBe(true);
    expect(sortSansJet(saisie())).toBe(false);
  });

  it('casts only with enough power points', () => {
    expect(pouvoirSuffisant(5, 5)).toBe(true);
    expect(pouvoirSuffisant(4, 5)).toBe(false);
    expect(pouvoirSuffisant(null, 1)).toBe(false);
  });
});

describe('surcoutArmure', () => {
  const armure = (pts: string | null, equipee = true, categorie: 'armure' | 'casque' | 'bouclier' = 'armure') => ({
    armure_id: 1,
    equipee,
    armure: {id: 1, armure: 'A', protection: null, malus: null, pts_de_pouvoir: pts, categorie, malus_agilite: 0, malus_initiative: 0, malus_attaque_subie: 0, malus_attaque_subie_portee: null},
  });

  it('reads the power points of the worn armour (+1 light, +2 medium, +3 heavy)', () => {
    expect(surcoutArmure([armure('+2'), armure(null, true, 'casque')])).toBe(2);
    expect(surcoutArmure([armure('+3', false)])).toBe(0);
    expect(surcoutArmure([armure('+3', false)], true)).toBe(3);
    expect(surcoutArmure([7, 8])).toBe(0);
    expect(surcoutArmure(undefined)).toBe(0);
  });
});

describe('ressourcesMagiques', () => {
  const fiche = (over: Partial<BolHerosModel> = {}): BolHerosModel =>
    ({
      attributs: {vigueur: 0, agilite: 0, agilite_effective: 0, esprit: 2, aura: 0},
      ressources: {vitalite: 10, heroisme: 5, foi: 0, pouvoir: 0, vilenie: 0, creation: 0, experience: 0},
      carrieres: [],
      traits: [],
      armures: [],
      ...over,
    }) as unknown as BolHerosModel;

  it('has neither faith nor power without the careers nor points', () => {
    expect(ressourcesMagiques(fiche())).toEqual({esprit: 2, foi: null, pouvoir: null, sorcier: null, surcoutArmure: 0, magieRoisSorciers: false, resistantMagie: false});
  });

  it('gives a priest of rank 2 his faith, and a sorcerer his rank and power', () => {
    const pretre = fiche({carrieres: [{carriere_id: 21, value: 2}], ressources: {vitalite: 10, heroisme: 5, foi: 1, pouvoir: 0, vilenie: 0, creation: 0, experience: 0}});
    expect(ressourcesMagiques(pretre)).toMatchObject({foi: 1, pouvoir: null, sorcier: null});
    const sorcier = fiche({carrieres: [{carriere_id: 24, value: 0}], ressources: {vitalite: 10, heroisme: 5, foi: 0, pouvoir: 10, vilenie: 0, creation: 0, experience: 0}});
    expect(ressourcesMagiques(sorcier)).toMatchObject({foi: null, pouvoir: 10, sorcier: 0});
  });

  it('keeps a spent pool at 0, and reads a current pool from the table (a NPC)', () => {
    const pretre = fiche({carrieres: [{carriere_id: 21, value: 2}]});
    expect(ressourcesMagiques(pretre).foi).toBe(0);
    const sorcier = fiche({carrieres: [{carriere_id: 24, value: 2}], ressources: {vitalite: 10, heroisme: 0, foi: 0, pouvoir: 12, vilenie: 0, creation: 0, experience: 0}});
    expect(ressourcesMagiques(sorcier, {pouvoir: 7, foi: null}).pouvoir).toBe(7);
  });

  it('knows the King-Sorcerers magic (bonus die to cast) and the magic resistance', () => {
    const traits = [
      {traitable_id: 30, type: 'A', detail: null, region_id: null, carriere: null},
      {traitable_id: 47, type: 'A', detail: null, region_id: null, carriere: null},
    ] as BolHerosModel['traits'];
    expect(ressourcesMagiques(fiche({traits}))).toMatchObject({magieRoisSorciers: true, resistantMagie: true});
  });
});

describe('cartesVisibles', () => {
  const card = (key: string, vitaliteCourante: number | null = 5): TapisCard => ({key, vitaliteCourante}) as TapisCard;

  it('keeps the cards still in the fight and standing', () => {
    expect(cartesVisibles([card('hero-1'), card('pnj-2', 0), card('pnj-3'), card('creature-4', null)], ['pnj-3']).map((c) => c.key)).toEqual(['hero-1', 'creature-4']);
  });
});

describe('issueSort', () => {
  it('succeeds at 9 or more, like any action roll', () => {
    expect(issueSort(null, 5, 9, true)).toBe('reussite');
    expect(issueSort(null, 5, 8, true)).toBe('echec');
  });

  it('fails on a double 1 and succeeds on a double 6, whatever the total', () => {
    expect(issueSort([1, 1], 2, 12, true)).toBe('echec');
    expect(issueSort([6, 6], 12, 7, true)).toBe('reussite');
  });

  it('makes a double 6 above the threshold a heroic success, for the heroes and their allies only', () => {
    expect(issueSort([6, 6], 12, 14, true)).toBe('heroique');
    expect(issueSort([6, 6], 12, 14, false)).toBe('reussite');
  });
});
