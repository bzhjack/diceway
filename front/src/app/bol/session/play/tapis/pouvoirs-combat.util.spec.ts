import {describe, expect, it} from 'vitest';
import {EtatCombat} from '../../models/combat-turn.model';
import {CardPouvoirs} from '../../models/pouvoirs-combat.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {effetParalyse} from './combat-effects.util';
import {degatsDoubles, libelleVitalite, libelleVulnerabilite, poisonPossible, pouvoirsDeCombat, regenerationsDuRound} from './pouvoirs-combat.util';

const SANS_POUVOIR: CardPouvoirs = {regeneration: false, intangible: false, poison: false, vulnerabilite: null, avertissements: []};

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

function etat(over: Partial<EtatCombat> = {}): EtatCombat {
  return {round: 2, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null, ...over};
}

describe('pouvoirsDeCombat', () => {
  it('reads the combat flags copied at the table', () => {
    expect(
      pouvoirsDeCombat([
        {pouvoir: 'Régénération', detail: null, regeneration: true, intangible: false, avertissement_combat: false},
        {pouvoir: 'Intangible', detail: null, regeneration: false, intangible: true, avertissement_combat: true},
        {pouvoir: 'Poison', detail: null, regeneration: false, intangible: false, avertissement_combat: true},
      ]),
    ).toEqual({regeneration: true, intangible: true, poison: true, vulnerabilite: null, avertissements: ['Intangible', 'Poison']});
  });

  it('falls back on the names, without accents or case, for a copy made before the flags', () => {
    expect(pouvoirsDeCombat([{pouvoir: 'regeneration', detail: null}, {pouvoir: ' INTANGIBLE ', detail: null}, {pouvoir: 'poison', detail: null}])).toEqual({
      regeneration: true,
      intangible: true,
      poison: true,
      vulnerabilite: null,
      avertissements: ['INTANGIBLE', 'poison'],
    });
  });

  it('keeps the element of a vulnerability, or none when the detail is empty', () => {
    expect(pouvoirsDeCombat([{pouvoir: 'Vulnérabilité', detail: ' feu '}]).vulnerabilite).toEqual({element: 'feu'});
    expect(pouvoirsDeCombat([{pouvoir: 'Vulnerabilite', detail: ''}]).vulnerabilite).toEqual({element: null});
  });

  it('does not repeat the vulnerability among the warnings: it has its own line', () => {
    expect(pouvoirsDeCombat([{pouvoir: 'Vulnérabilité', detail: 'feu', avertissement_combat: true}, {pouvoir: 'Séducteur', detail: null, avertissement_combat: true}]).avertissements).toEqual([
      'Séducteur',
    ]);
  });

  it('has nothing to say without powers', () => {
    expect(pouvoirsDeCombat(null)).toEqual(SANS_POUVOIR);
    expect(pouvoirsDeCombat([{pouvoir: null, detail: null}, {pouvoir: 'Armure', detail: null}])).toEqual(SANS_POUVOIR);
  });
});

describe('libelleVulnerabilite', () => {
  it('names the element, or only the doubled damage', () => {
    expect(libelleVulnerabilite({element: 'feu'})).toBe('Vulnérable : feu (dégâts doublés)');
    expect(libelleVulnerabilite({element: null})).toBe('Vulnérable (dégâts doublés)');
  });
});

describe('libelleVitalite', () => {
  it('says « Force vitale » for the undead, « Vitalité » otherwise', () => {
    expect(libelleVitalite(card('creature', 1, {mortVivant: true}))).toBe('Force vitale');
    expect(libelleVitalite(card('creature', 1))).toBe('Vitalité');
    expect(libelleVitalite(card('hero', 1))).toBe('Vitalité');
  });
});

describe('regenerationsDuRound', () => {
  const regenere = (vitaliteCourante: number, extra: Partial<TapisCard> = {}): TapisCard =>
    card('demon', 4, {vitaliteCourante, vitaliteMax: 20, pouvoirs: {...SANS_POUVOIR, regeneration: true}, ...extra});

  it('gives 1 vitality to a standing demon with the power', () => {
    expect(regenerationsDuRound([regenere(12)], etat())).toEqual([{card: regenere(12), vitalite: 13}]);
  });

  it('never goes above the maximum', () => {
    expect(regenerationsDuRound([regenere(20)], etat())).toEqual([]);
  });

  it('skips a demon out of the fight, excluded, fled, or without the power', () => {
    const fui = regenere(5, {key: 'demon-9', pivotId: 9});
    const exclu = regenere(5, {key: 'demon-8', pivotId: 8});
    expect(regenerationsDuRound([regenere(0), fui, exclu, card('demon', 5, {vitaliteCourante: 3, vitaliteMax: 20, pouvoirs: SANS_POUVOIR})], etat({exclus: ['demon-8', 'demon-9'], fuis: ['demon-9']}))).toEqual([]);
  });

  it('still regenerates a paralysed or wounded demon that is standing', () => {
    const blesse = regenere(1);
    expect(regenerationsDuRound([blesse], etat({effets: [{...effetParalyse(blesse.key), id: 'e-1'}]}))).toEqual([{card: blesse, vitalite: 2}]);
  });
});

describe('poisonPossible', () => {
  const poisonneux = card('demon', 1, {pouvoirs: {...SANS_POUVOIR, poison: true}});

  it('paralyses a hero or a PNJ, who are of medium size', () => {
    expect(poisonPossible(poisonneux, card('hero', 2))).toBe(true);
    expect(poisonPossible(poisonneux, card('pnj', 3))).toBe(true);
  });

  it('paralyses a creature of medium size or less, not a bigger one', () => {
    expect(poisonPossible(poisonneux, card('creature', 4, {taille: 4}))).toBe(true);
    expect(poisonPossible(poisonneux, card('creature', 4, {taille: 2}))).toBe(true);
    expect(poisonPossible(poisonneux, card('creature', 4, {taille: 5}))).toBe(false);
  });

  it('counts a demon, whose size is not known, as medium', () => {
    expect(poisonPossible(poisonneux, card('demon', 5))).toBe(true);
  });

  it('needs a poisonous attacker and a target', () => {
    expect(poisonPossible(card('demon', 1, {pouvoirs: SANS_POUVOIR}), card('hero', 2))).toBe(false);
    expect(poisonPossible(card('creature', 1), card('hero', 2))).toBe(false);
    expect(poisonPossible(poisonneux, null)).toBe(false);
  });
});

describe('degatsDoubles', () => {
  it('doubles the damage of the hit when the weakness is ticked', () => {
    expect(degatsDoubles(4, true)).toBe(8);
    expect(degatsDoubles(4, false)).toBe(4);
    expect(degatsDoubles(0, true)).toBe(0);
    expect(degatsDoubles(null, true)).toBeNull();
  });
});
