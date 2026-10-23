/**
 * navigationMath.ts
 * Algorithmes géométriques purs, 100% locaux, 0 réseau, 0 API.
 * - Distance haversine
 * - Relèvement (bearing) et différence angulaire
 * - Projection orthogonale du GPS sur un segment de polyligne
 * - Recherche du point le plus proche sur le parcours (Cross-Track Error)
 * - Détection des manœuvres (virages, bifurcations, arrivée)
 */

export interface Point2D {
  lon: number;
  lat: number;
}

export interface ProjectedPoint {
  nearestPoint: [number, number]; // [lon, lat]
  segmentIndex: number; // index i du segment [i, i+1]
  distanceToTrackMeters: number; // cross-track error
  progressDistanceMeters: number; // distance parcourue le long de la trace jusqu'au point projeté
  progressRatio: number; // 0..1
}

export interface NavigationManeuver {
  index: number;
  distanceFromUserMeters: number;
  instructionType: 'depart' | 'straight' | 'slight-left' | 'left' | 'sharp-left' | 'slight-right' | 'right' | 'sharp-right' | 'u-turn' | 'arrivee';
  title: string;
  detail: string;
  coordinate: [number, number]; // [lon, lat]
}

const R = 6371000; // Rayon terrestre en mètres

/**
 * Distance Haversine exacte en mètres entre deux coordonnées [lon, lat]
 */
export function distanceMeters(p1: [number, number], p2: [number, number]): number {
  const lon1 = (p1[0] * Math.PI) / 180;
  const lat1 = (p1[1] * Math.PI) / 180;
  const lon2 = (p2[0] * Math.PI) / 180;
  const lat2 = (p2[1] * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcule le relèvement (bearing en degrés 0..360) du point p1 vers p2
 */
export function calculateBearing(p1: [number, number], p2: [number, number]): number {
  const lon1 = (p1[0] * Math.PI) / 180;
  const lat1 = (p1[1] * Math.PI) / 180;
  const lon2 = (p2[0] * Math.PI) / 180;
  const lat2 = (p2[1] * Math.PI) / 180;

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Projette un point p [lon, lat] sur un segment [a, b].
 * Retourne le point projeté le plus proche et la distance en mètres.
 */
export function projectPointOnSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { point: [number, number]; distMeters: number; t: number } {
  const dAB = distanceMeters(a, b);
  if (dAB < 0.1) {
    return { point: a, distMeters: distanceMeters(p, a), t: 0 };
  }

  // Projection planaire locale équirectangulaire très précise pour des échelles de randonnée
  const cosLat = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const ax = a[0] * cosLat;
  const ay = a[1];
  const bx = b[0] * cosLat;
  const by = b[1];
  const px = p[0] * cosLat;
  const py = p[1];

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projLon = a[0] + t * (b[0] - a[0]);
  const projLat = a[1] + t * (b[1] - a[1]);
  const projPoint: [number, number] = [projLon, projLat];

  return {
    point: projPoint,
    distMeters: distanceMeters(p, projPoint),
    t,
  };
}

/**
 * Trouve la position la plus proche de l'utilisateur sur toute la polyligne de la trace.
 * Calcule l'écart latéral (Cross-Track Error) et la distance cumulée parcourue.
 */
export function projectOnTrack(
  userCoord: [number, number],
  trackCoords: [number, number][]
): ProjectedPoint {
  if (trackCoords.length < 2) {
    return {
      nearestPoint: trackCoords[0] || userCoord,
      segmentIndex: 0,
      distanceToTrackMeters: trackCoords[0] ? distanceMeters(userCoord, trackCoords[0]) : 0,
      progressDistanceMeters: 0,
      progressRatio: 0,
    };
  }

  // Pré-calcule les distances cumulées des sommets pour éviter les recalculs
  let minDistance = Infinity;
  let bestSegIndex = 0;
  let bestPoint: [number, number] = trackCoords[0];
  let bestT = 0;

  for (let i = 0; i < trackCoords.length - 1; i++) {
    const a = trackCoords[i];
    const b = trackCoords[i + 1];
    const proj = projectPointOnSegment(userCoord, a, b);

    if (proj.distMeters < minDistance) {
      minDistance = proj.distMeters;
      bestSegIndex = i;
      bestPoint = proj.point;
      bestT = proj.t;
    }
  }

  // Calcul de la distance cumulée jusqu'au point projeté
  let cumulativeDist = 0;
  for (let i = 0; i < bestSegIndex; i++) {
    cumulativeDist += distanceMeters(trackCoords[i], trackCoords[i + 1]);
  }
  cumulativeDist += distanceMeters(trackCoords[bestSegIndex], bestPoint);

  // Distance totale de la trace
  let totalTrackDist = cumulativeDist;
  for (let i = bestSegIndex + 1; i < trackCoords.length - 1; i++) {
    totalTrackDist += distanceMeters(trackCoords[i], trackCoords[i + 1]);
  }

  const ratio = totalTrackDist > 0 ? Math.min(1, cumulativeDist / totalTrackDist) : 0;

  return {
    nearestPoint: bestPoint,
    segmentIndex: bestSegIndex,
    distanceToTrackMeters: minDistance,
    progressDistanceMeters: cumulativeDist,
    progressRatio: ratio,
  };
}

/**
 * Détecte les manœuvres clés et virages le long du tracé restant à parcourir
 * à partir du point courant de l'utilisateur.
 */
export function findNextManeuver(
  currentSegmentIndex: number,
  userCoord: [number, number],
  trackCoords: [number, number][],
  minAngleThreshold = 25
): NavigationManeuver {
  const lastIndex = trackCoords.length - 1;

  // Si on est tout proche de la fin
  const distanceToEnd = distanceMeters(userCoord, trackCoords[lastIndex]);
  if (currentSegmentIndex >= lastIndex - 2 && distanceToEnd < 60) {
    return {
      index: lastIndex,
      distanceFromUserMeters: distanceToEnd,
      instructionType: 'arrivee',
      title: 'Arrivée',
      detail: 'Vous êtes arrivé au terme du parcours !',
      coordinate: trackCoords[lastIndex],
    };
  }

  // Scan les prochains sommets de la polyligne pour trouver le premier virage significatif
  let accumulatedDist = distanceMeters(userCoord, trackCoords[currentSegmentIndex + 1]);

  for (let i = currentSegmentIndex + 1; i < lastIndex - 1; i++) {
    const pPrev = trackCoords[i - 1];
    const pCurr = trackCoords[i];
    const pNext = trackCoords[i + 1];

    const bearingIn = calculateBearing(pPrev, pCurr);
    const bearingOut = calculateBearing(pCurr, pNext);

    let diff = bearingOut - bearingIn;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const absDiff = Math.abs(diff);

    if (absDiff >= minAngleThreshold) {
      let instructionType: NavigationManeuver['instructionType'] = 'straight';
      let title = 'Continuer';
      let detail = 'Suivre le sentier';

      if (diff > 120) {
        instructionType = 'u-turn';
        title = 'Demi-tour';
        detail = 'Virage très serré en épingle à droite';
      } else if (diff < -120) {
        instructionType = 'u-turn';
        title = 'Demi-tour';
        detail = 'Virage très serré en épingle à gauche';
      } else if (diff >= 65) {
        instructionType = 'right';
        title = 'Tourner à droite';
        detail = 'Bifurquer sur le sentier à droite';
      } else if (diff <= -65) {
        instructionType = 'left';
        title = 'Tourner à gauche';
        detail = 'Bifurquer sur le sentier à gauche';
      } else if (diff > 25) {
        instructionType = 'slight-right';
        title = 'Obliquer à droite';
        detail = 'Prendre la branche de droite';
      } else if (diff < -25) {
        instructionType = 'slight-left';
        title = 'Obliquer à gauche';
        detail = 'Prendre la branche de gauche';
      }

      return {
        index: i,
        distanceFromUserMeters: Math.round(accumulatedDist),
        instructionType,
        title,
        detail,
        coordinate: pCurr,
      };
    }

    accumulatedDist += distanceMeters(pCurr, pNext);
  }

  // Si aucun virage majeur avant la fin : continuer tout droit vers l'arrivée
  return {
    index: lastIndex,
    distanceFromUserMeters: Math.round(distanceToEnd),
    instructionType: 'straight',
    title: 'Continuer tout droit',
    detail: 'Rester sur le tracé balisé jusqu’à l’arrivée',
    coordinate: trackCoords[lastIndex],
  };
}

/**
 * Formate une distance en mètres lisible pour un écran de guidage terrain.
 * Ex: 35 m, 180 m, 1.4 km
 */
export function formatNavDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
