export interface MidpointHandle {
  insertIndex: number;
  lat: number;
  lng: number;
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

  for (let i = 0; i < pairsCount; i++) {
    const fromWp = waypoints[i];
    const toWp = waypoints[(i + 1) % waypoints.length];

    // Recherche des indices de points calculés les plus proches des deux extrémités
    let closestFromIdx = 0;
    let minFromDist = Infinity;
    let closestToIdx = calculatedLatLngs.length - 1;
    let minToDist = Infinity;

    for (let cIdx = 0; cIdx < calculatedLatLngs.length; cIdx++) {
      const [cLat, cLng] = calculatedLatLngs[cIdx];
      const d1 = Math.hypot(cLat - fromWp[1], cLng - fromWp[0]);
      if (d1 < minFromDist) {
        minFromDist = d1;
        closestFromIdx = cIdx;
      }
      const d2 = Math.hypot(cLat - toWp[1], cLng - toWp[0]);
      if (d2 < minToDist) {
        minToDist = d2;
        closestToIdx = cIdx;
      }
    }

    let midLat = (fromWp[1] + toWp[1]) / 2;
    let midLng = (fromWp[0] + toWp[0]) / 2;

    // Positionne la poignée sur le sentier réel à mi-chemin le long de la trace sinueuse
    if (closestFromIdx !== closestToIdx) {
      const total = calculatedLatLngs.length;
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
 */
export function findClosestWaypointInsertIndex(
  waypoints: [number, number][], // [lon, lat]
  clickedLat: number,
  clickedLng: number,
  isLoop: boolean
): number {
  if (waypoints.length < 2) return waypoints.length;

  let bestInsertIndex = waypoints.length;
  let minDistance = Infinity;

  const count = isLoop ? waypoints.length : waypoints.length - 1;
  for (let i = 0; i < count; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[(i + 1) % waypoints.length];
    const midLat = (p1[1] + p2[1]) / 2;
    const midLng = (p1[0] + p2[0]) / 2;
    const dist = Math.hypot(clickedLat - midLat, clickedLng - midLng);
    if (dist < minDistance) {
      minDistance = dist;
      bestInsertIndex = i + 1;
    }
  }

  return bestInsertIndex;
}
