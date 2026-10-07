import {describe, expect, it} from 'vitest';
import {applyArmureEquipToggle, toggleEquipee} from './form-selection';

describe('applyArmureEquipToggle', () => {
  const categorieOf = (id: number): string | null => ({1: 'armure', 2: 'armure', 3: 'bouclier'} as Record<number, string>)[id] ?? null;

  it('equips an item and unequips others of the same categorie', () => {
    const armures = [
      {id: 1, equipee: true},
      {id: 2, equipee: false},
      {id: 3, equipee: true},
    ];

    const result = applyArmureEquipToggle(armures, 1, categorieOf);

    expect(result).toEqual([
      {id: 1, equipee: false},
      {id: 2, equipee: true},
      {id: 3, equipee: true},
    ]);
  });

  it('unequips an item without affecting others', () => {
    const armures = [
      {id: 1, equipee: true},
      {id: 3, equipee: true},
    ];

    const result = applyArmureEquipToggle(armures, 0, categorieOf);

    expect(result).toEqual([
      {id: 1, equipee: false},
      {id: 3, equipee: true},
    ]);
  });

  it('returns a copy unchanged when the index is out of range', () => {
    const armures = [{id: 1, equipee: false}];
    expect(applyArmureEquipToggle(armures, 5, categorieOf)).toEqual(armures);
  });
});

describe('toggleEquipee', () => {
  it('flips the equipped state of one entry and leaves the others alone — several weapons can be equipped', () => {
    const armes = [
      {id: 1, equipee: true},
      {id: 2, equipee: false},
      {id: 3, equipee: true},
    ];

    expect(toggleEquipee(armes, 1)).toEqual([
      {id: 1, equipee: true},
      {id: 2, equipee: true},
      {id: 3, equipee: true},
    ]);
    expect(toggleEquipee(armes, 0).map((a) => a.equipee)).toEqual([false, false, true]);
  });

  it('does not modify the original list', () => {
    const armes = [{id: 1, equipee: true}];
    toggleEquipee(armes, 0);
    expect(armes[0].equipee).toBe(true);
  });

  it('returns an unchanged copy for an index that does not exist', () => {
    const armes = [{id: 1, equipee: true}];
    expect(toggleEquipee(armes, 5)).toEqual(armes);
  });
});
