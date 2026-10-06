/** Couleur d'accent d'une carte d'entité de la bibliothèque. */
export type EntityCardAccent = 'emerald' | 'amber' | 'rose';

/** Couleur d'une pastille de carte d'entité. */
export type EntityCardBadgeVariant = 'amber' | 'rose' | 'slate';

/** Pastille d'état sur une carte d'entité (par exemple « En cours »). */
export interface EntityCardBadge {
  readonly label: string;
  readonly variant: EntityCardBadgeVariant;
}

/** Action en icône sur une carte d'entité : un lien de navigation avec son infobulle. */
export interface EntityCardAction {
  readonly icon: string;
  readonly tooltip: string;
  readonly routerLink: readonly unknown[];
  readonly state?: Record<string, unknown>;
}

/** Jauge de points de vitalité (`pv`) ou d'héroïsme (`ph`) d'une carte d'entité. */
export interface EntityCardGauge {
  readonly icon: string;
  readonly value: number;
  readonly label: string;
  readonly accent: 'pv' | 'ph';
}

/** Petit compteur avec icône et infobulle sur une carte d'entité. */
export interface EntityCardChip {
  readonly icon: string;
  readonly value: number;
  readonly tooltip: string;
}
