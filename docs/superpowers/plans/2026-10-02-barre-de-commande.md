# Barre de commande Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à la table une barre de commande ouverte au clavier (`/` ou `Ctrl+K`) pour trouver un jeton, poser un personnage ou un lot, charger une scène ou lancer une action en quelques touches.

**Architecture:** La recherche, le classement, la lecture de la quantité et la détection du raccourci sont des fonctions pures. Le composant `bol-command-palette` (un `MatDialog`) n'appelle aucun service : il renvoie une `PaletteCommand` à `session-play-page`, qui l'exécute avec le code existant. Le chargement d'une scène et l'enregistrement de la table sont extraits de `bol-scene-list` dans `SceneActionsService`, partagé avec la barre.

**Tech Stack:** Angular 22 (standalone, signals, OnPush), Angular Material (`MatDialog`), Vitest. Aucun changement backend.

**Spec:** `docs/superpowers/specs/2026-10-02-barre-de-commande-design.md`

## Global Constraints

- La barre n'ajoute aucune fonction : chaque commande appelle un chemin de code qui existe déjà.
- La barre ne parle à aucun service ; elle se ferme avec la commande choisie ou `undefined`.
- Au plus 12 résultats ; 5 au plus pour chacun des groupes « Sur la table », « Poser », « Scènes ».
- Quantité de 1 à 20 ; au-delà, ramenée à 20. Elle ne s'applique qu'aux créatures et aux démons.
- En mode `combat`, seul le groupe « Actions » est proposé.
- `/` est ignorée dans un champ de saisie ; `Ctrl+K` / `Cmd+K` fonctionne aussi depuis un champ ; aucun des deux n'ouvre la barre si un dialogue est déjà ouvert.
- Conventions Angular du `CLAUDE.md` : pas de `standalone: true`, `OnPush`, `input()`/`output()`, `inject()`, `@if`/`@for`, pas de `ngClass`/`ngStyle`, pas de `@HostListener` (objet `host`), pas de fonction fléchée dans les templates, Angular Material uniquement, couleurs par tokens `--dw-*`.
- Tests : fonctions pures uniquement (pratique du dépôt, pas de `TestBed` de composant). Le comportement des composants est vérifié dans le navigateur (tâche 5).
- Lancer un test : `cd front && npx ng test --watch=false --include "**/<fichier>.spec.ts"`. Valider : `cd front && npm run build`.
- **Git** : pas de commit, pas de branche, pas de worktree, sauf autorisation explicite donnée pour l'exécution. Lionel gère git lui-même.
- Textes d'interface en français.

## Review Focus

Cas que la spec implique sans les nommer, les plus probables d'abord. Chacun a son test dans la tâche indiquée.

1. **Deux fiches de même nom** (« Loup géant » et « Loup Géant » existent dans la bibliothèque de test) : les deux apparaissent, avec des identifiants distincts, dans un ordre stable. → `buildResults`, tâche 1.
2. **Quantité devant un héros ou un PNJ** (« 3 garde ») : rien n'est proposé à poser, puisqu'un PNJ ne figure qu'une fois sur la table. → `buildResults`, tâche 1.
3. **Saisie faite de ponctuation ou de caractères spéciaux** (« ( », « * ») : aucun plantage, simplement aucun résultat. → `buildResults`, tâche 1.
4. **Résultats qui changent pendant que la barre est ouverte** (la bibliothèque finit de charger) : l'index actif reste valide, y compris quand la liste devient vide. → `nextIndex`, tâche 1.
5. **`/` tapée dans les notes d'une scène, la recherche de la réserve ou le total des dés** : la barre ne s'ouvre pas et le caractère est bien saisi. → `isPaletteShortcut`, tâche 1.

---

### Task 1: Fonctions pures de la barre

**Files:**
- Create: `front/src/app/bol/session/play/command-palette/command-palette.util.ts`
- Create: `front/src/app/bol/session/play/command-palette/shortcut.util.ts`
- Test: `front/src/app/bol/session/play/command-palette/command-palette.util.spec.ts`
- Test: `front/src/app/bol/session/play/command-palette/shortcut.util.spec.ts`
- Modify: `front/src/app/bol/session/play/reserve/reserve.util.ts` (exporter la normalisation de recherche)

**Interfaces:**
- Consumes: `isOnTable(entry, heroIds, pnjIds)` et la normalisation de `reserve.util.ts` ; `CombatCatalogEntry`, `CombatantKind` (`bol/services/combat-selection.service.ts`) ; `BolSceneModel` (`bol/models/bol-scene.model.ts`).
- Produces:
  - `reserve.util.ts` exporte `normalizeSearch(value: string): string`.
  - `command-palette.util.ts` : constantes `PALETTE_MAX_RESULTS = 12`, `PALETTE_GROUP_LIMIT = 5`, `PALETTE_MAX_QUANTITY = 20` ; types `PaletteMode`, `PaletteActionId`, `PaletteCommand`, `PaletteGroupId`, `PaletteResult`, `PaletteGroup`, `PaletteToken`, `PaletteContext`, `PaletteInput` ; fonctions `parseQuery(raw): {quantity: number; term: string}`, `buildResults(input: PaletteInput): PaletteGroup[]`, `flattenResults(groups): PaletteResult[]`, `nextIndex(current: number, count: number, delta: -1 | 1): number`.
  - `shortcut.util.ts` : `isPaletteShortcut(event: ShortcutEvent, target: ShortcutTarget | null): boolean`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `front/src/app/bol/session/play/command-palette/command-palette.util.spec.ts` :

```ts
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
```

Créer `front/src/app/bol/session/play/command-palette/shortcut.util.spec.ts` :

```ts
import {describe, expect, it} from 'vitest';
import {isPaletteShortcut, ShortcutEvent} from './shortcut.util';

function key(k: string, mods: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {key: k, ctrlKey: false, metaKey: false, altKey: false, ...mods};
}

describe('isPaletteShortcut', () => {
  it('opens on "/" when focus is not in a field', () => {
    expect(isPaletteShortcut(key('/'), null)).toBe(true);
    expect(isPaletteShortcut(key('/'), {tagName: 'BODY'})).toBe(true);
    expect(isPaletteShortcut(key('/'), {tagName: 'BUTTON'})).toBe(true);
  });

  it('ignores "/" typed in an input, a textarea, a select or an editable element', () => {
    expect(isPaletteShortcut(key('/'), {tagName: 'INPUT'})).toBe(false);
    expect(isPaletteShortcut(key('/'), {tagName: 'TEXTAREA'})).toBe(false);
    expect(isPaletteShortcut(key('/'), {tagName: 'SELECT'})).toBe(false);
    expect(isPaletteShortcut(key('/'), {tagName: 'DIV', isContentEditable: true})).toBe(false);
  });

  it('opens on Ctrl+K and Cmd+K, even from a field', () => {
    expect(isPaletteShortcut(key('k', {ctrlKey: true}), {tagName: 'INPUT'})).toBe(true);
    expect(isPaletteShortcut(key('K', {metaKey: true}), null)).toBe(true);
  });

  it('ignores other keys and other modifier combinations', () => {
    expect(isPaletteShortcut(key('k'), null)).toBe(false);
    expect(isPaletteShortcut(key('/', {ctrlKey: true}), null)).toBe(false);
    expect(isPaletteShortcut(key('k', {ctrlKey: true, altKey: true}), null)).toBe(false);
    expect(isPaletteShortcut(key('Escape'), null)).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `cd front && npx ng test --watch=false --include "**/command-palette/*.spec.ts"`
Expected: FAIL, modules `./command-palette.util` et `./shortcut.util` introuvables.

- [ ] **Step 3: Exporter la normalisation de recherche**

Dans `front/src/app/bol/session/play/reserve/reserve.util.ts`, remplacer :

```ts
/** Minuscules sans diacritiques : « Prêtre » et « pretre » se valent pour la recherche. */
function normalize(value: string): string {
```

par :

```ts
/** Minuscules sans diacritiques : « Prêtre » et « pretre » se valent pour la recherche. Partagé avec
 * la barre de commande. */
export function normalizeSearch(value: string): string {
```

et, dans `filterReserve` du même fichier, remplacer les deux appels `normalize(` par `normalizeSearch(`.

- [ ] **Step 4: Écrire `shortcut.util.ts`**

Créer `front/src/app/bol/session/play/command-palette/shortcut.util.ts` :

```ts
/** Ce qu'il faut d'un `KeyboardEvent` pour décider — sous-ensemble structurel, testable sans DOM. */
export interface ShortcutEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
}

/** Ce qu'il faut de la cible de l'événement (un `HTMLElement` convient). */
export interface ShortcutTarget {
  readonly tagName?: string;
  readonly isContentEditable?: boolean;
}

const EDITABLE_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditable(target: ShortcutTarget | null): boolean {
  return !!target && (target.isContentEditable === true || EDITABLE_TAGS.has((target.tagName ?? '').toUpperCase()));
}

/** Cet événement clavier doit-il ouvrir la barre de commande ? `Ctrl+K` / `Cmd+K` partout ; `/`
 * seulement hors d'un champ de saisie, pour ne pas empêcher de taper le caractère. */
export function isPaletteShortcut(event: ShortcutEvent, target: ShortcutTarget | null): boolean {
  if (event.altKey) {
    return false;
  }
  if (event.ctrlKey || event.metaKey) {
    return event.key.toLowerCase() === 'k';
  }
  return event.key === '/' && !isEditable(target);
}
```

- [ ] **Step 5: Écrire `command-palette.util.ts`**

Créer `front/src/app/bol/session/play/command-palette/command-palette.util.ts` :

```ts
import {BolSceneModel} from '../../../models/bol-scene.model';
import {CombatCatalogEntry, CombatantKind} from '../../../services/combat-selection.service';
import {isOnTable, normalizeSearch} from '../reserve/reserve.util';

export const PALETTE_MAX_RESULTS = 12;
export const PALETTE_GROUP_LIMIT = 5;
export const PALETTE_MAX_QUANTITY = 20;

export type PaletteMode = 'libre' | 'combat';

export type PaletteActionId =
  | 'startCombat'
  | 'endCombat'
  | 'saveScene'
  | 'toggleReserve'
  | 'createHero'
  | 'createPnj'
  | 'createCreature'
  | 'createDemon'
  | 'sessions'
  | 'newSession'
  | 'intendance';

/** Ce que la barre renvoie à la page, qui l'exécute. */
export type PaletteCommand =
  | {readonly type: 'select'; readonly key: string}
  | {
      readonly type: 'place';
      readonly kind: CombatantKind;
      readonly sourceId: string;
      readonly nom: string;
      readonly qty: number;
    }
  | {readonly type: 'loadScene'; readonly scene: BolSceneModel}
  | {readonly type: 'action'; readonly id: PaletteActionId};

export type PaletteGroupId = 'table' | 'place' | 'scene' | 'action';

export interface PaletteResult {
  /** Identifiant unique, utilisable comme `id` DOM (`aria-activedescendant`). */
  readonly id: string;
  /** Pastille affichée : type de personnage, scène ou action. */
  readonly kind: CombatantKind | 'scene' | 'action';
  readonly label: string;
  readonly hint: string;
  readonly command: PaletteCommand;
}

export interface PaletteGroup {
  readonly id: PaletteGroupId;
  readonly label: string;
  readonly results: readonly PaletteResult[];
}

export interface PaletteToken {
  readonly key: string;
  readonly nom: string;
  readonly kind: CombatantKind;
}

/** État de la table dont dépendent les résultats — tout sauf le texte saisi. */
export interface PaletteContext {
  readonly mode: PaletteMode;
  readonly tokens: readonly PaletteToken[];
  readonly catalog: readonly CombatCatalogEntry[];
  /** Ids source (heros_id / pnj_id) déjà présents dans la session. */
  readonly heroIds: ReadonlySet<string>;
  readonly pnjIds: ReadonlySet<string>;
  readonly scenes: readonly BolSceneModel[];
  readonly reserveOpen: boolean;
}

export interface PaletteInput extends PaletteContext {
  readonly query: string;
}

/** Texte saisi → quantité + terme. Un entier en tête suivi d'un espace est une quantité (« 3 loup »),
 * bornée de 1 à 20 ; « 3loups » ou « 3 » seul restent du texte. */
export function parseQuery(raw: string): {quantity: number; term: string} {
  const match = /^\s*(\d+)\s+(.*)$/.exec(raw);
  if (!match) {
    return {quantity: 1, term: raw.trim()};
  }

  const quantity = Math.max(1, Math.min(PALETTE_MAX_QUANTITY, Number(match[1])));
  return {quantity, term: match[2].trim()};
}

const KIND_LABELS: Record<CombatantKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

const GROUP_LABELS: Record<PaletteGroupId, string> = {
  table: 'Sur la table',
  place: 'Poser',
  scene: 'Scènes',
  action: 'Actions',
};

interface PaletteAction {
  readonly id: PaletteActionId;
  readonly label: string;
  readonly modes: readonly PaletteMode[];
}

const BOTH: readonly PaletteMode[] = ['libre', 'combat'];

function actions(reserveOpen: boolean): readonly PaletteAction[] {
  return [
    {id: 'startCombat', label: 'Démarrer un combat', modes: ['libre']},
    {id: 'endCombat', label: 'Terminer le combat', modes: ['combat']},
    {id: 'saveScene', label: 'Enregistrer la table comme scène', modes: ['libre']},
    {id: 'toggleReserve', label: reserveOpen ? 'Replier la réserve' : 'Déplier la réserve', modes: ['libre']},
    {id: 'createHero', label: 'Créer un héros', modes: BOTH},
    {id: 'createPnj', label: 'Créer un PNJ', modes: BOTH},
    {id: 'createCreature', label: 'Créer une créature', modes: BOTH},
    {id: 'createDemon', label: 'Créer un démon', modes: BOTH},
    {id: 'sessions', label: 'Changer de session', modes: BOTH},
    {id: 'newSession', label: 'Nouvelle session', modes: BOTH},
    {id: 'intendance', label: 'Intendance', modes: BOTH},
  ];
}

/** Éléments dont le nom contient le terme, ceux qui commencent par lui d'abord, puis par ordre
 * alphabétique ; `tieBreak` départage deux noms identiques pour un ordre stable. Sans terme, l'ordre
 * d'origine est conservé. Comparaison sans accents ni majuscules, sans expression régulière. */
function rank<T>(items: readonly T[], term: string, name: (item: T) => string, tieBreak: (item: T) => string): T[] {
  const needle = normalizeSearch(term);
  if (!needle) {
    return [...items];
  }

  return items
    .map((item) => ({item, normalized: normalizeSearch(name(item))}))
    .filter(({normalized}) => normalized.includes(needle))
    .sort(
      (left, right) =>
        Number(!left.normalized.startsWith(needle)) - Number(!right.normalized.startsWith(needle)) ||
        left.normalized.localeCompare(right.normalized, 'fr') ||
        tieBreak(left.item).localeCompare(tieBreak(right.item)),
    )
    .map(({item}) => item);
}

/** `id` DOM sûr à partir d'un identifiant métier (les `catalogId` contiennent « : »). */
function domId(prefix: string, raw: string): string {
  return `pal-${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

/** Résultats de la barre pour un texte saisi et un état de table, par groupes, dans l'ordre
 * d'affichage. Les groupes vides sont omis. */
export function buildResults(input: PaletteInput): PaletteGroup[] {
  const {quantity, term} = parseQuery(input.query);
  const batch = quantity > 1;
  if (batch && !term) {
    return [];
  }

  const groups: PaletteGroup[] = [];
  const searchable = input.mode === 'libre' && term !== '';

  if (searchable && !batch) {
    groups.push({
      id: 'table',
      label: GROUP_LABELS.table,
      results: rank(input.tokens, term, (t) => t.nom, (t) => t.key)
        .slice(0, PALETTE_GROUP_LIMIT)
        .map((token) => ({
          id: domId('t', token.key),
          kind: token.kind,
          label: token.nom,
          hint: 'ouvrir la fiche',
          command: {type: 'select', key: token.key},
        })),
    });
  }

  if (searchable) {
    const placeable = input.catalog.filter(
      (entry) =>
        !isOnTable(entry, input.heroIds, input.pnjIds) && (!batch || entry.kind === 'creature' || entry.kind === 'demon'),
    );
    groups.push({
      id: 'place',
      label: GROUP_LABELS.place,
      results: rank(placeable, term, (e) => e.nom, (e) => e.catalogId)
        .slice(0, PALETTE_GROUP_LIMIT)
        .map((entry) => ({
          id: domId('p', entry.catalogId),
          kind: entry.kind,
          label: entry.nom,
          hint: batch ? `${KIND_LABELS[entry.kind]} · poser ×${quantity}` : `${KIND_LABELS[entry.kind]} · poser`,
          command: {
            type: 'place',
            kind: entry.kind,
            sourceId: String(entry.sourceId),
            nom: entry.nom,
            qty: quantity,
          },
        })),
    });
  }

  if (searchable && !batch) {
    groups.push({
      id: 'scene',
      label: GROUP_LABELS.scene,
      results: rank(input.scenes, term, (s) => s.titre, (s) => s.id)
        .slice(0, PALETTE_GROUP_LIMIT)
        .map((scene) => ({
          id: domId('s', scene.id),
          kind: 'scene',
          label: scene.titre,
          hint: scene.scenario?.titre ?? 'Sans scénario',
          command: {type: 'loadScene', scene},
        })),
    });
  }

  if (!batch) {
    const used = groups.reduce((sum, group) => sum + group.results.length, 0);
    const available = actions(input.reserveOpen).filter((action) => action.modes.includes(input.mode));
    groups.push({
      id: 'action',
      label: GROUP_LABELS.action,
      results: rank(available, term, (a) => a.label, (a) => a.id)
        .slice(0, Math.max(0, PALETTE_MAX_RESULTS - used))
        .map((action) => ({
          id: domId('a', action.id),
          kind: 'action',
          label: action.label,
          hint: '',
          command: {type: 'action', id: action.id},
        })),
    });
  }

  return groups.filter((group) => group.results.length > 0);
}

export function flattenResults(groups: readonly PaletteGroup[]): PaletteResult[] {
  return groups.flatMap((group) => group.results);
}

/** Index du résultat suivant (+1) ou précédent (−1), en bouclant. `-1` pour une liste vide ; un index
 * courant hors bornes (la liste a rétréci) repart du début ou de la fin. */
export function nextIndex(current: number, count: number, delta: -1 | 1): number {
  if (count <= 0) {
    return -1;
  }
  if (current < 0 || current >= count) {
    return delta > 0 ? 0 : count - 1;
  }
  return (current + delta + count) % count;
}
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

Run: `cd front && npx ng test --watch=false --include "**/command-palette/*.spec.ts"`
Expected: PASS, les deux fichiers.

Run: `cd front && npx ng test --watch=false`
Expected: tous les tests passent (dont `reserve.util.spec.ts`, inchangé).

- [ ] **Step 7: Commit** (ignoré sans autorisation, cf. Global Constraints)

```bash
git add front/src/app/bol/session/play/command-palette front/src/app/bol/session/play/reserve/reserve.util.ts
git commit -m "feat(palette): fonctions pures de la barre de commande"
```

---

### Task 2: Service partagé des actions de scène

**Files:**
- Create: `front/src/app/bol/session/scene-actions.service.ts`
- Modify: `front/src/app/bol/session/play/scene-list/scene-list.ts`

**Interfaces:**
- Consumes: `BolFightSessionService.loadScene`, `BolSceneService.create`, `SceneLoadDialogComponent` + `SceneLoadDialogData` (`play/scene-list/scene-load-dialog.ts`), `promptDialog` (`shared/dw-prompt-dialog/dw-prompt-dialog.ts`), `needsLoadChoice`, `loadMessage`, `normalizeTitre`, `SCENE_TITLE_MAX` (`play/scene-list/scene.util.ts`).
- Produces: `SceneActionsService` (`providedIn: 'root'`) :
  - `load(sessionId: string, scene: BolSceneModel, nonHeroCount: number): Observable<BolSceneLoadResult | null>` — demande « Remplacer ou Ajouter » si besoin, charge, affiche le message ; émet `null` si l'utilisateur annule ; une erreur réseau est propagée.
  - `saveTable(sessionId: string, scenarioId: string | null): Observable<BolSceneModel | null>` — demande un titre, crée la scène, affiche le message ; émet `null` si annulé ; une erreur réseau est propagée.

- [ ] **Step 1: Écrire le service**

Créer `front/src/app/bol/session/scene-actions.service.ts` :

```ts
import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, Observable, of, switchMap, take, tap} from 'rxjs';
import {promptDialog} from '../../shared/dw-prompt-dialog/dw-prompt-dialog';
import {BolSceneLoadResult, BolSceneModel, SceneLoadMode} from '../models/bol-scene.model';
import {BolFightSessionService} from '../services/bol-fight-session.service';
import {BolSceneService} from '../services/bol-scene.service';
import {SceneLoadDialogComponent, SceneLoadDialogData} from './play/scene-list/scene-load-dialog';
import {loadMessage, needsLoadChoice, normalizeTitre, SCENE_TITLE_MAX} from './play/scene-list/scene.util';

/** Les deux gestes sur les scènes qui touchent la table, partagés par l'onglet Scènes et la barre de
 * commande pour qu'ils fassent exactement la même chose : dialogues, appel réseau, message. Chaque
 * méthode émet `null` si l'utilisateur annule ; l'appelant recharge la session sur une valeur non
 * nulle et affiche l'erreur éventuelle. */
@Injectable({providedIn: 'root'})
export class SceneActionsService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly sceneService = inject(BolSceneService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  /** Charge une scène sur la table. Si la table porte autre chose que des héros, demande d'abord
   * « Remplacer ou Ajouter » ; sinon charge directement. */
  load(sessionId: string, scene: BolSceneModel, nonHeroCount: number): Observable<BolSceneLoadResult | null> {
    return this.chooseMode(scene, nonHeroCount).pipe(
      switchMap((mode) => {
        if (!mode) {
          return of(null);
        }
        return this.fightSessionService
          .loadScene(sessionId, scene.id, mode)
          .pipe(tap((result) => this.snackBar.open(loadMessage(scene.titre, result.ignored), undefined, {duration: 4000})));
      }),
    );
  }

  /** « Enregistrer la table comme scène » : demande un titre, puis crée la scène dans le scénario
   * donné (`null` = « Sans scénario »). Elle devient la scène courante de la session. */
  saveTable(sessionId: string, scenarioId: string | null): Observable<BolSceneModel | null> {
    return promptDialog(this.dialog, {
      title: 'Enregistrer la table comme scène',
      label: 'Titre de la scène',
      maxLength: SCENE_TITLE_MAX,
      confirmLabel: 'Enregistrer',
    }).pipe(
      map((raw) => normalizeTitre(raw)),
      switchMap((titre) => {
        if (!titre) {
          return of(null);
        }
        return this.sceneService
          .create(titre, scenarioId, sessionId)
          .pipe(tap((scene) => this.snackBar.open(`Scène « ${scene.titre} » enregistrée.`, undefined, {duration: 2500})));
      }),
    );
  }

  private chooseMode(scene: BolSceneModel, nonHeroCount: number): Observable<SceneLoadMode | null> {
    if (!needsLoadChoice(nonHeroCount)) {
      return of<SceneLoadMode>('replace');
    }

    const data: SceneLoadDialogData = {titre: scene.titre, nonHeroCount};
    return this.dialog
      .open(SceneLoadDialogComponent, {data, width: '420px'})
      .afterClosed()
      .pipe(
        take(1),
        map((mode: SceneLoadMode | undefined) => mode ?? null),
      );
  }
}
```

- [ ] **Step 2: Faire utiliser le service par l'onglet Scènes**

Dans `front/src/app/bol/session/play/scene-list/scene-list.ts` :

**Imports.** Supprimer :

```ts
import {BolSceneModel, BolSceneScenarioRef, SceneLoadMode} from '../../../models/bol-scene.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
```

```ts
import {SceneLoadDialogComponent, SceneLoadDialogData} from './scene-load-dialog';
```

et les remplacer par :

```ts
import {BolSceneModel, BolSceneScenarioRef} from '../../../models/bol-scene.model';
import {SceneActionsService} from '../../scene-actions.service';
```

Dans l'import de `./scene.util`, retirer `loadMessage` et `needsLoadChoice` (les autres noms restent).

Dans l'import de `@angular/core`, ajouter `effect`.

**Champs.** Remplacer la ligne `private readonly fightSessionService = inject(BolFightSessionService);` par :

```ts
  private readonly sceneActions = inject(SceneActionsService);
```

**Méthodes.** Remplacer la méthode `saveTable` (commentaire compris) par :

```ts
  /** « Enregistrer la table comme scène » : la scène est créée dans le scénario sélectionné et
   * devient la scène courante de la session. */
  protected saveTable(): void {
    this.run(
      this.sceneActions.saveTable(this.sessionId(), this.selectedScenario()),
      "Impossible d'enregistrer la scène.",
      (scene) => {
        if (scene) {
          this.scenes.update((list) => [...list, scene]);
          this.changed.emit();
        }
      },
    );
  }
```

Remplacer les méthodes `load` et `doLoad` par la seule méthode :

```ts
  protected load(scene: BolSceneModel): void {
    this.run(
      this.sceneActions.load(this.sessionId(), scene, this.nonHeroCount()),
      'Impossible de charger la scène.',
      (result) => {
        if (result) {
          this.changed.emit();
        }
      },
    );
  }
```

**Scène créée ailleurs.** Une scène peut maintenant être enregistrée depuis la barre de commande pendant que l'onglet Scènes est affiché : la session reçoit une scène courante que la liste ne connaît pas. À la fin du constructeur, après l'appel `forkJoin(...).subscribe({...});`, ajouter :

```ts
    // La scène courante de la session peut avoir été créée hors de cette liste (barre de commande) :
    // si elle n'y figure pas, la liste est rechargée.
    effect(() => {
      const currentId = this.currentSceneId();
      if (currentId && !this.loading() && !this.scenes().some((scene) => scene.id === currentId)) {
        this.sceneService.scenes().subscribe((scenes) => {
          // Évite une boucle si la scène n'existe vraiment plus : on ne remplace que si elle est revenue.
          if (scenes.some((scene) => scene.id === currentId)) {
            this.scenes.set(scenes);
          }
        });
      }
    });
```

Le fichier `scene-load-dialog.ts` n'est pas modifié. `MatDialog` reste injecté dans `scene-list.ts` (utilisé par `promptDialog` et `confirmDialog` dans `newScenario`, `rename`, `updateFromTable`, `remove`).

- [ ] **Step 3: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi sans erreur ni avertissement (en particulier aucun import inutilisé signalé), tous les tests passent.

- [ ] **Step 4: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/scene-actions.service.ts front/src/app/bol/session/play/scene-list/scene-list.ts
git commit -m "refactor(scene): extraire chargement et enregistrement dans SceneActionsService"
```

---

### Task 3: Composant `bol-command-palette`

**Files:**
- Create: `front/src/app/bol/session/play/command-palette/command-palette.ts`
- Create: `front/src/app/bol/session/play/command-palette/command-palette.html`
- Create: `front/src/app/bol/session/play/command-palette/command-palette.scss`

**Interfaces:**
- Consumes: `buildResults`, `flattenResults`, `nextIndex`, `PaletteCommand`, `PaletteContext`, `PaletteResult` (tâche 1).
- Produces:
  - `CommandPaletteComponent`, sélecteur `bol-command-palette`, ouvert par `MatDialog`. Se ferme avec une `PaletteCommand`, ou `undefined` si annulé.
  - `interface CommandPaletteData { readonly context: Signal<PaletteContext> }` — la page passe un **signal** : les résultats se complètent quand la bibliothèque ou les scènes finissent de charger.
  - `openCommandPalette(dialog: MatDialog, data: CommandPaletteData): Observable<PaletteCommand | null>`.

- [ ] **Step 1: Écrire le composant**

Créer `front/src/app/bol/session/play/command-palette/command-palette.ts` :

```ts
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  Signal,
  signal,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {map, Observable, take} from 'rxjs';
import {
  buildResults,
  flattenResults,
  nextIndex,
  PaletteCommand,
  PaletteContext,
  PaletteResult,
} from './command-palette.util';

export interface CommandPaletteData {
  /** État de la table, en signal : les résultats suivent l'arrivée de la bibliothèque et des scènes. */
  readonly context: Signal<PaletteContext>;
}

/** Barre de commande de la table : un champ, des résultats groupés, navigation au clavier. Ne parle à
 * aucun service — se ferme avec la commande choisie, que `session-play-page` exécute. */
@Component({
  selector: 'bol-command-palette',
  imports: [MatIconModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private readonly data = inject<CommandPaletteData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<CommandPaletteComponent, PaletteCommand>);

  protected readonly query = signal('');

  protected readonly groups = computed(() => buildResults({...this.data.context(), query: this.query()}));
  private readonly flat = computed(() => flattenResults(this.groups()));
  protected readonly count = computed(() => this.flat().length);

  /** Index du résultat actif ; revient au premier dès que la liste change (saisie, données arrivées). */
  private readonly activeIndex = linkedSignal<number>(() => (this.flat().length > 0 ? 0 : -1));

  protected readonly activeId = computed(() => this.flat()[this.activeIndex()]?.id ?? null);

  protected readonly emptyMessage = computed(() => `Rien ne correspond à « ${this.query().trim()} ».`);

  /** Annonce pour les lecteurs d'écran (région aria-live). */
  protected readonly status = computed(() => {
    const count = this.count();
    if (count === 0) {
      return 'Aucun résultat';
    }
    return count === 1 ? '1 résultat' : `${count} résultats`;
  });

  constructor() {
    // Garde le résultat actif visible quand on parcourt la liste au clavier.
    afterRenderEffect(() => {
      const id = this.activeId();
      if (id) {
        document.getElementById(id)?.scrollIntoView({block: 'nearest'});
      }
    });
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected move(delta: -1 | 1, event: Event): void {
    event.preventDefault();
    this.activeIndex.set(nextIndex(this.activeIndex(), this.count(), delta));
  }

  protected runActive(event: Event): void {
    event.preventDefault();
    const result = this.flat()[this.activeIndex()];
    if (result) {
      this.run(result);
    }
  }

  protected activate(result: PaletteResult): void {
    const index = this.flat().findIndex((r) => r.id === result.id);
    if (index >= 0 && index !== this.activeIndex()) {
      this.activeIndex.set(index);
    }
  }

  protected run(result: PaletteResult): void {
    this.ref.close(result.command);
  }
}

/** Ouvre la barre de commande et émet une seule fois la commande choisie, ou `null` si annulé. */
export function openCommandPalette(dialog: MatDialog, data: CommandPaletteData): Observable<PaletteCommand | null> {
  return dialog
    .open(CommandPaletteComponent, {
      data,
      width: 'min(560px, 92vw)',
      maxWidth: '92vw',
      position: {top: '12vh'},
      panelClass: 'pal-panel',
    })
    .afterClosed()
    .pipe(
      take(1),
      map((command: PaletteCommand | undefined) => command ?? null),
    );
}
```

Créer `front/src/app/bol/session/play/command-palette/command-palette.html` :

```html
<div class="pal-shell">
  <div class="pal-field">
    <mat-icon aria-hidden="true">search</mat-icon>
    <input
      id="pal-input"
      class="pal-input"
      type="text"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      cdkFocusInitial
      placeholder="Un personnage, une scène, une action…"
      aria-label="Rechercher ou lancer une action"
      aria-autocomplete="list"
      aria-controls="pal-list"
      [attr.aria-expanded]="count() > 0"
      [attr.aria-activedescendant]="activeId()"
      [value]="query()"
      (input)="setQuery($any($event.target).value)"
      (keydown.arrowdown)="move(1, $event)"
      (keydown.arrowup)="move(-1, $event)"
      (keydown.enter)="runActive($event)"
    />
  </div>

  <div id="pal-list" class="pal-list" role="listbox" aria-label="Résultats">
    @for (group of groups(); track group.id) {
      <div class="pal-group" role="group" [attr.aria-labelledby]="'pal-group-' + group.id">
        <div class="pal-group-label" [id]="'pal-group-' + group.id">{{ group.label }}</div>
        @for (result of group.results; track result.id) {
          <div
            class="pal-option"
            role="option"
            [id]="result.id"
            [class.pal-option--active]="result.id === activeId()"
            [attr.aria-selected]="result.id === activeId()"
            (click)="run(result)"
            (mousemove)="activate(result)"
          >
            <span [class]="'pal-dot pal-dot--' + result.kind"></span>
            <span class="pal-label">{{ result.label }}</span>
            <span class="pal-hint">{{ result.hint }}</span>
          </div>
        }
      </div>
    } @empty {
      <p class="pal-empty">{{ emptyMessage() }}</p>
    }
  </div>

  <p class="pal-status" aria-live="polite">{{ status() }}</p>

  <p class="pal-footer" aria-hidden="true">
    <span>↑ ↓ parcourir</span>
    <span>↵ exécuter</span>
    <span>Échap fermer</span>
    <span>« 3 loup » pose un lot de trois</span>
  </p>
</div>
```

Créer `front/src/app/bol/session/play/command-palette/command-palette.scss` :

```scss
:host {
  display: block;
}

.pal-shell {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  background: var(--dw-surface-50);
  color: var(--dw-surface-700);
}

.pal-field {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--dw-border);
  color: var(--dw-surface-500);
}

.pal-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--dw-surface-900);
  font: inherit;
  font-size: 1.05rem;

  &::placeholder {
    color: var(--dw-surface-400);
  }

  // Le champ garde le focus tant que la barre est ouverte : le résultat actif porte l'indication
  // visuelle (cf. `.pal-option--active`), pas le champ.
  &:focus {
    outline: none;
  }
}

.pal-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.3rem 0;
  scrollbar-width: thin;
  scrollbar-color: var(--dw-border) transparent;
}

.pal-group-label {
  padding: 0.5rem 1rem 0.25rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dw-surface-500);
}

.pal-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 1rem;
  cursor: pointer;
}

.pal-option--active {
  background: var(--dw-surface-100);
  box-shadow: inset 2px 0 0 var(--dw-color-legendary);
}

.pal-dot {
  flex-shrink: 0;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
}

.pal-dot--hero { background: var(--dw-color-reussite); }
.pal-dot--pnj { background: var(--dw-color-pnj); }
.pal-dot--creature { background: var(--dw-color-creature); }
.pal-dot--demon { background: var(--dw-color-demon); }
.pal-dot--scene { background: var(--dw-color-dice-kicker); }

// Les actions n'ont pas de type : un carré creux les distingue des personnages sans ajouter de couleur.
.pal-dot--action {
  border-radius: 2px;
  border: 1px solid var(--dw-surface-500);
}

.pal-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dw-surface-800);
}

.pal-hint {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: var(--dw-surface-500);
}

.pal-empty {
  margin: 0;
  padding: 1rem;
  color: var(--dw-surface-500);
}

// Région aria-live : lue, pas affichée.
.pal-status {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.pal-footer {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1rem;
  margin: 0;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--dw-border);
  font-size: 0.72rem;
  color: var(--dw-surface-500);
}
```

- [ ] **Step 2: Retirer le rembourrage par défaut du conteneur de dialogue**

Le conteneur `MatDialog` a un fond et des coins propres ; la barre doit remplir tout le panneau. Dans `front/src/styles.scss` (feuille globale, à côté des autres surcharges de dialogue s'il y en a — sinon à la fin du fichier), ajouter :

```scss
// Barre de commande (`bol-command-palette`) : le contenu remplit le panneau du dialogue, sans marge.
.pal-panel .mat-mdc-dialog-surface {
  overflow: hidden;
  border: 1px solid var(--dw-border);
}
```

Si le fichier global du projet porte un autre nom, le trouver avec `grep -rn "dw-statblock-dialog" front/src/styles* front/src/styles/` (c'est là que vit la surcharge du dialogue de statbloc) et y ajouter le bloc.

- [ ] **Step 3: Valider**

Run: `cd front && npm run build`
Expected: build réussi. (Le composant est branché à la tâche 4 ; s'il n'est pas compilé tant qu'il n'est référencé nulle part, ses erreurs éventuelles apparaîtront à la tâche 4.)

- [ ] **Step 4: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play/command-palette front/src/styles*
git commit -m "feat(palette): composant bol-command-palette"
```

---

### Task 4: Brancher la barre dans la page et la barre du haut

**Files:**
- Modify: `front/src/app/bol/session/play/session-header/session-header.ts`
- Modify: `front/src/app/bol/session/play/session-header/session-header.html`
- Modify: `front/src/app/bol/session/play/session-header/session-header.scss`
- Modify: `front/src/app/bol/session/play/session-play-page.ts`
- Modify: `front/src/app/bol/session/play/session-play-page.html`

**Interfaces:**
- Consumes: `openCommandPalette`, `CommandPaletteData` (tâche 3) ; `PaletteCommand`, `PaletteActionId`, `PaletteContext` (tâche 1) ; `isPaletteShortcut` (tâche 1) ; `SceneActionsService` (tâche 2) ; `CombatSelectionService.catalog` / `.loadCatalog()` ; `BolSceneService.scenes()` ; `resolveAddCombatantCamp` (`add-combatant-dialog.ts`) ; `reserveTab(kind)` (`reserve/reserve.util.ts`, donne `createLink`).
- Produces: `SessionHeaderComponent` gagne la sortie `search = output<void>()`.

- [ ] **Step 1: Bouton loupe dans la barre du haut**

Dans `session-header.ts` :
- ajouter les imports `import {MatButtonModule} from '@angular/material/button';` et `import {MatTooltipModule} from '@angular/material/tooltip';` ;
- remplacer `imports: [MatIconModule, AccountMenuComponent],` par `imports: [MatButtonModule, MatIconModule, MatTooltipModule, AccountMenuComponent],` ;
- après `readonly endCombat = output<void>();`, ajouter :

```ts
  /** Ouvre la barre de commande (même effet que les raccourcis `/` et `Ctrl+K`). */
  readonly search = output<void>();
```

Dans `session-header.html`, juste après la ligne `<div class="cp-header-actions">`, ajouter :

```html
    <button
      mat-icon-button
      type="button"
      class="cp-header-search"
      aria-label="Rechercher ou lancer une action ( / )"
      matTooltip="Rechercher ou lancer une action ( / )"
      (click)="search.emit()"
    >
      <mat-icon>search</mat-icon>
    </button>
```

Dans `session-header.scss`, ajouter à la fin :

```scss
.cp-header-search {
  color: var(--dw-surface-700);
}
```

- [ ] **Step 2: Brancher la page**

Dans `session-play-page.ts` :

**Imports.** Remplacer `import {ActivatedRoute, RouterLink} from '@angular/router';` par :

```ts
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
```

et ajouter :

```ts
import {BolSceneModel} from '../../models/bol-scene.model';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatantKind, CombatSelectionService} from '../../services/combat-selection.service';
import {SceneActionsService} from '../scene-actions.service';
import {resolveAddCombatantCamp} from './add-combatant-dialog/add-combatant-dialog';
import {openCommandPalette} from './command-palette/command-palette';
import {PaletteActionId, PaletteCommand, PaletteContext} from './command-palette/command-palette.util';
import {isPaletteShortcut} from './command-palette/shortcut.util';
import {reserveTab} from './reserve/reserve.util';
```

(`AddCombatantDialogComponent` est déjà importé depuis `./add-combatant-dialog/add-combatant-dialog` : fusionner les deux imports en `import {AddCombatantDialogComponent, resolveAddCombatantCamp} from './add-combatant-dialog/add-combatant-dialog';`.)

**Décorateur.** Remplacer l'objet `host` par :

```ts
  host: {
    '(document:keydown.escape)': 'closeInspector()',
    '(document:keydown)': 'onKeydown($event)',
  },
```

**Injections.** Après `private readonly snackBar = inject(MatSnackBar);`, ajouter :

```ts
  private readonly router = inject(Router);
  private readonly selection = inject(CombatSelectionService);
  private readonly sceneService = inject(BolSceneService);
  private readonly sceneActions = inject(SceneActionsService);
```

**Membres.** Après la déclaration de `headerTitle`, ajouter :

```ts
  /** Scènes de l'utilisateur, chargées à chaque ouverture de la barre de commande. */
  private readonly paletteScenes = signal<readonly BolSceneModel[]>([]);

  /** État de la table vu par la barre de commande — un signal, pour que ses résultats se complètent
   * quand la bibliothèque et les scènes finissent de charger. */
  private readonly paletteContext = computed<PaletteContext>(() => ({
    mode: this.mode(),
    tokens: (this.board()?.tokens ?? []).map((token) => ({key: token.key, nom: token.nom, kind: token.kind})),
    catalog: this.selection.catalog(),
    heroIds: this.existingHeroIds(),
    pnjIds: this.existingPnjIds(),
    scenes: this.paletteScenes(),
    reserveOpen: this.reserveOpen(),
  }));
```

**Méthodes.** Après la méthode `onSceneChanged`, ajouter :

```ts
  /** `/` ou `Ctrl+K` : ouvre la barre de commande, sauf si un dialogue est déjà ouvert. */
  protected onKeydown(event: KeyboardEvent): void {
    if (!isPaletteShortcut(event, event.target as HTMLElement | null) || this.dialog.openDialogs.length > 0) {
      return;
    }
    event.preventDefault();
    this.openPalette();
  }

  protected openPalette(): void {
    if (!this.sessionId() || this.dialog.openDialogs.length > 0) {
      return;
    }

    // La barre s'ouvre tout de suite ; bibliothèque et scènes complètent ses résultats à leur arrivée.
    // En combat la réserve n'est pas affichée : la bibliothèque peut ne jamais avoir été chargée.
    if (this.selection.catalog().length === 0) {
      this.selection.loadCatalog();
    }
    this.sceneService.scenes().subscribe({
      next: (scenes) => this.paletteScenes.set(scenes),
      error: () => this.paletteScenes.set([]),
    });

    openCommandPalette(this.dialog, {context: this.paletteContext}).subscribe((command) => {
      if (command) {
        this.executePaletteCommand(command);
      }
    });
  }

  /** Exécute la commande choisie dans la barre, par les mêmes chemins que les panneaux. */
  private executePaletteCommand(command: PaletteCommand): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    switch (command.type) {
      case 'select': {
        const token = this.board()?.tokens.find((t) => t.key === command.key);
        if (token) {
          this.onTokenSelected(token);
        }
        break;
      }
      case 'place':
        this.fightSessionService
          .addCombatant(sessionId, {
            kind: command.kind,
            sourceId: command.sourceId,
            camp: resolveAddCombatantCamp(command.kind, 'adversaires'),
            qty: command.qty,
          })
          .subscribe({
            next: () => {
              const message =
                command.qty > 1
                  ? `${command.qty} × ${command.nom} posés sur la table.`
                  : `${command.nom} posé sur la table.`;
              this.snackBar.open(message, undefined, {duration: 2000});
              this.loadSession(sessionId);
            },
            error: (error: unknown) => this.paletteError(error, 'Impossible de poser ce personnage.'),
          });
        break;
      case 'loadScene':
        this.sceneActions.load(sessionId, command.scene, this.nonHeroCount()).subscribe({
          next: (result) => {
            if (result) {
              this.onSceneChanged();
            }
          },
          error: (error: unknown) => this.paletteError(error, 'Impossible de charger la scène.'),
        });
        break;
      case 'action':
        this.runPaletteAction(command.id, sessionId);
        break;
    }
  }

  private runPaletteAction(id: PaletteActionId, sessionId: string): void {
    switch (id) {
      case 'startCombat':
        this.openStartCombatDialog();
        break;
      case 'endCombat':
        this.askEndCombat();
        break;
      case 'saveScene':
        // Rangée dans le scénario de la scène courante, sinon dans « Sans scénario ».
        this.sceneActions.saveTable(sessionId, this.session()?.scene?.scenario?.id ?? null).subscribe({
          next: (scene) => {
            if (scene) {
              this.onSceneChanged();
            }
          },
          error: (error: unknown) => this.paletteError(error, "Impossible d'enregistrer la scène."),
        });
        break;
      case 'toggleReserve':
        this.toggleReserve();
        break;
      case 'createHero':
        this.openCreateForm('hero');
        break;
      case 'createPnj':
        this.openCreateForm('pnj');
        break;
      case 'createCreature':
        this.openCreateForm('creature');
        break;
      case 'createDemon':
        this.openCreateForm('demon');
        break;
      case 'sessions':
        void this.router.navigateByUrl('/library/sessions');
        break;
      case 'newSession':
        void this.router.navigateByUrl('/session/new');
        break;
      case 'intendance':
        void this.router.navigateByUrl('/intendance');
        break;
    }
  }

  /** Formulaire de création, avec retour à cette table après enregistrement (même état de
   * navigation que les liens « Créer » de la réserve). */
  private openCreateForm(kind: CombatantKind): void {
    void this.router.navigateByUrl(reserveTab(kind).createLink, {state: {returnUrl: this.returnUrl()}});
  }

  private paletteError(error: unknown, fallback: string): void {
    this.snackBar.open(extractApiErrorMessage(error, fallback), 'Fermer', {duration: 5000});
  }
```

Dans `session-play-page.html`, sur `<bol-session-header>`, ajouter après `(endCombat)="askEndCombat()"` :

```html
      (search)="openPalette()"
```

- [ ] **Step 3: Vérifier que `addCombatant` accepte la quantité**

Run: `grep -n "qty" front/src/app/bol/models/bol-fight-session.model.ts | tail -3`
Expected: `BolFightSessionAddCombatantPayload` contient `qty?: number;` (c'est le cas : le champ existe déjà, rien à modifier).

- [ ] **Step 4: Valider**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi sans erreur ni avertissement, tous les tests passent.

- [ ] **Step 5: Commit** (ignoré sans autorisation)

```bash
git add front/src/app/bol/session/play
git commit -m "feat(palette): barre de commande branchée sur la table"
```

---

### Task 5: Vérification de bout en bout

**Files:** aucun fichier créé dans le dépôt ; un script Playwright jetable dans `front/scripts/`, supprimé à la fin. Corrections éventuelles dans les fichiers des tâches précédentes.

**Interfaces:**
- Consumes: l'application complète. Skill `run`. Compte de test `claude-test@example.com` / `ClaudeTest123!`. API en conteneur (`docker ps` montre `diceway`), front sur `http://localhost:4200` (vérifier `<title>Front</title>`).

Le script crée une session, une scène et les supprime à la fin. Dans le script, attendre la fin de l'ouverture d'un dialogue de saisie avant d'y taper (sinon l'initialisation du champ efface la saisie).

- [ ] **Step 1: Préparer**

Ouvrir une table avec deux héros du compte de test.

- [ ] **Step 2: Ouverture et fermeture**

Presser `/`.
Expected: la barre s'ouvre, le champ a le focus et ne contient pas « / » ; seules des actions sont listées, la première active ; Échap ferme et rend le focus. `Ctrl+K` ouvre aussi. Le bouton loupe de la barre du haut ouvre aussi.

- [ ] **Step 3: `/` dans un champ**

Cliquer la recherche de la réserve, taper « a/b ».
Expected: la barre ne s'ouvre pas, le champ contient « a/b ». `Ctrl+K` depuis ce champ ouvre la barre.

- [ ] **Step 4: Poser au clavier**

`/`, taper « garde », Entrée.
Expected: le PNJ « Garde du port » apparaît sur la carte, message « Garde du port posé sur la table. », la barre est fermée. Rouvrir et retaper « garde » : il figure sous « Sur la table », plus sous « Poser ».

- [ ] **Step 5: Lot**

`/`, taper « 3 loup », Entrée.
Expected: seul le groupe « Poser » est affiché, avec « poser ×3 » ; trois jetons numérotés #1 à #3 apparaissent ; message « 3 × … posés sur la table. ».

- [ ] **Step 6: Sélectionner un jeton**

`/`, taper le début du nom d'un héros, Entrée.
Expected: la fiche du jeton s'ouvre à droite, anneau doré sur le jeton.

- [ ] **Step 7: Navigation au clavier**

`/`, taper « e », flèche bas plusieurs fois puis flèche haut depuis le premier résultat.
Expected: un seul résultat actif à la fois ; `aria-activedescendant` du champ suit ; depuis le premier, flèche haut va au dernier ; le résultat actif reste visible dans la liste.

- [ ] **Step 8: Scène**

`/` → « enregistrer » → Entrée, titre « Palette test ». Puis `/` → « palette » → Entrée → « Remplacer ».
Expected: la scène est créée et devient la scène courante (barre du haut) ; si l'onglet Scènes est affiché, elle y apparaît ; le chargement propose « Remplacer ou Ajouter » et la table est rechargée.

- [ ] **Step 9: Actions et mode combat**

`/` → « replier » → Entrée : la réserve se replie. Rouvrir : l'action s'appelle « Déplier la réserve ». Démarrer un combat par l'API, recharger, `/`.
Expected: en combat, seules des actions sont proposées, dont « Terminer le combat » et pas « Démarrer un combat » ; taper le nom d'un héros ne donne aucun résultat.

- [ ] **Step 10: Dialogue déjà ouvert**

Ouvrir le menu « Enregistrer la table comme scène » (dialogue de titre), presser `Ctrl+K`.
Expected: la barre ne s'ouvre pas par-dessus le dialogue.

- [ ] **Step 11: Suites complètes et nettoyage**

Run: `cd front && npm run build && npx ng test --watch=false`
Expected: build réussi, tous les tests passent.

Supprimer le script jetable, la session et la scène de test. Vérifier qu'il ne reste que `screenshot.mjs` dans `front/scripts/`.

- [ ] **Step 12: Commit des corrections éventuelles** (ignoré sans autorisation)

```bash
git add -A
git commit -m "fix(palette): corrections issues de la vérification de bout en bout"
```
