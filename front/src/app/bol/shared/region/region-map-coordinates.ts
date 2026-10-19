/**
 * Position (en % de la largeur/hauteur de `carte.jpg`) de l'étiquette de chaque région,
 * relevée manuellement sur l'illustration pour poser les points cliquables de la carte.
 * Clé = id de région (`bol_region.id`).
 */
export const REGION_MAP_COORDINATES: Record<number, {x: number; y: number}> = {
  1: {x: 54.1, y: 95.6}, // Côte de Feu
  2: {x: 13.6, y: 90.5}, // Désert de Beshaar
  3: {x: 32.1, y: 86.9}, // Halakh
  4: {x: 71.2, y: 94.6}, // Îles du Crâne
  5: {x: 26.4, y: 59.0}, // Jungle de Qo et jungle de Qush
  6: {x: 60.7, y: 71.4}, // Lysor
  7: {x: 27.0, y: 77.1}, // Malakut
  8: {x: 55.9, y: 63.0}, // Marais de Festrel
  9: {x: 48.8, y: 87.2}, // Marais de Kasht
  10: {x: 18.5, y: 37.6}, // Montagnes de l'Axos
  11: {x: 52.8, y: 59.6}, // Oomis
  12: {x: 48.8, y: 78.1}, // Parsool
  13: {x: 64.4, y: 49.0}, // Plaines de Klaar
  14: {x: 35.2, y: 64.3}, // Satarla
  15: {x: 13.6, y: 55.5}, // Shamballah
  16: {x: 4.0, y: 57.3}, // Terres Désolées
  17: {x: 24.6, y: 62.4}, // Tyrus
  18: {x: 77.0, y: 62.2}, // Urceb
  19: {x: 26.8, y: 25.5}, // Valgard
  20: {x: 72.6, y: 73.1}, // Zalut
};

/**
 * La carte HD (`cartes/carte-hd.jpg`, 1248 × 1741 px) : la même illustration que `carte.jpg`, au pixel près, entourée de son cadre
 * et de son titre. `carte.jpg` en est le recadrage à partir de (55, 109) px, sur 1137 × 1491 px (recalage par corrélation).
 */
export const CARTE_HD = {
  url: '/assets/bol/cartes/carte-hd.jpg',
  largeur: 1248,
  hauteur: 1741,
  recadrage: {x: 55, y: 109, largeur: 1137, hauteur: 1491},
} as const;

/** Un point de `carte.jpg` (en %, comme `REGION_MAP_COORDINATES`), en % de la carte HD. */
export function positionSurCarteHd(point: {x: number; y: number}): {x: number; y: number} {
  const {largeur, hauteur, recadrage} = CARTE_HD;
  return {
    x: ((recadrage.x + (point.x / 100) * recadrage.largeur) / largeur) * 100,
    y: ((recadrage.y + (point.y / 100) * recadrage.hauteur) / hauteur) * 100,
  };
}
