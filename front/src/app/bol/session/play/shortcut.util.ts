import {ShortcutEvent, ShortcutTarget} from '../models/shortcut.model';

const EDITABLE_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function isEditable(target: ShortcutTarget | null): boolean {
  return !!target && (target.isContentEditable === true || EDITABLE_TAGS.has((target.tagName ?? '').toUpperCase()));
}

/** Cet événement clavier doit-il terminer le tour en combat ? `F` seul, hors d'un champ de saisie —
 * avec un modificateur, la touche garde son rôle habituel (Ctrl+F cherche dans la page). La répétition
 * d'une touche maintenue est ignorée : un appui termine un tour, pas plusieurs. */
export function isEndTurnShortcut(event: ShortcutEvent, target: ShortcutTarget | null): boolean {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
    return false;
  }
  return event.key.toLowerCase() === 'f' && !isEditable(target);
}
