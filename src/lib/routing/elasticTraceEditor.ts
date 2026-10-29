import type { RouteSuggestions, RouteTrace } from '../../types';
import { haversineDistance } from '../geoUtils';
import { getInterpolatedElevation, findNearestGazetteerPlace } from './subSection';
import {
  buildOriginalLeg,
  routeSingleLeg,
  assembleLegsIntoRouteResult,
  type CalculatedRouteResult,
  type SegmentRoutingMode,
  type RoutedLegResult,
} from './segmentRouter';
import { countSharedPassagePoints } from './spurPruner';
import type { ActivityType } from './routingProfiles';
import { chainMultiSegmentsToContinuousLine } from '../cycleways/cyclewayGeometry';

export type SubTraceReturnMode = 'out_and_back' | 'loop_trail' | 'one_way';

export interface SubTraceSliceInfo {
  startKm: number;
  endKm: number;
  totalParentKm: number;
  forwardDistanceKm: number;
  estimatedTotalDistanceKm: number;
  returnMode: SubTraceReturnMode;
  startPlaceName: string;
  endPlaceName: string;
  startCoord: [number, number]; // [lat, lon]
  endCoord: [number, number]; // [lat, lon]
  turnaroundWaypointIndex: number;
  parentCoordsLatLng: [number, number][]; // [lat, lon][]
  suggestedTitle: string;
  suggestedDescription: string;
}

/**
 * Représente un segment entre deux waypoints consécutifs W[i] -> W[i+1] (ou W[n-1] -> W[0] en boucle).
 * - Si `source === 'original'`, `originalSlice` contient les coordonnées exactes 100% intactes de la trace GPX d'origine.
 * - Dès que l'utilisateur modifie W[i], W[i+1] ou insère un point dans ce segment, `source` passe à `'trail'` (ou `'direct'`).
 */
export interface SurgicalSegmentMeta {
  source: SegmentRoutingMode; // 'original' | 'trail' | 'direct'
  originalSlice?: [number, number, number?][];
}

export interface SurgicalTraceState {
  waypoints: [number, number][]; // [lon, lat]
  segmentMetas: SurgicalSegmentMeta[];
  isLoop: boolean;
}

/**
 * Convertit les coordonnées 2D/3D et le profil d'élévation d'une RouteTrace en coordonnées 3D [lon, lat, ele].
 */
export function extract3DCoordinatesFromTrace(
  trace: RouteTrace,
  route?: RouteSuggestions | null
): [number, number, number?][] {
  let raw: [number, number, number?][] = [];
  if (Array.isArray(trace.coordinates[0]?.[0])) {
    raw = chainMultiSegmentsToContinuousLine(
      trace.coordinates as unknown as [number, number, number?][][]
    );
  } else {
    raw = trace.coordinates as [number, number, number?][];
  }

  if (!raw || raw.length === 0) return [];

  const profile = trace.elevationProfile || [];
  let accumMeters = 0;
  const fallbackBaseEle = route?.minElevation ?? 300;

  return raw.map((pt, idx) => {
    if (idx > 0) {
      const prev = raw[idx - 1];
      accumMeters += haversineDistance([prev[0], prev[1]], [pt[0], pt[1]]);
    }
    const existingEle = pt[2];
    if (typeof existingEle === 'number' && !isNaN(existingEle)) {
      return [pt[0], pt[1], existingEle];
    }
    const distKm = accumMeters / 1000;
    const ele =
      profile.length > 0
        ? getInterpolatedElevation(profile, distKm)
        : fallbackBaseEle;
    return [pt[0], pt[1], ele];
  });
}

/**
 * Découpe une trace GPX existante en segments natifs verrouillés (`source: 'original'`).
 * Garantit qu'à l'ouverture du mode modification, la trace affichée est 100% identique
 * au mètre près à la trace originale, tout en permettant de modifier n'importe quel tronçon localement.
 */
export function buildInitialSurgicalStateFromTrace(
  trace: RouteTrace,
  route?: RouteSuggestions | null
): SurgicalTraceState {
  const coords3D = extract3DCoordinatesFromTrace(trace, route);
  if (coords3D.length < 2) {
    return {
      waypoints: coords3D.map(([lon, lat]) => [lon, lat]),
      segmentMetas: [],
      isLoop: true,
    };
  }

  // Calcul des distances cumulées le long de la trace
  const cumMeters: number[] = [0];
  let totalMeters = 0;
  for (let i = 1; i < coords3D.length; i++) {
    totalMeters += haversineDistance(
      [coords3D[i - 1][0], coords3D[i - 1][1]],
      [coords3D[i][0], coords3D[i][1]]
    );
    cumMeters.push(totalMeters);
  }

  const first = coords3D[0];
  const last = coords3D[coords3D.length - 1];
  const startEndDist = haversineDistance([first[0], first[1]], [last[0], last[1]]);
  const isLoop = startEndDist < 180 && totalMeters > 400;

  // Nombre d'ancres adaptatif (1 ancre tous les ~900m à 1.5km, entre 8 et 18 ancres)
  // pour que chaque modification reste strictement locale autour de l'endroit touché
  const totalKm = totalMeters / 1000;
  const targetSegments = Math.max(8, Math.min(18, Math.round(totalKm / 1.1)));

  const anchorIndices: number[] = [0];
  for (let s = 1; s < targetSegments; s++) {
    const targetDist = (s / targetSegments) * totalMeters;
    let bestIdx = anchorIndices[anchorIndices.length - 1] + 1;
    for (let i = bestIdx; i < coords3D.length - 1; i++) {
      if (cumMeters[i] >= targetDist) {
        bestIdx = i;
        break;
      }
    }
    if (
      bestIdx > anchorIndices[anchorIndices.length - 1] &&
      bestIdx < coords3D.length - 1
    ) {
      anchorIndices.push(bestIdx);
    }
  }

  if (!isLoop) {
    anchorIndices.push(coords3D.length - 1);
  }

  const waypoints: [number, number][] = anchorIndices.map((idx) => [
    Number(coords3D[idx][0].toFixed(6)),
    Number(coords3D[idx][1].toFixed(6)),
  ]);

  const segmentMetas: SurgicalSegmentMeta[] = [];
  for (let i = 0; i < anchorIndices.length - 1; i++) {
    const startIdx = anchorIndices[i];
    const endIdx = anchorIndices[i + 1];
    segmentMetas.push({
      source: 'original',
      originalSlice: coords3D.slice(startIdx, endIdx + 1),
    });
  }

  // En mode boucle, le dernier segment relie la dernière ancre au point de départ (fin de la trace GPX)
  if (isLoop && anchorIndices.length >= 2) {
    const lastAnchorIdx = anchorIndices[anchorIndices.length - 1];
    const closingSlice = coords3D.slice(lastAnchorIdx);
    if (
      closingSlice.length > 0 &&
      haversineDistance(
        [closingSlice[closingSlice.length - 1][0], closingSlice[closingSlice.length - 1][1]],
        [coords3D[0][0], coords3D[0][1]]
      ) > 3
    ) {
      closingSlice.push(coords3D[0]);
    }
    segmentMetas.push({
      source: 'original',
      originalSlice: closingSlice,
    });
  }

  return {
    waypoints,
    segmentMetas,
    isLoop,
  };
}

/**
 * Calcule le parcours complet à partir de l'état chirurgical :
 * - Les segments `source === 'original'` sont restitués instantanément à 100% à l'identique (0 appel réseau).
 * - Seuls les segments modifiés (`source === 'trail'` ou `'direct'`) sont calculés avec contraintes
 *   d'évitement (`forbiddenCoords` / `&nogos=`) contre tous les autres tronçons du circuit,
 *   plus une inversion de priorité bidirectionnelle sur les segments adjacents modifiés
 *   afin de former une vraie boucle sans jamais repasser par le même point.
 */
export async function computeSurgicalRoute(
  state: SurgicalTraceState,
  options: {
    activity: ActivityType;
    defaultRoutingMode?: SegmentRoutingMode;
    filters?: string[];
  }
): Promise<CalculatedRouteResult | null> {
  const { waypoints, segmentMetas, isLoop } = state;
  const { activity, defaultRoutingMode = 'trail', filters = [] } = options;

  if (!waypoints || waypoints.length < 2) {
    return null;
  }

  const totalLegs = isLoop ? waypoints.length : waypoints.length - 1;
  const legs: (RoutedLegResult | null)[] = new Array(totalLegs).fill(null);
  const legModes: ('original' | 'trail' | 'direct' | 'skip')[] = new Array(totalLegs).fill('trail');

  // 1. Figer tous les segments originaux intacts et collecter leurs coordonnées dans usedCoords
  const usedCoords: [number, number, number?][] = [];

  for (let i = 0; i < totalLegs; i++) {
    const from = waypoints[i];
    const to = waypoints[(i + 1) % waypoints.length];

    // En boucle, si le dernier point est déjà superposé au premier, on ignore le segment de fermeture vide
    if (isLoop && i === waypoints.length - 1 && haversineDistance(from, to) < 8) {
      const meta = segmentMetas[i];
      if (!meta || meta.source !== 'original' || !meta.originalSlice || meta.originalSlice.length < 3) {
        legModes[i] = 'skip';
        continue;
      }
    }

    const meta = segmentMetas[i];
    if (
      meta &&
      meta.source === 'original' &&
      meta.originalSlice &&
      meta.originalSlice.length >= 2
    ) {
      const origLeg = buildOriginalLeg(meta.originalSlice);
      legs[i] = origLeg;
      legModes[i] = 'original';
      usedCoords.push(...origLeg.coordinates);
    } else {
      const mode: SegmentRoutingMode =
        meta?.source === 'direct'
          ? 'direct'
          : meta?.source === 'free'
          ? 'free'
          : defaultRoutingMode === 'direct'
          ? 'direct'
          : defaultRoutingMode === 'free'
          ? 'free'
          : 'trail';
      legModes[i] = mode;
    }
  }

  // 2. Router séquentiellement les segments modifiés en évitant tous les tronçons déjà empruntés (en mode 'trail')
  for (let i = 0; i < totalLegs; i++) {
    if (legModes[i] === 'skip' || legModes[i] === 'original') {
      continue;
    }

    const from = waypoints[i];
    const to = waypoints[(i + 1) % waypoints.length];
    const mode = legModes[i];

    let leg = await routeSingleLeg(from, to, {
      activity,
      mode,
      filters,
      forbiddenCoords: mode === 'trail' ? usedCoords : undefined,
    });

    // Si deux segments consécutifs (i-1 et i) ont été routés en mode 'trail' et partagent encore
    // un carrefour / cul-de-sac commun autour de waypoints[i], tester l'ordre inverse (router i d'abord puis i-1)
    if (
      mode === 'trail' &&
      i > 0 &&
      legModes[i - 1] === 'trail' &&
      legs[i - 1] !== null
    ) {
      const prevLeg = legs[i - 1]!;
      const sharedWithPrev = countSharedPassagePoints(
        prevLeg.coordinates,
        leg.coordinates,
        waypoints[i]
      );

      if (sharedWithPrev >= 3) {
        const otherCoords: [number, number, number?][] = [];
        for (let k = 0; k < totalLegs; k++) {
          if (k !== i - 1 && k !== i && legs[k]) {
            otherCoords.push(...legs[k]!.coordinates);
          }
        }

        const altCurrLeg = await routeSingleLeg(from, to, {
          activity,
          mode,
          filters,
          forbiddenCoords: otherCoords,
        });
        const altPrevLeg = await routeSingleLeg(waypoints[i - 1], waypoints[i], {
          activity,
          mode,
          filters,
          forbiddenCoords: [...otherCoords, ...altCurrLeg.coordinates],
        });

        const altShared = countSharedPassagePoints(
          altPrevLeg.coordinates,
          altCurrLeg.coordinates,
          waypoints[i]
        );

        if (altShared < sharedWithPrev) {
          legs[i - 1] = altPrevLeg;
          leg = altCurrLeg;
        }
      }
    }

    legs[i] = leg;
    usedCoords.push(...leg.coordinates);
  }

  const finalLegs = legs.filter((l): l is RoutedLegResult => l !== null);
  return assembleLegsIntoRouteResult(finalLegs, waypoints, activity, {
    preserveOutAndBack: true,
  });
}

/**
 * Calcule la distance totale cumulée en kilomètres d'une RouteTrace.
 */
export function computeTraceTotalDistanceKm(trace: RouteTrace): number {
  const coords3D = extract3DCoordinatesFromTrace(trace);
  if (coords3D.length < 2) {
    return trace.distance ? Number((trace.distance / 1000).toFixed(2)) : 0;
  }
  let totalMeters = 0;
  for (let i = 1; i < coords3D.length; i++) {
    totalMeters += haversineDistance(
      [coords3D[i - 1][0], coords3D[i - 1][1]],
      [coords3D[i][0], coords3D[i][1]]
    );
  }
  return Number((totalMeters / 1000).toFixed(2));
}

/**
 * Projette un clic carte (lat, lng) sur la trace parente et renvoie le kilomètre exact le plus proche.
 */
export function projectLatLngToTraceKm(
  trace: RouteTrace,
  lat: number,
  lng: number
): number {
  const coords3D = extract3DCoordinatesFromTrace(trace);
  if (coords3D.length < 2) return 0;

  let accumMeters = 0;
  let bestDistToClick = Infinity;
  let bestKm = 0;

  for (let i = 0; i < coords3D.length; i++) {
    if (i > 0) {
      accumMeters += haversineDistance(
        [coords3D[i - 1][0], coords3D[i - 1][1]],
        [coords3D[i][0], coords3D[i][1]]
      );
    }
    const d = haversineDistance([lng, lat], [coords3D[i][0], coords3D[i][1]]);
    if (d < bestDistToClick) {
      bestDistToClick = d;
      bestKm = accumMeters / 1000;
    }
  }

  return Number(bestKm.toFixed(1));
}

/**
 * Construit un état chirurgical de Sous-Trace (avec retour inclus au choix) à partir d'une trace existante :
 * - `out_and_back` : Aller sur la trace [startKm -> endKm] + Retour exact sur la même trace [endKm -> startKm] (100% piste cyclable / voie verte, 0 appel API).
 * - `loop_trail`   : Aller sur la trace [startKm -> endKm] (`original`) + Retour bouclé par voies/sentiers annexes (`trail`) pour former une boucle variée.
 * - `one_way`      : Aller simple [startKm -> endKm] sur la trace parente (`isLoop: false`).
 */
export function buildSurgicalStateFromSubTrace(
  trace: RouteTrace,
  route: RouteSuggestions | null | undefined,
  startKm: number,
  endKm: number,
  returnMode: SubTraceReturnMode = 'out_and_back'
): { surgicalState: SurgicalTraceState; info: SubTraceSliceInfo } {
  const coords3D = extract3DCoordinatesFromTrace(trace, route);
  const parentCoordsLatLng: [number, number][] = coords3D.map(([lon, lat]) => [lat, lon]);

  if (coords3D.length < 2) {
    const fallbackCoord: [number, number] = coords3D[0]
      ? [coords3D[0][1], coords3D[0][0]]
      : [49.61, 6.13];
    return {
      surgicalState: {
        waypoints: coords3D.map(([lon, lat]) => [lon, lat]),
        segmentMetas: [],
        isLoop: returnMode !== 'one_way',
      },
      info: {
        startKm: 0,
        endKm: 0,
        totalParentKm: 0,
        forwardDistanceKm: 0,
        estimatedTotalDistanceKm: 0,
        returnMode,
        startPlaceName: 'Départ',
        endPlaceName: 'Arrivée',
        startCoord: fallbackCoord,
        endCoord: fallbackCoord,
        turnaroundWaypointIndex: 0,
        parentCoordsLatLng,
        suggestedTitle: route?.title ? `${route.title} (Sous-trace)` : 'Sous-trace',
        suggestedDescription: 'Sous-trace personnalisée',
      },
    };
  }

  // Distances cumulées le long de la trace parente
  const cumMeters: number[] = [0];
  let totalMeters = 0;
  for (let i = 1; i < coords3D.length; i++) {
    totalMeters += haversineDistance(
      [coords3D[i - 1][0], coords3D[i - 1][1]],
      [coords3D[i][0], coords3D[i][1]]
    );
    cumMeters.push(totalMeters);
  }

  const totalParentKm = Math.max(0.5, Number((totalMeters / 1000).toFixed(1)));
  const minSpanKm = Math.min(0.5, totalParentKm * 0.25);

  const safeStartKm = Number(
    Math.max(0, Math.min(startKm, totalParentKm - minSpanKm)).toFixed(1)
  );
  const safeEndKm = Number(
    Math.max(safeStartKm + minSpanKm, Math.min(endKm, totalParentKm)).toFixed(1)
  );

  const startTargetM = safeStartKm * 1000;
  const endTargetM = safeEndKm * 1000;

  let startIdx = 0;
  for (let i = 0; i < cumMeters.length; i++) {
    if (cumMeters[i] >= startTargetM) {
      startIdx = i;
      break;
    }
  }

  let endIdx = coords3D.length - 1;
  for (let i = startIdx + 1; i < cumMeters.length; i++) {
    if (cumMeters[i] >= endTargetM) {
      endIdx = i;
      break;
    }
  }

  if (endIdx <= startIdx) {
    endIdx = Math.min(coords3D.length - 1, startIdx + 1);
  }

  const forwardSlice3D = coords3D.slice(startIdx, endIdx + 1);
  const subCumMeters: number[] = [0];
  let forwardMeters = 0;
  for (let i = 1; i < forwardSlice3D.length; i++) {
    forwardMeters += haversineDistance(
      [forwardSlice3D[i - 1][0], forwardSlice3D[i - 1][1]],
      [forwardSlice3D[i][0], forwardSlice3D[i][1]]
    );
    subCumMeters.push(forwardMeters);
  }

  const forwardDistanceKm = Number((forwardMeters / 1000).toFixed(1));

  // Nombre de sous-segments sur l'aller (entre 3 et 6 pour garder des ancres propres et maniables)
  const forwardSegCount = Math.max(
    2,
    Math.min(6, Math.round(Math.max(1, forwardDistanceKm) / 2.2))
  );

  const subAnchorIndices: number[] = [0];
  for (let s = 1; s < forwardSegCount; s++) {
    const targetM = (s / forwardSegCount) * forwardMeters;
    let bestIdx = subAnchorIndices[subAnchorIndices.length - 1] + 1;
    for (let i = bestIdx; i < forwardSlice3D.length - 1; i++) {
      if (subCumMeters[i] >= targetM) {
        bestIdx = i;
        break;
      }
    }
    if (
      bestIdx > subAnchorIndices[subAnchorIndices.length - 1] &&
      bestIdx < forwardSlice3D.length - 1
    ) {
      subAnchorIndices.push(bestIdx);
    }
  }
  subAnchorIndices.push(forwardSlice3D.length - 1);

  const forwardWaypoints: [number, number][] = subAnchorIndices.map((idx) => [
    Number(forwardSlice3D[idx][0].toFixed(6)),
    Number(forwardSlice3D[idx][1].toFixed(6)),
  ]);

  const forwardMetas: SurgicalSegmentMeta[] = [];
  for (let i = 0; i < subAnchorIndices.length - 1; i++) {
    const a = subAnchorIndices[i];
    const b = subAnchorIndices[i + 1];
    forwardMetas.push({
      source: 'original',
      originalSlice: forwardSlice3D.slice(a, b + 1),
    });
  }

  const turnaroundWaypointIndex = forwardWaypoints.length - 1;
  let waypoints: [number, number][] = [...forwardWaypoints];
  let segmentMetas: SurgicalSegmentMeta[] = [...forwardMetas];
  let isLoop = returnMode !== 'one_way';

  if (returnMode === 'out_and_back') {
    // Retour intégral sur la trace d'origine en sens inverse (B -> A)
    // On ajoute les ancres intermédiaires en sens inverse [k-1 ... 1], et le segment de fermeture boucle vers W[0] (A)
    const returnIntermediateWaypoints: [number, number][] = [];
    for (let i = forwardWaypoints.length - 2; i >= 1; i--) {
      returnIntermediateWaypoints.push([forwardWaypoints[i][0], forwardWaypoints[i][1]]);
    }
    waypoints = [...forwardWaypoints, ...returnIntermediateWaypoints];

    const returnMetas: SurgicalSegmentMeta[] = [];
    for (let i = forwardMetas.length - 1; i >= 0; i--) {
      const orig = forwardMetas[i].originalSlice || [];
      returnMetas.push({
        source: 'original',
        originalSlice: [...orig].reverse(),
      });
    }
    segmentMetas = [...forwardMetas, ...returnMetas];
    isLoop = true;
  } else if (returnMode === 'loop_trail') {
    // Aller sur la trace originale (A -> B), et retour automatique par les voies/sentiers annexes (B -> A)
    waypoints = [...forwardWaypoints];
    segmentMetas = [
      ...forwardMetas,
      {
        source: 'trail',
      },
    ];
    isLoop = true;
  } else {
    // Aller simple (A -> B)
    waypoints = [...forwardWaypoints];
    segmentMetas = [...forwardMetas];
    isLoop = false;
  }

  const firstPt = forwardSlice3D[0];
  const lastPt = forwardSlice3D[forwardSlice3D.length - 1];
  const startCoord: [number, number] = [firstPt[1], firstPt[0]];
  const endCoord: [number, number] = [lastPt[1], lastPt[0]];

  const startPlace = findNearestGazetteerPlace([firstPt[0], firstPt[1]]);
  const endPlace = findNearestGazetteerPlace([lastPt[0], lastPt[1]]);
  const startPlaceName = startPlace ? startPlace.name : 'Départ';
  const endPlaceName = endPlace ? endPlace.name : 'Arrivée';

  const estimatedTotalDistanceKm =
    returnMode === 'out_and_back'
      ? Number((forwardDistanceKm * 2).toFixed(1))
      : returnMode === 'loop_trail'
      ? Number((forwardDistanceKm * 2.05).toFixed(1))
      : forwardDistanceKm;

  const baseTitle = (route?.title || 'Parcours Vélo')
    .replace(/\s*\((Variante|Sous-trace).*?\)\s*/gi, '')
    .trim();

  const modeBadge =
    returnMode === 'out_and_back'
      ? 'A/R'
      : returnMode === 'loop_trail'
      ? 'Boucle'
      : 'Aller simple';

  const arrow = returnMode === 'one_way' ? '→' : '⇄';
  const suggestedTitle = `${baseTitle} • ${startPlaceName} ${arrow} ${endPlaceName} (${estimatedTotalDistanceKm} km ${modeBadge})`;

  const returnDesc =
    returnMode === 'out_and_back'
      ? `Aller-retour inclus sur la trace (${forwardDistanceKm} km aller + ${forwardDistanceKm} km retour = ${estimatedTotalDistanceKm} km au total).`
      : returnMode === 'loop_trail'
      ? `Aller sur la trace originale (${forwardDistanceKm} km) et retour en boucle par les voies cyclables et sentiers.`
      : `Tronçon aller simple de ${forwardDistanceKm} km extrait de la trace originale.`;

  const suggestedDescription = `Sous-trace extraite de « ${baseTitle} » entre ${startPlaceName} (km ${safeStartKm}) et ${endPlaceName} (km ${safeEndKm}). ${returnDesc}`;

  return {
    surgicalState: {
      waypoints,
      segmentMetas,
      isLoop,
    },
    info: {
      startKm: safeStartKm,
      endKm: safeEndKm,
      totalParentKm,
      forwardDistanceKm,
      estimatedTotalDistanceKm,
      returnMode,
      startPlaceName,
      endPlaceName,
      startCoord,
      endCoord,
      turnaroundWaypointIndex,
      parentCoordsLatLng,
      suggestedTitle,
      suggestedDescription,
    },
  };
}
