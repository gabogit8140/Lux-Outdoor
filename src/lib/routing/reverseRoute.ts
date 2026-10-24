import type { RouteTrace } from '../../types';

/**
 * Inverse proprement et intégralement une trace outdoor :
 * 1. Inverse les coordonnées GPS brutes (simples ou multi-segments)
 * 2. Inverse les tronçons routiers (voies vertes sans voiture / routes partagées)
 * 3. Inverse le profil altimétrique (altitudes et distances kilométriques)
 * 4. Met à jour les drapeaux isReversed et reverseKey pour la réactivité de l'UI
 */
export function reverseRouteTrace(trace: RouteTrace): RouteTrace {
  const coords = trace.coordinates;

  let reversedCoords: [number, number][] | [number, number][][];
  if (Array.isArray(coords[0]?.[0])) {
    reversedCoords = (coords as [number, number][][])
      .slice()
      .reverse()
      .map((seg) => seg.slice().reverse());
  } else {
    reversedCoords = (coords as [number, number][]).slice().reverse();
  }

  // Inverser également les segments routiers s'ils existent
  let reversedSegments = trace.segments;
  if (trace.segments && trace.segments.length > 0) {
    reversedSegments = trace.segments
      .slice()
      .reverse()
      .map((seg) => ({
        ...seg,
        coordinates: (seg.coordinates as [number, number][]).slice().reverse(),
      }));
  }

  // Inverser le profil altimétrique
  const totalDistKm = trace.distance / 1000;
  let reversedProfile = trace.elevationProfile;
  if (trace.elevationProfile && trace.elevationProfile.length > 0) {
    reversedProfile = trace.elevationProfile
      .slice()
      .reverse()
      .map((p) => ({
        ...p,
        elevation: p.elevation,
        distance: Number(Math.max(0, totalDistKm - p.distance).toFixed(1)),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  const isNowReversed = !Boolean((trace as any).isReversed);

  return {
    ...trace,
    coordinates: reversedCoords,
    elevationProfile: reversedProfile,
    segments: reversedSegments,
    isReversed: isNowReversed,
    reverseKey: Date.now(),
  } as RouteTrace;
}
