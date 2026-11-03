import {describe, expect, it} from 'vitest';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {candidatsMassacre, objetsDeParade, optionHeroiqueBloquee, tombesMassacre} from './options-heroiques.util';

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

const HEROS = card('hero', 1, {nom: 'Krongar'});
const TROLL = card('creature', 2, {nom: 'Troll', taille: 6});
const OURS = card('creature', 3, {nom: 'Ours', taille: 5});
const BANDIT = (n: number, extra: Partial<TapisCard> = {}) => card('pnj', n, {nom: `Bandit #${n}`, rang: 'Piétaille', vitaliteCourante: 2, vitaliteMax: 2, ...extra});

describe('optionHeroiqueBloquee : renversement', () => {
  it('knocks down a target at most one size category bigger (book p. 59)', () => {
    expect(optionHeroiqueBloquee('renversement', {attaquant: HEROS, cible: OURS, cibleArme: undefined})).toBeNull();
    expect(optionHeroiqueBloquee('renversement', {attaquant: HEROS, cible: TROLL, cibleArme: undefined})).toBe(
      'Renversement impossible : Troll (Très grande) dépasse Krongar (Moyenne) de plus d’une catégorie de taille.',
    );
  });

  it('a big attacker knocks down a big target; heroes, PNJ and demons count as medium', () => {
    expect(optionHeroiqueBloquee('renversement', {attaquant: OURS, cible: TROLL, cibleArme: undefined})).toBeNull();
    expect(optionHeroiqueBloquee('renversement', {attaquant: card('demon', 4), cible: HEROS, cibleArme: undefined})).toBeNull();
  });
});

describe('optionHeroiqueBloquee : désarmement et massacre', () => {
  it('disarms only a target that holds a weapon (unknown: allowed)', () => {
    expect(optionHeroiqueBloquee('desarmement', {attaquant: HEROS, cible: BANDIT(5), cibleArme: true})).toBeNull();
    expect(optionHeroiqueBloquee('desarmement', {attaquant: HEROS, cible: BANDIT(5), cibleArme: undefined})).toBeNull();
    expect(optionHeroiqueBloquee('desarmement', {attaquant: HEROS, cible: TROLL, cibleArme: false})).toBe('Désarmement impossible : Troll n’a pas d’arme en main.');
  });

  it('massacres the mooks only when the target is one', () => {
    expect(optionHeroiqueBloquee('pietaille', {attaquant: HEROS, cible: BANDIT(5), cibleArme: true})).toBeNull();
    expect(optionHeroiqueBloquee('pietaille', {attaquant: HEROS, cible: OURS, cibleArme: false})).toBe('Massacrer la piétaille : Ours n’est pas de la piétaille.');
  });

  it('never blocks the other options, nor without a target', () => {
    expect(optionHeroiqueBloquee('carnage', {attaquant: HEROS, cible: TROLL, cibleArme: false})).toBeNull();
    expect(optionHeroiqueBloquee('renversement', {attaquant: HEROS, cible: null, cibleArme: undefined})).toBeNull();
  });
});

describe('candidatsMassacre et tombesMassacre', () => {
  it('the target first, then the other mooks still standing in its camp', () => {
    const cibles = [OURS, BANDIT(5), BANDIT(6), BANDIT(7, {vitaliteCourante: 0}), BANDIT(8, {camp: 'heros'}), BANDIT(9)];
    expect(candidatsMassacre(BANDIT(6), cibles).map((c) => c.key)).toEqual(['pnj-6', 'pnj-5', 'pnj-9']);
  });

  it('the damage is the number put out of combat, never more than there are', () => {
    const candidats = [BANDIT(6), BANDIT(5), BANDIT(9)];
    expect(tombesMassacre(candidats, 2)).toEqual(['pnj-6', 'pnj-5']);
    expect(tombesMassacre(candidats, 9)).toEqual(['pnj-6', 'pnj-5', 'pnj-9']);
    expect(tombesMassacre(candidats, 0)).toEqual([]);
  });
});

describe('objetsDeParade', () => {
  it('a shield and a weapon: both are offered, the shield first', () => {
    expect(objetsDeParade({bouclier: true, arme: true, bouclierMalusUneAttaque: 0, bouclierDefenseToutes: 0})).toEqual(['bouclier', 'arme']);
  });

  it('a shield seen from the defence it gives, without the flag', () => {
    expect(objetsDeParade({bouclierMalusUneAttaque: 1, bouclierDefenseToutes: 0, arme: false})).toEqual(['bouclier']);
  });

  it('otherwise the weapon (also when nothing is known)', () => {
    expect(objetsDeParade({bouclierMalusUneAttaque: 0, bouclierDefenseToutes: 0})).toEqual(['arme']);
    expect(objetsDeParade(null)).toEqual(['arme']);
  });
});
