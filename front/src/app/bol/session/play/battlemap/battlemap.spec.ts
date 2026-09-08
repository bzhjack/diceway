import {describe, expect, it} from 'vitest';
import {parseBattlemapTerrain} from './battlemap';

describe('parseBattlemapTerrain', () => {
  it('accepts each known terrain key', () => {
    expect(parseBattlemapTerrain('herbe')).toBe('herbe');
    expect(parseBattlemapTerrain('dalles')).toBe('dalles');
    expect(parseBattlemapTerrain('terre')).toBe('terre');
  });

  it('falls back to herbe when the stored value is null (nothing saved yet)', () => {
    expect(parseBattlemapTerrain(null)).toBe('herbe');
  });

  it('falls back to herbe for an unknown/corrupted stored value', () => {
    expect(parseBattlemapTerrain('sable')).toBe('herbe');
    expect(parseBattlemapTerrain('')).toBe('herbe');
  });
});
