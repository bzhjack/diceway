import {CombatantKind} from '../../../models/combat-selection.model';
import {isOnTable, normalizeSearch} from '../reserve/reserve.util';
import {PaletteMode, PaletteActionId, PaletteGroupId, PaletteResult, PaletteGroup, PaletteInput} from '../../models/command-palette.model';

export const PALETTE_MAX_RESULTS = 12;
const PALETTE_GROUP_LIMIT = 5;
const PALETTE_MAX_QUANTITY = 20;

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
        !isOnTable(entry, input.heroIds) && (!batch || entry.kind !== 'hero'),
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
