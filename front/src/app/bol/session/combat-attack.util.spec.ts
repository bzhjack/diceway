import {describe, expect, it} from 'vitest';
import {dualStrikeDegats, isDualWieldEligible} from './combat-attack.util';

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
