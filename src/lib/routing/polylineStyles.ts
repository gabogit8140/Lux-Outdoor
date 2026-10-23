import type { PathOptions } from 'leaflet';

export const ROAD_COLORS = {
  carFree: '#059669', // Emerald Green (Nature paths, protected cycleways, 0-car ways)
  sharedRoad: '#ea580c', // Orange (Open traffic roads shared with motor vehicles)
} as const;

export const ROAD_DASH_PATTERNS = {
  carFree: undefined,
  sharedRoad: '10, 7',
} as const;

/**
 * Fournit les options graphiques Leaflet pour le halo blanc contrasté
 * placé sous la trace pour la détacher parfaitement du fond de carte.
 */
export function getHaloUnderlayPathOptions(overrides?: Partial<PathOptions>): PathOptions {
  return {
    color: '#ffffff',
    weight: 11,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: false,
    ...overrides,
  };
}

/**
 * Fournit les options graphiques Leaflet pour un tronçon de trace selon son type de voie.
 */
export function getRoadSegmentPathOptions(
  isCarFree: boolean,
  overrides?: Partial<PathOptions>
): PathOptions {
  return {
    color: isCarFree ? ROAD_COLORS.carFree : ROAD_COLORS.sharedRoad,
    weight: 6.5,
    opacity: 1,
    dashArray: isCarFree ? ROAD_DASH_PATTERNS.carFree : ROAD_DASH_PATTERNS.sharedRoad,
    lineCap: 'round',
    lineJoin: 'round',
    interactive: true,
    ...overrides,
  };
}

/**
 * Fournit le libellé textuel et la pastille de couleur pour les infobulles de voirie.
 */
export function getRoadSegmentBadge(isCarFree: boolean, activity: 'bike' | 'hike') {
  return {
    isCarFree,
    dotColor: isCarFree ? '#10b981' : '#fb923c',
    dotBgClass: isCarFree ? 'bg-emerald-400' : 'bg-orange-400',
    title: isCarFree
      ? activity === 'hike'
        ? '🌿 Sentier 0 voiture'
        : '🌿 Voie sans voiture'
      : '🚗 Route ouverte aux voitures',
  };
}
