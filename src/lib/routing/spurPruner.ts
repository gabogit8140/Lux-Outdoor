import { haversineDistance } from '../geoUtils';

export interface SpurPruningResult {
  cleanedCoords: [number, number, number?][];
  cleanedWaypoints: [number, number][];
  hasPrunedSpurs: boolean;
  prunedMeters: number;
}

/**
 * Calcule la projection orthogonale d'un point [lon, lat] sur une polyligne 2D/3D
 * et retourne le point projeté exact ainsi que l'index du sommet le plus proche.
 */
export function snapPointToTrack(
  point: [number, number],
  trackCoords: [number, number, number?][]
): {
  snappedCoord: [number, number];
  closestIndex: number;
  distanceMeters: number;
} {
  if (!trackCoords || trackCoords.length === 0) {
    return { snappedCoord: point, closestIndex: 0, distanceMeters: 0 };
  }
  if (trackCoords.length === 1) {
    const c = trackCoords[0];
    return {
      snappedCoord: [Number(c[0].toFixed(6)), Number(c[1].toFixed(6))],
      closestIndex: 0,
      distanceMeters: haversineDistance(point, [c[0], c[1]]),
    };
  }

  const [px, py] = point;
  const cosLat = Math.cos((py * Math.PI) / 180);

  let bestDistMeters = Infinity;
  let bestCoord: [number, number] = [trackCoords[0][0], trackCoords[0][1]];
  let bestIdx = 0;

  for (let i = 0; i < trackCoords.length - 1; i++) {
    const a = trackCoords[i];
    const b = trackCoords[i + 1];

    const dx = (b[0] - a[0]) * cosLat;
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 1e-12) {
      const pxRel = (px - a[0]) * cosLat;
      const pyRel = py - a[1];
      t = Math.max(0, Math.min(1, (pxRel * dx + pyRel * dy) / lenSq));
    }

    const projLon = a[0] + t * (b[0] - a[0]);
    const projLat = a[1] + t * (b[1] - a[1]);
    const dist = haversineDistance(point, [projLon, projLat]);

    if (dist < bestDistMeters) {
      bestDistMeters = dist;
      bestCoord = [Number(projLon.toFixed(6)), Number(projLat.toFixed(6))];
      bestIdx = t < 0.5 ? i : i + 1;
    }
  }

  return {
    snappedCoord: bestCoord,
    closestIndex: bestIdx,
    distanceMeters: bestDistMeters,
  };
}

/**
 * Calcule les abscisses curvilignes cumulées (en mètres) le long d'une polyligne.
 */
export function computeCumulativeArcLengths(coords: [number, number, number?][]): number[] {
  const cum: number[] = new Array(coords.length).fill(0);
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(
      [coords[i - 1][0], coords[i - 1][1]],
      [coords[i][0], coords[i][1]]
    );
    cum[i] = total;
  }
  return cum;
}

/**
 * Compte le nombre de points partagés (chevauchement < toleranceMeters) entre deux segments A et B,
 * en excluant un rayon de dégagement autour de leur point de jonction commun.
 */
export function countSharedPassagePoints(
  coordsA: [number, number, number?][],
  coordsB: [number, number, number?][],
  junctionPoint: [number, number],
  junctionClearanceMeters: number = 45,
  overlapToleranceMeters: number = 24
): number {
  let shared = 0;
  for (const pa of coordsA) {
    if (haversineDistance([pa[0], pa[1]], junctionPoint) < junctionClearanceMeters) {
      continue;
    }
    for (const pb of coordsB) {
      if (haversineDistance([pb[0], pb[1]], junctionPoint) < junctionClearanceMeters) {
        continue;
      }
      if (haversineDistance([pa[0], pa[1]], [pb[0], pb[1]]) <= overlapToleranceMeters) {
        shared++;
        break;
      }
    }
  }
  return shared;
}

/**
 * Vérifie si une portion de trace [startIdx .. endIdx] contient ou longe
 * un waypoint volontaire posé par l'utilisateur.
 */
function doesRangeContainWaypoint(
  waypoints: [number, number][],
  coords: [number, number, number?][],
  startIdx: number,
  endIdx: number,
  thresholdMeters: number = 38
): boolean {
  if (!waypoints || waypoints.length === 0) return false;
  const clampedStart = Math.max(0, startIdx);
  const clampedEnd = Math.min(coords.length - 1, endIdx);

  for (const wp of waypoints) {
    for (let k = clampedStart; k <= clampedEnd; k++) {
      const c = coords[k];
      if (c && haversineDistance(wp, [c[0], c[1]]) <= thresholdMeters) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Détecte et élimine tous les aller-retours (spurs / impasses / passages répétés par le même point)
 * par abscisse curviligne, puis projette chaque étape sur le circuit nettoyé.
 *
 * RÈGLE D'OR : Les tronçons contenant un waypoint utilisateur explicite (ex: antenne de départ
 * d'un circuit en sucette / lollipop, belvédère en aller-retour) ne sont JAMAIS élagués.
 */
export function pruneLoopSpursAndOrphans(
  rawCoords: [number, number, number?][],
  waypoints: [number, number][],
  neckToleranceMeters: number = 42
): SpurPruningResult {
  if (!rawCoords || rawCoords.length < 6) {
    return {
      cleanedCoords: rawCoords || [],
      cleanedWaypoints: waypoints,
      hasPrunedSpurs: false,
      prunedMeters: 0,
    };
  }

  let coords = [...rawCoords];
  let hasPrunedSpurs = false;
  let totalPrunedMeters = 0;

  // Passe itérative d'élagage de tout repassage par un même point (jusqu'à 6 passes)
  for (let pass = 0; pass < 6; pass++) {
    if (coords.length < 6) break;
    const cumDist = computeCumulativeArcLengths(coords);
    const totalLength = cumDist[cumDist.length - 1];
    if (totalLength < 120) break;

    // Une impasse ou boucle parasite ne peut pas excéder 45% de la longueur totale du circuit
    const maxSpurLength = Math.min(4500, totalLength * 0.45);
    let prunedInThisPass = false;

    for (let i = 0; i < coords.length - 3; i++) {
      const pi = coords[i];
      let bestEndJ = -1;

      for (let j = i + 2; j < coords.length; j++) {
        // Ne pas supprimer la fermeture complète de la boucle entre le tout début (i=0..2) et la toute fin (j=N-3..N-1)
        if (i <= 2 && j >= coords.length - 3) continue;

        const arcLen = cumDist[j] - cumDist[i];
        if (arcLen < 20) continue;
        if (arcLen > maxSpurLength) break;

        const pj = coords[j];
        const neckDist = haversineDistance([pi[0], pi[1]], [pj[0], pj[1]]);

        if (neckDist <= neckToleranceMeters && arcLen > Math.max(30, neckDist * 2.1)) {
          // Si ce tronçon contient un waypoint utilisateur explicite, NE PAS l'élaguer (ex: détour point de vue)
          if (!doesRangeContainWaypoint(waypoints, coords, i + 1, j)) {
            bestEndJ = j;
          }
        }
      }

      if (bestEndJ !== -1) {
        const removedMeters = cumDist[bestEndJ] - cumDist[i];
        totalPrunedMeters += removedMeters;
        hasPrunedSpurs = true;
        prunedInThisPass = true;
        coords.splice(i + 1, bestEndJ - i);
        break;
      }
    }

    if (!prunedInThisPass) break;
  }

  // Si la trace est une boucle fermée, vérifier aussi qu'il n'y a pas d'aller-retour (spur)
  // à cheval sur le point de départ/arrivée (début coords[0..i] et fin coords[j..N-1] qui se superposent).
  // PROTECTION : Si l'antenne d'accès de départ/arrivée contient le point de départ de l'utilisateur
  // (circuit en sucette / lollipop), elle ne doit JAMAIS être coupée.
  if (coords.length >= 8) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (haversineDistance([first[0], first[1]], [last[0], last[1]]) < 60) {
      const cumDist = computeCumulativeArcLengths(coords);
      const totalLength = cumDist[cumDist.length - 1];
      const maxWrapSpur = Math.min(2500, totalLength * 0.35);

      let bestHeadIdx = -1;
      let bestTailIdx = -1;
      let bestWrapArc = 0;

      for (let i = 1; i < coords.length - 4; i++) {
        if (cumDist[i] > maxWrapSpur) break;
        const pi = coords[i];
        for (let j = coords.length - 2; j > i + 3; j--) {
          const tailArc = totalLength - cumDist[j];
          if (tailArc > maxWrapSpur) break;
          const wrapArc = cumDist[i] + tailArc;
          if (wrapArc < 25 || wrapArc > maxWrapSpur) continue;

          const pj = coords[j];
          const neckDist = haversineDistance([pi[0], pi[1]], [pj[0], pj[1]]);
          if (neckDist <= neckToleranceMeters && wrapArc > Math.max(30, neckDist * 2.1)) {
            if (wrapArc > bestWrapArc) {
              bestWrapArc = wrapArc;
              bestHeadIdx = i;
              bestTailIdx = j;
            }
          }
        }
      }

      if (bestHeadIdx !== -1 && bestTailIdx !== -1) {
        // Si le début (coords[0..bestHeadIdx]) ou la fin (coords[bestTailIdx..N-1]) contient
        // un waypoint utilisateur (ex: départ en sucette / parking), ne JAMAIS couper cette antenne !
        const containsDepartureWp = doesRangeContainWaypoint(waypoints, coords, 0, bestHeadIdx);
        const containsArrivalWp = doesRangeContainWaypoint(waypoints, coords, bestTailIdx, coords.length - 1);

        if (!containsDepartureWp && !containsArrivalWp) {
          totalPrunedMeters += bestWrapArc;
          hasPrunedSpurs = true;
          const trimmedLoop = coords.slice(bestHeadIdx, bestTailIdx + 1);
          if (
            trimmedLoop.length >= 3 &&
            haversineDistance(
              [trimmedLoop[0][0], trimmedLoop[0][1]],
              [trimmedLoop[trimmedLoop.length - 1][0], trimmedLoop[trimmedLoop.length - 1][1]]
            ) > 2
          ) {
            trimmedLoop.push([...trimmedLoop[0]]);
          }
          coords = trimmedLoop;
        }
      }
    }
  }

  // Projection des waypoints sur le tracé sans aller-retour
  const cleanedWaypoints: [number, number][] = waypoints.map((wp) => {
    const snapped = snapPointToTrack(wp, coords);
    if (snapped.distanceMeters > 8) {
      hasPrunedSpurs = true;
    }
    return snapped.snappedCoord;
  });

  return {
    cleanedCoords: coords,
    cleanedWaypoints,
    hasPrunedSpurs,
    prunedMeters: Math.round(totalPrunedMeters),
  };
}
