import {ShortcutEvent, ShortcutTarget} from '../../models/shortcut.model';



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

/** Cet événement clavier doit-il terminer le tour en combat ? `F` seul, hors d'un champ de saisie —
 * avec un modificateur, la touche garde son rôle habituel (Ctrl+F cherche dans la page). La répétition
 * d'une touche maintenue est ignorée : un appui termine un tour, pas plusieurs. */
export function isEndTurnShortcut(event: ShortcutEvent, target: ShortcutTarget | null): boolean {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
    return false;
  }
  return event.key.toLowerCase() === 'f' && !isEditable(target);
}
