/** Identité et vitalité de session d'un héros, pour régler sa vitalité et son héroïsme ; sa foi et son pouvoir, avec leur réserve
 * maximale (`null` sans la carrière), pour les récupérer. */
export interface HeroResourcesData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
  readonly foi: number;
  readonly foiMax: number | null;
  readonly pouvoir: number;
  readonly pouvoirMax: number | null;
}

/** Une manière de récupérer des points de foi ou de pouvoir (livre p. 146 et 155), et ce qu'elle rend (`null` : tout). */
export interface RecuperationMagique {
  readonly ressource: 'foi' | 'pouvoir';
  readonly libelle: string;
  readonly gain: number | null;
}
