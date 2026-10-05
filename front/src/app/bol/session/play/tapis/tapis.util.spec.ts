import {describe, expect, it} from 'vitest';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {
  buildTapisCards,
  campActionLabel,
  cardAriaLabel,
  cardLabel,
  findCard,
  isLowVitalite,
  removeActionLabel,
  splitRows,
  TapisCard,
  vitalitePercent,
  vitaliteSteppers,
  vitaliteText,
} from './tapis.util';

function hero(id: number, nom: string, extra: Record<string, unknown> = {}): NonNullable<BolFightSessionModel['heros']>[number] {
  return {
    id,
    fight_session_id: 's',
    heros_id: `h${id}`,
    camp: 'heros',
    initiative_resultat: null,
    vitalite_courante: 9,
    heros: {
      id: `h${id}`,
      origines: {nom, avatar: null, joueur: null},
      ressources: {vitalite: 11, heroisme: 4},
      combat: {defense: 1, defense_effective: 0},
      armes: [{arme: {arme: 'Dague', degats: 'd6B'}}],
    },
    ...extra,
  } as NonNullable<BolFightSessionModel['heros']>[number];
}

const PNJ = {
  id: 7, fight_session_id: 's', pnj_id: 'p1', camp: 'adversaires', surnom: null, rang: 'coriace', nom: 'Prêtre de Shazzadion',
  vigueur: 0, agilite: 0, esprit: 1, aura: 0, melee: 1, tir: 0, defense: 0, vitalite_max: 6, vitalite_courante: 2,
  armes: [{nom: 'Dague', degats: 'd6B', type: 'M'}],
};

const CREATURE = {
  id: 3, fight_session_id: 's', creature_id: '48', camp: 'adversaires', qty: 3, surnom: null, rang: 'pietaille', nom: 'Hippocampe',
  vigueur: 1, agilite: 1, esprit: 0, vitalite_max: 5, vitalite_courante: 5, vitalite_instances: [5, 1, 0],
  attaque: 1, defense: 1, degats: 'd6', protection: null, id_taille: 1, capacites: null,
};

const DEMON = {
  id: 9, fight_session_id: 's', demon_id: 'd1', camp: 'adversaires', qty: 1, surnom: 'Le Voilé', rang: 'rival', nom: 'Mazallakos',
  vigueur: 3, agilite: 2, esprit: 2, aura: 3, melee: 2, tir: 0, defense: 2, vitalite_max: 20, vitalite_courante: 20,
  vitalite_instances: [20], degats: 'd6+3', pouvoirs: null,
};

function session(overrides: Partial<BolFightSessionModel> = {}): BolFightSessionModel {
  return {
    id: 's',
    titre: null,
    statut: 'libre',
    heros: [hero(1, 'Kalena')],
    pnjs: [PNJ],
    creatures: [CREATURE],
    demons: [DEMON],
    ...overrides,
  } as BolFightSessionModel;
}

function card(key: string, s = session()): TapisCard {
  return buildTapisCards(s).find((c) => c.key === key)!;
}

describe('buildTapisCards', () => {
  it('builds one card per session row, keyed by kind and row id', () => {
    expect(buildTapisCards(session()).map((c) => c.key)).toEqual(['hero-1', 'pnj-7', 'creature-3', 'demon-9']);
  });

  it('puts damage, effective defense and session vitality on a hero face', () => {
    expect(card('hero-1')).toMatchObject({
      nom: 'Kalena', degats: 'd6B', defense: '0', vitaliteCourante: 9, vitaliteMax: 11, badge: null, rang: null, qty: 1,
    });
  });

  it('shows a dash for the damage of a hero without a weapon, or whose weapons are not loaded', () => {
    const none = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: []}})]});
    const missing = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: undefined}})]});
    const noDamage = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: [{arme: {arme: 'Filet', degats: null}}]}})]});
    expect(card('hero-1', none).degats).toBe('—');
    expect(card('hero-1', missing).degats).toBe('—');
    expect(card('hero-1', noDamage).degats).toBe('—');
  });

  it('keeps a negative vitality for a dying hero', () => {
    const dying = session({heros: [hero(1, 'Kalena', {vitalite_courante: -3})]});
    expect(card('hero-1', dying).vitaliteCourante).toBe(-3);
  });

  it('labels a PNJ with its rank and reads its first weapon', () => {
    expect(card('pnj-7')).toMatchObject({badge: 'Coriace', rang: 'Coriace', degats: 'd6B', defense: '0', vitaliteCourante: 2, vitaliteMax: 6});
  });

  it('labels a non-hero in the heroes camp as an ally', () => {
    const s = session({pnjs: [{...PNJ, camp: 'heros'}] as BolFightSessionModel['pnjs']});
    expect(card('pnj-7', s).badge).toBe('Allié');
    expect(card('pnj-7', s).rang).toBe('Coriace');
  });

  it('builds a single card for a batch, with one gauge per instance and a ×N badge', () => {
    expect(card('creature-3')).toMatchObject({qty: 3, badge: '×3', rang: 'Piétaille', instances: [5, 1, 0], degats: 'd6', defense: '1', vitaliteMax: 5});
  });

  it('fills the missing gauges of a batch from its current vitality', () => {
    const nullInstances = session({creatures: [{...CREATURE, vitalite_instances: null}] as BolFightSessionModel['creatures']});
    const shortInstances = session({creatures: [{...CREATURE, vitalite_instances: [2]}] as BolFightSessionModel['creatures']});
    expect(card('creature-3', nullInstances).instances).toEqual([5, 5, 5]);
    expect(card('creature-3', shortInstances).instances).toEqual([2, 5, 5]);
  });

  it('has no gauges for a single creature or demon, and uses its nickname', () => {
    expect(card('demon-9')).toMatchObject({nom: 'Le Voilé', instances: null, badge: 'Rival', vitaliteCourante: 20, qty: 1});
  });

  it('still builds the card when the library source was deleted', () => {
    const s = session({pnjs: [{...PNJ, pnj_id: null}] as BolFightSessionModel['pnjs']});
    expect(card('pnj-7', s)).toMatchObject({sourceId: null, nom: 'Prêtre de Shazzadion'});
  });

  it('returns no card for an empty session', () => {
    expect(buildTapisCards({id: 's', titre: null, statut: 'libre'})).toEqual([]);
  });
});

describe('splitRows', () => {
  it('puts adversaries on top (PNJ, creatures, demons) and heroes below', () => {
    const rows = splitRows(buildTapisCards(session()));
    expect(rows.presents.map((c) => c.key)).toEqual(['pnj-7', 'creature-3', 'demon-9']);
    expect(rows.heros.map((c) => c.key)).toEqual(['hero-1']);
  });

  it('puts allies after the heroes in the bottom row', () => {
    const s = session({
      heros: [hero(2, 'Rork'), hero(1, 'Kalena')],
      pnjs: [{...PNJ, camp: 'heros'}] as BolFightSessionModel['pnjs'],
    });
    const rows = splitRows(buildTapisCards(s));
    expect(rows.heros.map((c) => c.key)).toEqual(['hero-1', 'hero-2', 'pnj-7']);
    expect(rows.presents.map((c) => c.key)).toEqual(['creature-3', 'demon-9']);
  });

  it('orders cards of the same kind by arrival', () => {
    const s = session({pnjs: [{...PNJ, id: 12}, {...PNJ, id: 4}] as BolFightSessionModel['pnjs'], creatures: [], demons: []});
    expect(splitRows(buildTapisCards(s)).presents.map((c) => c.key)).toEqual(['pnj-4', 'pnj-12']);
  });
});

describe('findCard', () => {
  const cards = buildTapisCards(session());

  it('finds a card by key', () => {
    expect(findCard(cards, 'creature-3')?.nom).toBe('Hippocampe');
  });

  it('returns null for a card that is no longer on the table, or when nothing is expanded', () => {
    expect(findCard(cards, 'pnj-99')).toBeNull();
    expect(findCard(cards, null)).toBeNull();
  });
});

describe('labels', () => {
  it('names a batch with its count', () => {
    expect(cardLabel(card('creature-3'))).toBe('Hippocampe ×3');
    expect(cardLabel(card('pnj-7'))).toBe('Prêtre de Shazzadion');
  });

  it('writes the vitality of a face', () => {
    expect(vitaliteText(card('pnj-7'))).toBe('2/6');
    expect(vitaliteText(card('creature-3'))).toBe('5');
  });

  it('describes a card for screen readers', () => {
    expect(cardAriaLabel(card('pnj-7'))).toBe('Prêtre de Shazzadion, PNJ, Coriace, dégâts d6B, défense 0, vitalité 2 sur 6');
    expect(cardAriaLabel(card('hero-1'))).toBe('Kalena, Héros, dégâts d6B, défense 0, vitalité 9 sur 11');
    expect(cardAriaLabel(card('creature-3'))).toBe('Hippocampe, Créature, lot de 3, dégâts d6, défense 1, vitalité 5 par exemplaire');
  });

  it('offers to change camp, except for a hero', () => {
    expect(campActionLabel(card('hero-1'))).toBeNull();
    expect(campActionLabel(card('pnj-7'))).toBe('Passer du côté des héros');
    const ally = session({pnjs: [{...PNJ, camp: 'heros'}] as BolFightSessionModel['pnjs']});
    expect(campActionLabel(card('pnj-7', ally))).toBe('Remettre avec les présents');
  });

  it('names the removal after what it removes', () => {
    expect(removeActionLabel(card('pnj-7'))).toBe('Retirer de la table');
    expect(removeActionLabel(card('creature-3'))).toBe('Retirer un exemplaire');
  });
});

describe('vitalite helpers', () => {
  it('computes the fill of a vitality bar, clamped between 0 and 100', () => {
    expect(vitalitePercent(3, 6)).toBe(50);
    expect(vitalitePercent(-3, 11)).toBe(0);
    expect(vitalitePercent(20, 10)).toBe(100);
    expect(vitalitePercent(null, 10)).toBe(100);
    expect(vitalitePercent(5, 0)).toBe(100);
  });

  it('flags half vitality or less as low', () => {
    expect(isLowVitalite(3, 6)).toBe(true);
    expect(isLowVitalite(4, 6)).toBe(false);
    expect(isLowVitalite(-3, 11)).toBe(true);
    expect(isLowVitalite(null, 6)).toBe(false);
  });

  it('gives one stepper per instance of a batch, numbered from 1', () => {
    expect(vitaliteSteppers(card('creature-3'))).toEqual([
      {index: 0, label: '#1', value: 5},
      {index: 1, label: '#2', value: 1},
      {index: 2, label: '#3', value: 0},
    ]);
  });

  it('gives a single stepper otherwise, with instance 0 for a creature or demon and none for a PNJ', () => {
    expect(vitaliteSteppers(card('demon-9'))).toEqual([{index: 0, label: 'Vitalité', value: 20}]);
    expect(vitaliteSteppers(card('pnj-7'))).toEqual([{index: null, label: 'Vitalité', value: 2}]);
  });
});
