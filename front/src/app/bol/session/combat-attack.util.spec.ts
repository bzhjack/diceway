import {describe, expect, it} from 'vitest';
import {firstValueFrom, of} from 'rxjs';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosService} from '../services/bol-heros.service';
import {dualStrikeDegats, equippedProtection, isDualWieldEligible, resolveAttackStats} from './combat-attack.util';
import {PlayToken} from './models/combat-play.model';

describe('isDualWieldEligible', () => {
  it('accepts light weapons (d6M)', () => {
    expect(isDualWieldEligible('d6M')).toBe(true);
  });

  it('accepts medium weapons (d6)', () => {
    expect(isDualWieldEligible('d6')).toBe(true);
  });

  it('accepts bare hands / improvised (d3)', () => {
    expect(isDualWieldEligible('d3')).toBe(true);
  });

  it('rejects heavy weapons (d6B) — combat à deux armes uniquement armes légères/moyennes', () => {
    expect(isDualWieldEligible('d6B')).toBe(false);
  });

  it('rejects a missing degats string', () => {
    expect(isDualWieldEligible(null)).toBe(false);
  });
});

describe('dualStrikeDegats', () => {
  it('two light weapons upgrade to medium damage', () => {
    expect(dualStrikeDegats('d6M', 'd6M')).toBe('d6');
  });

  it('one medium + one light weapon upgrade to heavy damage', () => {
    expect(dualStrikeDegats('d6', 'd6M')).toBe('d6B');
    expect(dualStrikeDegats('d6M', 'd6')).toBe('d6B');
  });

  it('two medium weapons upgrade to heavy damage', () => {
    expect(dualStrikeDegats('d6', 'd6')).toBe('d6B');
  });

  it('treats bare hands (d3) as light', () => {
    expect(dualStrikeDegats('d3', 'd3')).toBe('d6');
    expect(dualStrikeDegats('d6', 'd3')).toBe('d6B');
  });
});

describe('equippedProtection', () => {
  const light = {equipee: true, armure: {protection: 'd6-3 (1)', categorie: 'armure'}};
  const heavy = {equipee: true, armure: {protection: 'd6-1 (3)', categorie: 'armure'}};
  const helmet = {equipee: true, armure: {protection: '+1', categorie: 'casque'}};

  it('reads the worn armour, not the first one of the list', () => {
    expect(equippedProtection([{...light, equipee: false}, heavy])).toEqual({text: 'd6-1 (3)', value: 3});
  });

  it('adds +1 for a worn helmet', () => {
    expect(equippedProtection([heavy, helmet])).toEqual({text: 'd6-1 (3) +1', value: 4});
  });

  it('ignores armour that is owned but not worn', () => {
    expect(equippedProtection([{...heavy, equipee: false}])).toEqual({text: null, value: 0});
  });

  it('counts a helmet alone as 1', () => {
    expect(equippedProtection([helmet])).toEqual({text: '1', value: 1});
  });

  it('is nothing when the hero wears nothing, or when the catalogue is not loaded', () => {
    expect(equippedProtection([])).toEqual({text: null, value: 0});
    expect(equippedProtection([3, 4])).toEqual({text: null, value: 0});
    expect(equippedProtection(undefined)).toEqual({text: null, value: 0});
  });
});

describe('resolveAttackStats — un PNJ porte tout ce qu’il possède', () => {
  // Le Champion gladiateur du livre : « Agilité 1 (0*) », armure moyenne d6-2 (2), bouclier. En base, ses armures sont « non équipées ».
  const fiche = {
    attributs: {agilite: 1, agilite_effective: 0},
    combat: {defense: 1, defense_effective: 1},
    armures: [
      {equipee: false, armure: {protection: 'd6-2(2)', categorie: 'armure'}},
      {equipee: false, armure: {protection: 'Impose un malus de -1 à une attaque subie par round', categorie: 'bouclier'}},
    ],
    equipement_effectif: {bouclier_malus_attaque_subie: 1, bouclier_malus_attaque_subie_portee: 'une', bouclier_defense_toutes: 0},
  } as unknown as BolHerosModel;
  const service = {heros: () => of(fiche)} as unknown as BolHerosService;
  const token = {
    kind: 'pnj',
    combat: {sourceId: 'pnj-4', agilite: 1, vigueur: 2, melee: 1, tir: -1, attaque: null, defense: 1, degats: 'd6', protection: null},
  } as unknown as PlayToken;

  it('counts its armour even when it is stored as not worn', async () => {
    const stats = await firstValueFrom(resolveAttackStats(token, service));
    expect(stats.protection).toBe(2);
    expect(stats.protectionText).toBe('d6-2(2)');
  });

  it('takes its agility and defence with all its equipment, and its shield', async () => {
    const stats = await firstValueFrom(resolveAttackStats(token, service));
    expect(stats.agilite).toBe(0);
    expect(stats.defense).toBe(1);
    expect(stats.bouclierMalusUneAttaque).toBe(1);
  });
});
