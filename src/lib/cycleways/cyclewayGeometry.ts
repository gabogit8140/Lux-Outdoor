import type { RouteSuggestions, RouteTrace } from '../../types';
import { calculatePathDistance, computeElevationProfile, haversineDistance } from '../geoUtils';

export type Coord3D = [number, number, number?]; // [lon, lat, ele?]

function ptDist(a: Coord3D, b: Coord3D): number {
  return haversineDistance([a[0], a[1]], [b[0], b[1]]);
}

function segmentLengthMeters(seg: Coord3D[]): number {
  let d = 0;
  for (let i = 1; i < seg.length; i++) {
    d += ptDist(seg[i - 1], seg[i]);
  }
  return d;
}

function minDistanceToTarget(seg: Coord3D[], targetLonLat: [number, number]): number {
  let best = Infinity;
  for (let i = 0; i < seg.length; i++) {
    const d = haversineDistance([seg[i][0], seg[i][1]], targetLonLat);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Découpe tout segment contenant un saut rectiligne anormal (> splitJumpMeters)
 * afin d'éliminer les téléportations artificielles issues de relations OSM non ordonnées.
 */
function splitInternalJumps(segments: Coord3D[][], splitJumpMeters: number): Coord3D[][] {
  const clean: Coord3D[][] = [];
  for (const seg of segments) {
    if (!seg || seg.length < 2) continue;
    if (seg.length === 2) {
      clean.push(seg);
      continue;
    }
    let current: Coord3D[] = [seg[0]];
    for (let i = 1; i < seg.length; i++) {
      const gap = ptDist(seg[i - 1], seg[i]);
      if (gap > splitJumpMeters) {
        if (current.length >= 2) clean.push(current);
        current = [seg[i]];
      } else if (gap > 0.5) {
        current.push(seg[i]);
      }
    }
    if (current.length >= 2) clean.push(current);
  }
  return clean;
}

/**
 * Déduplique les segments quasi-identiques (fréquents dans les relations cyclables OSM aller/retour).
 */
function deduplicateSegments(segments: Coord3D[][]): Coord3D[][] {
  const unique: Coord3D[][] = [];
  const signatures = new Set<string>();

  for (const seg of segments) {
    if (seg.length < 2) continue;
    const first = seg[0];
    const last = seg[seg.length - 1];
    const mid = seg[Math.floor(seg.length / 2)];
    const k1 = `${first[0].toFixed(4)},${first[1].toFixed(4)}->${last[0].toFixed(4)},${last[1].toFixed(4)}@${mid[0].toFixed(4)},${mid[1].toFixed(4)}`;
    const k2 = `${last[0].toFixed(4)},${last[1].toFixed(4)}->${first[0].toFixed(4)},${first[1].toFixed(4)}@${mid[0].toFixed(4)},${mid[1].toFixed(4)}`;
    if (signatures.has(k1) || signatures.has(k2)) continue;
    signatures.add(k1);
    unique.push(seg);
  }
  return unique;
}

/**
 * Chaîne intelligemment un ensemble de tronçons (`Coord3D[][]`) bout-à-bout (avec inversion automatique
 * de sens si nécessaire) pour produire une ligne continue sans sauts parasites.
 * Si `targetLonLat` est fourni, privilégie la chaîne continue passant au plus près du clic utilisateur.
 */
export function chainMultiSegmentsToContinuousLine(
  rawSegments: Coord3D[][],
  targetLonLat?: [number, number],
  maxGapMeters: number = 1600
): Coord3D[] {
  const split = splitInternalJumps(rawSegments, Math.max(1800, maxGapMeters));
  const pool = deduplicateSegments(split);

  if (pool.length === 0) return [];
  if (pool.length === 1) return pool[0];

  const used = new Array<boolean>(pool.length).fill(false);
  const chains: Coord3D[][] = [];

  // Ordonner les graines par proximité avec targetLonLat (si présent), sinon par longueur décroissante
  const seedOrder = pool
    .map((seg, idx) => ({
      idx,
      score: targetLonLat
        ? -minDistanceToTarget(seg, targetLonLat)
        : segmentLengthMeters(seg),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.idx);

  for (const seedIdx of seedOrder) {
    if (used[seedIdx]) continue;
    used[seedIdx] = true;
    let chain: Coord3D[] = [...pool[seedIdx]];

    let extended = true;
    while (extended) {
      extended = false;
      const head = chain[0];
      const tail = chain[chain.length - 1];

      let bestIdx = -1;
      let bestDist = maxGapMeters;
      let attachMode: 'tail-start' | 'tail-end' | 'head-end' | 'head-start' = 'tail-start';

      for (let i = 0; i < pool.length; i++) {
        if (used[i]) continue;
        const cand = pool[i];
        const cStart = cand[0];
        const cEnd = cand[cand.length - 1];

        const dTailStart = ptDist(tail, cStart);
        if (dTailStart < bestDist) {
          bestDist = dTailStart;
          bestIdx = i;
          attachMode = 'tail-start';
        }

        const dTailEnd = ptDist(tail, cEnd);
        if (dTailEnd < bestDist) {
          bestDist = dTailEnd;
          bestIdx = i;
          attachMode = 'tail-end';
        }

        const dHeadEnd = ptDist(head, cEnd);
        if (dHeadEnd < bestDist) {
          bestDist = dHeadEnd;
          bestIdx = i;
          attachMode = 'head-end';
        }

        const dHeadStart = ptDist(head, cStart);
        if (dHeadStart < bestDist) {
          bestDist = dHeadStart;
          bestIdx = i;
          attachMode = 'head-start';
        }
      }

      if (bestIdx !== -1) {
        used[bestIdx] = true;
        extended = true;
        const cand = pool[bestIdx];
        const skipDuplicate = bestDist < 8 ? 1 : 0;

        if (attachMode === 'tail-start') {
          chain = [...chain, ...cand.slice(skipDuplicate)];
        } else if (attachMode === 'tail-end') {
          const rev = [...cand].reverse();
          chain = [...chain, ...rev.slice(skipDuplicate)];
        } else if (attachMode === 'head-end') {
          chain = [...cand.slice(0, cand.length - skipDuplicate), ...chain];
        } else {
          const rev = [...cand].reverse();
          chain = [...rev.slice(0, rev.length - skipDuplicate), ...chain];
        }
      }
    }

    chains.push(chain);
  }

  if (chains.length === 0) return [];

  if (targetLonLat) {
    // Choisir la chaîne passant à proximité immédiate du clic, et à proximité égale la plus longue
    let bestChain = chains[0];
    let bestScore = -Infinity;
    for (const ch of chains) {
      const dist = minDistanceToTarget(ch, targetLonLat);
      const len = segmentLengthMeters(ch);
      // Forte priorité aux chaînes à moins de 150m du clic, tout en favorisant un axe continu exploitable
      const proximityBonus = dist <= 150 ? 1_000_000 - dist * 500 : -dist * 2000;
      const score = proximityBonus + Math.min(len, 120_000);
      if (score > bestScore) {
        bestScore = score;
        bestChain = ch;
      }
    }
    return bestChain;
  }

  // Sinon, retourner la chaîne continue la plus longue
  let longest = chains[0];
  let maxLen = segmentLengthMeters(longest);
  for (let i = 1; i < chains.length; i++) {
    const l = segmentLengthMeters(chains[i]);
    if (l > maxLen) {
      maxLen = l;
      longest = chains[i];
    }
  }
  // Préserver l'orientation naturelle du premier tronçon GPX (Départ -> Arrivée)
  if (rawSegments.length > 0 && rawSegments[0].length > 0 && longest.length >= 2) {
    const origStart = rawSegments[0][0];
    if (ptDist(longest[longest.length - 1], origStart) < ptDist(longest[0], origStart)) {
      return [...longest].reverse();
    }
  }
  return longest;
}

/**
 * Normalise une `RouteTrace` multi-segments (ex: PC nationales dans catalog.json contenant des segments désordonnés)
 * en une trace continue propre avec distance réelle corrigée.
 */
export function normalizeCyclewayTrace(
  trace: RouteTrace,
  route?: RouteSuggestions | null,
  targetLonLat?: [number, number]
): RouteTrace {
  if (!trace?.coordinates || trace.coordinates.length === 0) return trace;

  const isMulti = Array.isArray(trace.coordinates[0]?.[0]);
  if (!isMulti) {
    // Vérifier s'il y a des sauts internes géants (> 2.5 km) dans une trace linéaire
    const single = trace.coordinates as [number, number][];
    let hasGiantJump = false;
    for (let i = 1; i < single.length; i++) {
      if (haversineDistance(single[i - 1], single[i]) > 2500) {
        hasGiantJump = true;
        break;
      }
    }
    if (!hasGiantJump) return trace;

    const chained = chainMultiSegmentsToContinuousLine(
      [single],
      targetLonLat,
      1600
    );
    if (chained.length < 2) return trace;
    const clean2D: [number, number][] = chained.map(([lon, lat]) => [lon, lat]);
    const distM = Math.round(calculatePathDistance(clean2D));
    const elev = computeElevationProfile(
      clean2D,
      Math.max(20, Math.round((distM / 1000) * 6))
    );
    return {
      ...trace,
      distance: distM,
      duration: Math.round(((distM / 1000) / 20) * 3600),
      coordinates: clean2D,
      elevationProfile: elev.profile,
    };
  }

  const multi = trace.coordinates as [number, number][][];
  const chained = chainMultiSegmentsToContinuousLine(multi, targetLonLat, 1600);
  if (chained.length < 2) return trace;

  const clean2D: [number, number][] = chained.map(([lon, lat]) => [lon, lat]);
  const distM = Math.round(calculatePathDistance(clean2D));
  const distKm = distM / 1000;
  const estGain =
    route && route.elevationGain > 0 && route.elevationGain < distKm * 25
      ? route.elevationGain
      : Math.max(15, Math.round(distKm * 5.5));
  const elev = computeElevationProfile(clean2D, estGain);

  return {
    ...trace,
    distance: distM,
    duration: Math.round((distKm / 20) * 3600),
    coordinates: clean2D,
    elevationProfile: elev.profile,
  };
}

/**
 * Projette un point GPS `(lat, lng)` sur une `RouteTrace` et retourne son abscisse curviligne en km
 * ainsi que la distance orthogonale minimale en mètres.
 */
export function projectPointToTraceKm(
  trace: RouteTrace,
  lat: number,
  lng: number
): {
  projectedKm: number;
  distanceMeters: number;
  totalKm: number;
} {
  const flat: [number, number][] = Array.isArray(trace.coordinates[0]?.[0])
    ? (trace.coordinates as [number, number][][]).flat()
    : (trace.coordinates as [number, number][]);

  if (!flat || flat.length === 0) {
    return { projectedKm: 0, distanceMeters: Infinity, totalKm: 0 };
  }

  const target: [number, number] = [lng, lat];
  let cumMeters = 0;
  let bestDistM = haversineDistance(flat[0], target);
  let bestAtMeters = 0;

  for (let i = 1; i < flat.length; i++) {
    const a = flat[i - 1];
    const b = flat[i];
    const segLen = haversineDistance(a, b);

    // Projection linéaire sur le segment [a, b]
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 1e-12) {
      t = Math.max(0, Math.min(1, ((target[0] - a[0]) * dx + (target[1] - a[1]) * dy) / lenSq));
    }
    const proj: [number, number] = [a[0] + t * dx, a[1] + t * dy];
    const d = haversineDistance(proj, target);

    if (d < bestDistM) {
      bestDistM = d;
      bestAtMeters = cumMeters + t * segLen;
    }

    cumMeters += segLen;
  }

  return {
    projectedKm: Number((bestAtMeters / 1000).toFixed(2)),
    distanceMeters: bestDistM,
    totalKm: Number((cumMeters / 1000).toFixed(2)),
  };
}
