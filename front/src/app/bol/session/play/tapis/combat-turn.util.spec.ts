import {describe, expect, it} from 'vitest';
import {buildCombatStates, endTurn, firstStandingInstance, giveBackTurn, INITIAL_ETAT, isOut, normalizeEtat, orderCards, targetableKeys, targetLabel, tokenForCard, totalDefense, turnAnnouncement, turnState} from './combat-turn.util';
import {EtatCombat, OrderedCard, TurnToken} from '../../models/combat-turn.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';

function card(kind: TapisKind, pivotId: number, extra: Partial<TapisCard> = {}): TapisCard {
  return {
    key: `${kind}-${pivotId}`,
    kind,
    camp: kind === 'hero' ? 'heros' : 'adversaires',
    pivotId,
    sourceId: 'src',
    nom: `${kind} ${pivotId}`,
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '0',
    vitaliteCourante: 10,
    vitaliteMax: 10,
    instances: null,
    qty: 1,
    ...extra,
  };
}

function ordered(...cards: TapisCard[]): OrderedCard[] {
  return cards.map((c) => ({card: c, tier: null, lockedRound1: false}));
}

function etat(round: number, joues: string[] = [], defense: string[] = []): EtatCombat {
  return {round, joues, defense_totale: defense};
}

const KALENA = card('hero', 1);
const RORK = card('hero', 2);
const PRETRE = card('pnj', 7);
const LOT = card('creature', 3, {qty: 3, instances: [5, 1, 0], vitaliteMax: 5, vitaliteCourante: 5});

describe('normalizeEtat', () => {
  it('starts at round 1 with nobody played when there is no state', () => {
    expect(normalizeEtat(null)).toEqual(INITIAL_ETAT);
    expect(normalizeEtat(undefined)).toEqual(INITIAL_ETAT);
    expect(normalizeEtat('x')).toEqual(INITIAL_ETAT);
  });

  it('keeps a valid state', () => {
    expect(normalizeEtat({round: 3, joues: ['hero-1'], defense_totale: ['pnj-7']})).toEqual(etat(3, ['hero-1'], ['pnj-7']));
  });

  it('repairs a malformed state: bad round, duplicates, non-string keys', () => {
    expect(normalizeEtat({round: 0, joues: ['hero-1', 'hero-1', 4, null, ''], defense_totale: 'x'})).toEqual(etat(1, ['hero-1']));
    expect(normalizeEtat({round: 2.7})).toEqual(etat(2));
  });
});

describe('orderCards', () => {
  const tokens: TurnToken[] = [
    {kind: 'hero', pivotId: 1, tier: 'reussite', lockedRound1: false},
    {kind: 'pnj', pivotId: 7, tier: 'coriace', lockedRound1: true},
    {kind: 'creature', pivotId: 3, tier: 'pietaille', lockedRound1: true},
    {kind: 'creature', pivotId: 3, tier: 'pietaille', lockedRound1: true},
    {kind: 'creature', pivotId: 3, tier: 'pietaille', lockedRound1: true},
    {kind: 'hero', pivotId: 2, tier: 'echec_critique', lockedRound1: true},
  ];
  const cards = [RORK, LOT, KALENA, PRETRE];

  it('follows the initiative order of the tokens, a batch counting once', () => {
    expect(orderCards(cards, tokens, null).map((o) => o.card.key)).toEqual(['hero-1', 'pnj-7', 'creature-3', 'hero-2']);
  });

  it('carries the tier and round-1 lock of each card', () => {
    const [first, second] = orderCards(cards, tokens, null);
    expect(first).toMatchObject({tier: 'reussite', lockedRound1: false});
    expect(second).toMatchObject({tier: 'coriace', lockedRound1: true});
  });

  it('applies the manual order first, then the remaining cards in initiative order', () => {
    expect(orderCards(cards, tokens, ['hero-2', 'creature-3']).map((o) => o.card.key)).toEqual([
      'hero-2',
      'creature-3',
      'hero-1',
      'pnj-7',
    ]);
  });

  it('ignores unknown and duplicated keys of the manual order', () => {
    expect(orderCards(cards, tokens, ['creature-3-0', 'hero-2', 'hero-2', 'pnj-99']).map((o) => o.card.key)).toEqual([
      'hero-2',
      'hero-1',
      'pnj-7',
      'creature-3',
    ]);
  });

  it('still lists a card that has no token', () => {
    expect(orderCards([KALENA, card('demon', 9)], tokens, null).map((o) => o.card.key)).toEqual(['hero-1', 'demon-9']);
  });
});

describe('isOut', () => {
  it('puts a hero out only below zero', () => {
    expect(isOut(card('hero', 1, {vitaliteCourante: 0}))).toBe(false);
    expect(isOut(card('hero', 1, {vitaliteCourante: -1}))).toBe(true);
  });

  it('puts a non-hero out at zero', () => {
    expect(isOut(card('pnj', 7, {vitaliteCourante: 1}))).toBe(false);
    expect(isOut(card('pnj', 7, {vitaliteCourante: 0}))).toBe(true);
  });

  it('puts a batch out only when every instance is down', () => {
    expect(isOut(LOT)).toBe(false);
    expect(isOut(card('creature', 3, {qty: 2, instances: [0, 0], vitaliteMax: 5}))).toBe(true);
  });

  it('never puts out a character without a tracked vitality', () => {
    expect(isOut(card('pnj', 7, {vitaliteCourante: 0, vitaliteMax: 0}))).toBe(false);
    expect(isOut(card('pnj', 7, {vitaliteCourante: null, vitaliteMax: null}))).toBe(false);
  });
});

describe('turnState', () => {
  const order = ordered(KALENA, PRETRE, RORK);

  it('makes the first card of the order active', () => {
    const state = turnState(order, etat(1));
    expect(state.activeKey).toBe('hero-1');
    expect([...state.statuses]).toEqual([['hero-1', 'active'], ['pnj-7', 'upcoming'], ['hero-2', 'upcoming']]);
  });

  it('moves to the next card that has not played', () => {
    const state = turnState(order, etat(1, ['hero-1']));
    expect(state.activeKey).toBe('pnj-7');
    expect(state.statuses.get('hero-1')).toBe('played');
  });

  it('skips a card that is out of combat', () => {
    const out = card('pnj', 7, {vitaliteCourante: 0});
    const state = turnState(ordered(KALENA, out, RORK), etat(1, ['hero-1']));
    expect(state.activeKey).toBe('hero-2');
    expect(state.statuses.get('pnj-7')).toBe('skipped');
  });

  it('skips a locked card in round 1 only', () => {
    const locked: OrderedCard[] = [{card: PRETRE, tier: 'coriace', lockedRound1: true}, ...ordered(KALENA)];
    expect(turnState(locked, etat(1)).activeKey).toBe('hero-1');
    expect(turnState(locked, etat(1)).statuses.get('pnj-7')).toBe('skipped');
    expect(turnState(locked, etat(2)).activeKey).toBe('pnj-7');
  });

  it('has no active card when everybody is out or has played', () => {
    expect(turnState(order, etat(1, ['hero-1', 'pnj-7', 'hero-2'])).activeKey).toBeNull();
    expect(turnState(ordered(card('pnj', 7, {vitaliteCourante: 0})), etat(1)).activeKey).toBeNull();
    expect(turnState([], etat(1)).activeKey).toBeNull();
  });
});

describe('endTurn', () => {
  const order = ordered(KALENA, PRETRE);

  it('marks the active card as played', () => {
    expect(endTurn(order, etat(1))).toEqual(etat(1, ['hero-1']));
  });

  it('starts the next round when everybody has played', () => {
    expect(endTurn(order, etat(1, ['hero-1']))).toEqual(etat(2));
  });

  it('moves to round 2 when only round-1-locked cards are left, so they get to play', () => {
    const locked: OrderedCard[] = [...ordered(KALENA), {card: PRETRE, tier: 'coriace', lockedRound1: true}];
    const next = endTurn(locked, etat(1));
    expect(next).toEqual(etat(2));
    expect(turnState(locked, next).activeKey).toBe('hero-1');
  });

  it('does not spin rounds when nobody can play any more', () => {
    const allOut = ordered(card('hero', 1, {vitaliteCourante: -2}), card('pnj', 7, {vitaliteCourante: 0}));
    expect(endTurn(allOut, etat(4))).toEqual(etat(4));
  });

  it('drops played keys of cards that left the table', () => {
    expect(endTurn(ordered(KALENA, PRETRE, RORK), etat(1, ['pnj-99']))).toEqual(etat(1, ['hero-1']));
  });

  it('lifts the total defense of the card that becomes active', () => {
    expect(endTurn(order, etat(1, [], ['pnj-7']))).toEqual(etat(1, ['hero-1'], []));
  });
});

describe('totalDefense', () => {
  it('marks the active card and ends its turn', () => {
    expect(totalDefense(ordered(KALENA, PRETRE), etat(1))).toEqual(etat(1, ['hero-1'], ['hero-1']));
  });

  it('keeps the marker through the round change, until that card plays again', () => {
    const order = ordered(KALENA, PRETRE);
    const afterPretre = totalDefense(order, etat(1, ['hero-1']));
    expect(afterPretre).toEqual(etat(2, [], ['pnj-7']));
    expect(endTurn(order, afterPretre)).toEqual(etat(2, ['hero-1'], []));
  });

  it('does nothing when nobody is active', () => {
    expect(totalDefense([], etat(1))).toEqual(etat(1));
  });
});

describe('total defense leaves with the turn', () => {
  it('is cancelled when the turn is given back to the card', () => {
    const order = ordered(KALENA, PRETRE);
    const defended = totalDefense(order, etat(1));
    expect(giveBackTurn(defended, 'hero-1')).toEqual(etat(1));
  });

  it('does not survive the turn of a card that became active without an end of turn', () => {
    // Le prêtre porte un marqueur du round précédent et devient actif parce que la carte active a
    // été retirée de la table : il joue, puis son marqueur doit avoir disparu.
    const order = ordered(PRETRE, KALENA);
    const stale = etat(2, [], ['pnj-7']);
    expect(buildCombatStates(order, stale).get('pnj-7')?.defenseTotale).toBe(false);
    expect(endTurn(order, stale)).toEqual(etat(2, ['pnj-7'], []));
  });
});

describe('giveBackTurn', () => {
  it('lets a card that has played play again this round', () => {
    expect(giveBackTurn(etat(2, ['hero-1', 'pnj-7']), 'hero-1')).toEqual(etat(2, ['pnj-7']));
  });

  it('leaves the state unchanged for a card that has not played', () => {
    expect(giveBackTurn(etat(2, ['pnj-7']), 'hero-1')).toEqual(etat(2, ['pnj-7']));
  });
});

describe('targetableKeys', () => {
  const ally = card('pnj', 8, {camp: 'heros'});
  const out = card('pnj', 9, {vitaliteCourante: 0});
  const order = ordered(KALENA, RORK, ally, PRETRE, LOT, out);

  it('offers the opposite camp of the active card, minus cards out of combat', () => {
    expect([...targetableKeys(order, 'hero-1')].sort()).toEqual(['creature-3', 'pnj-7']);
  });

  it('lets an adversary target heroes and their allies', () => {
    expect([...targetableKeys(order, 'pnj-7')].sort()).toEqual(['hero-1', 'hero-2', 'pnj-8']);
  });

  it('offers nothing when nobody is active', () => {
    expect(targetableKeys(order, null).size).toBe(0);
  });
});

describe('buildCombatStates', () => {
  it('describes every card: turn status, targetable, total defense, out, locked', () => {
    const order: OrderedCard[] = [...ordered(KALENA, RORK), {card: PRETRE, tier: 'coriace', lockedRound1: true}];
    const states = buildCombatStates(order, etat(1, [], ['hero-2']));
    expect(states.get('hero-1')).toEqual({status: 'active', targetable: false, defenseTotale: false, out: false, locked: false});
    expect(states.get('hero-2')).toEqual({status: 'upcoming', targetable: false, defenseTotale: true, out: false, locked: false});
    expect(states.get('pnj-7')).toEqual({status: 'skipped', targetable: true, defenseTotale: false, out: false, locked: true});
  });

  it('no longer flags the round-1 lock after round 1', () => {
    const order: OrderedCard[] = [{card: PRETRE, tier: 'coriace', lockedRound1: true}];
    expect(buildCombatStates(order, etat(2)).get('pnj-7')?.locked).toBe(false);
  });
});

describe('targets in a batch', () => {
  it('aims at the first instance still standing', () => {
    expect(firstStandingInstance(LOT)).toBe(0);
    expect(firstStandingInstance(card('creature', 3, {qty: 3, instances: [0, 0, 4]}))).toBe(2);
  });

  it('falls back on the first instance when the whole batch is down', () => {
    expect(firstStandingInstance(card('creature', 3, {qty: 2, instances: [0, 0]}))).toBe(0);
  });

  it('uses instance 0 for a single creature or demon, and none for a hero or a PNJ', () => {
    expect(firstStandingInstance(card('demon', 9))).toBe(0);
    expect(firstStandingInstance(PRETRE)).toBeNull();
    expect(firstStandingInstance(KALENA)).toBeNull();
  });

  it('names the targeted instance of a batch', () => {
    expect(targetLabel(card('creature', 3, {nom: 'Hippocampe', qty: 3, instances: [0, 2, 5]}))).toBe('Hippocampe #2');
    expect(targetLabel(card('pnj', 7, {nom: 'Prêtre'}))).toBe('Prêtre');
  });
});

describe('tokenForCard', () => {
  const tokens = [
    {kind: 'hero' as const, pivotId: 1, instanceIndex: null},
    {kind: 'creature' as const, pivotId: 3, instanceIndex: 0},
    {kind: 'creature' as const, pivotId: 3, instanceIndex: 1},
  ];

  it('finds the token of a hero or a PNJ', () => {
    expect(tokenForCard(tokens, KALENA, null)).toBe(tokens[0]);
  });

  it('finds the token of one instance of a batch', () => {
    expect(tokenForCard(tokens, LOT, 1)).toBe(tokens[2]);
  });

  it('returns null when the card has no token', () => {
    expect(tokenForCard(tokens, PRETRE, null)).toBeNull();
    expect(tokenForCard(tokens, LOT, 5)).toBeNull();
  });
});

describe('turnAnnouncement', () => {
  it('says the round and whose turn it is', () => {
    expect(turnAnnouncement(ordered(card('hero', 1, {nom: 'Kalena'})), etat(2))).toBe('Round 2. À Kalena de jouer.');
  });

  it('says when nobody can play', () => {
    expect(turnAnnouncement([], etat(1))).toBe('Round 1. Plus personne ne peut jouer.');
  });
});
