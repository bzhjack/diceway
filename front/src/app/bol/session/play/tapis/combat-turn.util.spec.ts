import {describe, expect, it} from 'vitest';
import {bloqueeCeRound, bouclierPerduRound1, debutDeTour, effetsDerives, endTurn, groupByTier, giveBackTurn, herosMourants, horsCombat, INITIAL_ETAT, isOut, normalizeEtat, orderCards, targetableKeys, tokenForCard, totalDefense, turnAnnouncement, turnState} from './combat-turn.util';
import {EtatCombat, OrderedCard, TurnToken} from '../../models/combat-turn.model';
import {TurnOrderEntry} from '../../models/turn-order.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {CombatEffect} from '../../models/combat-effect.model';
import {appliquerEvenement, effetAssomme, effetsDeTour, effetStabilise, modificateursPour} from './combat-effects.util';

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
    ...extra,
  };
}

function ordered(...cards: TapisCard[]): OrderedCard[] {
  return cards.map((c) => ({card: c, tier: null, lockedRound1: false}));
}

function defended(key: string, id = 'e-1'): CombatEffect {
  return {id, origine: 'defense-totale', porteur: key, stat: 'defense', valeur: 2, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false};
}

function etat(round: number, joues: string[] = [], effets: CombatEffect[] = []): EtatCombat {
  return {round, joues, effets, exclus: [], depart: {}};
}

const KALENA = card('hero', 1);
const RORK = card('hero', 2);
const PRETRE = card('pnj', 7);
const CREATURE = card('creature', 3, {vitaliteMax: 5, vitaliteCourante: 5});

describe('normalizeEtat', () => {
  it('starts at round 1 with nobody played when there is no state', () => {
    expect(normalizeEtat(null)).toEqual(INITIAL_ETAT);
    expect(normalizeEtat(undefined)).toEqual(INITIAL_ETAT);
    expect(normalizeEtat('x')).toEqual(INITIAL_ETAT);
  });

  it('keeps a valid state', () => {
    expect(normalizeEtat({round: 3, joues: ['hero-1'], effets: [defended('pnj-7')]})).toEqual(etat(3, ['hero-1'], [defended('pnj-7')]));
  });

  it('repairs a malformed state: bad round, duplicates, non-string keys', () => {
    expect(normalizeEtat({round: 0, joues: ['hero-1', 'hero-1', 4, null, ''], defense_totale: 'x'})).toEqual(etat(1, ['hero-1']));
    expect(normalizeEtat({round: 2.7})).toEqual(etat(2));
  });

  it('reads the starting vitalities, and an empty PHP array as none', () => {
    expect(normalizeEtat({round: 1, depart: {'hero-1': 11, 'pnj-2': '8', 'pnj-3': 2.5}}).depart).toEqual({'hero-1': 11});
    expect(normalizeEtat({round: 1, depart: []}).depart).toEqual({});
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
  const cards = [RORK, CREATURE, KALENA, PRETRE];

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
  it('puts a hero out at zero or below, like everyone', () => {
    expect(isOut(card('hero', 1, {vitaliteCourante: 1}))).toBe(false);
    expect(isOut(card('hero', 1, {vitaliteCourante: 0}))).toBe(true);
    expect(isOut(card('hero', 1, {vitaliteCourante: -1}))).toBe(true);
  });

  it('tells why a card is out', () => {
    expect(horsCombat(card('hero', 1, {vitaliteCourante: 1}))).toBeNull();
    expect(horsCombat(card('hero', 1, {vitaliteCourante: 0}))).toBe('inconscient');
    expect(horsCombat(card('hero', 1, {vitaliteCourante: -5}))).toBe('mourant');
    expect(horsCombat(card('hero', 1, {vitaliteCourante: -6}))).toBe('mort');
    expect(horsCombat(card('pnj', 7, {vitaliteCourante: 0}))).toBe('hors de combat');
  });

  it('says a hero below zero is stabilized once the effect is on him', () => {
    const stabilise = appliquerEvenement([], {type: 'ajout-manuel', effet: effetStabilise('hero-1')}, () => 'e-1');
    expect(horsCombat(card('hero', 1, {vitaliteCourante: -3}), stabilise)).toBe('stabilisé');
    expect(horsCombat(card('hero', 1, {vitaliteCourante: -7}), stabilise)).toBe('stabilisé');
    expect(horsCombat(card('hero', 1, {vitaliteCourante: 0}), stabilise)).toBe('inconscient');
    expect(horsCombat(card('hero', 2, {vitaliteCourante: -3}), stabilise)).toBe('mourant');
  });

  it('says a hero knocked to zero in a brawl is only knocked out', () => {
    const assomme = appliquerEvenement([], {type: 'ajout-manuel', effet: effetAssomme('hero-1')}, () => 'e-1');
    expect(horsCombat(card('hero', 1, {vitaliteCourante: 0}), assomme)).toBe('assommé');
    expect(horsCombat(card('hero', 2, {vitaliteCourante: 0}), assomme)).toBe('inconscient');
  });

  it('lists the dying heroes who lose 1 vitality at the start of a round', () => {
    const dying = card('hero', 1, {vitaliteCourante: -2});
    const steady = card('hero', 2, {vitaliteCourante: -4});
    const dead = card('hero', 3, {vitaliteCourante: -6});
    const removed = card('hero', 4, {vitaliteCourante: -1});
    const stabilise = appliquerEvenement([], {type: 'ajout-manuel', effet: effetStabilise(steady.key)}, () => 'e-1');
    const cards = [dying, steady, dead, removed, card('hero', 5, {vitaliteCourante: 0}), card('pnj', 7, {vitaliteCourante: -2})];
    expect(herosMourants(cards, {...etat(2, [], [...stabilise]), exclus: [removed.key]}).map((c) => c.key)).toEqual([dying.key]);
  });

  it('puts a non-hero out at zero', () => {
    expect(isOut(card('pnj', 7, {vitaliteCourante: 1}))).toBe(false);
    expect(isOut(card('pnj', 7, {vitaliteCourante: 0}))).toBe(true);
  });

  it('puts a creature out at zero', () => {
    expect(isOut(CREATURE)).toBe(false);
    expect(isOut(card('creature', 3, {vitaliteCourante: 0, vitaliteMax: 5}))).toBe(true);
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

  it('forgets the shield spent this round when a new round starts, and keeps it within the round', () => {
    const spent: CombatEffect = {id: 'e-1', origine: 'bouclier-depense', porteur: 'pnj-7', stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false};
    const attacked: EtatCombat = {...etat(1), effets: [spent]};

    expect(endTurn(order, attacked).effets).toEqual([spent]);
    expect(endTurn(order, {...attacked, joues: ['hero-1']}).effets).toEqual([]);
  });

  it('applies the creations of the turn: a posture lasts until that card plays again', () => {
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const apres = endTurn(order, etat(1), crees);
    expect(apres.effets.map((e) => [e.origine, e.porteur])).toEqual([['posture-defensive', 'hero-1']]);
    const nextRound = endTurn(order, {...apres, joues: ['hero-1']});
    expect(nextRound.round).toBe(2);
    expect(nextRound.effets).toEqual([]);
  });

  it('expires the effects of a card that is alone and becomes active again right away', () => {
    const alone = ordered(KALENA);
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const apres = endTurn(alone, etat(1), crees);
    expect(apres.round).toBe(2);
    expect(apres.effets).toEqual([]);
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
    expect(endTurn(order, etat(1, [], [defended('pnj-7')]))).toEqual(etat(1, ['hero-1']));
  });
});

describe('totalDefense', () => {
  it('marks the active card and ends its turn', () => {
    expect(totalDefense(ordered(KALENA, PRETRE), etat(1))).toEqual(etat(1, ['hero-1'], [defended('hero-1')]));
  });

  it('keeps the marker through the round change, until that card plays again', () => {
    const order = ordered(KALENA, PRETRE);
    const afterPretre = totalDefense(order, etat(1, ['hero-1']));
    expect(afterPretre).toEqual(etat(2, [], [defended('pnj-7')]));
    expect(endTurn(order, afterPretre)).toEqual(etat(2, ['hero-1']));
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
    const stale = etat(2, [], [defended('pnj-7')]);
    expect(endTurn(order, stale)).toEqual(etat(2, ['pnj-7']));
  });
});

describe('giveBackTurn et parade', () => {
  it('cancels a parade (one use, until the next turn) together with the turn it came from', () => {
    const parade: CombatEffect = {id: 'e-1', origine: 'parade', porteur: 'hero-1', stat: 'defense', valeur: 1, quand: 'subie', duree: {type: 'usages', restants: 1, expireAuTour: true}, manuel: false};
    expect(giveBackTurn(etat(1, ['hero-1'], [parade]), 'hero-1')).toEqual(etat(1));
  });

  it('keeps the effects of other cards and the manual ones of the same card', () => {
    const manuel: CombatEffect = {id: 'e-2', origine: 'manuel', porteur: 'hero-1', stat: 'attaque', valeur: -1, quand: 'attaque', duree: {type: 'fin-round'}, manuel: true};
    const autre = defended('pnj-7', 'e-3');
    expect(giveBackTurn(etat(1, ['hero-1'], [manuel, autre]), 'hero-1').effets).toEqual([manuel, autre]);
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
  const order = ordered(KALENA, RORK, ally, PRETRE, CREATURE, out);

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

describe('tokenForCard', () => {
  const tokens = [
    {kind: 'hero' as const, pivotId: 1},
    {kind: 'creature' as const, pivotId: 3},
    {kind: 'creature' as const, pivotId: 4},
  ];

  it('finds the token of a card by kind and line id', () => {
    expect(tokenForCard(tokens, KALENA)).toBe(tokens[0]);
    expect(tokenForCard(tokens, CREATURE)).toBe(tokens[1]);
  });

  it('returns null when the card has no token', () => {
    expect(tokenForCard(tokens, PRETRE)).toBeNull();
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

describe('bloqueeCeRound', () => {
  it('blocks a card locked by the reaction roll during round 1 only', () => {
    expect(bloqueeCeRound(true, 1)).toBe(true);
    expect(bloqueeCeRound(true, 2)).toBe(false);
    expect(bloqueeCeRound(true, 5)).toBe(false);
  });

  it('never blocks a card that is not locked', () => {
    expect(bloqueeCeRound(false, 1)).toBe(false);
    expect(bloqueeCeRound(false, 2)).toBe(false);
  });
});

describe('groupByTier', () => {
  const entry = (key: string, tier: TurnOrderEntry['tier'], locked = false): TurnOrderEntry => ({
    key, nom: key, kind: 'hero', avatar: '', status: 'upcoming', tier, locked, ally: false, effets: [], horsCombat: null,
  });

  it('groups the combatants by reaction rank, in rulebook order', () => {
    const groups = groupByTier([entry('p1', 'pietaille'), entry('h1', 'reussite'), entry('r1', 'rival'), entry('h2', 'legendaire'), entry('c1', 'coriace'), entry('e1', 'echec')]);
    expect(groups.map((g) => g.id)).toEqual(['heros', 'rival', 'coriace', 'echec', 'pietaille', 'echec_critique']);
    expect(groups[0].entries.map((e) => e.key)).toEqual(['h1', 'h2']);
    expect(groups[5].entries).toEqual([]);
  });

  it('puts a hero without a known roll with the successful heroes', () => {
    expect(groupByTier([entry('h1', null)])[0].entries).toHaveLength(1);
  });

  it('marks a group as blocked only when everyone in it is locked', () => {
    const groups = groupByTier([entry('c1', 'coriace', true), entry('p1', 'pietaille', true), entry('p2', 'pietaille', false)]);
    expect(groups[2].blocked).toBe(true);
    expect(groups[4].blocked).toBe(false);
    expect(groups[1].blocked).toBe(false);
  });
});

describe('excluded cards', () => {
  const excluding = (...keys: string[]): EtatCombat => ({round: 1, joues: [], effets: [], exclus: keys, depart: {}});

  it('skips an excluded card, which never becomes active', () => {
    const turn = turnState(ordered(KALENA, RORK), excluding('hero-1'));
    expect(turn.statuses.get('hero-1')).toBe('skipped');
    expect(turn.activeKey).toBe('hero-2');
  });

  it('does not let an excluded card be targeted', () => {
    const order = ordered(KALENA, PRETRE, card('pnj', 8));
    const targetable = targetableKeys(order, 'hero-1', ['pnj-8']);
    expect(targetable.has('pnj-8')).toBe(false);
    expect(targetable.has('pnj-7')).toBe(true);
  });

  it('keeps the exclusions when a turn ends', () => {
    const next = endTurn(ordered(KALENA, RORK), excluding('pnj-7'));
    expect(next.exclus).toEqual(['pnj-7']);
  });

  it('reads them from the API state', () => {
    expect(normalizeEtat({round: 2, exclus: ['pnj-7', 'pnj-7', '']}).exclus).toEqual(['pnj-7']);
    const converted = normalizeEtat({round: 2, defense_totale: ['pnj-7'], attaquees: ['hero-1', 'hero-1']});
    expect(converted.effets.map((e) => [e.id, e.origine, e.porteur])).toEqual([
      ['e-1', 'defense-totale', 'pnj-7'],
      ['e-2', 'bouclier-depense', 'hero-1'],
    ]);
    expect(normalizeEtat({round: 2, effets: [], defense_totale: ['pnj-7']}).effets).toEqual([]);
  });
});

describe('posture et parade sur un tour complet', () => {
  const order = ordered(KALENA, PRETRE);
  const contre = {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0, bouclierToutes: 0} as const;

  it('lets the defender of a posture count its bonus against the next attacker, then drops it on its next turn', () => {
    // Kalena prend la posture défensive et termine son tour : le prêtre l'attaque avec +1 en défense contre lui.
    const apres = endTurn(order, etat(1), effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false}));
    expect(modificateursPour(apres.effets, contre).map((t) => t.valeur)).toEqual([-1]);

    // Le prêtre termine : nouveau round, Kalena redevient active, sa posture est tombée.
    const round2 = endTurn(order, apres);
    expect(round2.round).toBe(2);
    expect(modificateursPour(round2.effets, contre)).toEqual([]);
  });

  it('gives the parade for one attack only', () => {
    const apres = endTurn(order, etat(1), effetsDeTour('hero-1', {posture: 'dual-parry', defenseTotale: false}));
    expect(modificateursPour(apres.effets, contre).map((t) => t.valeur)).toEqual([-1]);
    const apresAttaque = appliquerEvenement(apres.effets, {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: false});
    expect(modificateursPour(apresAttaque, contre)).toEqual([]);
  });

  it('makes an intrepid defender lose its shield when attacked afterwards', () => {
    const apres = endTurn(order, etat(1), effetsDeTour('hero-1', {posture: 'intrepid', defenseTotale: false}));
    const termes = modificateursPour(apres.effets, {...contre, bouclier: 1});
    expect(termes.map((t) => t.label)).toEqual(['+ 2 attaque intrépide']);
  });
});

describe('bouclierPerduRound1', () => {
  it('removes the shield of a critical failure during the first round only', () => {
    expect(bouclierPerduRound1(1, 'echec_critique')).toBe(true);
    expect(bouclierPerduRound1(2, 'echec_critique')).toBe(false);
    expect(bouclierPerduRound1(1, 'echec')).toBe(false);
    expect(bouclierPerduRound1(1, null)).toBe(false);
  });
});

describe('debutDeTour', () => {
  it('ends what lasts until the card plays again, for that card only', () => {
    const posture: CombatEffect = {id: 'e-1', origine: 'posture-defensive', porteur: 'hero-1', stat: 'defense', valeur: 1, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false};
    const autre = defended('pnj-7', 'e-2');
    expect(debutDeTour(etat(1, [], [posture, autre]), 'hero-1').effets).toEqual([autre]);
  });

  it('returns the very same state when nothing expires, so nothing is saved for nothing', () => {
    const state = etat(1, [], [defended('pnj-7')]);
    expect(debutDeTour(state, 'hero-1')).toBe(state);
  });
});

describe('effetsDerives', () => {
  const order: OrderedCard[] = [
    {card: KALENA, tier: 'echec_critique', lockedRound1: false},
    {card: RORK, tier: 'reussite', lockedRound1: false},
    {card: PRETRE, tier: 'coriace', lockedRound1: false},
  ];

  it('removes the shield of a critical failure during the first round, with a trace that is not stored', () => {
    const derives = effetsDerives(order, 1);
    expect(derives).toHaveLength(1);
    expect(derives[0]).toMatchObject({origine: 'sans-bouclier', porteur: 'hero-1', valeur: 0, duree: {type: 'fin-round'}});
    expect(derives[0].id.startsWith('derive-')).toBe(true);
  });

  it('gives nothing after the first round', () => {
    expect(effetsDerives(order, 2)).toEqual([]);
  });
});
