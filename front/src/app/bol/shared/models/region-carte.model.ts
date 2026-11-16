/** Une région que la carte propose : son id (`bol_region.id`, qui place son point sur la carte) et son nom. */
export interface RegionCarteChoix {
  readonly id: number;
  readonly region: string;
}
