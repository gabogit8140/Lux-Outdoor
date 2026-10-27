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
 * Calcule les points d'ancrage d'une boucle fermée
 * visant une distance cible sur sentiers réels sans angles aigus.
 * Utilise 4 points cardinaux réguliers pour éviter les coupures de relief et impasses.
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

  // 4 points d'ancrage répartis à 90° autour du centre pour une boucle équilibrée
  // Point 0 = départ exact préservé (sans dérive trigonométrique)
  // Point 1 = quart de boucle (+90°)
  // Point 2 = point opposé (0° depuis le centre)
  // Point 3 = retour trois-quarts (-90°)
  return [
    [Number(startLon.toFixed(5)), Number(startLat.toFixed(5))],
    [
      Number((centerLon + (rKm / kmPerLon) * Math.cos(theta + Math.PI / 2)).toFixed(5)),
      Number((centerLat + (rKm / kmPerLat) * Math.sin(theta + Math.PI / 2)).toFixed(5)),
    ],
    [
      Number((centerLon + (rKm / kmPerLon) * Math.cos(theta)).toFixed(5)),
      Number((centerLat + (rKm / kmPerLat) * Math.sin(theta)).toFixed(5)),
    ],
    [
      Number((centerLon + (rKm / kmPerLon) * Math.cos(theta - Math.PI / 2)).toFixed(5)),
      Number((centerLat + (rKm / kmPerLat) * Math.sin(theta - Math.PI / 2)).toFixed(5)),
    ],
  ];
}

/**
 * Détecte et élimine tous les tronçons en aller-retour vers des points isolés (spurs / culs-de-sac).
 * Si un point de passage se trouve au fond d'une impasse, il est automatiquement relocalisé
 * sur la bifurcation du circuit principal, et le tronçon d'aller-retour parasite est supprimé.
 */
export function removeIsolatedPointSpurs(
  rawCoords: [number, number, number?][],
  waypoints: [number, number][],
  toleranceMeters: number = 35
): {
  cleanedCoords: [number, number, number?][];
  cleanedWaypoints: [number, number][];
  hasPrunedSpurs: boolean;
} {
  let coords = [...rawCoords];
  const cleanedWaypoints = waypoints.map((w) => [w[0], w[1]] as [number, number]);
  let hasPrunedSpurs = false;

  const distM = (a: [number, number, number?], b: [number, number, number?]) => {
    const dLon = (a[0] - b[0]) * 71000;
    const dLat = (a[1] - b[1]) * 111000;
    return Math.hypot(dLon, dLat);
  };

  // 1. Trouver les index de passage des waypoints le long du tracé calculé
  const wpIndices = cleanedWaypoints.map((wp) => {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = distM([wp[0], wp[1]], coords[i]);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  });

  // 2. Vérifier chaque waypoint intermédiaire (hors départ/arrivée)
  for (let wIdx = 1; wIdx < cleanedWaypoints.length; wIdx++) {
    const targetIdx = wpIndices[wIdx];
    if (targetIdx <= 2 || targetIdx >= coords.length - 3) continue;

    let maxBacktrackLen = 0;
    let junctionBeforeIdx = targetIdx;
    let junctionAfterIdx = targetIdx;

    const maxSearch = Math.min(targetIdx, coords.length - 1 - targetIdx, 150);
    for (let offset = 1; offset < maxSearch; offset++) {
      const beforePt = coords[targetIdx - offset];
      const afterPt = coords[targetIdx + offset];
      if (distM(beforePt, afterPt) < toleranceMeters) {
        maxBacktrackLen = offset;
        junctionBeforeIdx = targetIdx - offset;
        junctionAfterIdx = targetIdx + offset;
      } else {
        break;
      }
    }

    // Si le tracé fait un aller-retour symétrique d'au moins 3 points (>= 45-50 mètres)
    // vers ce point isolé : on élague l'antenne et on replace le waypoint sur la boucle
    if (maxBacktrackLen >= 3) {
      hasPrunedSpurs = true;
      const junctionPt = coords[junctionBeforeIdx];
      cleanedWaypoints[wIdx] = [
        Number(junctionPt[0].toFixed(5)),
        Number(junctionPt[1].toFixed(5)),
      ];

      // Supprime l'antenne parasite entre l'aller et le retour
      coords.splice(junctionBeforeIdx + 1, junctionAfterIdx - junctionBeforeIdx);

      // Ajuste les index des waypoints suivants
      const delta = junctionAfterIdx - junctionBeforeIdx;
      for (let k = wIdx + 1; k < cleanedWaypoints.length; k++) {
        if (wpIndices[k] > junctionBeforeIdx) {
          wpIndices[k] -= delta;
        }
      }
    }
  }

  return { cleanedCoords: coords, cleanedWaypoints, hasPrunedSpurs };
}
