/**
 * loopGenerator.ts
 * Module dédié à la génération géométrique d'ancres pour les circuits en boucle outdoor.
 * Calibre le rayon selon la sinuosité réelle des sentiers (BRouter / OSM).
 */

export interface LoopAnchorParams {
  startCoords: [number, number]; // [lon, lat]
  targetDistanceKm: number;
  activity?: 'hike' | 'bike';
  directionAngle?: number; // radians (0 = Est, PI/2 = Nord, etc.)
}

/**
 * Facteurs d'étalonnage empiriques sentier / vol d'oiseau :
 * - À pied ('hike') : les sentiers de randonnée et dénivelés sont plus sinueux -> diviseur ~9.5
 * - À vélo ('bike') : les routes, pistes cyclables et voies vertes sont plus directes -> diviseur ~7.8
 */
export const LOOP_SINUOSITY_DIVISORS: Record<'hike' | 'bike', number> = {
  hike: 9.5,
  bike: 7.8,
};

/**
 * Calcule les points d'ancrage triangulaires d'une boucle fermée
 * visant une distance cible sur sentiers réels.
 */
export function generateLoopAnchors({
  startCoords,
  targetDistanceKm,
  activity = 'hike',
  directionAngle = 0,
}: LoopAnchorParams): [number, number][] {
  const divisor = LOOP_SINUOSITY_DIVISORS[activity] || 9.5;
  const rKm = Math.max(0.4, targetDistanceKm / divisor);

  const startLon = startCoords[0];
  const startLat = startCoords[1];

  const latRad = (startLat * Math.PI) / 180;
  const kmPerLat = 111;
  const kmPerLon = Math.max(10, 111 * Math.cos(latRad));

  const theta = directionAngle;
  // Centre du cercle virtuel de la boucle
  const centerLat = startLat + (rKm / kmPerLat) * Math.sin(theta);
  const centerLon = startLon + (rKm / kmPerLon) * Math.cos(theta);

  // 3 points d'ancrage triangulaires naturels (Départ, Étape 1 à +120°, Étape 2 à -120°)
  const angles = [
    theta + Math.PI,      // Point de départ
    theta + Math.PI / 3,  // Étape 1 (~120°)
    theta - Math.PI / 3,  // Étape 2 (~240°)
  ];

  return angles.map((a) => [
    Number((centerLon + (rKm / kmPerLon) * Math.cos(a)).toFixed(5)),
    Number((centerLat + (rKm / kmPerLat) * Math.sin(a)).toFixed(5)),
  ]);
}
