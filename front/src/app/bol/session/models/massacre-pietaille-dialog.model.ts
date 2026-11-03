import {TapisCard} from './tapis.model';

/** Données du dialogue « Massacrer la piétaille » : qui frappe, les dégâts du coup (le nombre de piétailles qui tombent), et les
 * piétailles qui peuvent tomber, la cible d'abord. */
export interface MassacrePietailleDialogData {
  readonly attaquantNom: string;
  readonly degats: number;
  readonly candidats: readonly TapisCard[];
}

/** « Appliquer » : les piétailles mises hors de combat. Fermer le dialogue sans appliquer ne fait rien. */
export interface MassacrePietailleResult {
  readonly tombes: readonly string[];
}
