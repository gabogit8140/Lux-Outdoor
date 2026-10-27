import {
  haversineDistance,
  computeRoadBreakdown,
  calculateRouteDifficulty,
  generateTrackSegments,
  rdpSimplify,
  computeElevationProfile,
} from '../geoUtils';
import type {
  ElevationPoint,
  RoadTypeBreakdown,
  RouteDifficulty,
  TrackSegment,
} from '../../types';
import {
  resolveBRouterProfile,
  resolveOsrmProfile,
  getProfileSurfaceDistribution,
  estimateRouteDuration,
  type ActivityType,
} from './routingProfiles';
import { removeIsolatedPointSpurs } from './loopGenerator';

export interface CalculatedRouteResult {
  coordinates: [number, number][]; // [lon, lat]
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  elevationProfile: ElevationPoint[];
  roadBreakdown?: RoadTypeBreakdown;
  surfaceDistribution?: { type: string; percentage: number }[];
  difficulty: RouteDifficulty;
  segments?: TrackSegment[];
  durationMinutes: number;
  waypointsUsed: [number, number][];
}

/**
 * Calcule un itinéraire réel suivant les sentiers pédestres et cyclables OpenStreetMap
 * via le moteur BRouter (spécialiste outdoor) avec repli automatique sur OSRM.
 */
export async function computeOutdoorRouteFromWaypoints(
  rawWaypoints: [number, number][], // [lon, lat]
  options: {
    activity: 'bike' | 'hike';
    isLoop?: boolean;
    filters?: string[];
  }
): Promise<CalculatedRouteResult | null> {
  const { activity, isLoop = true, filters = [] } = options;

  if (!rawWaypoints || rawWaypoints.length < 2) {
    return null;
  }

  // Si le mode boucle est activé, on ferme la boucle en revenant au premier point
  const waypoints: [number, number][] = [...rawWaypoints];
  if (isLoop && waypoints.length >= 2) {
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];
    const distToFirst = haversineDistance(first, last);
    // Si le dernier point n'est pas déjà le départ, on ajoute le départ
    if (distToFirst > 30) {
      waypoints.push(first);
    }
  }

  // 1. MOTEUR PRINCIPAL : BRouter (tracé fidèle aux sentiers forestiers et pistes cyclables)
  try {
    const lonlats = waypoints
      .map(([lon, lat]) => `${lon.toFixed(5)},${lat.toFixed(5)}`)
      .join('|');

    const bProfile = resolveBRouterProfile(activity, filters);
    const bUrl = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${bProfile}&alternativeidx=0&format=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(bUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const f = data.features?.[0];
      const rawCoords: [number, number, number][] = f?.geometry?.coordinates;

      if (rawCoords && rawCoords.length >= 4) {
        let finalCoords: [number, number, number?][] = rawCoords;
        let finalWaypoints = waypoints;

        // Détection et suppression automatique des antennes/spurs vers des points isolés en boucle
        if (isLoop && rawCoords.length >= 10 && waypoints.length >= 3) {
          const spurResult = removeIsolatedPointSpurs(rawCoords, waypoints);
          if (spurResult.hasPrunedSpurs) {
            finalCoords = spurResult.cleanedCoords;
            finalWaypoints = spurResult.cleanedWaypoints;
          }
        }

        const coordinates: [number, number][] = finalCoords.map(([lon, lat]) => [lon, lat]);

        // Calcul du profil altimétrique cumulé et de la distance réelle sans les aller-retours parasites
        let accumMeters = 0;
        const elevationProfile: ElevationPoint[] = finalCoords.map(([lon, lat, ele], idx) => {
          if (idx > 0) {
            const prev = finalCoords[idx - 1];
            accumMeters += haversineDistance([prev[0], prev[1]], [lon, lat]);
          }
          return {
            distance: Number((accumMeters / 1000).toFixed(2)),
            elevation: Math.round(ele || 300),
          };
        });

        const distanceKm = Number((accumMeters / 1000).toFixed(2));
        const elevationGain = Math.round(Number(f.properties?.['filtered ascend']) || 0);
        const elevationLoss = Math.round(Number(f.properties?.['filtered descend']) || elevationGain);

        const surfaceDistribution = getProfileSurfaceDistribution(activity, 'brouter');
        const difficulty = calculateRouteDifficulty(distanceKm, elevationGain, activity);
        const roadBreakdown = computeRoadBreakdown(distanceKm, surfaceDistribution, activity);
        const segments = generateTrackSegments(coordinates, roadBreakdown.carFreePercentage);
        const durationMinutes = estimateRouteDuration(distanceKm, elevationGain, activity);

        return {
          coordinates,
          distanceKm,
          elevationGain,
          elevationLoss,
          elevationProfile,
          roadBreakdown,
          difficulty,
          segments,
          durationMinutes,
          waypointsUsed: finalWaypoints,
        };
      }
    }
  } catch (brouterErr) {
    console.warn('[OutdoorRouter] BRouter non disponible, bascule sur OSRM:', brouterErr);
  }

  // 2. MOTEUR DE SECOURS : OSRM (Open Source Routing Machine)
  try {
    const profile = resolveOsrmProfile(activity);
    const coordsStr = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        let rawCoords: [number, number][] = route.geometry.coordinates;
        let finalWaypoints = waypoints;

        if (isLoop && rawCoords.length >= 10 && waypoints.length >= 3) {
          const spurResult = removeIsolatedPointSpurs(rawCoords, waypoints);
          if (spurResult.hasPrunedSpurs) {
            rawCoords = spurResult.cleanedCoords as [number, number][];
            finalWaypoints = spurResult.cleanedWaypoints;
          }
        }

        const coordinates: [number, number][] = rawCoords;
        const elevRes = computeElevationProfile(coordinates, Math.round(coordinates.length / 2) + 50);
        const distanceKm = Number(
          (
            elevRes.profile[elevRes.profile.length - 1]?.distance ||
            route.distance / 1000
          ).toFixed(2)
        );
        const elevationGain = Math.round(elevRes.gain);
        const elevationLoss = Math.round(elevRes.loss);
        const elevationProfile = elevRes.profile;

        const surfaceDistribution = getProfileSurfaceDistribution(activity, 'osrm');
        const difficulty = calculateRouteDifficulty(distanceKm, elevationGain, activity);
        const roadBreakdown = computeRoadBreakdown(distanceKm, surfaceDistribution, activity);
        const segments = generateTrackSegments(coordinates, roadBreakdown.carFreePercentage);
        const durationMinutes = estimateRouteDuration(distanceKm, elevationGain, activity);

        return {
          coordinates,
          distanceKm,
          elevationGain,
          elevationLoss,
          elevationProfile,
          roadBreakdown,
          difficulty,
          segments,
          durationMinutes,
          waypointsUsed: finalWaypoints,
        };
      }
    }
  } catch (osrmErr) {
    console.error('[OutdoorRouter] Erreur OSRM secours:', osrmErr);
  }

  return null;
}

/**
 * Simplifie une trace GPS existante comportant des centaines de points
 * pour en extraire un nombre restreint de points de passage clés (waypoints) éditables.
 */
export function simplifyRouteToWaypoints(
  coordinates: [number, number][], // [lon, lat]
  targetCount: number = 7
): [number, number][] {
  if (!coordinates || coordinates.length <= targetCount) {
    return coordinates || [];
  }

  // On recherche par dichotomie une tolérance epsilon qui donne environ targetCount points
  let low = 50;
  let high = 1500;
  let bestPoints = coordinates;

  for (let iter = 0; iter < 6; iter++) {
    const mid = (low + high) / 2;
    const simplified = rdpSimplify(coordinates, mid);
    if (simplified.length > targetCount) {
      low = mid;
      bestPoints = simplified;
    } else {
      high = mid;
      bestPoints = simplified;
    }
  }

  // Si trop de points restent, sous-échantillonnage régulier
  if (bestPoints.length > 12) {
    const step = Math.ceil(bestPoints.length / targetCount);
    const sampled: [number, number][] = [bestPoints[0]];
    for (let i = step; i < bestPoints.length - 1; i += step) {
      sampled.push(bestPoints[i]);
    }
    sampled.push(bestPoints[bestPoints.length - 1]);
    return sampled;
  }

  return bestPoints;
}
