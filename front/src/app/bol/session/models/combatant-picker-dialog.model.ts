import {CombatantKind} from '../../models/combat-selection.model';

export interface CombatantPickerDialogData {
  /** Restreint le catalogue à un seul type (héros pour la création de session) et masque les onglets de filtre. */
  readonly lockKind?: CombatantKind;
}
