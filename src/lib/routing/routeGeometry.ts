export interface MidpointHandle {
  insertIndex: number;
  lat: number;
  lng: number;
}

/**
 * Calcule la distance euclidienne au carré (évite le coût CPU de Math.sqrt / Math.hypot)
 */
function distSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

/**
 * Calcule la position des poignées intermédiaires déplaçables (midpoint handles)
 * positionnées à mi-chemin de chaque tronçon calculé le long des sentiers réels.
 */
export function calculateMidpointHandles(
  waypoints: [number, number][], // [lon, lat]
  calculatedLatLngs: [number, number][], // [lat, lon]
  isLoop: boolean
): MidpointHandle[] {
  if (waypoints.length < 2 || calculatedLatLngs.length < 4) {
    return [];
  }

  const handles: MidpointHandle[] = [];
  const pairsCount = isLoop ? waypoints.length : waypoints.length - 1;
  const total = calculatedLatLngs.length;

  for (let i = 0; i < pairsCount; i++) {
    const fromWp = waypoints[i];
    const toWp = waypoints[(i + 1) % waypoints.length];

    // Recherche des indices de points calculés les plus proches des deux extrémités
    let closestFromIdx = 0;
    let minFromDistSq = Infinity;
    let closestToIdx = total - 1;
    let minToDistSq = Infinity;

    for (let cIdx = 0; cIdx < total; cIdx++) {
      const [cLat, cLng] = calculatedLatLngs[cIdx];
      const d1 = distSq(cLat, cLng, fromWp[1], fromWp[0]);
      if (d1 < minFromDistSq) {
        minFromDistSq = d1;
        closestFromIdx = cIdx;
      }
      const d2 = distSq(cLat, cLng, toWp[1], toWp[0]);
      if (d2 < minToDistSq) {
        minToDistSq = d2;
        closestToIdx = cIdx;
      }
    }

    let midLat = (fromWp[1] + toWp[1]) / 2;
    let midLng = (fromWp[0] + toWp[0]) / 2;

    // Positionne la poignée sur le sentier réel à mi-chemin le long de la trace sinueuse
    if (closestFromIdx !== closestToIdx) {
      let midIdx = 0;
      if (closestFromIdx <= closestToIdx) {
        midIdx = Math.floor((closestFromIdx + closestToIdx) / 2);
      } else {
        const span = (closestToIdx + total - closestFromIdx) % total;
        midIdx = (closestFromIdx + Math.floor(span / 2)) % total;
      }
      if (calculatedLatLngs[midIdx]) {
        midLat = calculatedLatLngs[midIdx][0];
        midLng = calculatedLatLngs[midIdx][1];
      }
    }

    handles.push({
      insertIndex: i + 1,
      lat: midLat,
      lng: midLng,
    });
  }

  return handles;
}

/**
 * Trouve l'index optimal d'insertion d'un nouveau waypoint entre les étapes existantes
 * lors d'un clic n'importe où sur la polyline.
 * Utilise la trace détaillée si disponible pour une précision chronologique parfaite.
 */
export function findClosestWaypointInsertIndex(
  waypoints: [number, number][], // [lon, lat]
  clickedLat: number,
  clickedLng: number,
  isLoop: boolean,
  detailedLatLngs?: [number, number][] // [lat, lon]
): number {
  if (waypoints.length < 2) return waypoints.length;

  // 1. Si on a le tracé détaillé (coordonnées sinueuses réelles), on projette le clic le long de la courbe
  if (detailedLatLngs && detailedLatLngs.length >= 4) {
    let closestDetailedIdx = 0;
    let minDetailDistSq = Infinity;
    const totalDetail = detailedLatLngs.length;

    for (let k = 0; k < totalDetail; k++) {
      const [dLat, dLng] = detailedLatLngs[k];
      const dSq = distSq(dLat, dLng, clickedLat, clickedLng);
      if (dSq < minDetailDistSq) {
        minDetailDistSq = dSq;
        closestDetailedIdx = k;
      }
    }

    // Trouver l'index dans le tracé détaillé de chaque waypoint
    const wpDetailedIndices: number[] = waypoints.map(([wLon, wLat]) => {
      let bestIdx = 0;
      let minDistSq = Infinity;
      for (let k = 0; k < totalDetail; k++) {
        const [dLat, dLng] = detailedLatLngs[k];
        const dSq = distSq(dLat, dLng, wLat, wLon);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestIdx = k;
        }
      }
      return bestIdx;
    });

    const count = isLoop ? waypoints.length : waypoints.length - 1;
    for (let i = 0; i < count; i++) {
      const idxA = wpDetailedIndices[i];
      const idxB = wpDetailedIndices[(i + 1) % waypoints.length];

      if (idxA <= idxB) {
        if (closestDetailedIdx >= idxA && closestDetailedIdx <= idxB) {
          return i + 1;
        }
      } else {
        // En cas de boucle traversant la jonction fin/début
        if (closestDetailedIdx >= idxA || closestDetailedIdx <= idxB) {
          return i + 1;
        }
      }
    }
  }

  // 2. Méthode géométrique de secours par projection sur les segments
  let bestInsertIndex = waypoints.length;
  let minDistanceSq = Infinity;

  const count = isLoop ? waypoints.length : waypoints.length - 1;
  for (let i = 0; i < count; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[(i + 1) % waypoints.length];
    const midLat = (p1[1] + p2[1]) / 2;
    const midLng = (p1[0] + p2[0]) / 2;
    const dSq = distSq(clickedLat, clickedLng, midLat, midLng);
    if (dSq < minDistanceSq) {
      minDistanceSq = dSq;
      bestInsertIndex = i + 1;
    }
  }

  return bestInsertIndex;
}
