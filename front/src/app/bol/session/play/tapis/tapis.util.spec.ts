import {describe, expect, it} from 'vitest';
import {BolFightSessionModel} from '../../../models/bol-fight-session.model';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {buildTapisCards,
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
  vitaliteText, revealDelta, heroHeaderStats, heroDetails, heroIdentityLine} from './tapis.util';

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
    const unequipped = session({heros: [hero(1, 'Kalena', {heros: {...hero(1, 'Kalena').heros, armes: [{arme: {arme: 'Épée', degats: 'd6B'}, equipee: false}]}})]});
    expect(buildTapisCards(unequipped)[0].degats).toBe('—');
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

describe('revealDelta', () => {
  // Zone visible de 100 à 500, marge de 12.
  const reveal = (start: number, end: number) => revealDelta(start, end, 100, 500, 12);

  it('does not move when the item is already fully visible', () => {
    expect(reveal(150, 450)).toBe(0);
  });

  it('moves forward just enough to show an item cut off at the end', () => {
    expect(reveal(300, 620)).toBe(132);
  });

  it('moves back just enough to show an item cut off at the start', () => {
    expect(reveal(40, 300)).toBe(-72);
  });

  it('aligns the start of an item wider than the visible area', () => {
    expect(reveal(300, 900)).toBe(188);
    expect(reveal(20, 700)).toBe(-92);
  });

  it('keeps an item that touches the edge inside the margin', () => {
    expect(reveal(200, 495)).toBe(7);
  });
});

describe('heroHeaderStats', () => {
  const hero = (overrides: Record<string, unknown> = {}): BolHerosModel =>
    ({
      combat: {initiative: 2, initiative_effective: 1, melee: 4, tir: 2, defense: 1, defense_effective: 2},
      armes: [{arme: {arme: 'Épée', degats: 'd6B'}}],
      armures: [
        {armure_id: 1, equipee: false, armure: {categorie: 'armure', protection: 'd6-2 (1)'}},
        {armure_id: 2, equipee: true, armure: {categorie: 'armure', protection: 'd6-3 (1)'}},
      ],
      ...overrides,
    }) as unknown as BolHerosModel;

  const values = (stats: ReturnType<typeof heroHeaderStats>) => Object.fromEntries(stats.map((stat) => [stat.label, stat.value]));

  it('lists initiative, melee, shot, defence, protection and damage, in that order', () => {
    expect(heroHeaderStats(hero()).map((stat) => stat.label)).toEqual(['Init.', 'Mêlée', 'Tir', 'Déf.', 'Prot.', 'Dég.']);
  });

  it('uses the effective initiative and defence, which include the equipment', () => {
    expect(values(heroHeaderStats(hero()))).toMatchObject({'Init.': '1', Mêlée: '4', Tir: '2', 'Déf.': '2'});
  });

  it('shows the protection of the equipped armour, not the first one owned', () => {
    expect(values(heroHeaderStats(hero()))['Prot.']).toBe('d6-3 (1)');
  });

  it('shows the damage of the first weapon that has any', () => {
    const armes = [{arme: {arme: 'Bâton', degats: null}}, {arme: {arme: 'Épée', degats: 'd6B'}}];
    expect(values(heroHeaderStats(hero({armes})))['Dég.']).toBe('d6B');
  });

  it('takes the damage from an equipped weapon only, and shows a dash when none is equipped', () => {
    const armes = [{arme: {arme: 'Épée', degats: 'd6B'}, equipee: false}, {arme: {arme: 'Dague', degats: 'd6M'}, equipee: true}];
    expect(values(heroHeaderStats(hero({armes})))['Dég.']).toBe('d6M');
    const unequipped = [{arme: {arme: 'Épée', degats: 'd6B'}, equipee: false}];
    expect(values(heroHeaderStats(hero({armes: unequipped})))['Dég.']).toBe('—');
  });

  it('shows a dash when there is no equipped armour, no weapon, or only unloaded ids', () => {
    const none = values(heroHeaderStats(hero({armures: [{armure_id: 1, equipee: false, armure: {categorie: 'armure', protection: 'd6'}}], armes: []})));
    expect(none['Prot.']).toBe('—');
    expect(none['Dég.']).toBe('—');
    const ids = values(heroHeaderStats(hero({armures: [3, 4], armes: [5]})));
    expect(ids['Prot.']).toBe('—');
    expect(ids['Dég.']).toBe('—');
  });

  it('ignores an equipped shield or helmet when looking for the body armour protection', () => {
    const armures = [{armure_id: 7, equipee: true, armure: {categorie: 'bouclier', protection: null}}];
    expect(values(heroHeaderStats(hero({armures})))['Prot.']).toBe('—');
  });
});

describe('heroDetails', () => {
  const hero = (overrides: Record<string, unknown> = {}): BolHerosModel =>
    ({
      id: 'abc',
      active: true,
      origines: {joueur: 'Léa', region: {region: 'Nord'}, commentaire: 'Prudente.'},
      traits: [
        {type: 'A', detail: 'Au Nord', traitable: {avantage: 'Ami des bêtes'}},
        {type: 'D', detail: null, traitable: {desavantage: 'Arrogant'}},
        {type: 'A', detail: null},
      ],
      carrieres: [
        {carriere: {carriere: 'Barbare'}, value: 3},
        {carriere: {carriere: 'Assassin'}, value: 2},
        {carriere: null, value: 9},
      ],
      armes: [
        {arme_id: 10, equipee: false, arme: {arme: 'Épée', degats: 'd6B', portee: null}},
        {arme_id: 11, equipee: true, arme: {arme: 'Arc', degats: 'd6', portee: 'Longue'}},
        7,
      ],
      armures: [
        {armure_id: 1, equipee: false, armure: {armure: 'Armure légère', categorie: 'armure', protection: 'd6-3(1)', malus: null}},
        {armure_id: 2, equipee: true, armure: {armure: 'Petit bouclier', categorie: 'bouclier', protection: 'Malus de -1', malus: null}},
        {armure_id: 3, equipee: false, armure: {armure: 'Casque', categorie: 'casque', protection: '+1', malus: 'Vue réduite'}},
        9,
      ],
      ...overrides,
    }) as unknown as BolHerosModel;

  it('lists the careers by name with their value, and skips a career whose catalogue entry is missing', () => {
    expect(heroDetails(hero()).carrieres).toEqual([
      {label: 'Barbare', value: 3},
      {label: 'Assassin', value: 2},
    ]);
  });

  it('lists the weapons with damage and range, equipped ones first, and skips ids that were not loaded', () => {
    expect(heroDetails(hero()).armes).toEqual([
      {id: 11, label: 'Arc', degats: 'd6', portee: 'Longue', equipee: true},
      {id: 10, label: 'Épée', degats: 'd6B', portee: null, equipee: false},
    ]);
  });

  it('counts a weapon without the flag as equipped', () => {
    const armes = [{arme_id: 12, arme: {arme: 'Dague', degats: 'd6M', portee: null}}];
    expect(heroDetails(hero({armes})).armes[0].equipee).toBe(true);
  });

  it('lists the armours with the equipped ones first, keeping the order otherwise', () => {
    const labels = heroDetails(hero()).armures.map((a) => [a.label, a.equipee]);
    expect(labels).toEqual([
      ['Petit bouclier', true],
      ['Armure légère', false],
      ['Casque', false],
    ]);
  });

  it('keeps the protection, the malus and the category of each armour', () => {
    expect(heroDetails(hero()).armures[2]).toEqual({
      id: 3,
      label: 'Casque',
      protection: '+1',
      malus: 'Vue réduite',
      categorie: 'casque',
      equipee: false,
    });
  });

  it('lists the advantages and disadvantages with their detail, and skips a trait without catalogue entry', () => {
    expect(heroDetails(hero()).traits).toEqual([
      {label: 'Ami des bêtes', detail: 'Au Nord', kind: 'avantage'},
      {label: 'Arrogant', detail: null, kind: 'desavantage'},
    ]);
  });

  it('gathers the player, the region and the comment, and says whether the hero is still being created', () => {
    expect(heroDetails(hero()).infos).toEqual({joueur: 'Léa', region: 'Nord', commentaire: 'Prudente.', enCours: false});
    const draft = heroDetails(hero({active: false, origines: {joueur: null, region: null}}));
    expect(draft.infos).toEqual({joueur: null, region: null, commentaire: null, enCours: true});
  });

  it('gives the edit route of the hero sheet, and none for a hero without id', () => {
    expect(heroDetails(hero()).editRoute).toEqual(['/create/hero', 'abc']);
    expect(heroDetails(hero({id: null})).editRoute).toBeNull();
  });

  it('returns empty lists for a hero with no gear', () => {
    const empty = heroDetails(hero({carrieres: [], armes: [], armures: [], traits: []}));
    expect([empty.carrieres, empty.armes, empty.armures, empty.traits]).toEqual([[], [], [], []]);
  });
});

describe('heroIdentityLine', () => {
  const infos = (joueur: string | null, region: string | null) => ({joueur, region, commentaire: null, enCours: false});

  it('puts the player first, then the region', () => {
    expect(heroIdentityLine(infos('Alice', 'Côte de Feu'))).toBe('Alice · Côte de Feu');
  });

  it('shows only what is known', () => {
    expect(heroIdentityLine(infos('Alice', null))).toBe('Alice');
    expect(heroIdentityLine(infos(null, 'Côte de Feu'))).toBe('Côte de Feu');
  });

  it('is empty when nothing is known', () => {
    expect(heroIdentityLine(infos(null, null))).toBe('');
  });
});
