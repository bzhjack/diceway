import {ActionRollCarriere} from './action-roll.model';

/** Un héros mourant qu'on peut tenter de stabiliser. */
interface RescuePatient {
  /** Clé de sa carte sur la table. */
  readonly key: string;
  readonly nom: string;
  readonly vitalite: number;
}

/** Données du dialogue « Secourir un mourant » : le secouriste (son esprit, ses carrières, son héroïsme) et les mourants à sa portée. */
export interface RescueDialogData {
  readonly rescuerNom: string;
  readonly herosId: string;
  readonly esprit: number;
  readonly heroisme: number;
  readonly carrieres: readonly ActionRollCarriere[];
  readonly patients: readonly RescuePatient[];
}

/** Le jet est fait : qui a été secouru, et s'il est stabilisé. Fermer le dialogue sans valider ne fait rien. */
export interface RescueResult {
  readonly key: string;
  readonly success: boolean;
}
