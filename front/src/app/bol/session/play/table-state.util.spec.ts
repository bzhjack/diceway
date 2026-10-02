import {describe, expect, it} from 'vitest';
import {PlayToken} from '../combat-play.util';
import {findSelectedToken, readPanelOpen, writePanelOpen} from './table-state.util';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  } as Storage;
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
} as unknown as Storage;

describe('readPanelOpen', () => {
  it('returns the stored value', () => {
    expect(readPanelOpen(fakeStorage({k: '0'}), 'k', true)).toBe(false);
    expect(readPanelOpen(fakeStorage({k: '1'}), 'k', false)).toBe(true);
  });

  it('falls back when nothing is stored', () => {
    expect(readPanelOpen(fakeStorage(), 'k', true)).toBe(true);
  });

  it('falls back on a corrupted value', () => {
    expect(readPanelOpen(fakeStorage({k: 'banana'}), 'k', true)).toBe(true);
  });

  it('falls back when storage is unavailable or throws', () => {
    expect(readPanelOpen(null, 'k', true)).toBe(true);
    expect(readPanelOpen(throwingStorage, 'k', true)).toBe(true);
  });
});

describe('writePanelOpen', () => {
  it('stores a value readPanelOpen reads back', () => {
    const storage = fakeStorage();
    writePanelOpen(storage, 'k', false);
    expect(readPanelOpen(storage, 'k', true)).toBe(false);
  });

  it('does not throw when storage is unavailable or throws', () => {
    expect(() => writePanelOpen(null, 'k', true)).not.toThrow();
    expect(() => writePanelOpen(throwingStorage, 'k', true)).not.toThrow();
  });
});

describe('findSelectedToken', () => {
  const tokens = [{key: 'hero-1'}, {key: 'pnj-2'}] as PlayToken[];

  it('returns the token matching the selected key in free mode', () => {
    expect(findSelectedToken(tokens, 'pnj-2', 'libre')?.key).toBe('pnj-2');
  });

  it('returns null when the selected token is no longer on the table', () => {
    expect(findSelectedToken(tokens, 'creature-9-0', 'libre')).toBeNull();
  });

  it('returns null in combat mode, where the inspector is not shown', () => {
    expect(findSelectedToken(tokens, 'hero-1', 'combat')).toBeNull();
  });

  it('returns null when nothing is selected', () => {
    expect(findSelectedToken(tokens, null, 'libre')).toBeNull();
  });
});
