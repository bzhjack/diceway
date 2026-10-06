import {CombatantKind} from '../../models/combat-selection.model';

export interface ReserveTab {
  readonly kind: CombatantKind;
  readonly label: string;
  readonly createLabel: string;
  readonly createLink: string;
  readonly libraryLink: string;
}
