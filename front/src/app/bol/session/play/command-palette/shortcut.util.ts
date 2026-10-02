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
