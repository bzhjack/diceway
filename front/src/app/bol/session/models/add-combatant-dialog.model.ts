import {CombatantKind} from '../../models/combat-selection.model';

/** Données du dialogue « Ajouter un combattant » : la session et ce qui est déjà à table. */
export interface AddCombatantDialogData {
  readonly sessionId: string;
  /** Ids source (heros_id / pnj_id) déjà présents dans la session — un héros ou un PNJ ne peut y figurer qu'une fois. */
  readonly existingHeroIds: ReadonlySet<string>;
  /** Restreint le catalogue à un seul type (héros seuls en mode libre) et masque le toggle de camp + les onglets de filtre. */
  readonly lockKind?: CombatantKind;
}
