import {describe, expect, it} from 'vitest';
import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard} from '../../models/tapis.model';
import {fuir, peutFuir} from './fuite-opportune.util';

function pnj(id: number, extra: Partial<TapisCard> = {}): TapisCard {
  return {
    key: `pnj-${id}`,
    kind: 'pnj',
    camp: 'adversaires',
    pivotId: id,
    sourceId: 'src',
    nom: `Rival ${id}`,
    avatar: '',
    badge: 'Rival',
    rang: 'Rival',
    degats: 'd6',
    defense: '1',
    vitaliteCourante: 12,
    vitaliteMax: 12,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: 3,
    ...extra,
  };
}

function etat(over: Partial<EtatCombat> = {}): EtatCombat {
  return {round: 2, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null, ...over};
}

describe('peutFuir', () => {
  it('lets a rival with villainy flee', () => {
    expect(peutFuir(pnj(3), etat())).toBe(true);
  });

  it('lets a rival flee even when he seems dead (0 or less)', () => {
    expect(peutFuir(pnj(3, {vitaliteCourante: 0}), etat())).toBe(true);
    expect(peutFuir(pnj(3, {vitaliteCourante: -4}), etat())).toBe(true);
  });

  it('refuses a rival without villainy left', () => {
    expect(peutFuir(pnj(3, {vilenie: 0}), etat())).toBe(false);
    expect(peutFuir(pnj(3, {vilenie: null}), etat())).toBe(false);
  });

  it('refuses a rival already out of this combat (fled or excluded)', () => {
    expect(peutFuir(pnj(3), etat({exclus: ['pnj-3']}))).toBe(false);
    expect(peutFuir(pnj(3), etat({exclus: ['pnj-3'], fuis: ['pnj-3']}))).toBe(false);
  });

  it('refuses whoever is not a rival PNJ', () => {
    expect(peutFuir(pnj(3, {rang: 'Coriace'}), etat())).toBe(false);
    expect(peutFuir({...pnj(3), kind: 'creature', key: 'creature-3'}, etat())).toBe(false);
    expect(peutFuir({...pnj(3), kind: 'hero', key: 'hero-3', rang: null}, etat())).toBe(false);
  });
});

describe('fuir', () => {
  it('excludes the rival from the combat and records that he fled', () => {
    const next = fuir(etat({exclus: ['creature-4']}), 'pnj-3');

    expect(next.exclus).toEqual(['creature-4', 'pnj-3']);
    expect(next.fuis).toEqual(['pnj-3']);
  });

  it('keeps the rest of the state', () => {
    const before = etat({round: 3, joues: ['hero-1'], melee: 3});
    const next = fuir(before, 'pnj-3');

    expect(next.round).toBe(3);
    expect(next.joues).toEqual(['hero-1']);
    expect(next.melee).toBe(3);
  });

  it('does not record the same escape twice', () => {
    const once = fuir(etat(), 'pnj-3');

    expect(fuir(once, 'pnj-3')).toEqual(once);
  });
});
