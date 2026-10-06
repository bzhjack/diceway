import {describe, expect, it} from 'vitest';
import {equippedArmes, firstEquippedDegats, isArmeEquipee} from './arme-equipee';

describe('isArmeEquipee', () => {
  it('is true when the weapon is flagged equipped', () => {
    expect(isArmeEquipee({equipee: true})).toBe(true);
  });

  it('is false only when the weapon is explicitly unequipped', () => {
    expect(isArmeEquipee({equipee: false})).toBe(false);
  });

  it('counts a weapon with no flag as equipped (weapons made before the notion existed, bare hands)', () => {
    expect(isArmeEquipee({})).toBe(true);
  });
});

describe('equippedArmes', () => {
  it('keeps the equipped weapons, in order', () => {
    const armes = [{n: 1, equipee: false}, {n: 2, equipee: true}, {n: 3}];
    expect(equippedArmes(armes).map((a) => a.n)).toEqual([2, 3]);
  });
});

describe('firstEquippedDegats', () => {
  const arme = (degats: string | null, equipee?: boolean) => ({arme: {degats}, equipee});

  it('gives the damage of the first equipped weapon that has some', () => {
    expect(firstEquippedDegats([arme('d6', false), arme(null), arme('d6B', true)])).toBe('d6B');
  });

  it('is null when no equipped weapon has damage', () => {
    expect(firstEquippedDegats([arme('d6B', false), arme(null, true)])).toBeNull();
    expect(firstEquippedDegats([])).toBeNull();
  });

  it('ignores ids that were not loaded', () => {
    expect(firstEquippedDegats([4, 5])).toBeNull();
  });
});
