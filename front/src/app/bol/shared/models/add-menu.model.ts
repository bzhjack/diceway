/** Option du menu d'ajout ; `detail` est le texte grisé affiché après le libellé. */
export interface AddMenuOption {
  readonly id: number;
  readonly label: string;
  readonly detail?: string | null;
}

/** Sélection émise ; `detail` vient du champ libre (visible avec `withDetail`). */
export interface AddMenuEvent {
  readonly id: number;
  readonly detail: string | null;
}
