import {describe, expect, it} from 'vitest';
import {bloqueeCeRound, bouclierPerduRound1, cartesRelevees, commencerTour, etatEnregistre, remettreAuCombat, retirerDuCombat, cibleAuHasard, combatOutcome, debutDeTour, effetsDerives, endTurn, groupByTier, giveBackTurn, turnOrderFrise, hordeMates, herosMourants, horsCombat, INITIAL_ETAT, isOut, poserEffet, raisonHorsJeu, normalizeEtat, orderCards, targetableKeys, tokenForCard, totalDefense, turnAnnouncement, turnState} from './combat-turn.util';
import {EtatCombat, OrderedCard, TurnToken} from '../../models/combat-turn.model';
import {TurnOrderEntry} from '../../models/turn-order.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {CombatEffect} from '../../models/combat-effect.model';
import {appliquerEvenement, effetActionPerdue, effetAssomme, effetCoupPrecis, effetInconscient, effetParalyse, effetRenversement, effetsDeLaFrise, effetsDeTour, effetStabilise, modificateursPour, perdSonAction} from './combat-effects.util';

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
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
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
  return {round, joues, effets, exclus: [], depart: {}, fuis: [], melee: null};
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

  it('keeps the rivals who fled, always excluded, and the round of the mook melee', () => {
    const normalized = normalizeEtat({round: 3, exclus: ['creature-4'], fuis: ['pnj-3', 'pnj-3', '', 5], melee: 3});

    expect(normalized.fuis).toEqual(['pnj-3']);
    expect(normalized.exclus).toEqual(['creature-4', 'pnj-3']);
    expect(normalized.melee).toBe(3);
  });

  it('drops a malformed mook melee round', () => {
    expect(normalizeEtat({round: 3, melee: 0}).melee).toBeNull();
    expect(normalizeEtat({round: 3, melee: '2'}).melee).toBeNull();
    expect(normalizeEtat({round: 3, melee: 1.5}).melee).toBeNull();
    expect(normalizeEtat({round: 3}).melee).toBeNull();
  });

  it('drops the GM die for everyone that an older version saved', () => {
    expect(normalizeEtat({round: 1, deMj: 'bonus'})).toEqual(etat(1));
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
    expect(orderCards(cards, tokens).map((o) => o.card.key)).toEqual(['hero-1', 'pnj-7', 'creature-3', 'hero-2']);
  });

  it('carries the tier and round-1 lock of each card', () => {
    const [first, second] = orderCards(cards, tokens);
    expect(first).toMatchObject({tier: 'reussite', lockedRound1: false});
    expect(second).toMatchObject({tier: 'coriace', lockedRound1: true});
  });

  it('still lists a card that has no token', () => {
    expect(orderCards([KALENA, card('demon', 9)], tokens).map((o) => o.card.key)).toEqual(['hero-1', 'demon-9']);
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

  it('skips a paralysed card until the GM removes the effect', () => {
    const paralyse: CombatEffect = {...effetParalyse('pnj-7'), id: 'e-1'};
    const state = turnState(ordered(KALENA, PRETRE, RORK), etat(1, ['hero-1'], [paralyse]));
    expect(state.activeKey).toBe('hero-2');
    expect(state.statuses.get('pnj-7')).toBe('skipped');
    expect(turnState(ordered(KALENA, PRETRE, RORK), etat(1, ['hero-1'])).activeKey).toBe('pnj-7');
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

  it('adds up with the parry of two weapons, as the rules say', () => {
    const sansParade = totalDefense(ordered(KALENA, PRETRE), etat(1));
    const avecParade = totalDefense(ordered(KALENA, PRETRE), etat(1), undefined, true);
    expect(sansParade.effets?.some((e) => e.origine !== 'defense-totale')).toBe(false);
    expect(avecParade.effets?.filter((e) => e.stat === 'defense').map((e) => e.valeur).sort()).toEqual([1, 2]);
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

describe('cibleAuHasard', () => {
  const hero1 = card('hero', 1);
  const hero2 = card('hero', 2);
  const allie = card('pnj', 8, {camp: 'heros'});
  const adversaire = card('pnj', 7);

  it('picks a hero at random for an adversary, never an ally while a hero can be targeted', () => {
    expect(cibleAuHasard(adversaire, [allie, hero1, hero2], () => 0)?.key).toBe('hero-1');
    expect(cibleAuHasard(adversaire, [allie, hero1, hero2], () => 0.99)?.key).toBe('hero-2');
  });

  it('falls back on an ally of the heroes when no hero is left', () => {
    expect(cibleAuHasard(adversaire, [allie], () => 0.5)?.key).toBe('pnj-8');
  });

  it('preselects nothing for a card of the heroes’ camp, nor without targets', () => {
    expect(cibleAuHasard(hero1, [adversaire], () => 0)).toBeNull();
    expect(cibleAuHasard(allie, [adversaire], () => 0)).toBeNull();
    expect(cibleAuHasard(adversaire, [], () => 0)).toBeNull();
    expect(cibleAuHasard(null, [hero1], () => 0)).toBeNull();
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

describe('turnOrderFrise', () => {
  const entry = (key: string, tier: TurnOrderEntry['tier'], over: Partial<TurnOrderEntry> = {}): TurnOrderEntry => ({
    key, nom: key, kind: 'hero', avatar: '', status: 'upcoming', tier, locked: false, ally: false, effets: [], horsCombat: null, ...over,
  });

  it('suit les rangs de réaction, avec un trait long entre deux rangs', () => {
    const frise = turnOrderFrise([entry('p1', 'pietaille', {kind: 'pnj'}), entry('h1', 'reussite'), entry('p2', 'pietaille', {kind: 'pnj'})], null);
    expect(frise.map((step) => [step.key, step.link])).toEqual([
      ['h1', 'long'],
      ['p1', 'court'],
      ['p2', null],
    ]);
  });

  it('colore un héros par son rang, les autres par leur camp, et fait d’un héros un carré', () => {
    const frise = turnOrderFrise([entry('h1', null), entry('r1', 'rival', {kind: 'pnj', ally: true}), entry('c1', 'coriace', {kind: 'creature'}), entry('h2', 'echec')], null);
    expect(frise.map((step) => [step.tone, step.hero])).toEqual([
      ['attente', true],
      ['allie', false],
      ['adversaire', false],
      ['echec', true],
    ]);
  });

  it('un retiré se clique pour revenir au combat : barré, et sa bulle le dit', () => {
    const [step] = turnOrderFrise([entry('p1', 'coriace', {kind: 'pnj', status: 'skipped', horsCombat: 'retiré'})], null);

    expect(step).toMatchObject({clickable: true, excluded: true, down: true});
    expect(step.tooltip).toContain('cliquer pour le remettre au combat');
  });

  it('ne laisse cliquer que celui qui a joué, et marque la cible, les effets et le hors de combat', () => {
    const frise = turnOrderFrise(
      [entry('h1', 'reussite', {status: 'played'}), entry('r1', 'rival', {kind: 'pnj', effets: ['Sonné'], horsCombat: 'mort'})],
      'r1',
    );
    expect(frise.map((step) => [step.clickable, step.target, step.effects, step.down])).toEqual([
      [true, false, false, false],
      [false, true, true, true],
    ]);
    expect(frise[0].tooltip).toBe('h1 — cliquer pour lui rendre la main');
    expect(frise[1].label).toBe('r1, rivaux, à venir, mort, visé');
  });
});

describe('excluded cards', () => {
  const excluding = (...keys: string[]): EtatCombat => ({round: 1, joues: [], effets: [], exclus: keys, depart: {}, fuis: [], melee: null});

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

describe('combatOutcome', () => {
  const hero = card('hero', 1);
  const pnj = card('pnj', 7, {vitaliteMax: 8, vitaliteCourante: 8});

  it('goes on while both camps have someone standing', () => {
    expect(combatOutcome([hero, pnj], [])).toBeNull();
  });

  it('is a victory once every opponent is out or removed from the fight', () => {
    expect(combatOutcome([hero, card('pnj', 7, {vitaliteMax: 8, vitaliteCourante: 0})], [])).toBe('victoire');
    expect(combatOutcome([hero, pnj], [pnj.key])).toBe('victoire');
  });

  it('is a defeat once every hero and ally is out', () => {
    expect(combatOutcome([card('hero', 1, {vitaliteCourante: 0}), pnj], [])).toBe('defaite');
    const ally = card('pnj', 9, {camp: 'heros', vitaliteMax: 6, vitaliteCourante: 6});
    expect(combatOutcome([card('hero', 1, {vitaliteCourante: -2}), ally, pnj], [])).toBeNull();
  });
});

describe('horde', () => {
  const bandit = (pivotId: number, extra: Partial<TapisCard> = {}): TapisCard => card('pnj', pivotId, {rang: 'Piétaille', ...extra});
  const B1 = bandit(11);
  const B2 = bandit(12);
  const B3 = bandit(13);
  const CHEF = card('pnj', 14, {rang: 'Coriace'});
  const ALLIE = bandit(15, {camp: 'heros'});

  it('offers the piétailles of the same camp that still have to play, when the active card is a piétaille', () => {
    const order = ordered(KALENA, B1, CHEF, B2, B3, ALLIE);
    expect(hordeMates(order, etat(1, ['hero-1'])).map((c) => c.key)).toEqual(['pnj-12', 'pnj-13']);
  });

  it('offers nobody when the active card is not a piétaille, or once the others have played or are out', () => {
    expect(hordeMates(ordered(CHEF, B1, B2), etat(1))).toEqual([]);
    expect(hordeMates(ordered(B1, B2, B3), etat(1, ['pnj-12', 'pnj-13']))).toEqual([]);
    const down = bandit(12, {vitaliteCourante: 0});
    expect(hordeMates(ordered(B1, down, B3), etat(1)).map((c) => c.key)).toEqual(['pnj-13']);
  });

  it('ends the turn of the engaged piétailles with the active one', () => {
    const order = ordered(B1, B2, B3, KALENA);
    expect(endTurn(order, etat(1), [], undefined, ['pnj-12', 'pnj-13'])).toEqual(etat(1, ['pnj-11', 'pnj-12', 'pnj-13']));
  });

  it('ignores engaged cards that already played, and starts the next round when the horde was the last to play', () => {
    const order = ordered(KALENA, B1, B2);
    expect(endTurn(order, etat(1, ['hero-1', 'pnj-12']), [], undefined, ['pnj-12'])).toEqual(etat(2));
    expect(endTurn(order, etat(1, ['hero-1']), [], undefined, ['pnj-12'])).toEqual(etat(2));
  });

  it('n’offre pas une piétaille qui a perdu son action : son tour sera sauté, elle ne peut pas attaquer en horde', () => {
    const perdue: CombatEffect = {...effetActionPerdue('pnj-12'), id: 'e-1'};
    expect(hordeMates(ordered(B1, B2, B3), etat(1, [], [perdue])).map((c) => c.key)).toEqual(['pnj-13']);
  });

  it('drops the effects an engaged piétaille kept until its next turn', () => {
    const order = ordered(B1, B2, KALENA);
    expect(endTurn(order, etat(1, [], [defended('pnj-12')]), [], undefined, ['pnj-12']).effets).toEqual([]);
  });
});

describe('raisonHorsJeu', () => {
  it('says a rival who fled is « enfui », whatever his vitality', () => {
    const rival = card('pnj', 3, {vitaliteCourante: 0});
    const fled: EtatCombat = {...etat(2), exclus: ['pnj-3'], fuis: ['pnj-3']};

    expect(raisonHorsJeu(rival, fled)).toBe('enfui');
    expect(raisonHorsJeu(card('pnj', 3), fled)).toBe('enfui');
  });

  it('otherwise gives the out-of-combat reason', () => {
    expect(raisonHorsJeu(card('pnj', 3, {vitaliteCourante: 0}), etat(2))).toBe('hors de combat');
    expect(raisonHorsJeu(card('pnj', 3), etat(2))).toBeNull();
  });
});

describe('raisonHorsJeu : paralysie et morts-vivants', () => {
  it('says a paralysed card is « paralysé » while it stands', () => {
    const paralyse: CombatEffect = {...effetParalyse('hero-1'), id: 'e-1'};
    expect(raisonHorsJeu(KALENA, etat(2, [], [paralyse]))).toBe('paralysé');
    expect(raisonHorsJeu(card('hero', 1, {vitaliteCourante: -2}), etat(2, [], [paralyse]))).toBe('mourant');
  });

  it('says an undead at 0 is « détruit », not « hors de combat »', () => {
    expect(horsCombat(card('creature', 3, {vitaliteCourante: 0, mortVivant: true}))).toBe('détruit');
    expect(raisonHorsJeu(card('creature', 3, {vitaliteCourante: 0, mortVivant: true}), etat(2))).toBe('détruit');
    expect(horsCombat(card('creature', 3, {vitaliteCourante: 0, mortVivant: false}))).toBe('hors de combat');
    expect(isOut(card('creature', 3, {vitaliteCourante: 0, mortVivant: true}))).toBe(true);
  });
});

describe('endTurn : coup précis sur un démon qui se régénère', () => {
  it('drops the malus die at the start of the second round after the blow', () => {
    const demon = card('demon', 4);
    const order = ordered(KALENA, demon);
    const coup: CombatEffect = {...effetCoupPrecis('demon-4', true), id: 'e-1'};
    // Round 1 : Kalena porte le coup précis, puis le démon joue avec son dé de malus.
    const round2 = endTurn(order, endTurn(order, etat(1, [], [coup])));
    expect(round2.round).toBe(2);
    expect(round2.effets.map((e) => e.id)).toEqual(['e-1']);
    const round3 = endTurn(order, endTurn(order, round2));
    expect(round3.round).toBe(3);
    expect(round3.effets).toEqual([]);
  });
});

describe('combatOutcome with a rival who fled', () => {
  it('no longer counts him: his camp falls when the rest is down', () => {
    const rival = card('pnj', 3);
    const mook = card('pnj', 4, {vitaliteCourante: 0});

    expect(combatOutcome([KALENA, rival, mook], [])).toBeNull();
    expect(combatOutcome([KALENA, rival, mook], ['pnj-3'])).toBe('victoire');
  });
});

describe('retirerDuCombat', () => {
  it('excludes the card: it no longer plays nor counts, and its effects go with it', () => {
    const order = ordered(KALENA, PRETRE, RORK);
    const surPretre: CombatEffect = {...effetStabilise('pnj-7'), id: 'e-1'};
    const visantPretre: CombatEffect = {...defended('hero-1', 'e-2'), cible: 'pnj-7'};
    const garde: CombatEffect = defended('hero-2', 'e-3');
    const avant = etat(1, [], [surPretre, visantPretre, garde]);

    const apres = retirerDuCombat(avant, 'pnj-7');

    expect(apres.exclus).toEqual(['pnj-7']);
    expect(apres.fuis).toEqual([]);
    expect(apres.effets).toEqual([garde]);
    expect(turnState(order, apres).statuses.get('pnj-7')).toBe('skipped');
    expect(raisonHorsJeu(PRETRE, apres)).toBe('retiré');
    expect(combatOutcome([KALENA, PRETRE], apres.exclus)).toBe('victoire');
  });

  it('does nothing for a card already out of this combat', () => {
    const dejaRetire = retirerDuCombat(etat(1), 'pnj-7');
    expect(retirerDuCombat(dejaRetire, 'pnj-7')).toBe(dejaRetire);
  });

  it('« Remettre au combat » le fait revenir et jouer, sans ses effets ; un rival enfui reste parti', () => {
    const order = ordered(KALENA, PRETRE, RORK);
    const surPretre: CombatEffect = {...effetStabilise('pnj-7'), id: 'e-1'};
    const retire = retirerDuCombat(etat(1, [], [surPretre]), 'pnj-7');

    const revenu = remettreAuCombat(retire, 'pnj-7');

    expect(revenu.exclus).toEqual([]);
    expect(revenu.effets).toEqual([]);
    expect(raisonHorsJeu(PRETRE, revenu)).toBeNull();
    expect(turnState(order, revenu).statuses.get('pnj-7')).not.toBe('skipped');
    const enfui = {...etat(1), exclus: ['pnj-7'], fuis: ['pnj-7']};
    expect(remettreAuCombat(enfui, 'pnj-7')).toBe(enfui);
    expect(remettreAuCombat(revenu, 'pnj-7')).toBe(revenu);
  });

  it('a rival who fled stays « enfui »', () => {
    expect(raisonHorsJeu(PRETRE, {...etat(1), exclus: ['pnj-7'], fuis: ['pnj-7']})).toBe('enfui');
  });
});

describe('endTurn : action perdue (juste une égratignure)', () => {
  const order = ordered(KALENA, PRETRE, RORK);
  const perdue: CombatEffect = {...effetActionPerdue('pnj-7'), id: 'e-1'};

  it('skips the turn of the card that lost its action: it has played, and the frieze says why until its next turn', () => {
    const apres = endTurn(order, etat(1, [], [perdue]), [], () => 'e-2');

    expect(turnState(order, apres).activeKey).toBe('hero-2');
    expect(apres.joues).toEqual(['hero-1', 'pnj-7']);
    expect(perdSonAction(apres.effets, 'pnj-7')).toBe(false);
    expect(effetsDeLaFrise(apres.effets, 'pnj-7')).toEqual(['a perdu son action (juste une égratignure) · jusqu’à son prochain tour']);

    // Le round suivant, son tour revient : la trace tombe.
    const round2 = endTurn(order, endTurn(order, apres));
    expect(round2.round).toBe(2);
    expect(turnState(order, round2).activeKey).toBe('pnj-7');
    expect(effetsDeLaFrise(round2.effets, 'pnj-7')).toEqual([]);
  });

  it('keeps a malus die « at his next action » for the action he really takes', () => {
    const malus: CombatEffect = {...effetRenversement('pnj-7'), id: 'e-3'};
    const apres = endTurn(order, etat(1, [], [perdue, malus]), [], () => 'e-2');
    expect(apres.effets.map((e) => e.id)).toContain('e-3');
  });

  it('starts the next round when the skipped card was the last to play', () => {
    const perdueRork: CombatEffect = {...effetActionPerdue('hero-2'), id: 'e-1'};
    const apres = endTurn(order, etat(1, ['hero-1'], [perdueRork]), [], () => 'e-2');
    expect(apres.round).toBe(2);
    expect(turnState(order, apres).activeKey).toBe('hero-1');
    expect(perdSonAction(apres.effets, 'hero-2')).toBe(false);
  });

  it('commencerTour skips the active card when it lost its action, and changes nothing otherwise', () => {
    const avant = etat(1, [], [{...effetActionPerdue('hero-1'), id: 'e-1'}]);
    const apres = commencerTour(order, avant, () => 'e-2');
    expect(turnState(order, apres).activeKey).toBe('pnj-7');
    expect(apres.joues).toEqual(['hero-1']);
    const rien = etat(1);
    expect(commencerTour(order, rien)).toBe(rien);
  });
});

describe('poserEffet : « Perd sa prochaine action » posé sur la carte qui joue', () => {
  const order = ordered(KALENA, PRETRE, RORK);
  let n = 0;
  const ids = () => `e-${++n}`;

  it('ne lui coûte pas son tour en cours, même quand la page rechargée le recommence', () => {
    const pose = poserEffet(order, etat(1), effetActionPerdue('hero-1'), ids);

    expect(perdSonAction(pose.effets, 'hero-1')).toBe(false);
    const recharge = commencerTour(order, pose, ids);
    expect(turnState(order, recharge).activeKey).toBe('hero-1');
    expect(recharge.joues).toEqual([]);
    expect(effetsDeLaFrise(recharge.effets, 'hero-1')).toEqual(['perd sa prochaine action · jusqu’à sa prochaine action']);
  });

  it('lui fait sauter son prochain tour', () => {
    const pose = poserEffet(order, etat(1), effetActionPerdue('hero-1'), ids);

    const apres = endTurn(order, pose, [], ids);
    expect(perdSonAction(apres.effets, 'hero-1')).toBe(true);

    const round2 = endTurn(order, endTurn(order, apres, [], ids), [], ids);
    expect(round2.round).toBe(2);
    expect(round2.joues).toEqual(['hero-1']);
    expect(turnState(order, round2).activeKey).toBe('pnj-7');
    expect(perdSonAction(round2.effets, 'hero-1')).toBe(false);
  });

  it('vaut pour le round suivant même si son tour n’est pas allé jusqu’à « Fin du tour »', () => {
    const pose = poserEffet(order, etat(1), effetActionPerdue('hero-1'), ids);

    expect(perdSonAction(appliquerEvenement(pose.effets, {type: 'nouveau-round'}), 'hero-1')).toBe(true);
  });

  it('posé sur une autre carte, il lui fait sauter son prochain tour, et les autres effets sont posés tels quels', () => {
    const pose = poserEffet(order, etat(1), effetActionPerdue('pnj-7'), ids);
    expect(perdSonAction(pose.effets, 'pnj-7')).toBe(true);

    const apres = endTurn(order, pose, [], ids);
    expect(turnState(order, apres).activeKey).toBe('hero-2');
    expect(apres.joues).toEqual(['hero-1', 'pnj-7']);

    const malus = poserEffet(order, etat(1), effetRenversement('hero-1'), ids);
    expect(malus.effets.map((effet) => effet.origine)).toEqual([effetRenversement('hero-1').origine]);
  });
});

describe('giveBackTurn : action perdue posée pendant son tour', () => {
  const order = ordered(KALENA, PRETRE, RORK);
  let n = 10;
  const ids = () => `e-${++n}`;

  it('le tour rendu n’est pas sauté : l’action perdue vise de nouveau le tour suivant', () => {
    const pose = poserEffet(order, etat(1), effetActionPerdue('hero-1'), ids);
    const fini = endTurn(order, pose, [], ids);
    expect(perdSonAction(fini.effets, 'hero-1')).toBe(true);

    const rendu = commencerTour(order, giveBackTurn(fini, 'hero-1'), ids);
    expect(turnState(order, rendu).activeKey).toBe('hero-1');
    expect(rendu.joues).toEqual([]);
    expect(perdSonAction(rendu.effets, 'hero-1')).toBe(false);

    // Son tour rouvert fini, l'action perdue coûte bien le suivant.
    const refini = endTurn(order, rendu, [], ids);
    expect(perdSonAction(refini.effets, 'hero-1')).toBe(true);
    const round2 = endTurn(order, endTurn(order, refini, [], ids), [], ids);
    expect(round2.round).toBe(2);
    expect(round2.joues).toEqual(['hero-1']);
    expect(turnState(order, round2).activeKey).toBe('pnj-7');
  });

  it('une action perdue infligée par un adversaire après son tour lui coûte le tour rouvert', () => {
    // Kalena a joué ; pendant le tour du prêtre, elle prend « Juste une égratignure ».
    const inflige = poserEffet(order, etat(1, ['hero-1']), effetActionPerdue('hero-1'), ids);
    expect(turnState(order, inflige).activeKey).toBe('pnj-7');
    expect(inflige.effets.find((e) => e.porteur === 'hero-1')?.auTourDuPorteur).toBeUndefined();

    const rendu = commencerTour(order, giveBackTurn(inflige, 'hero-1'), ids);

    expect(rendu.joues).toContain('hero-1');
    expect(perdSonAction(rendu.effets, 'hero-1')).toBe(false);
    expect(turnState(order, rendu).activeKey).toBe('pnj-7');
  });

  it('ne touche pas l’action perdue d’une carte à qui on ne rend pas la main', () => {
    const perdue: CombatEffect = {...effetActionPerdue('pnj-7'), id: 'e-1'};
    expect(perdSonAction(giveBackTurn(etat(1, ['hero-1'], [perdue]), 'hero-1').effets, 'pnj-7')).toBe(true);
  });
});

describe('cartesRelevees', () => {
  const tombe: CombatEffect = {...effetInconscient('hero-1'), id: 'e-1'};

  it('a hero back above 0 after being down is raised: his fall traces can go', () => {
    const avant = new Map([['hero-1', 0]]);
    expect(cartesRelevees(avant, [card('hero', 1, {vitaliteCourante: 5})], [tombe])).toEqual(['hero-1']);
  });

  it('not while he is still down, nor without a trace, nor when he never went down (a save that comes back before the wound)', () => {
    expect(cartesRelevees(new Map([['hero-1', -2]]), [card('hero', 1, {vitaliteCourante: 0})], [tombe])).toEqual([]);
    expect(cartesRelevees(new Map([['hero-1', 0]]), [card('hero', 1, {vitaliteCourante: 5})], [])).toEqual([]);
    expect(cartesRelevees(new Map([['hero-1', 7]]), [card('hero', 1, {vitaliteCourante: 7})], [{...effetAssomme('hero-1'), id: 'e-2'}])).toEqual([]);
  });

  it('a card seen for the first time standing with a fall trace is raised (an old table)', () => {
    expect(cartesRelevees(new Map(), [card('hero', 1, {vitaliteCourante: 5})], [tombe])).toEqual(['hero-1']);
  });
});

describe('carte paralysée : son tour est sauté et compté', () => {
  const order = ordered(KALENA, PRETRE, RORK);
  const paralyseKalena: CombatEffect = {...effetParalyse('hero-1'), id: 'e-1'};

  it('passes its turn: it counts as played, with a trace on the frieze, and the next card plays', () => {
    const apres = commencerTour(order, etat(2, [], [paralyseKalena]), () => 'e-2');

    expect(apres.joues).toEqual(['hero-1']);
    expect(turnState(order, apres).activeKey).toBe('pnj-7');
    expect(turnState(order, apres).statuses.get('hero-1')).toBe('skipped');
    expect(effetsDeLaFrise(apres.effets, 'hero-1')).toContain('paralysé, tour sauté · jusqu’à son prochain tour');
  });

  it('freed during the turn of a card that comes after it, it gets the hand back only next round', () => {
    const pendantLeDemon = commencerTour(order, etat(2, [], [paralyseKalena]), () => 'e-2');
    const liberee: EtatCombat = {...pendantLeDemon, effets: appliquerEvenement(pendantLeDemon.effets, {type: 'retrait-manuel', id: 'e-1'})};

    expect(turnState(order, liberee).activeKey).toBe('pnj-7');
    expect(turnState(order, liberee).statuses.get('hero-1')).toBe('played');

    const round3 = endTurn(order, endTurn(order, liberee));
    expect(round3.round).toBe(3);
    expect(turnState(order, round3).activeKey).toBe('hero-1');
    expect(effetsDeLaFrise(round3.effets, 'hero-1')).toEqual([]);
  });

  it('applies its start-of-turn effects: what lasted until its next turn falls when its turn is passed', () => {
    const avant = etat(2, [], [paralyseKalena, defended('hero-1', 'e-3')]);

    const apres = commencerTour(order, avant, () => 'e-2');

    expect(apres.effets.map((e) => e.id)).not.toContain('e-3');
    expect(apres.effets.map((e) => e.id)).toContain('e-1');
  });

  it('passes a paralysed card that is last in the order before the next round starts', () => {
    const paralyseRork: CombatEffect = {...effetParalyse('hero-2'), id: 'e-1'};
    const apres = endTurn(order, etat(1, ['hero-1'], [paralyseRork, defended('hero-2', 'e-3')]), [], () => 'e-2');

    expect(apres.round).toBe(2);
    expect(turnState(order, apres).activeKey).toBe('hero-1');
    expect(apres.effets.map((e) => e.id)).not.toContain('e-3');
  });

  it('son tour sauté pour paralysie consomme aussi son action perdue : libérée, elle joue son tour suivant', () => {
    const perdue: CombatEffect = {...effetActionPerdue('hero-1'), id: 'e-3'};
    const malus: CombatEffect = {...effetRenversement('hero-1'), id: 'e-4'};

    const apres = commencerTour(order, etat(2, [], [paralyseKalena, perdue, malus]), () => 'e-2');
    expect(apres.joues).toEqual(['hero-1']);
    expect(perdSonAction(apres.effets, 'hero-1')).toBe(false);
    // Le dé de malus attend l'action qu'elle fera vraiment.
    expect(apres.effets.map((e) => e.id)).toContain('e-4');

    const liberee: EtatCombat = {...apres, effets: appliquerEvenement(apres.effets, {type: 'retrait-manuel', id: 'e-1'})};
    const round3 = endTurn(order, endTurn(order, liberee));
    expect(round3.round).toBe(3);
    expect(turnState(order, round3).activeKey).toBe('hero-1');
  });

  it('does not spin rounds when the only cards left standing are paralysed', () => {
    const order2 = ordered(KALENA, card('pnj', 7, {vitaliteCourante: 0}));

    const apres = commencerTour(order2, etat(1, [], [paralyseKalena]), () => 'e-2');

    expect(apres.round).toBe(1);
    expect(apres.joues).toEqual(['hero-1']);
    expect(turnState(order2, apres).activeKey).toBeNull();
  });
});

describe('combatOutcome : une carte paralysée ne tient plus debout', () => {
  const paralyse = (key: string): CombatEffect => ({...effetParalyse(key), id: `e-${key}`});

  it('is a victory when the last opponent standing is paralysed', () => {
    expect(combatOutcome([KALENA, PRETRE], [], [paralyse('pnj-7')])).toBe('victoire');
  });

  it('is a defeat when the last hero standing is paralysed', () => {
    expect(combatOutcome([KALENA, PRETRE], [], [paralyse('hero-1')])).toBe('defaite');
  });

  it('goes on while someone else stands in that camp', () => {
    expect(combatOutcome([KALENA, RORK, PRETRE], [], [paralyse('hero-1')])).toBeNull();
  });
});

describe('etatEnregistre : une réponse perdue, l’enregistrement est-il passé ?', () => {
  const trace: CombatEffect = {...effetStabilise('hero-1'), id: 'e-9'};
  const avant = etat(1, ['hero-1']);

  it('une fin de tour : le déroulé fait foi, même si le serveur a écarté un effet', () => {
    const voulu = {...etat(2, []), effets: [trace]};

    expect(etatEnregistre(etat(2, []), avant, voulu)).toBe(true);
    expect(etatEnregistre(avant, avant, voulu)).toBe(false);
  });

  it('un effet ajouté ou retiré : il faut le retrouver, ou ne plus le trouver', () => {
    const avecTrace = etat(1, ['hero-1'], [trace]);

    expect(etatEnregistre(avecTrace, avant, avecTrace)).toBe(true);
    expect(etatEnregistre(avant, avant, avecTrace)).toBe(false);
    expect(etatEnregistre(avant, avecTrace, avant)).toBe(true);
    expect(etatEnregistre(avecTrace, avecTrace, avant)).toBe(false);
  });
});
