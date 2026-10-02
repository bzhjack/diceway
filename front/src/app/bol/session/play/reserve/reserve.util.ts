import {CombatCatalogEntry, CombatantKind} from '../../../services/combat-selection.service';

export interface ReserveTab {
  readonly kind: CombatantKind;
  readonly label: string;
  readonly createLabel: string;
  readonly createLink: string;
  readonly libraryLink: string;
}

/** Onglets de la réserve, dans l'ordre d'affichage. Une donnée (pas du template) pour qu'un onglet
 * « Scènes » s'ajoute plus tard sans refonte. */
export const RESERVE_TABS: readonly ReserveTab[] = [
  {kind: 'hero', label: 'Héros', createLabel: 'Créer un héros', createLink: '/create/hero', libraryLink: '/library/heroes'},
  {kind: 'pnj', label: 'PNJ', createLabel: 'Créer un PNJ', createLink: '/create/pnj', libraryLink: '/library/pnjs'},
  {
    kind: 'creature',
    label: 'Créatures',
    createLabel: 'Créer une créature',
    createLink: '/create/creature',
    libraryLink: '/library/creatures',
  },
  {kind: 'demon', label: 'Démons', createLabel: 'Créer un démon', createLink: '/create/demon', libraryLink: '/library/demons'},
];

export function reserveTab(kind: CombatantKind): ReserveTab {
  return RESERVE_TABS.find((tab) => tab.kind === kind) ?? RESERVE_TABS[0];
}

/** Minuscules sans diacritiques : « Prêtre » et « pretre » se valent pour la recherche. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase()
    .trim();
}

/** Entrées du catalogue pour un onglet, filtrées par nom et triées par ordre alphabétique. */
export function filterReserve(
  catalog: readonly CombatCatalogEntry[],
  kind: CombatantKind,
  query: string,
): CombatCatalogEntry[] {
  const term = normalize(query);
  return catalog
    .filter((entry) => entry.kind === kind && (!term || normalize(entry.nom).includes(term)))
    .sort((left, right) => left.nom.localeCompare(right.nom, 'fr'));
}

/** Un héros ou un PNJ ne figure qu'une fois dans une session ; créatures et démons sont des gabarits
 * ré-instanciables, jamais « déjà à table ». */
export function isOnTable(
  entry: CombatCatalogEntry,
  heroIds: ReadonlySet<string>,
  pnjIds: ReadonlySet<string>,
): boolean {
  const sourceId = String(entry.sourceId);
  if (entry.kind === 'hero') {
    return heroIds.has(sourceId);
  }
  if (entry.kind === 'pnj') {
    return pnjIds.has(sourceId);
  }
  return false;
}
