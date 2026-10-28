import {
  haversineDistance,
  computeRoadBreakdown,
  calculateRouteDifficulty,
  generateTrackSegments,
  rdpSimplify,
  computeElevationProfile,
} from '../geoUtils';
import type { ElevationPoint } from '../../types';
import {
  resolveBRouterProfile,
  resolveOsrmProfile,
  getProfileSurfaceDistribution,
  estimateRouteDuration,
} from './routingProfiles';
import { pruneLoopSpursAndOrphans, countSharedPassagePoints } from './spurPruner';
import {
  routeSingleLeg,
  assembleLegsIntoRouteResult,
  type CalculatedRouteResult,
  type SegmentRoutingMode,
  type RoutedLegResult,
} from './segmentRouter';

export type { CalculatedRouteResult, SegmentRoutingMode, RoutedLegResult };

/**
 * Calcule un itinéraire réel suivant les sentiers pédestres et cyclables OpenStreetMap,
 * avec contrainte anti-repassage (`forbiddenCoords` / `nogos`) entre chaque segment
 * pour garantir qu'un circuit ne repasse jamais deux fois par le même point.
 */
export async function computeOutdoorRouteFromWaypoints(
  rawWaypoints: [number, number][], // [lon, lat]
  options: {
    activity: 'bike' | 'hike';
    isLoop?: boolean;
    filters?: string[];
    pruneSpurs?: boolean;
    routingMode?: SegmentRoutingMode;
    segmentModes?: Record<number, SegmentRoutingMode>;
  }
): Promise<CalculatedRouteResult | null> {
  const {
    activity,
    isLoop = true,
    filters = [],
    pruneSpurs = false,
    routingMode = 'trail',
    segmentModes = {},
  } = options;

  if (!rawWaypoints || rawWaypoints.length < 2) {
    return null;
  }

  // 1. Mode Tracé Manuel & Modification : Routage séquentiel avec mémoire anti-repassage (`forbiddenCoords`)
  if (!pruneSpurs) {
    const legPairs: { from: [number, number]; to: [number, number]; legIndex: number }[] = [];
    for (let i = 0; i < rawWaypoints.length - 1; i++) {
      legPairs.push({
        from: rawWaypoints[i],
        to: rawWaypoints[i + 1],
        legIndex: i,
      });
    }

    if (isLoop && rawWaypoints.length >= 2) {
      const first = rawWaypoints[0];
      const last = rawWaypoints[rawWaypoints.length - 1];
      if (haversineDistance(first, last) > 20) {
        legPairs.push({
          from: last,
          to: first,
          legIndex: rawWaypoints.length - 1,
        });
      }
    }

    const routedLegs: RoutedLegResult[] = [];
    const usedCoords: [number, number, number?][] = [];

    for (let idx = 0; idx < legPairs.length; idx++) {
      const pair = legPairs[idx];
      const mode = segmentModes[pair.legIndex] || routingMode;

      const leg = await routeSingleLeg(pair.from, pair.to, {
        activity,
        mode,
        filters,
        forbiddenCoords: usedCoords.length > 0 ? usedCoords : undefined,
      });

      // Si malgré tout le segment `idx` partage des points avec le segment précédent `idx - 1`
      // (parce que le segment `idx - 1` avait pris la seule sortie disponible vers `pair.to`),
      // on inverse la priorité : on calcule d'abord `idx` librement, puis on recalcule `idx - 1` avec `nogos` sur `idx` !
      if (idx > 0 && mode === 'trail') {
        const prevLeg = routedLegs[idx - 1];
        const prevPair = legPairs[idx - 1];
        const sharedCount = countSharedPassagePoints(
          prevLeg.coordinates,
          leg.coordinates,
          pair.from
        );

        if (sharedCount >= 3) {
          const priorCoordsBeforePrev = routedLegs
            .slice(0, idx - 1)
            .flatMap((l) => l.coordinates);
          const altCurrLeg = await routeSingleLeg(pair.from, pair.to, {
            activity,
            mode,
            filters,
            forbiddenCoords:
              priorCoordsBeforePrev.length > 0 ? priorCoordsBeforePrev : undefined,
          });
          const altPrevLeg = await routeSingleLeg(prevPair.from, prevPair.to, {
            activity,
            mode: segmentModes[prevPair.legIndex] || routingMode,
            filters,
            forbiddenCoords: [...priorCoordsBeforePrev, ...altCurrLeg.coordinates],
          });

          const altShared = countSharedPassagePoints(
            altPrevLeg.coordinates,
            altCurrLeg.coordinates,
            pair.from
          );
          if (altShared < sharedCount) {
            routedLegs[idx - 1] = altPrevLeg;
            routedLegs.push(altCurrLeg);
            usedCoords.length = 0;
            for (const l of routedLegs) {
              usedCoords.push(...l.coordinates);
            }
            continue;
          }
        }
      }

      routedLegs.push(leg);
      usedCoords.push(...leg.coordinates);
    }

    return assembleLegsIntoRouteResult(routedLegs, rawWaypoints, activity);
  }

  // 2. Mode Boucle Automatique (`pruneSpurs = true`)
  const waypoints: [number, number][] = [...rawWaypoints];
  if (isLoop && waypoints.length >= 2) {
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];
    if (haversineDistance(first, last) > 30) {
      waypoints.push(first);
    }
  }

  try {
    const lonlats = waypoints
      .map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`)
      .join('|');

    const bProfile = resolveBRouterProfile(activity, filters);
    const bUrl = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${bProfile}&alternativeidx=0&format=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9500);
    const res = await fetch(bUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const f = data.features?.[0];
      const rawCoords: [number, number, number?][] = f?.geometry?.coordinates;

      if (rawCoords && rawCoords.length >= 4) {
        const spurResult = pruneLoopSpursAndOrphans(rawCoords, waypoints);
        const finalCoords = spurResult.cleanedCoords;
        const finalWaypoints = spurResult.cleanedWaypoints;

        const coordinates: [number, number][] = finalCoords.map(([lon, lat]) => [lon, lat]);

        let accumMeters = 0;
        let elevationGain = 0;
        let elevationLoss = 0;
        let lastEle = finalCoords[0]?.[2];

        const elevationProfile: ElevationPoint[] = finalCoords.map(([lon, lat, ele], idx) => {
          if (idx > 0) {
            const prev = finalCoords[idx - 1];
            accumMeters += haversineDistance([prev[0], prev[1]], [lon, lat]);
            if (typeof ele === 'number' && typeof lastEle === 'number') {
              const diff = ele - lastEle;
              if (Math.abs(diff) >= 2.5) {
                if (diff > 0) elevationGain += diff;
                else elevationLoss += Math.abs(diff);
                lastEle = ele;
              }
            } else if (typeof ele === 'number') {
              lastEle = ele;
            }
          }
          return {
            distance: Number((accumMeters / 1000).toFixed(2)),
            elevation: Math.round(ele || 300),
          };
        });

        const distanceKm = Number((accumMeters / 1000).toFixed(2));
        if (elevationGain === 0) {
          elevationGain = Math.round(Number(f.properties?.['filtered ascend']) || 0);
          elevationLoss = Math.round(Number(f.properties?.['filtered descend']) || elevationGain);
        } else {
          elevationGain = Math.round(elevationGain);
          elevationLoss = Math.round(elevationLoss);
        }

        const surfaceDistribution = getProfileSurfaceDistribution(activity, 'brouter');
        const difficulty = calculateRouteDifficulty(distanceKm, elevationGain, activity);
        const roadBreakdown = computeRoadBreakdown(distanceKm, surfaceDistribution, activity);
        const segments = generateTrackSegments(coordinates, roadBreakdown.carFreePercentage);
        const durationMinutes = estimateRouteDuration(distanceKm, elevationGain, activity);

        return {
          coordinates,
          coordinates3D: finalCoords,
          distanceKm,
          elevationGain,
          elevationLoss,
          elevationProfile,
          roadBreakdown,
          surfaceDistribution,
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

  // Secours OSRM
  try {
    const profile = resolveOsrmProfile(activity);
    const coordsStr = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        const rawCoords: [number, number][] = route.geometry.coordinates;
        const spurResult = pruneLoopSpursAndOrphans(rawCoords, waypoints);
        const coordinates: [number, number][] = spurResult.cleanedCoords.map(([lon, lat]) => [
          lon,
          lat,
        ]);

        const elevRes = computeElevationProfile(
          coordinates,
          Math.round(coordinates.length / 2) + 50
        );
        const distanceKm = Number(
          (
            elevRes.profile[elevRes.profile.length - 1]?.distance ||
            route.distance / 1000
          ).toFixed(2)
        );
        const elevationGain = Math.round(elevRes.gain);
        const elevationLoss = Math.round(elevRes.loss);

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
          elevationProfile: elevRes.profile,
          roadBreakdown,
          surfaceDistribution,
          difficulty,
          segments,
          durationMinutes,
          waypointsUsed: spurResult.cleanedWaypoints,
        };
      }
    }
  } catch (osrmErr) {
    console.error('[OutdoorRouter] Erreur OSRM secours:', osrmErr);
  }

  return null;
}

/**
 * Simplifie une trace GPS existante pour en extraire des points de passage clés.
 */
export function simplifyRouteToWaypoints(
  coordinates: [number, number][], // [lon, lat]
  targetCount: number = 9
): [number, number][] {
  if (!coordinates || coordinates.length <= targetCount) {
    return coordinates || [];
  }

  let low = 40;
  let high = 1200;
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

  if (bestPoints.length > 14) {
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
