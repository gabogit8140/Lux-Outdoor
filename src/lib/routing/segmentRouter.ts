import {
  haversineDistance,
  computeRoadBreakdown,
  calculateRouteDifficulty,
  generateTrackSegments,
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
import { pruneLoopSpursAndOrphans } from './spurPruner';

export type SegmentRoutingMode = 'trail' | 'free' | 'direct' | 'original';

export interface RoutedLegResult {
  coordinates: [number, number, number?][]; // [lon, lat, ele?]
  distanceMeters: number;
  elevationGain: number;
  elevationLoss: number;
  mode: SegmentRoutingMode;
  engine: 'brouter' | 'osrm' | 'direct' | 'original';
}

export interface CalculatedRouteResult {
  coordinates: [number, number][]; // [lon, lat]
  coordinates3D?: [number, number, number?][];
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
  legs?: RoutedLegResult[];
}

// Cache LRU en mémoire pour les segments unitaires
const legCache = new Map<string, RoutedLegResult>();
const MAX_CACHE_ENTRIES = 350;

/**
 * Génère la chaîne `nogos` BRouter (lon,lat,radius|...) à partir des coordonnées déjà empruntées
 * par les autres segments du circuit, afin d'interdire tout repassage par un même point/sentier
 * et de forcer la création d'une vraie boucle entre les étapes consécutives.
 */
export function buildAntiOverlapNogos(
  forbiddenCoords: [number, number, number?][],
  from: [number, number],
  to: [number, number],
  endpointClearanceMeters: number = 165,
  nogoRadiusMeters: number = 32
): string {
  if (!forbiddenCoords || forbiddenCoords.length === 0) return '';

  const selected: [number, number][] = [];
  // Parcourt en priorité les points les plus récents (segment précédent immédiat) pour empêcher tout demi-tour
  for (let i = forbiddenCoords.length - 1; i >= 0; i--) {
    const pt: [number, number] = [forbiddenCoords[i][0], forbiddenCoords[i][1]];
    if (
      haversineDistance(pt, from) < endpointClearanceMeters ||
      haversineDistance(pt, to) < endpointClearanceMeters
    ) {
      continue;
    }
    const tooCloseToExisting = selected.some(
      (s) => haversineDistance(pt, s) < nogoRadiusMeters * 1.65
    );
    if (!tooCloseToExisting) {
      selected.push(pt);
      if (selected.length >= 42) break;
    }
  }

  return selected
    .map(([lon, lat]) => `${lon.toFixed(5)},${lat.toFixed(5)},${nogoRadiusMeters}`)
    .join('|');
}

function makeLegCacheKey(
  from: [number, number],
  to: [number, number],
  activity: ActivityType,
  mode: SegmentRoutingMode,
  nogosHash: string
): string {
  return `${from[0].toFixed(5)},${from[1].toFixed(5)}->${to[0].toFixed(5)},${to[1].toFixed(5)}|${activity}|${mode}|${nogosHash}`;
}

function storeInLegCache(key: string, val: RoutedLegResult) {
  if (legCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = legCache.keys().next().value;
    if (firstKey) legCache.delete(firstKey);
  }
  legCache.set(key, val);
}

/**
 * Raccorde proprement les extrémités d'un segment routé aux coordonnées exactes demandées.
 */
function enforceExactEndpoints(
  coords: [number, number, number?][],
  from: [number, number],
  to: [number, number]
): [number, number, number?][] {
  if (!coords || coords.length === 0) {
    return [
      [from[0], from[1], 300],
      [to[0], to[1], 300],
    ];
  }

  const result = [...coords];
  const first = result[0];
  const last = result[result.length - 1];

  const distStart = haversineDistance([first[0], first[1]], from);
  if (distStart > 4) {
    result.unshift([from[0], from[1], first[2] ?? 300]);
  } else {
    result[0] = [from[0], from[1], first[2] ?? 300];
  }

  const distEnd = haversineDistance([last[0], last[1]], to);
  if (distEnd > 4) {
    result.push([to[0], to[1], last[2] ?? 300]);
  } else {
    result[result.length - 1] = [to[0], to[1], last[2] ?? 300];
  }

  return result;
}

/**
 * Calcule la distance et le dénivelé positif/négatif filtré d'une liste de coordonnées 3D.
 */
export function computeLegMetrics(coords: [number, number, number?][]): {
  distanceMeters: number;
  elevationGain: number;
  elevationLoss: number;
} {
  if (!coords || coords.length < 2) {
    return { distanceMeters: 0, elevationGain: 0, elevationLoss: 0 };
  }

  let distanceMeters = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let lastFilteredEle = coords[0][2];

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    distanceMeters += haversineDistance([prev[0], prev[1]], [curr[0], curr[1]]);

    if (typeof curr[2] === 'number' && typeof lastFilteredEle === 'number') {
      const diff = curr[2] - lastFilteredEle;
      if (Math.abs(diff) >= 2.5) {
        if (diff > 0) elevationGain += diff;
        else elevationLoss += Math.abs(diff);
        lastFilteredEle = curr[2];
      }
    } else if (typeof curr[2] === 'number') {
      lastFilteredEle = curr[2];
    }
  }

  return {
    distanceMeters,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
  };
}

/**
 * Crée un segment en ligne directe (hors-sentier / liaison libre) entre deux points.
 */
export function buildDirectLeg(
  from: [number, number],
  to: [number, number],
  startEle: number = 300,
  endEle: number = 300
): RoutedLegResult {
  const dist = haversineDistance(from, to);
  const steps = Math.max(2, Math.min(30, Math.ceil(dist / 35)));
  const coords: [number, number, number?][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = from[0] + t * (to[0] - from[0]);
    const lat = from[1] + t * (to[1] - from[1]);
    const ele = Math.round(startEle + t * (endEle - startEle));
    coords.push([lon, lat, ele]);
  }

  const metrics = computeLegMetrics(coords);
  return {
    coordinates: coords,
    distanceMeters: metrics.distanceMeters,
    elevationGain: metrics.elevationGain,
    elevationLoss: metrics.elevationLoss,
    mode: 'direct',
    engine: 'direct',
  };
}

/**
 * Crée un segment natif verrouillé à partir des coordonnées exactes d'une trace GPX originale.
 */
export function buildOriginalLeg(
  sliceCoords: [number, number, number?][]
): RoutedLegResult {
  const metrics = computeLegMetrics(sliceCoords);
  return {
    coordinates: sliceCoords,
    distanceMeters: metrics.distanceMeters,
    elevationGain: metrics.elevationGain,
    elevationLoss: metrics.elevationLoss,
    mode: 'original',
    engine: 'original',
  };
}

/**
 * Interroge BRouter avec ou sans `nogos` anti-chevauchement.
 */
async function fetchBRouterLeg(
  from: [number, number],
  to: [number, number],
  bProfile: string,
  nogosParam: string,
  mode: SegmentRoutingMode = 'trail'
): Promise<RoutedLegResult | null> {
  try {
    const lonlats = `${from[0].toFixed(6)},${from[1].toFixed(6)}|${to[0].toFixed(6)},${to[1].toFixed(6)}`;
    const nogoQuery = nogosParam ? `&nogos=${nogosParam}` : '';
    const bUrl = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${bProfile}${nogoQuery}&alternativeidx=0&format=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(bUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        const f = data.features?.[0];
        const rawCoords: [number, number, number?][] | undefined = f?.geometry?.coordinates;

        if (rawCoords && rawCoords.length >= 2) {
          const exactCoords = enforceExactEndpoints(rawCoords, from, to);
          const metrics = computeLegMetrics(exactCoords);
          const bGain = Math.round(
            Number(f.properties?.['filtered ascend']) || metrics.elevationGain
          );
          const bLoss = Math.round(
            Number(f.properties?.['filtered descend']) || metrics.elevationLoss
          );

          return {
            coordinates: exactCoords,
            distanceMeters: metrics.distanceMeters,
            elevationGain: bGain,
            elevationLoss: bLoss,
            mode,
            engine: 'brouter',
          };
        }
      }
    }
  } catch {
    // Ignoré
  }
  return null;
}

/**
 * Calcule le tracé d'un segment unique (from -> to) sur les sentiers réels.
 * - Mode 'trail' : cherche une boucle en interdisant les coordonnées déjà empruntées (`forbiddenCoords`)
 * - Mode 'free' : sentiers libres au plus court, sans aucune interdiction de repassage (aller-retours permis)
 * - Mode 'direct' : ligne droite point par point (hors-sentier)
 */
export async function routeSingleLeg(
  from: [number, number],
  to: [number, number],
  options: {
    activity: ActivityType;
    mode?: SegmentRoutingMode;
    filters?: string[];
    forbiddenCoords?: [number, number, number?][];
  }
): Promise<RoutedLegResult> {
  const { activity, mode = 'trail', filters = [], forbiddenCoords } = options;

  const directDist = haversineDistance(from, to);
  if (directDist < 6 || mode === 'direct') {
    return buildDirectLeg(from, to);
  }

  // En mode 'free' (sentiers libres), on n'impose AUCUN nogos anti-repassage :
  // l'utilisateur peut repasser sur le même sentier (aller-retour, circuit en 8, trèfle...)
  const nogosStr =
    mode === 'trail' && forbiddenCoords
      ? buildAntiOverlapNogos(forbiddenCoords, from, to, 165, 32)
      : '';
  const nogosHash = nogosStr ? `${nogosStr.length}_${nogosStr.slice(0, 24)}` : '0';

  const cacheKey = makeLegCacheKey(from, to, activity, mode, nogosHash);
  const cached = legCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const bProfile = resolveBRouterProfile(activity, filters);

  // 1a. Moteur principal BRouter AVEC contrainte anti-repassage (`nogos`) pour forcer une boucle propre (mode 'trail' uniquement)
  if (nogosStr) {
    const disjointLeg = await fetchBRouterLeg(from, to, bProfile, nogosStr, mode);
    if (disjointLeg) {
      storeInLegCache(cacheKey, disjointLeg);
      return disjointLeg;
    }
  }

  // 1b. Repli BRouter sans `nogos` (utilisé directement en mode 'free', ou en secours 'trail' si aucune autre sortie)
  const standardLeg = await fetchBRouterLeg(from, to, bProfile, '', mode);
  if (standardLeg) {
    storeInLegCache(cacheKey, standardLeg);
    return standardLeg;
  }

  // 2. Moteur de secours : OSRM
  try {
    const profile = resolveOsrmProfile(activity);
    const coordsStr = `${from[0].toFixed(6)},${from[1].toFixed(6)};${to[0].toFixed(6)},${to[1].toFixed(6)}`;
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (data.code === 'Ok' && route?.geometry?.coordinates?.length >= 2) {
        const raw2D: [number, number][] = route.geometry.coordinates;
        const elevRes = computeElevationProfile(
          raw2D,
          Math.max(5, Math.round(route.distance / 120))
        );
        const coords3D: [number, number, number?][] = raw2D.map(([lon, lat], idx) => {
          const pIdx = Math.min(
            elevRes.profile.length - 1,
            Math.floor((idx / Math.max(1, raw2D.length - 1)) * (elevRes.profile.length - 1))
          );
          return [lon, lat, elevRes.profile[pIdx]?.elevation ?? 300];
        });

        const exactCoords = enforceExactEndpoints(coords3D, from, to);
        const metrics = computeLegMetrics(exactCoords);

        const legResult: RoutedLegResult = {
          coordinates: exactCoords,
          distanceMeters: metrics.distanceMeters,
          elevationGain: Math.round(elevRes.gain),
          elevationLoss: Math.round(elevRes.loss),
          mode,
          engine: 'osrm',
        };
        storeInLegCache(cacheKey, legResult);
        return legResult;
      }
    }
  } catch {
    // Repli final sur liaison directe
  }

  return buildDirectLeg(from, to);
}

/**
 * Assemble une séquence de segments (legs) en un résultat de parcours complet,
 * et élimine systématiquement tout aller-retour / repassage par le même point
 * dès que le parcours comporte au moins 2 segments.
 */
export function assembleLegsIntoRouteResult(
  legs: RoutedLegResult[],
  waypointsUsed: [number, number][],
  activity: ActivityType,
  options?: { preserveOutAndBack?: boolean }
): CalculatedRouteResult | null {
  if (!legs || legs.length === 0) return null;

  const rawMerged3D: [number, number, number?][] = [];
  let totalGain = 0;
  let totalLoss = 0;

  for (let lIdx = 0; lIdx < legs.length; lIdx++) {
    const leg = legs[lIdx];
    totalGain += leg.elevationGain;
    totalLoss += leg.elevationLoss;

    for (let cIdx = 0; cIdx < leg.coordinates.length; cIdx++) {
      if (lIdx > 0 && cIdx === 0 && rawMerged3D.length > 0) {
        const prev = rawMerged3D[rawMerged3D.length - 1];
        const curr = leg.coordinates[0];
        if (haversineDistance([prev[0], prev[1]], [curr[0], curr[1]]) < 3) {
          continue;
        }
      }
      rawMerged3D.push(leg.coordinates[cIdx]);
    }
  }

  if (rawMerged3D.length < 2) return null;

  // Élimination systématique de tout repassage par un même point (aller-retour d'impasse ou jonction doublée),
  // sauf lorsque tous les tronçons proviennent de la trace GPX originale ou d'une sous-trace Aller-Retour volontaire.
  let merged3D = rawMerged3D;
  let finalWaypoints = waypointsUsed;
  const allOriginal = legs.every((l) => l.mode === 'original');

  if (!options?.preserveOutAndBack && !allOriginal && legs.length >= 2 && rawMerged3D.length >= 8) {
    const spurClean = pruneLoopSpursAndOrphans(rawMerged3D, waypointsUsed, 38);
    if (spurClean.hasPrunedSpurs && spurClean.cleanedCoords.length >= 4) {
      merged3D = spurClean.cleanedCoords;
      finalWaypoints = spurClean.cleanedWaypoints;
      const cleanedMetrics = computeLegMetrics(merged3D);
      if (cleanedMetrics.elevationGain > 0) {
        totalGain = cleanedMetrics.elevationGain;
        totalLoss = cleanedMetrics.elevationLoss;
      }
    }
  }

  const coordinates: [number, number][] = merged3D.map(([lon, lat]) => [lon, lat]);

  // Profil altimétrique continu
  let accumMeters = 0;
  let fallbackEle = 300;
  const elevationProfile: ElevationPoint[] = merged3D.map(([lon, lat, ele], idx) => {
    if (idx > 0) {
      const prev = merged3D[idx - 1];
      accumMeters += haversineDistance([prev[0], prev[1]], [lon, lat]);
    }
    if (typeof ele === 'number' && !isNaN(ele)) {
      fallbackEle = Math.round(ele);
    }
    return {
      distance: Number((accumMeters / 1000).toFixed(2)),
      elevation: fallbackEle,
    };
  });

  const distanceKm = Number((accumMeters / 1000).toFixed(2));

  if (totalGain === 0 && distanceKm > 0.2) {
    const synth = computeElevationProfile(coordinates, Math.round(distanceKm * 12));
    totalGain = Math.round(synth.gain);
    totalLoss = Math.round(synth.loss);
  }

  const primaryEngine = legs.some((l) => l.engine === 'brouter') ? 'brouter' : 'osrm';
  const surfaceDistribution = getProfileSurfaceDistribution(activity, primaryEngine);
  const difficulty = calculateRouteDifficulty(distanceKm, totalGain, activity);
  const roadBreakdown = computeRoadBreakdown(distanceKm, surfaceDistribution, activity);
  const segments = generateTrackSegments(coordinates, roadBreakdown.carFreePercentage);
  const durationMinutes = estimateRouteDuration(distanceKm, totalGain, activity);

  return {
    coordinates,
    coordinates3D: merged3D,
    distanceKm,
    elevationGain: Math.round(totalGain),
    elevationLoss: Math.round(totalLoss),
    elevationProfile,
    roadBreakdown,
    surfaceDistribution,
    difficulty,
    segments,
    durationMinutes,
    waypointsUsed: finalWaypoints,
    legs,
  };
}
