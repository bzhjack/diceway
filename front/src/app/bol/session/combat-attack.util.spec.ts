import {describe, expect, it} from 'vitest';
import {dualStrikeDegats, equippedProtection, isDualWieldEligible} from './combat-attack.util';

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
