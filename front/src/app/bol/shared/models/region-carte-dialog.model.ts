/** Une région que la carte propose : son id (`bol_region.id`, qui place son point sur la carte) et son nom. */
export interface RegionCarteChoix {
  readonly id: number;
  readonly region: string;
}

export interface RegionCarteDialogData {
  readonly regions: readonly RegionCarteChoix[];
  /** La région déjà choisie, cerclée sur la carte et marquée dans la liste. */
  readonly regionId: number | null;
}

/** La région choisie, `null` pour « Aucune » ; le dialogue fermé sans choix rend `undefined`. */
export type RegionCarteDialogResult = number | null;
