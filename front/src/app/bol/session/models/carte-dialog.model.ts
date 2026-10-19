/** Ce que montre la carte ouverte depuis le cartouche : le lieu de la scène, en clair, et le point de sa région sur `carte.jpg`
 * (en %, comme `REGION_MAP_COORDINATES`). */
export interface CarteDialogData {
  readonly lieu: string;
  readonly point: {readonly x: number; readonly y: number};
}
