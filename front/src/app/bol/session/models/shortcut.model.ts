/** Ce qu'il faut d'un `KeyboardEvent` pour décider — sous-ensemble structurel, testable sans DOM. */
export interface ShortcutEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  /** Répétition automatique d'une touche maintenue enfoncée. */
  readonly repeat?: boolean;
}

/** Ce qu'il faut de la cible de l'événement (un `HTMLElement` convient). */
export interface ShortcutTarget {
  readonly tagName?: string;
  readonly isContentEditable?: boolean;
}
