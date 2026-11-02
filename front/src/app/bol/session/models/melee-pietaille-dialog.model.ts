import {MeleeCamps} from './melee-pietaille.model';

/** Données du dialogue « Mêlée de piétaille » : la piétaille debout de chaque camp, dans l'ordre de jeu. */
export interface MeleePietailleDialogData {
  readonly camps: MeleeCamps;
}

/** « Appliquer » : les cartes de piétaille qui tombent, des deux camps. Fermer le dialogue sans appliquer ne fait rien. */
export interface MeleePietailleResult {
  readonly tombes: readonly string[];
}
