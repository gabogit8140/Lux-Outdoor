import type { RoutedLegResult } from './segmentRouter';

export interface MidpointHandle {
  insertIndex: number;
  segmentIndex: number;
  lat: number;
  lng: number;
}

export interface ClosestSegmentProjection {
  insertIndex: number;
  segmentIndex: number;
  snappedLat: number;
  snappedLng: number;
  distanceMeters: number;
}

export interface SegmentOrderAnomaly {
  waypointIndex: number;
  type: 'backtrack' | 'crossing';
  description: string;
  swapWithIndex: number;
}

/**
 * Calcule la distance euclidienne au carré avec correction de latitude (cos(lat))
 */
function distSqCorrected(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const cosLat = Math.cos(((lat1 + lat2) * 0.5 * Math.PI) / 180);
  const dLat = lat1 - lat2;
  const dLng = (lng1 - lng2) * cosLat;
  return dLat * dLat + dLng * dLng;
}

/**
 * Distance approximative en mètres entre deux points [lat, lng]
 */
export function approxDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return Math.sqrt(distSqCorrected(lat1, lng1, lat2, lng2)) * 111132;
}

/**
 * Projette orthogonalement un point (lat, lng) sur un segment [A, B]
 */
function projectPointOnSegmentLatLng(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): { projLat: number; projLng: number; distSq: number; t: number } {
  const cosLat = Math.cos((pLat * Math.PI) / 180);
  const dx = (bLng - aLng) * cosLat;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 1e-14) {
    const px = (pLng - aLng) * cosLat;
    const py = pLat - aLat;
    t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
  }

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);
  const distSq = distSqCorrected(pLat, pLng, projLat, projLng);

  return { projLat, projLng, distSq, t };
}

/**
 * Calcule le cosinus de l'angle de déviation au point P dans la séquence A -> P -> B.
 * - Proche de +1 : progression fluide vers l'avant (0° de déviation)
 * - Proche de -1 : rebroussement / inversion à 180° (A -> P revient sur A)
 */
function computeFlowCosine(
  a: [number, number], // [lon, lat]
  p: [number, number], // [lon, lat]
  b: [number, number] // [lon, lat]
): number {
  const cosLat = Math.cos((p[1] * Math.PI) / 180);
  const v1x = (p[0] - a[0]) * cosLat;
  const v1y = p[1] - a[1];
  const v2x = (b[0] - p[0]) * cosLat;
  const v2y = b[1] - p[1];

  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 < 1e-7 || len2 < 1e-7) return 1;

  return (v1x * v2x + v1y * v2y) / (len1 * len2);
}

/**
 * Vérifie si l'insertion d'un point P dans le segment `segIdx` (entre W[segIdx] et W[segIdx+1])
 * crée une inversion topologique avec le segment précédent ou suivant, et retourne le meilleur index de segment.
 */
function refineSegmentIndexAgainstInversion(
  waypoints: [number, number][],
  candidateSegIdx: number,
  clickedLat: number,
  clickedLng: number,
  isLoop: boolean
): number {
  const n = waypoints.length;
  if (n < 3) return candidateSegIdx;

  const totalSegs = isLoop ? n : n - 1;
  const p: [number, number] = [clickedLng, clickedLat];

  // Évalue le coût d'insertion (surcoût de détour + pénalité d'angle de rebroussement aux bornes)
  const evaluateSegmentInsertionCost = (sIdx: number): number => {
    const wA = waypoints[sIdx % n];
    const wB = waypoints[(sIdx + 1) % n];

    const dAB = approxDistanceMeters(wA[1], wA[0], wB[1], wB[0]);
    const dAP = approxDistanceMeters(wA[1], wA[0], clickedLat, clickedLng);
    const dPB = approxDistanceMeters(clickedLat, clickedLng, wB[1], wB[0]);
    const detourMeters = Math.max(0, dAP + dPB - dAB);

    let turnBackPenalty = 0;

    // Vérifie si W_prev -> wA -> P fait un demi-tour brutal (P est en réalité avant wA)
    const hasPrev = isLoop || sIdx > 0;
    if (hasPrev) {
      const wPrev = waypoints[(sIdx - 1 + n) % n];
      const cosAtA = computeFlowCosine(wPrev, wA, p);
      if (cosAtA < -0.65) {
        // Angle de rebroussement > 130° : forte pénalité d'inversion
        turnBackPenalty += Math.abs(cosAtA) * 650;
      }
    }

    // Vérifie si P -> wB -> W_next fait un demi-tour brutal (P est en réalité après wB)
    const hasNext = isLoop || sIdx + 1 < n - 1;
    if (hasNext) {
      const wNext = waypoints[(sIdx + 2) % n];
      const cosAtB = computeFlowCosine(p, wB, wNext);
      if (cosAtB < -0.65) {
        turnBackPenalty += Math.abs(cosAtB) * 650;
      }
    }

    return detourMeters + turnBackPenalty;
  };

  const baseCost = evaluateSegmentInsertionCost(candidateSegIdx);

  // Compare avec le segment précédent et le segment suivant
  const neighbors: number[] = [];
  if (candidateSegIdx > 0) neighbors.push(candidateSegIdx - 1);
  else if (isLoop) neighbors.push(totalSegs - 1);

  if (candidateSegIdx + 1 < totalSegs) neighbors.push(candidateSegIdx + 1);
  else if (isLoop) neighbors.push(0);

  let bestSegIdx = candidateSegIdx;
  let bestCost = baseCost;

  for (const adjIdx of neighbors) {
    // On ne bascule sur le segment voisin que si la pénalité d'inversion est nettement réduite
    const adjCost = evaluateSegmentInsertionCost(adjIdx) + 80; // Hystérésis de 80m en faveur du segment touché
    if (adjCost < bestCost) {
      bestCost = adjCost;
      bestSegIdx = adjIdx;
    }
  }

  return bestSegIdx;
}

/**
 * Calcule la position des poignées intermédiaires déplaçables (midpoint handles)
 * positionnées exactement à mi-distance curviligne de chaque segment.
 */
export function calculateMidpointHandles(
  waypoints: [number, number][], // [lon, lat]
  calculatedLatLngs: [number, number][], // [lat, lon]
  isLoop: boolean,
  legs?: RoutedLegResult[]
): MidpointHandle[] {
  if (waypoints.length < 2) {
    return [];
  }

  if (legs && legs.length > 0) {
    return legs.map((leg, segIdx) => {
      const coords = leg.coordinates;
      if (!coords || coords.length === 0) {
        const fromWp = waypoints[segIdx % waypoints.length];
        const toWp = waypoints[(segIdx + 1) % waypoints.length];
        return {
          insertIndex: segIdx + 1,
          segmentIndex: segIdx,
          lat: (fromWp[1] + toWp[1]) / 2,
          lng: (fromWp[0] + toWp[0]) / 2,
        };
      }
      if (coords.length === 1) {
        return {
          insertIndex: segIdx + 1,
          segmentIndex: segIdx,
          lat: coords[0][1],
          lng: coords[0][0],
        };
      }

      const cumDist: number[] = [0];
      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        total += approxDistanceMeters(
          coords[i - 1][1],
          coords[i - 1][0],
          coords[i][1],
          coords[i][0]
        );
        cumDist.push(total);
      }

      const halfDist = total * 0.5;
      let midLat = coords[Math.floor(coords.length / 2)][1];
      let midLng = coords[Math.floor(coords.length / 2)][0];

      for (let i = 0; i < coords.length - 1; i++) {
        if (cumDist[i + 1] >= halfDist) {
          const span = cumDist[i + 1] - cumDist[i];
          const t = span > 0 ? (halfDist - cumDist[i]) / span : 0.5;
          midLng = coords[i][0] + t * (coords[i + 1][0] - coords[i][0]);
          midLat = coords[i][1] + t * (coords[i + 1][1] - coords[i][1]);
          break;
        }
      }

      return {
        insertIndex: segIdx + 1,
        segmentIndex: segIdx,
        lat: midLat,
        lng: midLng,
      };
    });
  }

  if (calculatedLatLngs.length < 4) {
    return [];
  }

  const handles: MidpointHandle[] = [];
  const pairsCount = isLoop ? waypoints.length : waypoints.length - 1;
  const total = calculatedLatLngs.length;

  let searchStartIdx = 0;
  const wpIndices: number[] = waypoints.map(([wLon, wLat], wIdx) => {
    if (wIdx === 0) return 0;
    let bestIdx = searchStartIdx;
    let minD = Infinity;
    for (let cIdx = searchStartIdx; cIdx < total; cIdx++) {
      const [cLat, cLng] = calculatedLatLngs[cIdx];
      const d = distSqCorrected(cLat, cLng, wLat, wLon);
      if (d < minD) {
        minD = d;
        bestIdx = cIdx;
      }
    }
    searchStartIdx = Math.max(searchStartIdx, bestIdx);
    return bestIdx;
  });

  for (let i = 0; i < pairsCount; i++) {
    const fromWp = waypoints[i];
    const toWp = waypoints[(i + 1) % waypoints.length];
    const idxA = wpIndices[i];
    const idxB =
      i === waypoints.length - 1 && isLoop ? total - 1 : wpIndices[(i + 1) % waypoints.length];

    let midLat = (fromWp[1] + toWp[1]) / 2;
    let midLng = (fromWp[0] + toWp[0]) / 2;

    if (idxB > idxA) {
      const midIdx = Math.floor((idxA + idxB) / 2);
      if (calculatedLatLngs[midIdx]) {
        midLat = calculatedLatLngs[midIdx][0];
        midLng = calculatedLatLngs[midIdx][1];
      }
    }

    handles.push({
      insertIndex: i + 1,
      segmentIndex: i,
      lat: midLat,
      lng: midLng,
    });
  }

  return handles;
}

/**
 * Projette un toucher/clic n'importe où sur la trace ou à proximité sur le segment exact correspondant,
 * avec vérification directionnelle anti-inversion pour éviter d'intervertir deux segments consécutifs.
 */
export function projectPointOntoRouteSegments(
  waypoints: [number, number][], // [lon, lat]
  clickedLat: number,
  clickedLng: number,
  isLoop: boolean,
  detailedLatLngs?: [number, number][], // [lat, lon]
  legs?: RoutedLegResult[]
): ClosestSegmentProjection {
  if (waypoints.length < 2) {
    return {
      insertIndex: waypoints.length,
      segmentIndex: 0,
      snappedLat: clickedLat,
      snappedLng: clickedLng,
      distanceMeters: 0,
    };
  }

  // 1. Recherche directe par segment dans `legs` avec arbitrage anti-inversion aux jonctions
  if (legs && legs.length > 0) {
    let bestSegIdx = 0;
    let bestDistSq = Infinity;
    let bestLat = clickedLat;
    let bestLng = clickedLng;

    for (let sIdx = 0; sIdx < legs.length; sIdx++) {
      const coords = legs[sIdx].coordinates;
      if (!coords || coords.length < 2) continue;

      for (let k = 0; k < coords.length - 1; k++) {
        const a = coords[k];
        const b = coords[k + 1];
        const proj = projectPointOnSegmentLatLng(
          clickedLat,
          clickedLng,
          a[1],
          a[0],
          b[1],
          b[0]
        );
        if (proj.distSq < bestDistSq) {
          bestDistSq = proj.distSq;
          bestSegIdx = sIdx;
          bestLat = proj.projLat;
          bestLng = proj.projLng;
        }
      }
    }

    const distMeters = Math.sqrt(bestDistSq) * 111132;
    // Si le clic est à l'écart de la trace (> 35m) ou proche d'une ancre, vérifie qu'il n'inverse pas 2 segments
    const refinedSegIdx =
      distMeters > 35
        ? refineSegmentIndexAgainstInversion(
            waypoints,
            bestSegIdx,
            clickedLat,
            clickedLng,
            isLoop
          )
        : bestSegIdx;

    return {
      insertIndex: refinedSegIdx + 1,
      segmentIndex: refinedSegIdx,
      snappedLat: bestLat,
      snappedLng: bestLng,
      distanceMeters: distMeters,
    };
  }

  // 2. Si on a la polyligne détaillée [lat, lon]
  if (detailedLatLngs && detailedLatLngs.length >= 2) {
    const totalDetail = detailedLatLngs.length;
    let bestDetailIdx = 0;
    let bestDistSq = Infinity;
    let bestLat = clickedLat;
    let bestLng = clickedLng;

    for (let k = 0; k < totalDetail - 1; k++) {
      const [aLat, aLng] = detailedLatLngs[k];
      const [bLat, bLng] = detailedLatLngs[k + 1];
      const proj = projectPointOnSegmentLatLng(
        clickedLat,
        clickedLng,
        aLat,
        aLng,
        bLat,
        bLng
      );
      if (proj.distSq < bestDistSq) {
        bestDistSq = proj.distSq;
        bestDetailIdx = k;
        bestLat = proj.projLat;
        bestLng = proj.projLng;
      }
    }

    let searchFrom = 0;
    const wpDetailedIndices: number[] = waypoints.map(([wLon, wLat], idx) => {
      if (idx === 0) return 0;
      let bestIdx = searchFrom;
      let minDistSq = Infinity;
      for (let k = searchFrom; k < totalDetail; k++) {
        const [dLat, dLng] = detailedLatLngs[k];
        const dSq = distSqCorrected(dLat, dLng, wLat, wLon);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestIdx = k;
        }
      }
      searchFrom = Math.max(searchFrom, bestIdx);
      return bestIdx;
    });

    const count = isLoop ? waypoints.length : waypoints.length - 1;
    for (let i = 0; i < count; i++) {
      const idxA = wpDetailedIndices[i];
      const idxB =
        i === waypoints.length - 1 && isLoop
          ? totalDetail - 1
          : wpDetailedIndices[(i + 1) % waypoints.length];

      if (bestDetailIdx >= idxA && bestDetailIdx <= idxB) {
        const distMeters = Math.sqrt(bestDistSq) * 111132;
        const refinedSegIdx =
          distMeters > 35
            ? refineSegmentIndexAgainstInversion(
                waypoints,
                i,
                clickedLat,
                clickedLng,
                isLoop
              )
            : i;
        return {
          insertIndex: refinedSegIdx + 1,
          segmentIndex: refinedSegIdx,
          snappedLat: bestLat,
          snappedLng: bestLng,
          distanceMeters: distMeters,
        };
      }
    }
  }

  // 3. Projection orthogonale directe sur les segments reliant les waypoints + anti-inversion
  let bestSegIdx = Math.max(0, waypoints.length - 2);
  let minDistanceSq = Infinity;
  let bestLat = clickedLat;
  let bestLng = clickedLng;

  const count = isLoop ? waypoints.length : waypoints.length - 1;
  for (let i = 0; i < count; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[(i + 1) % waypoints.length];
    const proj = projectPointOnSegmentLatLng(
      clickedLat,
      clickedLng,
      p1[1],
      p1[0],
      p2[1],
      p2[0]
    );
    if (proj.distSq < minDistanceSq) {
      minDistanceSq = proj.distSq;
      bestSegIdx = i;
      bestLat = proj.projLat;
      bestLng = proj.projLng;
    }
  }

  const refinedSegIdx = refineSegmentIndexAgainstInversion(
    waypoints,
    bestSegIdx,
    clickedLat,
    clickedLng,
    isLoop
  );

  return {
    insertIndex: refinedSegIdx + 1,
    segmentIndex: refinedSegIdx,
    snappedLat: bestLat,
    snappedLng: bestLng,
    distanceMeters: Math.sqrt(minDistanceSq) * 111132,
  };
}

/**
 * Trouve l'index optimal d'insertion d'un nouveau waypoint entre les étapes existantes.
 */
export function findClosestWaypointInsertIndex(
  waypoints: [number, number][], // [lon, lat]
  clickedLat: number,
  clickedLng: number,
  isLoop: boolean,
  detailedLatLngs?: [number, number][], // [lat, lon]
  legs?: RoutedLegResult[]
): number {
  return projectPointOntoRouteSegments(
    waypoints,
    clickedLat,
    clickedLng,
    isLoop,
    detailedLatLngs,
    legs
  ).insertIndex;
}

/**
 * Détecte les anomalies d'organisation des segments (rebroussements / inversions entre 2 étapes
 * ou croisements géométriques de segments) afin de les signaler dans le dashboard.
 */
export function detectSegmentOrderAnomalies(
  waypoints: [number, number][],
  isLoop: boolean
): SegmentOrderAnomaly[] {
  const n = waypoints.length;
  if (n < 3) return [];

  const anomalies: SegmentOrderAnomaly[] = [];
  const totalSegs = isLoop ? n : n - 1;

  // 1. Détection des inversions locales entre deux étapes consécutives (A -> B -> C -> D où A->C->B->D est plus court)
  for (let i = 0; i < totalSegs - 1; i++) {
    const idxA = i % n;
    const idxB = (i + 1) % n;
    const idxC = (i + 2) % n;
    const idxD = (i + 3) % n;

    if (!isLoop && i + 3 > n) continue;
    if (idxA === idxD) continue;

    const A = waypoints[idxA];
    const B = waypoints[idxB];
    const C = waypoints[idxC];
    const D = waypoints[idxD];

    const currentLen =
      approxDistanceMeters(A[1], A[0], B[1], B[0]) +
      approxDistanceMeters(B[1], B[0], C[1], C[0]) +
      approxDistanceMeters(C[1], C[0], D[1], D[0]);

    const swappedLen =
      approxDistanceMeters(A[1], A[0], C[1], C[0]) +
      approxDistanceMeters(C[1], C[0], B[1], B[0]) +
      approxDistanceMeters(B[1], B[0], D[1], D[0]);

    // Si intervertir B et C raccourcit le trajet d'au moins 18% (et > 80m), les étapes B et C sont interverties !
    if (swappedLen < currentLen * 0.82 && currentLen - swappedLen > 80) {
      anomalies.push({
        waypointIndex: idxB,
        type: 'backtrack',
        description: `Les étapes ${idxB + 1} et ${idxC + 1} semblent interverties (détour inutile de ${Math.round(currentLen - swappedLen)} m)`,
        swapWithIndex: idxC,
      });
    }
  }

  return anomalies;
}

/**
 * Réordonne automatiquement les waypoints (algorithme 2-Opt préservant le point de départ 0)
 * pour éliminer toutes les inversions et croisements de segments.
 */
export function optimizeWaypointsOrder2Opt(
  waypoints: [number, number][],
  isLoop: boolean
): {
  optimizedWaypoints: [number, number][];
  newOrderIndices: number[];
  hasChanged: boolean;
} {
  const n = waypoints.length;
  if (n < 4) {
    return {
      optimizedWaypoints: waypoints,
      newOrderIndices: waypoints.map((_, i) => i),
      hasChanged: false,
    };
  }

  const order = waypoints.map((_, i) => i);
  let hasChanged = false;

  const distBetweenIdx = (i1: number, i2: number): number => {
    const p1 = waypoints[i1];
    const p2 = waypoints[i2];
    return approxDistanceMeters(p1[1], p1[0], p2[1], p2[0]);
  };

  // Passe 2-Opt (décroise les segments et corrige les étapes interverties tout en gardant order[0] = 0 fixe)
  let improved = true;
  let iterations = 0;
  const maxIdx = isLoop ? n : n - 1;

  while (improved && iterations < 25) {
    improved = false;
    iterations++;

    for (let i = 0; i < maxIdx - 1; i++) {
      for (let k = i + 2; k < maxIdx; k++) {
        if (!isLoop && k >= n - 1 && i === 0) continue;

        const a = order[i];
        const b = order[i + 1];
        const c = order[k];
        const d = order[(k + 1) % n];

        if (!isLoop && k + 1 >= n) continue;

        const currentDist = distBetweenIdx(a, b) + distBetweenIdx(c, d);
        const newDist = distBetweenIdx(a, c) + distBetweenIdx(b, d);

        if (newDist + 15 < currentDist) {
          // Inverse la sous-séquence entre i+1 et k
          const reversedSlice = order.slice(i + 1, k + 1).reverse();
          order.splice(i + 1, k - i, ...reversedSlice);
          improved = true;
          hasChanged = true;
        }
      }
    }
  }

  return {
    optimizedWaypoints: order.map((idx) => waypoints[idx]),
    newOrderIndices: order,
    hasChanged,
  };
}
