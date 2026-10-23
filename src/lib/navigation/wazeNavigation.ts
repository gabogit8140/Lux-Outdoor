/**
 * Utilitaires pour le guidage routier vers le point de départ d'une trace via Waze.
 */
import type { RouteSuggestions, RouteTrace } from '../../types';

/**
 * Ouvre l'application Waze (sur smartphone iOS/Android via Deep Link) ou l'interface web Waze (sur PC)
 * avec guidage GPS directement initié vers les coordonnées cibles du point de départ.
 */
export function openWazeNavigation(lat: number, lng: number): void {
  // Deep link universel Waze avec paramètre navigate=yes
  const wazeUrl = `https://www.waze.com/ul?ll=${lat.toFixed(6)},${lng.toFixed(6)}&navigate=yes`;
  window.open(wazeUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Extrait les coordonnées du point de départ d'une trace ou d'une route au format [latitude, longitude].
 */
export function getRouteStartCoordinates(
  route?: RouteSuggestions | null,
  trace?: RouteTrace | null
): [number, number] | null {
  if (trace?.coordinates && trace.coordinates.length > 0) {
    const first = trace.coordinates[0];
    if (Array.isArray(first[0])) {
      const seg = first as unknown as [number, number][];
      if (seg.length > 0) return [seg[0][1], seg[0][0]];
    } else {
      const pt = first as [number, number];
      return [pt[1], pt[0]];
    }
  }
  if (route?.waypoints && route.waypoints.length > 0) {
    return [route.waypoints[0][1], route.waypoints[0][0]];
  }
  return null;
}

/**
 * Calcule la distance à vol d'oiseau (formule de Haversine) entre deux coordonnées GPS en kilomètres.
 */
export function calculateDistanceKm(
  coord1: [number, number], // [lat, lng]
  coord2: [number, number]  // [lat, lng]
): number {
  const R = 6371; // Rayon moyen de la Terre en km
  const lat1 = (coord1[0] * Math.PI) / 180;
  const lat2 = (coord2[0] * Math.PI) / 180;
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formate la distance routière estimée de manière conviviale.
 */
export function formatDriveDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}
