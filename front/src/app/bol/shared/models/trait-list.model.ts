import {TraitIcon} from './trait-icon.model';

export interface TraitDetail {
  readonly title: string;
  readonly description: string | null;
}

/** Origine du trait affichée en badge : régional, ou désavantage de carrière (création avancée uniquement). */
export type TraitBadge = 'region' | 'career';

export interface TraitEntry {
  readonly id: number;
  readonly type: 'A' | 'D';
  readonly label: string;
  readonly details: readonly TraitDetail[];
  readonly icon: TraitIcon;
  readonly badge?: TraitBadge | null;
}
