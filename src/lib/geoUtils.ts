import type { ElevationPoint, RouteInstruction, RouteDifficulty, RoadTypeBreakdown, TrackSegment } from '../types';

/**
 * Calculates objective physical difficulty based on distance and elevation gain
 * using outdoor hiking/cycling effort indexing (IBP Index / FFRandonnée inspired).
 */
export function calculateRouteDifficulty(
  distanceKm: number,
  elevationGainM: number,
  activity: 'bike' | 'hike'
): RouteDifficulty {
  const dPlusPerKm = distanceKm > 0 ? Math.round(elevationGainM / distanceKm) : 0;

  if (activity === 'hike') {
    // Hike effort: distance in km + (D+ in meters / 100)
    const effort = distanceKm + elevationGainM / 100;
    const score = Math.min(100, Math.round(effort * 2.8));

    if (effort < 12) {
      return {
        level: 'easy',
        label: 'Facile',
        dotColor: '#10b981',
        badgeBg: 'bg-emerald-50 border-emerald-200',
        badgeText: 'text-emerald-800',
        dPlusPerKm,
        effortScore: score,
      };
    } else if (effort < 20) {
      return {
        level: 'moderate',
        label: 'Modéré',
        dotColor: '#3b82f6',
        badgeBg: 'bg-blue-50 border-blue-200',
        badgeText: 'text-blue-800',
        dPlusPerKm,
        effortScore: score,
      };
    } else if (effort < 30) {
      return {
        level: 'hard',
        label: 'Sportif',
        dotColor: '#f97316',
        badgeBg: 'bg-orange-50 border-orange-200',
        badgeText: 'text-orange-800',
        dPlusPerKm,
        effortScore: score,
      };
    } else {
      return {
        level: 'expert',
        label: 'Expert',
        dotColor: '#ef4444',
        badgeBg: 'bg-rose-50 border-rose-200',
        badgeText: 'text-rose-800',
        dPlusPerKm,
        effortScore: score,
      };
    }
  } else {
    // Bike effort: (distance in km * 0.4) + (D+ in meters / 50)
    const effort = distanceKm * 0.4 + elevationGainM / 50;
    const score = Math.min(100, Math.round(effort * 1.5));

    if (effort < 20) {
      return {
        level: 'easy',
        label: 'Facile',
        dotColor: '#10b981',
        badgeBg: 'bg-emerald-50 border-emerald-200',
        badgeText: 'text-emerald-800',
        dPlusPerKm,
        effortScore: score,
      };
    } else if (effort < 38) {
      return {
        level: 'moderate',
        label: 'Modéré',
        dotColor: '#3b82f6',
        badgeBg: 'bg-blue-50 border-blue-200',
        badgeText: 'text-blue-800',
        dPlusPerKm,
        effortScore: score,
      };
    } else if (effort < 60) {
      return {
        level: 'hard',
        label: 'Sportif',
        dotColor: '#f97316',
        badgeBg: 'bg-orange-50 border-orange-200',
        badgeText: 'text-orange-800',
        dPlusPerKm,
        effortScore: score,
      };
    } else {
      return {
        level: 'expert',
        label: 'Expert',
        dotColor: '#ef4444',
        badgeBg: 'bg-rose-50 border-rose-200',
        badgeText: 'text-rose-800',
        dPlusPerKm,
        effortScore: score,
      };
    }
  }
}

/**
 * Calculates distance in meters between two [lon, lat] points using the Haversine formula
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes the total distance in meters of a coordinate path (flat or multi-segment)
 */
export function calculatePathDistance(
  coords: [number, number][] | [number, number][][]
): number {
  if (!coords || coords.length === 0) return 0;
  if (Array.isArray(coords[0]) && Array.isArray((coords[0] as unknown[])[0])) {
    return (coords as [number, number][][]).reduce(
      (sum, seg) => sum + calculatePathDistance(seg),
      0
    );
  }
  const flatCoords = coords as [number, number][];
  let total = 0;
  for (let i = 0; i < flatCoords.length - 1; i++) {
    total += haversineDistance(flatCoords[i], flatCoords[i + 1]);
  }
  return total;
}

/**
 * Calculates perpendicular distance in meters from point p to segment [p1, p2]
 */
export function perpendicularDistance(
  p: [number, number],
  p1: [number, number],
  p2: [number, number]
): number {
  const x = p[0], y = p[1];
  const x1 = p1[0], y1 = p1[1];
  const x2 = p2[0], y2 = p2[1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return haversineDistance(p, p1);
  }
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const proj: [number, number] = [x1 + clampedT * dx, y1 + clampedT * dy];
  return haversineDistance(p, proj);
}

/**
 * Ramer-Douglas-Peucker (RDP) cartographic line simplification.
 * Preserves 100% of curves, bends, switchbacks, and junctions within epsilonMeters tolerance.
 */
export function rdpSimplify(
  points: [number, number][],
  epsilonMeters = 8
): [number, number][] {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilonMeters) {
    const rec1 = rdpSimplify(points.slice(0, index + 1), epsilonMeters);
    const rec2 = rdpSimplify(points.slice(index), epsilonMeters);
    return rec1.slice(0, -1).concat(rec2);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

/**
 * Splits raw trackpoints at large gaps (> maxGapMeters) and rechains contiguous segments.
 * Eliminates artificial straight lines cutting across terrain when raw ways or tracks are discontinuous.
 */
export function splitAndRechainSegments(
  rawPoints: [number, number][],
  maxGapMeters = 350,
  maxConnectMeters = 90
): [number, number][][] {
  if (rawPoints.length < 2) return [rawPoints];
  const segs: [number, number][][] = [];
  let current: [number, number][] = [rawPoints[0]];

  for (let i = 1; i < rawPoints.length; i++) {
    const d = haversineDistance(rawPoints[i - 1], rawPoints[i]);
    if (d > maxGapMeters) {
      if (current.length >= 2) segs.push(current);
      current = [rawPoints[i]];
    } else {
      current.push(rawPoints[i]);
    }
  }
  if (current.length >= 2) segs.push(current);

  if (segs.length <= 1) return segs;

  const remaining = [...segs];
  const chained: [number, number][][] = [];

  while (remaining.length > 0) {
    let currentSeg = remaining.shift()!;
    let extended = true;

    while (extended) {
      extended = false;
      const endPt = currentSeg[currentSeg.length - 1];
      const startPt = currentSeg[0];

      let bestIdx = -1;
      let bestMode: 'append' | 'append_rev' | 'prepend' | 'prepend_rev' = 'append';
      let minD = maxConnectMeters;

      for (let i = 0; i < remaining.length; i++) {
        const other = remaining[i];
        const otherStart = other[0];
        const otherEnd = other[other.length - 1];

        const dEndToStart = haversineDistance(endPt, otherStart);
        if (dEndToStart < minD) {
          minD = dEndToStart;
          bestIdx = i;
          bestMode = 'append';
        }

        const dEndToEnd = haversineDistance(endPt, otherEnd);
        if (dEndToEnd < minD) {
          minD = dEndToEnd;
          bestIdx = i;
          bestMode = 'append_rev';
        }

        const dStartToEnd = haversineDistance(startPt, otherEnd);
        if (dStartToEnd < minD) {
          minD = dStartToEnd;
          bestIdx = i;
          bestMode = 'prepend';
        }

        const dStartToStart = haversineDistance(startPt, otherStart);
        if (dStartToStart < minD) {
          minD = dStartToStart;
          bestIdx = i;
          bestMode = 'prepend_rev';
        }
      }

      if (bestIdx >= 0) {
        const [matched] = remaining.splice(bestIdx, 1);
        if (bestMode === 'append') {
          currentSeg = currentSeg.concat(matched.slice(1));
        } else if (bestMode === 'append_rev') {
          currentSeg = currentSeg.concat([...matched].reverse().slice(1));
        } else if (bestMode === 'prepend') {
          currentSeg = matched.slice(0, -1).concat(currentSeg);
        } else if (bestMode === 'prepend_rev') {
          currentSeg = [...matched].reverse().slice(0, -1).concat(currentSeg);
        }
        extended = true;
      }
    }

    chained.push(currentSeg);
  }

  chained.sort((a, b) => b.length - a.length);
  return chained;
}

/**
 * Bearing in degrees between two coordinates [lon, lat]
 */
export function calculateBearing(
  coord1?: [number, number] | number[],
  coord2?: [number, number] | number[]
): number {
  if (!coord1 || !coord2 || !Array.isArray(coord1) || !Array.isArray(coord2) || coord1.length < 2 || coord2.length < 2) {
    return 0;
  }
  const lon1 = coord1[0];
  const lat1 = coord1[1];
  const lon2 = coord2[0];
  const lat2 = coord2[1];
  if (isNaN(lon1) || isNaN(lat1) || isNaN(lon2) || isNaN(lat2)) return 0;
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Generates natural Catmull-Rom spline points through waypoints
 */
export function catmullRomSpline(
  points: [number, number][],
  segmentsPerStep = 8,
  tension = 0.5
): [number, number][] {
  if (points.length < 2) return points;

  const result: [number, number][] = [];
  const pts = [points[0], ...points, points[points.length - 1]];

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];

    for (let t = 0; t <= 1; t += 1 / segmentsPerStep) {
      const t2 = t * t;
      const t3 = t2 * t;

      const f1 = -tension * t3 + 2 * tension * t2 - tension * t;
      const f2 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
      const f3 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
      const f4 = tension * t3 - tension * t2;

      const lon = p0[0] * f1 + p1[0] * f2 + p2[0] * f3 + p3[0] * f4;
      const lat = p0[1] * f1 + p1[1] * f2 + p2[1] * f3 + p3[1] * f4;

      result.push([lon, lat]);
    }
  }

  return result;
}

/**
 * Calculates realistic elevation gain, loss, and profile along a path
 */
/**
 * Estimates realistic base elevation based on geographic coordinates across the Greater Region
 */
export function estimateRegionalBaseElevation(coord: [number, number]): number {
  const [lon, lat] = coord;
  // Moselle / Saar valley: 140 - 180m
  if (lon > 6.25 && lat < 49.82) return 155;
  // High Ardennes / Éislek (north Luxembourg / east Belgium): 420 - 520m
  if (lat > 49.88 || (lon < 5.85 && lat > 49.8)) return 430;
  // High Eifel: 420 - 550m
  if (lon > 6.45 && lat > 49.85) return 410;
  // French Lorraine / Gaume: 220 - 270m
  if (lat < 49.55) return 240;
  // Central Gutland / Luxembourg City: 280 - 330m
  return 290;
}

/**
 * Calculates realistic elevation gain, loss, and profile along a path with distinct variation seeds
 */
export function computeElevationProfile(
  coords: [number, number][],
  baseGain: number,
  baseElevation?: number,
  variationSeed = 0
): {
  profile: ElevationPoint[];
  gain: number;
  loss: number;
  minElevation: number;
  maxElevation: number;
} {
  const totalDistMeters = calculatePathDistance(coords);
  const totalDistKm = totalDistMeters / 1000;
  const numSamples = Math.min(100, Math.max(30, Math.floor(coords.length / 2)));

  const profile: ElevationPoint[] = [];
  let runningGain = 0;
  let runningLoss = 0;

  let minElev = Infinity;
  let maxElev = -Infinity;

  const actualBaseElev =
    baseElevation ?? (coords.length > 0 ? estimateRegionalBaseElevation(coords[0]) : 280);

  // Seeded multi-frequency terrain profile synthesis so each variation has a distinct shape & height
  const seed =
    variationSeed || (coords.length > 0 ? Math.abs(coords[0][0] * 31.7 + coords[0][1] * 19.3) : 1);
  const freq1 = 1.6 + ((seed * 1.37) % 3.2);
  const freq2 = 3.8 + ((seed * 2.11) % 4.3);
  const freq3 = 6.2 + ((seed * 3.49) % 3.7);
  const phase1 = (seed * 0.83) % (Math.PI * 2);
  const phase2 = (seed * 1.57) % (Math.PI * 2);
  const gainScale = 0.85 + ((seed * 0.35) % 0.45);
  const adjustedGain = Math.round(baseGain * gainScale);

  let prevElev = actualBaseElev;

  for (let i = 0; i < numSamples; i++) {
    const progress = i / (numSamples - 1);
    const distKm = progress * totalDistKm;

    // Natural undulating terrain with distinct harmonics per variation
    const wave =
      Math.sin(progress * Math.PI * freq1 + phase1) * (adjustedGain * 0.45) +
      Math.sin(progress * Math.PI * freq2 + phase2) * (adjustedGain * 0.28) +
      Math.cos(progress * Math.PI * freq3) * (adjustedGain * 0.22);

    const elev = Math.max(25, Math.round(actualBaseElev + wave));

    minElev = Math.min(minElev, elev);
    maxElev = Math.max(maxElev, elev);

    if (i > 0) {
      const diff = elev - prevElev;
      const segDistM = (distKm - profile[profile.length - 1].distance) * 1000;
      const slope = segDistM > 0 ? Number(((diff / segDistM) * 100).toFixed(1)) : 0;

      if (diff > 0) runningGain += diff;
      else runningLoss += Math.abs(diff);

      profile.push({
        distance: Number(distKm.toFixed(1)),
        elevation: elev,
        slope: Math.max(-25, Math.min(25, slope)),
      });
    } else {
      profile.push({
        distance: 0,
        elevation: elev,
        slope: 0,
      });
    }

    prevElev = elev;
  }

  return {
    profile,
    gain: Math.round(runningGain),
    loss: Math.round(runningLoss),
    minElevation: Math.round(minElev),
    maxElevation: Math.round(maxElev),
  };
}

/**
 * Fetches true topographic elevation along GPS coordinates from Open-Meteo DEM service.
 * Falls back gracefully to synthesized elevation profile if offline or service unavailable.
 */
export async function fetchElevationProfileOnline(
  coords: [number, number][],
  fallbackGain: number,
  variationSeed = 0
): Promise<{
  profile: ElevationPoint[];
  gain: number;
  loss: number;
  minElevation: number;
  maxElevation: number;
}> {
  if (coords.length < 2) {
    return computeElevationProfile(coords, fallbackGain, undefined, variationSeed);
  }

  const numSamples = Math.min(50, Math.max(20, Math.floor(coords.length / 10)));
  const sampleIndices: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    const idx = Math.min(
      coords.length - 1,
      Math.floor((i / (numSamples - 1)) * (coords.length - 1))
    );
    sampleIndices.push(idx);
  }

  const sampledCoords = sampleIndices.map((i) => coords[i]);
  const lats = sampledCoords.map((c) => c[1].toFixed(5)).join(',');
  const lons = sampledCoords.map((c) => c[0].toFixed(5)).join(',');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const elevations: number[] = data.elevation;

    if (!Array.isArray(elevations) || elevations.length !== numSamples) {
      throw new Error('Invalid elevation response format');
    }

    const profile: ElevationPoint[] = [];
    let runningGain = 0;
    let runningLoss = 0;
    let minElev = Infinity;
    let maxElev = -Infinity;
    let cumDist = 0;

    for (let i = 0; i < numSamples; i++) {
      const elev = Math.round(elevations[i]);
      minElev = Math.min(minElev, elev);
      maxElev = Math.max(maxElev, elev);

      if (i > 0) {
        const segDistMeters = haversineDistance(sampledCoords[i - 1], sampledCoords[i]);
        cumDist += segDistMeters / 1000;
        const diff = elev - elevations[i - 1];
        if (diff > 0) runningGain += diff;
        else runningLoss += Math.abs(diff);

        const slope = segDistMeters > 0 ? Number(((diff / segDistMeters) * 100).toFixed(1)) : 0;
        profile.push({
          distance: Number(cumDist.toFixed(1)),
          elevation: elev,
          slope: Math.max(-25, Math.min(25, slope)),
        });
      } else {
        profile.push({
          distance: 0,
          elevation: elev,
          slope: 0,
        });
      }
    }

    return {
      profile,
      gain: Math.round(runningGain),
      loss: Math.round(runningLoss),
      minElevation: Math.round(minElev),
      maxElevation: Math.round(maxElev),
    };
  } catch (_err) {
    // Graceful fallback to diversified procedural profile
    return computeElevationProfile(coords, fallbackGain, undefined, variationSeed);
  }
}

/**
 * Synthesizes roadbook turns along the coordinate trajectory
 */
export function generateTurnInstructions(
  coords: [number, number][],
  activity: 'bike' | 'hike'
): RouteInstruction[] {
  if (coords.length < 5) return [];

  const instructions: RouteInstruction[] = [
    {
      distanceKm: 0,
      text: activity === 'bike' ? 'Départ du circuit cyclable' : 'Départ de la randonnée',
      type: 'straight',
    },
  ];

  const totalDist = calculatePathDistance(coords) / 1000;
  const step = Math.max(1, Math.floor(coords.length / 8));

  const turnDescriptions = [
    'Bifurquer à droite sur la piste forestière',
    'Prendre à gauche vers le chemin du vallon',
    'Continuer tout droit le long de la rive',
    'Virage serré à droite - début de la montée',
    'Au carrefour des sentiers, suivre le balisage à gauche',
    'Point de vue panoramique - continuer sur le sentier principal',
    'Descente sinueuse, prudence',
    'Retour vers la voie verte principale',
  ];

  for (let i = step; i < coords.length - 1; i += step) {
    const p1 = coords[i - 1];
    const p2 = coords[i];
    const p3 = coords[i + 1];
    if (!p1 || !p2 || !p3) continue;

    const b1 = calculateBearing(p1, p2);
    const b2 = calculateBearing(p2, p3);
    let diff = b2 - b1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const currentDist = Number((calculatePathDistance(coords.slice(0, i)) / 1000).toFixed(1));
    let type: RouteInstruction['type'] = 'straight';
    let text = 'Continuer sur le chemin principal';

    if (diff > 45) {
      type = 'right';
      text = 'Tourner à droite';
    } else if (diff < -45) {
      type = 'left';
      text = 'Tourner à gauche';
    } else if (diff > 15) {
      type = 'slight-right';
      text = 'Obliquer légèrement à droite';
    } else if (diff < -15) {
      type = 'slight-left';
      text = 'Obliquer légèrement à gauche';
    }

    const descIdx = (Math.floor(i / step) - 1) % turnDescriptions.length;
    instructions.push({
      distanceKm: currentDist,
      text: `${text} — ${turnDescriptions[descIdx]}`,
      type,
    });
  }

  instructions.push({
    distanceKm: Number(totalDist.toFixed(1)),
    text: 'Arrivée et fin de la boucle',
    type: 'straight',
  });

  return instructions;
}

/**
 * Parses GPX XML content directly in the browser
 */
export function parseGPXString(gpxXml: string): {
  title: string;
  description: string;
  coordinates: [number, number][];
  elevationProfile: ElevationPoint[];
  distanceKm: number;
  elevationGain: number;
} {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxXml, 'text/xml');

  const title =
    xmlDoc.querySelector('metadata > name')?.textContent ||
    xmlDoc.querySelector('trk > name')?.textContent ||
    'Trace importée GPX';

  const description =
    xmlDoc.querySelector('metadata > desc')?.textContent ||
    xmlDoc.querySelector('trk > desc')?.textContent ||
    'Trace GPX importée depuis un fichier local';

  const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));
  const coordinates: [number, number][] = [];
  const rawElevations: number[] = [];

  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');
    if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
      coordinates.push([lon, lat]);
      const ele = pt.querySelector('ele');
      if (ele && ele.textContent) {
        rawElevations.push(parseFloat(ele.textContent));
      }
    }
  });

  if (coordinates.length === 0) {
    throw new Error('Aucun point GPS valide trouvé dans le fichier GPX.');
  }

  const totalMeters = calculatePathDistance(coordinates);
  const distanceKm = Number((totalMeters / 1000).toFixed(2));

  // Compute elevation profile
  let elevationGain = 0;
  const elevationProfile: ElevationPoint[] = [];

  if (rawElevations.length === coordinates.length && rawElevations.length > 0) {
    let prevEle = rawElevations[0];
    let distAcc = 0;
    rawElevations.forEach((ele, idx) => {
      if (idx > 0) {
        distAcc += haversineDistance(coordinates[idx - 1], coordinates[idx]);
        const diff = ele - prevEle;
        if (diff > 0) elevationGain += diff;
      }
      if (idx % Math.max(1, Math.floor(rawElevations.length / 80)) === 0 || idx === rawElevations.length - 1) {
        elevationProfile.push({
          distance: Number((distAcc / 1000).toFixed(1)),
          elevation: Math.round(ele),
        });
      }
      prevEle = ele;
    });
  } else {
    // Estimate profile based on terrain
    const res = computeElevationProfile(coordinates, Math.round(distanceKm * 18) + 120);
    elevationGain = res.gain;
    res.profile.forEach((p) => elevationProfile.push(p));
  }

  return {
    title,
    description,
    coordinates,
    elevationProfile,
    distanceKm,
    elevationGain: Math.round(elevationGain),
  };
}

/**
 * Computes road breakdown (% car-free vs % shared road with cars)
 */
export function computeRoadBreakdown(
  totalKm: number,
  surfaceDistribution: { type: string; percentage: number }[],
  activity: 'bike' | 'hike'
): RoadTypeBreakdown {
  let carFreePct = 0;
  for (const item of surfaceDistribution) {
    const text = item.type.toLowerCase();
    const isShared =
      text.includes('route') ||
      text.includes('liaison') ||
      text.includes('village') ||
      (text.includes('asphalte') && !text.includes('voie verte') && !text.includes('piste'));

    if (!isShared) {
      carFreePct += item.percentage;
    }
  }

  // Sensible defaults if not explicitly defined
  if (carFreePct === 0) {
    carFreePct = activity === 'hike' ? 88 : 72;
  }
  carFreePct = Math.min(100, Math.max(10, Math.round(carFreePct)));
  const sharedRoadPct = 100 - carFreePct;

  const carFreeKm = Number(((totalKm * carFreePct) / 100).toFixed(1));
  const sharedRoadKm = Number((totalKm - carFreeKm).toFixed(1));

  let safetyRating: RoadTypeBreakdown['safetyRating'] = 'high';
  if (carFreePct >= 80) safetyRating = 'maximal';
  else if (carFreePct >= 60) safetyRating = 'high';
  else if (carFreePct >= 40) safetyRating = 'moderate';
  else safetyRating = 'caution';

  return {
    carFreePercentage: carFreePct,
    sharedRoadPercentage: sharedRoadPct,
    carFreeKm,
    sharedRoadKm,
    carFreeLabel:
      activity === 'hike'
        ? 'Sentiers piétons, chemins forestiers & voies vertes (0 voiture)'
        : 'Voies vertes, pistes cyclables réservées & chemins sans voiture',
    sharedRoadLabel: 'Petites routes ouvertes à la circulation motorisée (partage de voirie)',
    safetyRating,
  };
}

/**
 * Splits coordinates into colored segments distinguishing car-free vs shared roads with cars
 */
export function generateTrackSegments(
  coords: [number, number][],
  carFreePct: number
): TrackSegment[] {
  if (coords.length < 3) {
    return [
      {
        coordinates: coords,
        roadType: carFreePct >= 50 ? 'car_free' : 'shared_road',
        label: carFreePct >= 50 ? 'Voie sans voiture' : 'Route ouverte aux voitures',
      },
    ];
  }

  // 100% car-free
  if (carFreePct >= 96) {
    return [
      {
        coordinates: coords,
        roadType: 'car_free',
        label: 'Voie verte & sentier protégé (0 voiture)',
      },
    ];
  }

  // 100% shared road
  if (carFreePct <= 5) {
    return [
      {
        coordinates: coords,
        roadType: 'shared_road',
        label: 'Route ouverte à la circulation motorisée',
      },
    ];
  }

  // Realistic loop distribution: start and end usually connect via local roads, core on greenways/trails
  const sharedRatio = (100 - carFreePct) / 100;
  const startRoadLen = Math.max(2, Math.floor(coords.length * (sharedRatio * 0.45)));
  const endRoadLen = Math.max(2, Math.floor(coords.length * (sharedRatio * 0.55)));
  const middleStart = Math.min(coords.length - 2, startRoadLen);
  const middleEnd = Math.max(middleStart + 2, coords.length - endRoadLen);

  const segments: TrackSegment[] = [];

  // Segment 1: Starting road link
  if (middleStart > 1) {
    segments.push({
      coordinates: coords.slice(0, middleStart + 1),
      roadType: 'shared_road',
      label: 'Liaison départ : route ouverte aux voitures',
    });
  }

  // Segment 2: Protected greenway / natural track
  if (middleEnd > middleStart) {
    segments.push({
      coordinates: coords.slice(middleStart, middleEnd + 1),
      roadType: 'car_free',
      label: 'Voie verte & sentier réservé (sans voiture)',
    });
  }

  // Segment 3: Return road link
  if (middleEnd < coords.length - 1) {
    segments.push({
      coordinates: coords.slice(middleEnd),
      roadType: 'shared_road',
      label: 'Liaison retour : route ouverte aux voitures',
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          coordinates: coords,
          roadType: 'car_free',
          label: 'Voie verte & sentier protégé (sans voiture)',
        },
      ];
}
