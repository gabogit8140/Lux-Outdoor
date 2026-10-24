import L from 'leaflet';

export interface DirectionArrow {
  position: [number, number]; // [lat, lng]
  bearing: number;
}

/**
 * Calcule le cap géographique (bearing) en degrés [0, 360[ entre deux coordonnées GPS.
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * rad) * Math.cos(lat2 * rad);
  const x =
    Math.cos(lat1 * rad) * Math.sin(lat2 * rad) -
    Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lon2 - lon1) * rad);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

/**
 * Calcule la distance approximative en mètres entre deux coordonnées (projection équirectangulaire)
 */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
  const y = (lat2 - lat1) * rad;
  return Math.sqrt(x * x + y * y) * R;
}

/**
 * Génère des flèches directionnelles réparties harmonieusement le long du tracé sélectionné.
 * Réagit instantanément au sens de parcours : quand le circuit est inversé, les flèches
 * pivotent automatiquement de 180° pour indiquer le sens de marche ou de pédalage.
 */
export function computeDirectionArrows(
  positions: [number, number][] | [number, number][][],
  targetIntervalMeters: number = 800
): DirectionArrow[] {
  const coords: [number, number][] = Array.isArray(positions[0]?.[0])
    ? (positions as [number, number][][]).flat()
    : (positions as [number, number][]);

  if (!coords || coords.length < 2) return [];

  const cumulativeDistances: number[] = [0];
  let totalDistance = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = distanceMeters(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    totalDistance += d;
    cumulativeDistances.push(totalDistance);
  }

  // Circuits trop courts (moins de 200m)
  if (totalDistance < 200) return [];

  // Nombre de flèches échelonnées selon la longueur (entre 4 et 28 flèches)
  const count = Math.max(4, Math.min(28, Math.floor(totalDistance / targetIntervalMeters)));
  const interval = totalDistance / (count + 1);

  const arrows: DirectionArrow[] = [];

  for (let step = 1; step <= count; step++) {
    const targetDist = step * interval;

    let segIdx = 0;
    while (
      segIdx < cumulativeDistances.length - 1 &&
      cumulativeDistances[segIdx + 1] < targetDist
    ) {
      segIdx++;
    }

    if (segIdx >= coords.length - 1) break;

    const p1 = coords[segIdx];
    const p2 = coords[segIdx + 1];

    // Calcul du cap en avant sur une fenêtre minimale de 20m pour éviter les micro-bruits GPS
    let forwardIdx = segIdx + 1;
    while (
      forwardIdx < coords.length - 1 &&
      cumulativeDistances[forwardIdx] - cumulativeDistances[segIdx] < 20
    ) {
      forwardIdx++;
    }
    const pAhead = coords[forwardIdx];

    const bearing = calculateBearing(p1[0], p1[1], pAhead[0], pAhead[1]);

    // Position exacte interpolée
    const segLen = cumulativeDistances[segIdx + 1] - cumulativeDistances[segIdx];
    const t = segLen > 0 ? (targetDist - cumulativeDistances[segIdx]) / segLen : 0;
    const arrowLat = p1[0] + (p2[0] - p1[0]) * t;
    const arrowLng = p1[1] + (p2[1] - p1[1]) * t;

    arrows.push({
      position: [arrowLat, arrowLng],
      bearing: Math.round(bearing),
    });
  }

  return arrows;
}

/**
 * Crée l'icône Leaflet SVG d'un chevron directionnel haute lisibilité
 */
export function createDirectionArrowIcon(bearing: number, fillColor: string = '#ffffff'): L.DivIcon {
  return L.divIcon({
    className: 'route-direction-arrow-marker',
    html: `
      <div style="transform: rotate(${Math.round(bearing)}deg); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
        <svg viewBox="0 0 24 24" width="18" height="18" style="filter: drop-shadow(0 2px 4px rgba(15,23,42,0.65));">
          <path d="M12 2.5 L21 18.5 L12 14 L3 18.5 Z" fill="${fillColor}" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
