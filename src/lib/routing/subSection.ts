import type { RouteSuggestions, RouteTrace, ElevationPoint } from '../../types';
import { GAZETTEER, type PlaceEntry } from './gazetteer';

export interface RouteSubSection {
  startKm: number;
  endKm: number;
  totalRouteKm: number;
  subDistanceKm: number;
  subElevationGain: number;
  subDurationSeconds: number;
  startPlace: PlaceEntry | null;
  endPlace: PlaceEntry | null;
  subRoute: RouteSuggestions;
  subTrace: RouteTrace;
  beforePositions: [number, number][]; // [lat, lng] for Leaflet
  subPositions: [number, number][];    // [lat, lng] for Leaflet
  afterPositions: [number, number][];  // [lat, lng] for Leaflet
  startCoord: [number, number];        // [lon, lat]
  endCoord: [number, number];          // [lon, lat]
}

export function haversineDistanceMeters(c1: [number, number], c2: [number, number]): number {
  const R = 6371e3;
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180;
  const dLon = ((c2[0] - c1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((c1[1] * Math.PI) / 180) *
      Math.cos((c2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getFlatCoordinates(
  coords: [number, number][] | [number, number][][]
): [number, number][] {
  if (!coords || coords.length === 0) return [];
  if (Array.isArray(coords[0]) && Array.isArray((coords[0] as unknown[])[0])) {
    return (coords as [number, number][][]).flat();
  }
  return coords as [number, number][];
}

export function findNearestGazetteerPlace(
  coord: [number, number],
  maxDistKm = 25
): PlaceEntry | null {
  if (!coord || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') return null;
  let best: PlaceEntry | null = null;
  let minDistance = Infinity;

  for (const place of GAZETTEER) {
    const dist = haversineDistanceMeters(coord, place.coords);
    if (dist < minDistance) {
      minDistance = dist;
      best = place;
    }
  }

  if (best && minDistance <= maxDistKm * 1000) {
    return best;
  }
  return null;
}

export function getInterpolatedElevation(
  profile: ElevationPoint[],
  targetDistKm: number
): number {
  if (!profile || profile.length === 0) return 250;
  if (profile.length === 1) return profile[0].elevation;
  if (targetDistKm <= profile[0].distance) return profile[0].elevation;
  if (targetDistKm >= profile[profile.length - 1].distance) {
    return profile[profile.length - 1].elevation;
  }

  for (let i = 0; i < profile.length - 1; i++) {
    const p1 = profile[i];
    const p2 = profile[i + 1];
    if (targetDistKm >= p1.distance && targetDistKm <= p2.distance) {
      const span = p2.distance - p1.distance;
      if (span === 0) return p1.elevation;
      const t = (targetDistKm - p1.distance) / span;
      return Math.round(p1.elevation + t * (p2.elevation - p1.elevation));
    }
  }
  return profile[0].elevation;
}

/**
 * Extracts a sub-section from a route and trace between startKm and endKm
 */
export function extractRouteSubSection(
  route: RouteSuggestions,
  trace: RouteTrace,
  rawStartKm: number,
  rawEndKm: number
): RouteSubSection | null {
  const flatCoords = getFlatCoordinates(trace.coordinates);
  if (!flatCoords || flatCoords.length < 2) return null;

  // Compute cumulative distances along flatCoords
  const cumDistMeters: number[] = [0];
  let totalMeters = 0;
  for (let i = 0; i < flatCoords.length - 1; i++) {
    const d = haversineDistanceMeters(flatCoords[i], flatCoords[i + 1]);
    totalMeters += d;
    cumDistMeters.push(totalMeters);
  }

  const totalRouteKm = Math.max(0.1, totalMeters / 1000);
  const clampedStartKm = Math.max(0, Math.min(rawStartKm, totalRouteKm - 0.2));
  const clampedEndKm = Math.min(totalRouteKm, Math.max(clampedStartKm + 0.2, rawEndKm));

  const targetStartM = clampedStartKm * 1000;
  const targetEndM = clampedEndKm * 1000;

  // Find slice indices
  let startIndex = 0;
  for (let i = 0; i < cumDistMeters.length; i++) {
    if (cumDistMeters[i] >= targetStartM) {
      startIndex = i;
      break;
    }
  }

  let endIndex = cumDistMeters.length - 1;
  for (let i = startIndex; i < cumDistMeters.length; i++) {
    if (cumDistMeters[i] >= targetEndM) {
      endIndex = i;
      break;
    }
  }

  if (endIndex <= startIndex) {
    endIndex = Math.min(cumDistMeters.length - 1, startIndex + 1);
  }

  // Sliced coordinates
  const beforeCoords = flatCoords.slice(0, startIndex + 1);
  const subCoords = flatCoords.slice(startIndex, endIndex + 1);
  const afterCoords = flatCoords.slice(endIndex);

  const toLeaflet = (c: [number, number]): [number, number] => [c[1], c[0]];
  const beforePositions = beforeCoords.map(toLeaflet);
  const subPositions = subCoords.map(toLeaflet);
  const afterPositions = afterCoords.map(toLeaflet);

  const subDistanceMeters = Math.max(10, cumDistMeters[endIndex] - cumDistMeters[startIndex]);
  const subDistanceKm = Number((subDistanceMeters / 1000).toFixed(1));

  // Sub-elevation profile
  const subProfile: ElevationPoint[] = [];
  const numProfilePoints = Math.max(15, Math.min(50, Math.round(subDistanceKm * 2)));

  if (trace.elevationProfile && trace.elevationProfile.length > 0) {
    for (let i = 0; i < numProfilePoints; i++) {
      const relDist = (i / (numProfilePoints - 1)) * (clampedEndKm - clampedStartKm);
      const absDist = clampedStartKm + relDist;
      const ele = getInterpolatedElevation(trace.elevationProfile, absDist);
      subProfile.push({
        distance: Number(relDist.toFixed(2)),
        elevation: ele,
        slope: 0,
      });
    }
  }

  // Calculate elevation gain (D+)
  let subElevationGain = 0;
  if (subProfile.length > 1) {
    let sumGain = 0;
    for (let i = 1; i < subProfile.length; i++) {
      const diff = subProfile[i].elevation - subProfile[i - 1].elevation;
      if (diff > 0) sumGain += diff;
    }
    subElevationGain = Math.round(sumGain);
  }
  if (subElevationGain === 0) {
    subElevationGain = Math.round(
      (route.elevationGain || 0) * (subDistanceMeters / Math.max(1, totalMeters))
    );
  }

  const subDurationSeconds = Math.round(
    (trace.duration || 3600) * (subDistanceMeters / Math.max(1, totalMeters))
  );

  const startCoord = subCoords[0];
  const endCoord = subCoords[subCoords.length - 1];

  const startPlace = findNearestGazetteerPlace(startCoord);
  const endPlace = findNearestGazetteerPlace(endCoord);

  let sectionTitle = route.title;
  if (startPlace && endPlace && startPlace.name !== endPlace.name) {
    sectionTitle = `${route.title} (${startPlace.name} ➔ ${endPlace.name})`;
  } else if (startPlace) {
    sectionTitle = `${route.title} (Depuis ${startPlace.name}, km ${clampedStartKm.toFixed(0)} - ${clampedEndKm.toFixed(0)})`;
  } else {
    sectionTitle = `${route.title} (Tronçon km ${clampedStartKm.toFixed(0)} – ${clampedEndKm.toFixed(0)})`;
  }

  const minElevation =
    subProfile.length > 0
      ? Math.min(...subProfile.map((p) => p.elevation))
      : route.minElevation ?? 250;
  const maxElevation =
    subProfile.length > 0
      ? Math.max(...subProfile.map((p) => p.elevation))
      : route.maxElevation ?? 400;

  const subRoute: RouteSuggestions = {
    ...route,
    id: `${route.id}-sub-${Math.round(clampedStartKm)}-${Math.round(clampedEndKm)}`,
    title: sectionTitle,
    description: `Tronçon actif de ${subDistanceKm} km (${clampedStartKm.toFixed(1)} km ➔ ${clampedEndKm.toFixed(1)} km) sur l'itinéraire officiel "${route.title}".`,
    elevationGain: subElevationGain,
    minElevation,
    maxElevation,
    waypoints: [startCoord, endCoord],
  };

  const subTrace: RouteTrace = {
    distance: subDistanceMeters,
    duration: subDurationSeconds,
    coordinates: subCoords,
    elevationProfile: subProfile,
  };

  return {
    startKm: clampedStartKm,
    endKm: clampedEndKm,
    totalRouteKm,
    subDistanceKm,
    subElevationGain,
    subDurationSeconds,
    startPlace,
    endPlace,
    subRoute,
    subTrace,
    beforePositions,
    subPositions,
    afterPositions,
    startCoord,
    endCoord,
  };
}
