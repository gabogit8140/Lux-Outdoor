/**
 * loopGenerator.ts
 * Module dédié à la génération géométrique et à la calibration itérative
 * de circuits en boucle outdoor sans points orphelins ni impasses.
 */

import { haversineDistance } from '../geoUtils';
import { pruneLoopSpursAndOrphans, snapPointToTrack } from './spurPruner';
import type { CalculatedRouteResult } from './segmentRouter';
import { computeOutdoorRouteFromWaypoints } from './outdoorRouter';

export { pruneLoopSpursAndOrphans as removeIsolatedPointSpurs };

export interface LoopAnchorParams {
  startCoords: [number, number]; // [lon, lat]
  targetDistanceKm: number;
  activity?: 'hike' | 'bike';
  directionAngle?: number; // radians (0 = Est, PI/2 = Nord, etc.)
  scaleMultiplier?: number;
}

/**
 * Facteurs d'étalonnage initiaux sentier / vol d'oiseau :
 * - À pied ('hike') : sentiers forestiers sinueux -> diviseur initial ~9.2
 * - À vélo ('bike') : pistes cyclables et petites routes -> diviseur initial ~7.6
 */
export const LOOP_SINUOSITY_DIVISORS: Record<'hike' | 'bike', number> = {
  hike: 9.2,
  bike: 7.6,
};

/**
 * Génère les points d'ancrage d'une boucle fermée harmonieuse (polygone en goutte d'eau à 5 sommets)
 * évitant les angles droits brusques qui provoquent des demi-tours sur le graphe routier.
 */
export function generateLoopAnchors({
  startCoords,
  targetDistanceKm,
  activity = 'hike',
  directionAngle = 0,
  scaleMultiplier = 1,
}: LoopAnchorParams): [number, number][] {
  const divisor = LOOP_SINUOSITY_DIVISORS[activity] || 9.2;
  const rKm = Math.max(0.25, (targetDistanceKm / divisor) * scaleMultiplier);

  const startLon = startCoords[0];
  const startLat = startCoords[1];

  const latRad = (startLat * Math.PI) / 180;
  const kmPerLat = 111.13;
  const kmPerLon = Math.max(10, 111.32 * Math.cos(latRad));

  const theta = directionAngle;
  // Centre du cercle virtuel de la boucle placé dans la direction choisie
  const centerLat = startLat + (rKm / kmPerLat) * Math.sin(theta);
  const centerLon = startLon + (rKm / kmPerLon) * Math.cos(theta);

  // Répartition régulière sur le cercle (départ = theta + PI, puis 4 étapes à +72°, +144°, -144°, -72°)
  // Les angles obtus de 108° favorisent l'enchaînement fluide des sentiers sans aller-retour
  const baseBackAngle = theta + Math.PI;
  const stepAngles = [
    baseBackAngle + (2 * Math.PI) / 5,
    baseBackAngle + (4 * Math.PI) / 5,
    baseBackAngle + (6 * Math.PI) / 5,
    baseBackAngle + (8 * Math.PI) / 5,
  ];

  const anchors: [number, number][] = [
    [Number(startLon.toFixed(6)), Number(startLat.toFixed(6))],
  ];

  for (const ang of stepAngles) {
    const lon = centerLon + (rKm / kmPerLon) * Math.cos(ang);
    const lat = centerLat + (rKm / kmPerLat) * Math.sin(ang);
    anchors.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
  }

  return anchors;
}

/**
 * Extrait des waypoints parfaitement distribués et 100% situés SUR les coordonnées de la boucle nettoyée.
 * Garantit mathématiquement l'absence totale de point orphelin à l'écart du tracé.
 */
export function extractCleanWaypointsFromLoopCoords(
  coords: [number, number][],
  desiredCount: number = 5
): [number, number][] {
  if (!coords || coords.length < 4) return coords || [];

  const cumDist: number[] = [0];
  let totalMeters = 0;
  for (let i = 1; i < coords.length; i++) {
    totalMeters += haversineDistance(coords[i - 1], coords[i]);
    cumDist.push(totalMeters);
  }

  if (totalMeters < 100) {
    return [coords[0]];
  }

  const waypoints: [number, number][] = [
    [Number(coords[0][0].toFixed(6)), Number(coords[0][1].toFixed(6))],
  ];

  for (let k = 1; k < desiredCount; k++) {
    const targetMeters = (k / desiredCount) * totalMeters;
    let bestIdx = 1;
    for (let i = 1; i < cumDist.length; i++) {
      if (cumDist[i] >= targetMeters) {
        bestIdx = i;
        break;
      }
    }
    const pt = coords[bestIdx];
    const candidate: [number, number] = [
      Number(pt[0].toFixed(6)),
      Number(pt[1].toFixed(6)),
    ];
    const prev = waypoints[waypoints.length - 1];
    if (haversineDistance(prev, candidate) > 40) {
      waypoints.push(candidate);
    }
  }

  return waypoints;
}

/**
 * Génère et calibre itérativement une boucle automatique sur sentiers réels :
 * 1. Élimine tous les culs-de-sac et points orphelins via `pruneLoopSpursAndOrphans`
 * 2. Ajuste dynamiquement l'échelle de la boucle (jusqu'à 3 passes) pour coller au plus près
 *    à la distance `targetDistanceKm` demandée par l'utilisateur
 * 3. Place tous les waypoints strictement sur la trace finale nettoyée.
 */
export async function generateCalibratedOutdoorLoop(params: {
  startCoords: [number, number];
  targetDistanceKm: number;
  activity: 'hike' | 'bike';
  directionAngle?: number;
  onProgress?: (pass: number, currentResult: CalculatedRouteResult) => void;
}): Promise<{
  result: CalculatedRouteResult | null;
  waypoints: [number, number][];
}> {
  const {
    startCoords,
    targetDistanceKm,
    activity,
    directionAngle = 0,
    onProgress,
  } = params;

  let currentScale = 1.0;
  let currentAngle = directionAngle;
  let bestResult: CalculatedRouteResult | null = null;
  let bestWaypoints: [number, number][] = [];
  let minRelativeError = Infinity;

  const MAX_CALIBRATION_PASSES = 3;

  for (let pass = 0; pass < MAX_CALIBRATION_PASSES; pass++) {
    const candidateAnchors = generateLoopAnchors({
      startCoords,
      targetDistanceKm,
      activity,
      directionAngle: currentAngle,
      scaleMultiplier: currentScale,
    });

    const routeRes = await computeOutdoorRouteFromWaypoints(candidateAnchors, {
      activity,
      isLoop: true,
      pruneSpurs: true,
    });

    if (!routeRes || routeRes.coordinates.length < 4 || routeRes.distanceKm <= 0.2) {
      // Si une barrière géographique bloque cette orientation, on pivote de 35°
      currentAngle += 0.6;
      continue;
    }

    // Repositionne les waypoints strictement sur la boucle nettoyée (0 point orphelin)
    const snappedWaypoints = extractCleanWaypointsFromLoopCoords(
      routeRes.coordinates,
      5
    );
    const calibratedRoute: CalculatedRouteResult = {
      ...routeRes,
      waypointsUsed: snappedWaypoints,
    };

    const relError =
      Math.abs(calibratedRoute.distanceKm - targetDistanceKm) /
      Math.max(1, targetDistanceKm);

    if (relError < minRelativeError) {
      minRelativeError = relError;
      bestResult = calibratedRoute;
      bestWaypoints = snappedWaypoints;
      if (onProgress) {
        onProgress(pass + 1, calibratedRoute);
      }
    }

    // Si la distance obtenue est à moins de 6% de la cible (ou +/- 0.4 km), la calibration est optimale
    if (
      relError <= 0.06 ||
      Math.abs(calibratedRoute.distanceKm - targetDistanceKm) <= 0.4
    ) {
      break;
    }

    // Ajustement proportionnel amorti du rayon selon le ratio (distance cible / distance réelle)
    const ratio = targetDistanceKm / Math.max(0.5, calibratedRoute.distanceKm);
    const dampedAdjustment = Math.pow(ratio, 0.85);
    currentScale = Math.max(0.25, Math.min(3.2, currentScale * dampedAdjustment));

    // Si le ratio était très aberrant (ex: contournement d'un cours d'eau), léger décalage angulaire
    if (ratio < 0.55 || ratio > 1.85) {
      currentAngle += 0.35;
    }
  }

  if (!bestResult) {
    const fallbackAnchors = generateLoopAnchors({
      startCoords,
      targetDistanceKm,
      activity,
      directionAngle,
    });
    return { result: null, waypoints: fallbackAnchors };
  }

  return {
    result: bestResult,
    waypoints: bestWaypoints,
  };
}

export { snapPointToTrack };
