import {describe, expect, it} from 'vitest';
import {CombatCatalogEntry, CombatantKind} from '../../../models/combat-selection.model';
import {filterReserve, isOnTable, RESERVE_TABS, reserveTab} from './reserve.util';

function entry(kind: CombatantKind, sourceId: string, nom: string): CombatCatalogEntry {
  return {catalogId: `${kind}:${sourceId}`, kind, sourceId, nom, vitalite: 10, avatar: ''} as CombatCatalogEntry;
}

const CATALOG: readonly CombatCatalogEntry[] = [
  entry('pnj', 'p2', 'Surdral Prados'),
  entry('pnj', 'p1', 'Prêtre de Shazzadion'),
  entry('hero', 'h1', 'Kalena'),
  entry('creature', 'c1', 'Hippocampe'),
];

describe('filterReserve', () => {
  it('keeps only the entries of the requested kind, sorted by name', () => {
    expect(filterReserve(CATALOG, 'pnj', '').map((e) => e.nom)).toEqual(['Prêtre de Shazzadion', 'Surdral Prados']);
  });

  it('finds an accented name from an unaccented, lower-case query', () => {
    expect(filterReserve(CATALOG, 'pnj', 'pretre').map((e) => e.nom)).toEqual(['Prêtre de Shazzadion']);
  });

  it('ignores surrounding spaces in the query', () => {
    expect(filterReserve(CATALOG, 'hero', '  kal ').map((e) => e.nom)).toEqual(['Kalena']);
  });

  it('returns nothing when no name matches', () => {
    expect(filterReserve(CATALOG, 'creature', 'dragon')).toEqual([]);
  });
});

describe('isOnTable', () => {
  const heroIds = new Set(['h1']);
  const pnjIds = new Set(['p1']);

  it('is true for a hero or a PNJ already in the session', () => {
    expect(isOnTable(entry('hero', 'h1', 'Kalena'), heroIds, pnjIds)).toBe(true);
    expect(isOnTable(entry('pnj', 'p1', 'Prêtre'), heroIds, pnjIds)).toBe(true);
  });

  it('is false for a hero or a PNJ not yet in the session', () => {
    expect(isOnTable(entry('hero', 'h2', 'Rork'), heroIds, pnjIds)).toBe(false);
    expect(isOnTable(entry('pnj', 'p2', 'Surdral'), heroIds, pnjIds)).toBe(false);
  });

  it('is always false for creatures and demons, which can be placed several times', () => {
    expect(isOnTable(entry('creature', 'h1', 'Hippocampe'), heroIds, pnjIds)).toBe(false);
    expect(isOnTable(entry('demon', 'p1', 'Démon'), heroIds, pnjIds)).toBe(false);
  });

  it('compares ids as strings (the API mixes integer and UUID ids)', () => {
    const numeric = {...entry('hero', '7', 'Thaïs'), sourceId: 7 as unknown as string};
    expect(isOnTable(numeric, new Set(['7']), new Set())).toBe(true);
  });
});

describe('RESERVE_TABS', () => {
  it('lists the four kinds in display order', () => {
    expect(RESERVE_TABS.map((t) => t.kind)).toEqual(['hero', 'pnj', 'creature', 'demon']);
  });

  it('resolves a tab from its kind', () => {
    expect(reserveTab('demon').createLink).toBe('/create/demon');
  });
});
