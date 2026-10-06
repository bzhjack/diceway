/** Identité et vitalité de session d'un héros, pour régler sa vitalité et son héroïsme. */
export interface HeroResourcesData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
}
