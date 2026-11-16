import {RegionCarteChoix} from './region-carte.model';

export interface RegionCarteDialogData {
  readonly regions: readonly RegionCarteChoix[];
  /** La région déjà choisie, cerclée sur la carte et marquée dans la liste. */
  readonly regionId: number | null;
}

/** La région choisie, `null` pour « Aucune » ; le dialogue fermé sans choix rend `undefined`. */
export type RegionCarteDialogResult = number | null;
