import {CombatCamp} from '../../models/bol-fight-session.model';
import {CombatCatalogEntry, CombatantKind} from '../../models/combat-selection.model';

/** Un onglet de la réserve : un type de personnage et les liens de création et de bibliothèque associés. */
export interface ReserveTab {
  readonly kind: CombatantKind;
  readonly label: string;
  readonly createLabel: string;
  readonly createLink: string;
  readonly libraryLink: string;
}

/** Un personnage de la réserve et le nombre d'exemplaires à poser (créatures et démons seulement : un
 * héros ou un PNJ n'existe qu'une fois). */
export interface ReserveItem {
  readonly entry: CombatCatalogEntry;
  readonly qty: number;
}

/** Ligne de liaison créée par une pose : de quoi la retirer si on annule. */
export interface ReservePlacedRow {
  readonly kind: CombatantKind;
  readonly pivotId: number;
}

/** Demande de pose venue d'un dépôt sur le tapis : les personnages glissés et le camp de la zone visée. */
export interface TapisPlaceRequest {
  readonly items: readonly ReserveItem[];
  readonly camp: CombatCamp;
}
