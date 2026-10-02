import {describe, expect, it} from 'vitest';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {CombatCatalogEntry, CombatantKind} from '../../../services/combat-selection.service';
import {
  buildResults,
  flattenResults,
  nextIndex,
  PALETTE_MAX_RESULTS,
  PaletteGroupId,
  PaletteInput,
  parseQuery,
} from './command-palette.util';

function entry(kind: CombatantKind, sourceId: string, nom: string): CombatCatalogEntry {
  return {catalogId: `${kind}:${sourceId}`, kind, sourceId, nom, vitalite: 10, avatar: ''} as CombatCatalogEntry;
}

function scene(id: string, titre: string, scenario: string | null = null): BolSceneModel {
  return {
    id,
    scenario_id: scenario ? 's1' : null,
    titre,
    ordre: 0,
    notes: null,
    distribution: [],
    scenario: scenario ? {id: 's1', titre: scenario} : null,
  };
}

const CATALOG: readonly CombatCatalogEntry[] = [
  entry('hero', 'h1', 'Kalena'),
  entry('hero', 'h2', 'Rork'),
  entry('pnj', 'p1', 'Garde du port'),
  entry('pnj', 'p2', 'Prêtre de Shazzadion'),
  entry('creature', 'c1', 'Loup géant'),
  entry('creature', 'c2', 'Loup Géant'),
  entry('creature', 'c3', 'Chien-loup'),
  entry('demon', 'd1', 'Baalgor le Cruel'),
];

function input(query: string, overrides: Partial<PaletteInput> = {}): PaletteInput {
  return {
    query,
    mode: 'libre',
    tokens: [
      {key: 'hero-1', nom: 'Kalena', kind: 'hero'},
      {key: 'pnj-7', nom: 'Garde du port', kind: 'pnj'},
    ],
    catalog: CATALOG,
    heroIds: new Set(['h1']),
    pnjIds: new Set(['p1']),
    scenes: [scene('s-a', 'Le temple', 'La Perle'), scene('s-b', 'Taverne de Marsus')],
    reserveOpen: true,
    ...overrides,
  };
}

function labels(query: string, overrides: Partial<PaletteInput> = {}): Partial<Record<PaletteGroupId, string[]>> {
  return Object.fromEntries(
    buildResults(input(query, overrides)).map((g) => [g.id, g.results.map((r) => r.label)]),
  ) as Partial<Record<PaletteGroupId, string[]>>;
}

describe('parseQuery', () => {
  it('has a quantity of 1 when no number leads the query', () => {
    expect(parseQuery('  loup ')).toEqual({quantity: 1, term: 'loup'});
  });

  it('reads a leading number followed by a space as the quantity', () => {
    expect(parseQuery('3 loup')).toEqual({quantity: 3, term: 'loup'});
    expect(parseQuery('  12   loup géant ')).toEqual({quantity: 12, term: 'loup géant'});
  });

  it('clamps the quantity between 1 and 20', () => {
    expect(parseQuery('250 loup').quantity).toBe(20);
    expect(parseQuery('0 loup').quantity).toBe(1);
  });

  it('does not treat a number glued to the text as a quantity', () => {
    expect(parseQuery('3loups')).toEqual({quantity: 1, term: '3loups'});
  });

  it('keeps a lone number as plain text', () => {
    expect(parseQuery('3')).toEqual({quantity: 1, term: '3'});
  });

  it('reads a number followed only by a space as a quantity without text', () => {
    expect(parseQuery('3 ')).toEqual({quantity: 3, term: ''});
  });
});

describe('buildResults', () => {
  it('shows only the actions for an empty query, in their declared order', () => {
    const groups = buildResults(input(''));
    expect(groups.map((g) => g.id)).toEqual(['action']);
    expect(groups[0].results.map((r) => r.label).slice(0, 3)).toEqual([
      'Démarrer un combat',
      'Enregistrer la table comme scène',
      'Replier la réserve',
    ]);
  });

  it('orders the groups: table, place, scene, action', () => {
    const groups = buildResults(input('e'));
    expect(groups.map((g) => g.id)).toEqual(['table', 'place', 'scene', 'action']);
  });

  it('finds tokens, library entries and scenes without accents or case', () => {
    expect(labels('pretre').place).toEqual(['Prêtre de Shazzadion']);
    expect(labels('KALENA').table).toEqual(['Kalena']);
    expect(labels('taverne').scene).toEqual(['Taverne de Marsus']);
  });

  it('ranks names starting with the text before names only containing it', () => {
    expect(labels('loup').place).toEqual(['Loup géant', 'Loup Géant', 'Chien-loup']);
  });

  it('keeps two entries with the same name, each with its own id', () => {
    const place = buildResults(input('loup g')).find((g) => g.id === 'place')!;
    expect(place.results).toHaveLength(2);
    expect(new Set(place.results.map((r) => r.id)).size).toBe(2);
  });

  it('never offers to place a hero or a PNJ already on the table', () => {
    expect(labels('kalena').place).toBeUndefined();
    expect(labels('garde').place).toBeUndefined();
    expect(labels('rork').place).toEqual(['Rork']);
  });

  it('returns the command matching each kind of result', () => {
    const flat = flattenResults(buildResults(input('kalena')));
    expect(flat[0].command).toEqual({type: 'select', key: 'hero-1'});

    const place = flattenResults(buildResults(input('baalgor')))[0];
    expect(place.command).toEqual({type: 'place', kind: 'demon', sourceId: 'd1', nom: 'Baalgor le Cruel', qty: 1});

    const load = flattenResults(buildResults(input('temple')))[0];
    expect(load.command).toMatchObject({type: 'loadScene', scene: {id: 's-a'}});
    expect(load.hint).toBe('La Perle');
  });

  it('with a quantity, only offers creatures and demons, as a batch', () => {
    const groups = buildResults(input('3 loup'));
    expect(groups.map((g) => g.id)).toEqual(['place']);
    expect(groups[0].results[0].command).toMatchObject({type: 'place', kind: 'creature', qty: 3});
    expect(groups[0].results[0].hint).toContain('×3');
  });

  it('offers nothing when a quantity is put in front of a hero or a PNJ', () => {
    expect(buildResults(input('3 pretre'))).toEqual([]);
    expect(buildResults(input('2 rork'))).toEqual([]);
  });

  it('offers nothing for a quantity without text', () => {
    expect(buildResults(input('3 '))).toEqual([]);
  });

  it('only offers actions in combat mode, and the combat ones', () => {
    const groups = buildResults(input('', {mode: 'combat'}));
    expect(groups.map((g) => g.id)).toEqual(['action']);
    const actionLabels = groups[0].results.map((r) => r.label);
    expect(actionLabels).toContain('Terminer le combat');
    expect(actionLabels).not.toContain('Démarrer un combat');
    expect(actionLabels).not.toContain('Enregistrer la table comme scène');
    expect(buildResults(input('kalena', {mode: 'combat'}))).toEqual([]);
  });

  it('names the reserve action after its current state', () => {
    expect(labels('réserve').action).toEqual(['Replier la réserve']);
    expect(labels('réserve', {reserveOpen: false}).action).toEqual(['Déplier la réserve']);
  });

  it('caps each searchable group at 5 and the whole list at 12', () => {
    const many = Array.from({length: 30}, (_, i) => entry('creature', `x${i}`, `Rat ${String(i).padStart(2, '0')}`));
    const groups = buildResults(input('r', {catalog: many, tokens: [], scenes: []}));
    expect(groups.find((g) => g.id === 'place')!.results).toHaveLength(5);
    expect(flattenResults(groups).length).toBeLessThanOrEqual(PALETTE_MAX_RESULTS);
  });

  it('returns nothing, without throwing, for punctuation or special characters', () => {
    for (const query of ['(', '*', '[a-', '\\', '   ?   ']) {
      expect(buildResults(input(query))).toEqual([]);
    }
  });
});

describe('nextIndex', () => {
  it('moves down and up', () => {
    expect(nextIndex(0, 3, 1)).toBe(1);
    expect(nextIndex(2, 3, -1)).toBe(1);
  });

  it('wraps around at both ends', () => {
    expect(nextIndex(2, 3, 1)).toBe(0);
    expect(nextIndex(0, 3, -1)).toBe(2);
  });

  it('returns -1 for an empty list', () => {
    expect(nextIndex(0, 0, 1)).toBe(-1);
  });

  it('recovers from an index left out of range by a list that shrank', () => {
    expect(nextIndex(9, 3, 1)).toBe(0);
    expect(nextIndex(9, 3, -1)).toBe(2);
    expect(nextIndex(-1, 3, 1)).toBe(0);
  });
});
