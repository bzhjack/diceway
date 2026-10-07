import {CombatantKind} from '../../models/combat-selection.model';

/** Un onglet de la réserve : un type de personnage et les liens de création et de bibliothèque associés. */
export interface ReserveTab {
  readonly kind: CombatantKind;
  readonly label: string;
  readonly createLabel: string;
  readonly createLink: string;
  readonly libraryLink: string;
}

/** Ligne de liaison créée par une pose : de quoi la retirer si on annule. */
export interface ReservePlacedRow {
  readonly kind: CombatantKind;
  readonly pivotId: number;
}
