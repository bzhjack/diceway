import {describe, expect, it} from 'vitest';
import {BolSceneEntry, BolSceneModel} from '../../../models/bol-scene.model';
import {
  distributionSummary,
  loadMessage,
  moveScene,
  needsLoadChoice,
  normalizeTitre,
  scenesOf,
  tableTitle,
} from './scene.util';

function scene(id: string, scenarioId: string | null, ordre: number, titre = id): BolSceneModel {
  return {id, scenario_id: scenarioId, titre, ordre, notes: null, distribution: []};
}

function entry(kind: BolSceneEntry['kind'], qty: number): BolSceneEntry {
  return {kind, source_id: 'x', qty, positions: []};
}

describe('scenesOf', () => {
  const scenes = [scene('b', 's1', 1), scene('a', 's1', 0), scene('c', null, 0), scene('d', 's2', 0)];
  const known = new Set(['s1', 's2']);

  it('returns the scenes of a scenario in their order', () => {
    expect(scenesOf(scenes, 's1', known).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('returns the scenes without scenario for null', () => {
    expect(scenesOf(scenes, null, known).map((s) => s.id)).toEqual(['c']);
  });

  it('puts a scene whose scenario is unknown or deleted under no scenario', () => {
    const orphan = [...scenes, scene('e', 'gone', 3)];
    expect(scenesOf(orphan, null, known).map((s) => s.id)).toEqual(['c', 'e']);
    expect(scenesOf(orphan, 's1', known).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('breaks an order tie by title so the list is stable', () => {
    const tied = [scene('2', null, 0, 'Temple'), scene('1', null, 0, 'Auberge')];
    expect(scenesOf(tied, null, known).map((s) => s.titre)).toEqual(['Auberge', 'Temple']);
  });
});

describe('distributionSummary', () => {
  it('says there is nobody for an empty distribution', () => {
    expect(distributionSummary([])).toBe('Aucun personnage');
  });

  it('counts instances per kind, with French plurals', () => {
    expect(distributionSummary([entry('pnj', 1), entry('pnj', 1), entry('creature', 3), entry('demon', 1)])).toBe(
      '2 PNJ · 3 créatures · 1 démon',
    );
  });

  it('omits the kinds that are absent', () => {
    expect(distributionSummary([entry('creature', 1)])).toBe('1 créature');
  });
});

describe('moveScene', () => {
  const ids = ['a', 'b', 'c'];

  it('moves a scene one rank up or down', () => {
    expect(moveScene(ids, 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveScene(ids, 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('returns null when the first scene goes up or the last one goes down', () => {
    expect(moveScene(ids, 'a', -1)).toBeNull();
    expect(moveScene(ids, 'c', 1)).toBeNull();
  });

  it('returns null for a scene that is not in the list', () => {
    expect(moveScene(ids, 'zzz', 1)).toBeNull();
  });

  it('does not mutate the list it is given', () => {
    moveScene(ids, 'b', 1);
    expect(ids).toEqual(['a', 'b', 'c']);
  });
});

describe('needsLoadChoice', () => {
  it('loads directly when only heroes are on the table', () => {
    expect(needsLoadChoice(0)).toBe(false);
  });

  it('asks replace or add as soon as another character is present', () => {
    expect(needsLoadChoice(1)).toBe(true);
  });
});

describe('tableTitle', () => {
  it('keeps the session title when there is no current scene', () => {
    expect(tableTitle('Soirée du 2', null)).toBe('Soirée du 2');
    expect(tableTitle(null, undefined)).toBeNull();
  });

  it('shows scenario and scene', () => {
    expect(tableTitle('x', {id: '1', titre: 'Le temple', scenario: {id: 's', titre: 'La Perle du Beshaar'}})).toBe(
      'La Perle du Beshaar · Le temple',
    );
  });

  it('shows the scene alone when it has no scenario', () => {
    expect(tableTitle('x', {id: '1', titre: 'Le temple', scenario: null})).toBe('Le temple');
  });
});

describe('normalizeTitre', () => {
  it('trims the title', () => {
    expect(normalizeTitre('  Le temple ')).toBe('Le temple');
  });

  it('rejects an empty or blank title', () => {
    expect(normalizeTitre('')).toBeNull();
    expect(normalizeTitre('   ')).toBeNull();
    expect(normalizeTitre(null)).toBeNull();
  });

  it('cuts a title longer than 120 characters', () => {
    expect(normalizeTitre('a'.repeat(200))).toHaveLength(120);
  });
});

describe('loadMessage', () => {
  it('confirms the load', () => {
    expect(loadMessage('Le temple', 0)).toBe('Scène « Le temple » chargée.');
  });

  it('mentions ignored characters, singular and plural', () => {
    expect(loadMessage('Le temple', 1)).toBe(
      'Scène « Le temple » chargée. 1 personnage a été ignoré (déjà sur la table ou supprimé de la bibliothèque).',
    );
    expect(loadMessage('Le temple', 2)).toBe(
      'Scène « Le temple » chargée. 2 personnages ont été ignorés (déjà sur la table ou supprimés de la bibliothèque).',
    );
  });
});
