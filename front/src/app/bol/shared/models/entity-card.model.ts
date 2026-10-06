export type EntityCardAccent = 'emerald' | 'amber' | 'rose';

export type EntityCardBadgeVariant = 'amber' | 'rose' | 'slate';

export interface EntityCardBadge {
  readonly label: string;
  readonly variant: EntityCardBadgeVariant;
}

export interface EntityCardAction {
  readonly icon: string;
  readonly tooltip: string;
  readonly routerLink: readonly unknown[];
  readonly state?: Record<string, unknown>;
}

export interface EntityCardGauge {
  readonly icon: string;
  readonly value: number;
  readonly label: string;
  readonly accent: 'pv' | 'ph';
}

export interface EntityCardChip {
  readonly icon: string;
  readonly value: number;
  readonly tooltip: string;
}
