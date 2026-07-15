import {Signal, computed} from '@angular/core';

/** Entrée de FormArray référençant un élément de catalogue par id. */
export interface IdDraft {
  id: number;
}

/** Entrée avec rang (carrières). */
export interface RankedDraft extends IdDraft {
  value: number;
}

/** Entrée avec détail libre (pouvoirs, capacités). */
export interface DetailDraft extends IdDraft {
  detail: string | null;
}

interface WithId {
  id?: number | string | null;
}

/** Éléments du catalogue non encore sélectionnés (pour les menus d'ajout). */
export function availableCatalog<TModel extends WithId>(
  list: Signal<readonly TModel[] | undefined>,
  selectedDrafts: () => readonly IdDraft[],
): Signal<TModel[]> {
  return computed(() => {
    const ids = new Set(selectedDrafts().map((draft) => Number(draft.id)));
    return (list() ?? []).filter((model) => !ids.has(Number(model.id)));
  });
}

/** Extrait les ids référencés d'une collection API pouvant mélanger objets pivots et ids nus. */
export function referencedIds<T extends object>(
  items: readonly (T | number)[] | undefined,
  id: (item: T) => number | string | null | undefined,
): number[] {
  return (items ?? []).flatMap((item) => (typeof item === 'object' ? [Number(id(item))] : []));
}

/** Projette le brouillon de sélection vers des entrées d'affichage, via le catalogue. */
export function selectedEntries<TDraft extends IdDraft, TModel extends WithId, TEntry>(
  drafts: () => readonly TDraft[],
  list: Signal<readonly TModel[] | undefined>,
  toEntry: (model: TModel, draft: TDraft, index: number) => TEntry | null,
): Signal<TEntry[]> {
  return computed(() =>
    drafts()
      .map((draft, index) => {
        const model = (list() ?? []).find((item) => Number(item.id) === Number(draft.id));
        return model ? toEntry(model, draft, index) : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  );
}
