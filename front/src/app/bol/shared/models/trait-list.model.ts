import {TraitIcon} from './trait-icon.model';

/** Un paragraphe de description d'un trait. */
export interface TraitDetail {
  readonly title: string;
  readonly description: string | null;
}

/** Origine du trait affichée en badge : régional, ou désavantage de carrière (création avancée uniquement). */
export type TraitBadge = 'region' | 'career';

/** Un trait à afficher dans la liste : avantage (`A`) ou désavantage (`D`), ses détails et son icône. */
export interface TraitEntry {
  readonly id: number;
  readonly type: 'A' | 'D';
  readonly label: string;
  readonly details: readonly TraitDetail[];
  readonly icon: TraitIcon;
  readonly badge?: TraitBadge | null;
}
