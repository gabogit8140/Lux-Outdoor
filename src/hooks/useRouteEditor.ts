import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';
import { haversineDistance } from '../lib/geoUtils';
import {
  computeOutdoorRouteFromWaypoints,
  type CalculatedRouteResult,
  type SegmentRoutingMode,
} from '../lib/routing/outdoorRouter';
import { generateCalibratedOutdoorLoop } from '../lib/routing/loopGenerator';
import {
  buildInitialSurgicalStateFromTrace,
  buildSurgicalStateFromSubTrace,
  computeTraceTotalDistanceKm,
  projectLatLngToTraceKm,
  computeSurgicalRoute,
  type SurgicalSegmentMeta,
  type SubTraceReturnMode,
  type SubTraceSliceInfo,
} from '../lib/routing/elasticTraceEditor';
import {
  projectPointOntoRouteSegments,
  detectSegmentOrderAnomalies,
  optimizeWaypointsOrder2Opt,
  type SegmentOrderAnomaly,
} from '../lib/routing/routeGeometry';

export interface EditorHistorySnapshot {
  waypoints: [number, number][];
  segmentMetas: SurgicalSegmentMeta[];
  isLoop: boolean;
}

export interface UseRouteEditorReturn {
  isEditorActive: boolean;
  editorMode: 'create' | 'edit';
  activity: 'bike' | 'hike';
  setActivity: (a: 'bike' | 'hike') => void;
  routingMode: SegmentRoutingMode;
  setRoutingMode: (mode: SegmentRoutingMode) => void;
  originalRoute: RouteSuggestions | null;
  originalTrace: RouteTrace | null;
  waypoints: [number, number][]; // [lon, lat]
  segmentMetas: SurgicalSegmentMeta[];
  selectedWaypointIndex: number | null;
  setSelectedWaypointIndex: (index: number | null) => void;
  highlightedSegmentIndex: number | null;
  setHighlightedSegmentIndex: (index: number | null) => void;
  orderAnomalies: SegmentOrderAnomaly[];
  isLoop: boolean;
  calculatedResult: CalculatedRouteResult | null;
  isCalculating: boolean;
  loopCalibrationPass: number | null;
  targetLoopDistanceKm: number | null;
  isSaveModalOpen: boolean;
  isLoopModalOpen: boolean;
  isSegmentsDashboardOpen: boolean;
  isSubTracePanelOpen: boolean;
  subTraceInfo: SubTraceSliceInfo | null;
  subTraceStartKm: number;
  subTraceEndKm: number;
  subTraceReturnMode: SubTraceReturnMode;
  subTracePickTarget: 'start' | 'end' | null;
  canUndo: boolean;
  canRedo: boolean;
  startCreating: (act?: 'bike' | 'hike') => void;
  startEditing: (route: RouteSuggestions, trace: RouteTrace) => void;
  startSubTraceSlicing: (
    route: RouteSuggestions,
    trace: RouteTrace,
    initialReturnMode?: SubTraceReturnMode,
    focusKmHint?: number
  ) => void;
  openSubTracePanel: () => void;
  closeSubTracePanel: () => void;
  toggleSubTracePanel: () => void;
  updateSubTraceRange: (
    startKm: number,
    endKm: number,
    returnMode?: SubTraceReturnMode
  ) => void;
  setSubTraceReturnMode: (mode: SubTraceReturnMode) => void;
  setSubTracePickTarget: (target: 'start' | 'end' | null) => void;
  handleParentTraceTapKm: (km: number) => void;
  addWaypoint: (lat: number, lng: number) => void;
  handleMapTap: (lat: number, lng: number) => void;
  insertWaypoint: (index: number, lat: number, lng: number) => void;
  updateWaypoint: (index: number, lat: number, lng: number) => void;
  removeWaypoint: (index: number) => void;
  reorderWaypoints: (fromIndex: number, toIndex: number) => void;
  swapWaypoints: (indexA: number, indexB: number) => void;
  setStartWaypoint: (index: number) => void;
  toggleSegmentRoutingMode: (segmentIndex: number) => void;
  autoOptimizeOrder: () => boolean;
  toggleSelectedWaypointDirectMode: () => void;
  resetToOriginalTrace: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  toggleLoop: () => void;
  reverseDirection: () => void;
  openSaveModal: () => void;
  closeSaveModal: () => void;
  openLoopModal: () => void;
  closeLoopModal: () => void;
  openSegmentsDashboard: () => void;
  closeSegmentsDashboard: () => void;
  toggleSegmentsDashboard: () => void;
  generateProposedLoop: (
    startCoords: [number, number],
    targetDistanceKm: number,
    directionAngle?: number
  ) => void;
  cancel: () => void;
}

/**
 * Reconstruit intelligemment les métadonnées de segments après une réorganisation de l'ordre des étapes.
 * - Si deux étapes consécutives dans le nouvel ordre étaient déjà consécutives dans l'ancien ordre,
 *   leur segment existant (ex: 'original') est préservé.
 * - Si la liaison est nouvelle, son mode passe à `defaultMode` ('trail' par défaut) afin que BRouter/OSRM
 *   relie automatiquement les segments entre eux en suivant les sentiers selon l'ordre choisi.
 */
function rebuildSegmentMetasForNewOrder(
  newOrderIndices: number[],
  prevMetas: SurgicalSegmentMeta[],
  oldWaypointsCount: number,
  isLoop: boolean,
  defaultMode: SegmentRoutingMode
): SurgicalSegmentMeta[] {
  const n = newOrderIndices.length;
  if (n < 2) return [];
  const totalSegs = isLoop ? n : n - 1;
  const nextMetas: SurgicalSegmentMeta[] = [];

  for (let i = 0; i < totalSegs; i++) {
    const oldA = newOrderIndices[i];
    const oldB = newOrderIndices[(i + 1) % n];

    // Même liaison directe qu'avant (oldA -> oldB)
    const wasForwardAdjacent =
      oldB === oldA + 1 || (isLoop && oldA === oldWaypointsCount - 1 && oldB === 0);
    // Liaison inversée (oldB -> oldA)
    const wasReverseAdjacent =
      oldA === oldB + 1 || (isLoop && oldB === oldWaypointsCount - 1 && oldA === 0);

    if (wasForwardAdjacent && prevMetas[oldA]) {
      nextMetas.push({ ...prevMetas[oldA] });
    } else if (
      wasReverseAdjacent &&
      prevMetas[oldB]?.source === 'original' &&
      prevMetas[oldB]?.originalSlice
    ) {
      nextMetas.push({
        source: 'original',
        originalSlice: [...prevMetas[oldB].originalSlice!].reverse(),
      });
    } else {
      // Nouvelle jonction : liaison automatique par les sentiers réels
      nextMetas.push({ source: defaultMode === 'direct' ? 'direct' : 'trail' });
    }
  }

  return nextMetas;
}

export function useRouteEditor(defaultActivity: 'bike' | 'hike' = 'hike'): UseRouteEditorReturn {
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [activity, setActivity] = useState<'bike' | 'hike'>(defaultActivity);
  const [routingMode, setRoutingMode] = useState<SegmentRoutingMode>('trail');
  const [originalRoute, setOriginalRoute] = useState<RouteSuggestions | null>(null);
  const [originalTrace, setOriginalTrace] = useState<RouteTrace | null>(null);

  // Liste ordonnée des points de passage [lon, lat]
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  // Métadonnées chirurgicales par segment (conserve 'original' sur les tronçons intacts)
  const [segmentMetas, setSegmentMetas] = useState<SurgicalSegmentMeta[]>([]);

  // Étape sélectionnée explicitement par l'utilisateur pour être déplacée ou supprimée
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);
  // Segment mis en surbrillance depuis le Dashboard d'organisation des segments
  const [highlightedSegmentIndex, setHighlightedSegmentIndex] = useState<number | null>(null);

  // Par défaut, les nouvelles traces sont des boucles qui reviennent au point de départ
  const [isLoop, setIsLoop] = useState<boolean>(true);

  // Résultat du calcul de tracé sur les sentiers réels
  const [calculatedResult, setCalculatedResult] = useState<CalculatedRouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loopCalibrationPass, setLoopCalibrationPass] = useState<number | null>(null);
  const [targetLoopDistanceKm, setTargetLoopDistanceKm] = useState<number | null>(null);

  // Historiques Undo / Redo complets
  const [history, setHistory] = useState<EditorHistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorHistorySnapshot[]>([]);

  // Modales & Dashboard d'organisation des segments + Studio de Sous-Trace (avec retour inclus)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);
  const [isSegmentsDashboardOpen, setIsSegmentsDashboardOpen] = useState(false);
  const [isSubTracePanelOpen, setIsSubTracePanelOpen] = useState(false);
  const [subTraceInfo, setSubTraceInfo] = useState<SubTraceSliceInfo | null>(null);
  const [subTraceStartKm, setSubTraceStartKm] = useState<number>(0);
  const [subTraceEndKm, setSubTraceEndKm] = useState<number>(10);
  const [subTraceReturnMode, setSubTraceReturnModeState] =
    useState<SubTraceReturnMode>('out_and_back');
  const [subTracePickTarget, setSubTracePickTarget] = useState<'start' | 'end' | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestIdRef = useRef<number>(0);

  // Détection en temps réel des segments possiblement intervertis
  const orderAnomalies = useMemo(() => {
    return detectSegmentOrderAnomalies(waypoints, isLoop);
  }, [waypoints, isLoop]);

  const stateRef = useRef({
    waypoints,
    segmentMetas,
    isLoop,
    activity,
    routingMode,
    editorMode,
    selectedWaypointIndex,
    calculatedResult,
    originalRoute,
    originalTrace,
    subTraceStartKm,
    subTraceEndKm,
    subTraceReturnMode,
    subTracePickTarget,
    subTraceInfo,
  });
  stateRef.current = {
    waypoints,
    segmentMetas,
    isLoop,
    activity,
    routingMode,
    editorMode,
    selectedWaypointIndex,
    calculatedResult,
    originalRoute,
    originalTrace,
    subTraceStartKm,
    subTraceEndKm,
    subTraceReturnMode,
    subTracePickTarget,
    subTraceInfo,
  };

  // Lance le calcul chirurgical par segment (relie automatiquement les segments sur les sentiers)
  const triggerRecalculate = useCallback(
    (
      pts: [number, number][],
      metas: SurgicalSegmentMeta[],
      loop: boolean,
      act: 'bike' | 'hike',
      defaultMode: SegmentRoutingMode = 'trail',
      immediate: boolean = false
    ) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (pts.length < 2) {
        setCalculatedResult(null);
        setIsCalculating(false);
        return;
      }

      setIsCalculating(true);
      const requestId = ++currentRequestIdRef.current;

      const execute = async () => {
        try {
          let result: CalculatedRouteResult | null = null;
          if (metas.length > 0) {
            result = await computeSurgicalRoute(
              { waypoints: pts, segmentMetas: metas, isLoop: loop },
              { activity: act, defaultRoutingMode: defaultMode }
            );
          } else {
            result = await computeOutdoorRouteFromWaypoints(pts, {
              activity: act,
              isLoop: loop,
              pruneSpurs: false,
              routingMode: defaultMode,
            });
          }

          if (requestId === currentRequestIdRef.current) {
            setCalculatedResult(result);
            if (result && result.waypointsUsed && result.waypointsUsed.length === pts.length) {
              const selIdx = stateRef.current.selectedWaypointIndex;
              let hasSnapped = false;
              const syncedWps = pts.map((pt, idx) => {
                if (idx === selIdx) return pt;
                const usedPt = result!.waypointsUsed[idx];
                // Micro-recalage uniquement si le point routé est très proche du clic (<= 35m)
                // Ne JAMAIS déplacer arbitrairement un point au-delà de 35m de la position choisie
                if (
                  usedPt &&
                  haversineDistance(pt, usedPt) > 4 &&
                  haversineDistance(pt, usedPt) <= 35
                ) {
                  hasSnapped = true;
                  return usedPt;
                }
                return pt;
              });
              if (hasSnapped) {
                setWaypoints(syncedWps);
              }
            }
          }
        } catch (err) {
          console.error('[RouteEditor] Erreur de calcul de parcours:', err);
        } finally {
          if (requestId === currentRequestIdRef.current) {
            setIsCalculating(false);
          }
        }
      };

      if (immediate) {
        execute();
      } else {
        debounceTimerRef.current = setTimeout(execute, 90);
      }
    },
    []
  );

  const pushSnapshot = useCallback(
    (pts: [number, number][], metas: SurgicalSegmentMeta[], loop: boolean) => {
      setHistory((prev) => [
        ...prev.slice(-30),
        {
          waypoints: pts.map((p) => [p[0], p[1]]),
          segmentMetas: metas.map((m) => ({ ...m })),
          isLoop: loop,
        },
      ]);
      setRedoStack([]);
    },
    []
  );

  // Démarrer la création ex-nihilo d'un nouveau tracé
  const startCreating = useCallback(
    (act?: 'bike' | 'hike') => {
      const chosenAct = act || defaultActivity;
      setEditorMode('create');
      setActivity(chosenAct);
      setRoutingMode('trail');
      setOriginalRoute(null);
      setOriginalTrace(null);
      setWaypoints([]);
      setSegmentMetas([]);
      setSelectedWaypointIndex(null);
      setHighlightedSegmentIndex(null);
      setHistory([]);
      setRedoStack([]);
      setIsLoop(true);
      setCalculatedResult(null);
      setTargetLoopDistanceKm(null);
      setLoopCalibrationPass(null);
      setIsSegmentsDashboardOpen(false);
      setIsSubTracePanelOpen(false);
      setSubTraceInfo(null);
      setSubTracePickTarget(null);
      setIsEditorActive(true);
    },
    [defaultActivity]
  );

  // Démarrer la modification chirurgicale d'un tracé existant
  const startEditing = useCallback(
    (route: RouteSuggestions, trace: RouteTrace) => {
      setEditorMode('edit');
      const routeAct = route.activity || defaultActivity;
      setActivity(routeAct);
      setRoutingMode('trail');
      setOriginalRoute(route);
      setOriginalTrace(trace);
      setSelectedWaypointIndex(null);
      setHighlightedSegmentIndex(null);
      setTargetLoopDistanceKm(null);
      setLoopCalibrationPass(null);
      setIsSegmentsDashboardOpen(false);
      setIsSubTracePanelOpen(false);
      setSubTraceInfo(null);
      setSubTracePickTarget(null);

      const totalKm = Math.max(1, computeTraceTotalDistanceKm(trace));
      setSubTraceStartKm(0);
      setSubTraceEndKm(Number((totalKm * 0.5).toFixed(1)));
      setSubTraceReturnModeState('out_and_back');

      const surgicalState = buildInitialSurgicalStateFromTrace(trace, route);
      setWaypoints(surgicalState.waypoints);
      setSegmentMetas(surgicalState.segmentMetas);
      setIsLoop(surgicalState.isLoop);
      setHistory([]);
      setRedoStack([]);
      setIsEditorActive(true);

      triggerRecalculate(
        surgicalState.waypoints,
        surgicalState.segmentMetas,
        surgicalState.isLoop,
        routeAct,
        'trail',
        true
      );
    },
    [defaultActivity, triggerRecalculate]
  );

  // Appliquer une découpe de sous-trace (avec retour inclus au choix) sur la trace originale
  const applySubTraceSlicing = useCallback(
    (
      trace: RouteTrace,
      route: RouteSuggestions | null,
      act: 'bike' | 'hike',
      startKm: number,
      endKm: number,
      returnMode: SubTraceReturnMode,
      recordHistory: boolean = true
    ) => {
      if (recordHistory) {
        const { waypoints: curWps, segmentMetas: curMetas, isLoop: curLoop } = stateRef.current;
        if (curWps.length > 0) {
          pushSnapshot(curWps, curMetas, curLoop);
        }
      }

      const { surgicalState, info } = buildSurgicalStateFromSubTrace(
        trace,
        route,
        startKm,
        endKm,
        returnMode
      );

      setSubTraceStartKm(info.startKm);
      setSubTraceEndKm(info.endKm);
      setSubTraceReturnModeState(returnMode);
      setSubTraceInfo(info);
      setWaypoints(surgicalState.waypoints);
      setSegmentMetas(surgicalState.segmentMetas);
      setIsLoop(surgicalState.isLoop);
      setSelectedWaypointIndex(null);
      setHighlightedSegmentIndex(null);

      triggerRecalculate(
        surgicalState.waypoints,
        surgicalState.segmentMetas,
        surgicalState.isLoop,
        act,
        'trail',
        true
      );
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Démarrer directement le Studio de Sous-Trace (avec retour inclus) depuis une fiche parcours ou un clic piste cyclable
  const startSubTraceSlicing = useCallback(
    (
      route: RouteSuggestions,
      trace: RouteTrace,
      initialReturnMode: SubTraceReturnMode = 'out_and_back',
      focusKmHint?: number
    ) => {
      setEditorMode('edit');
      const routeAct = route.activity || defaultActivity;
      setActivity(routeAct);
      setRoutingMode('trail');
      setOriginalRoute(route);
      setOriginalTrace(trace);
      setSelectedWaypointIndex(null);
      setHighlightedSegmentIndex(null);
      setTargetLoopDistanceKm(null);
      setLoopCalibrationPass(null);
      setIsSegmentsDashboardOpen(false);
      setSubTracePickTarget(null);
      setHistory([]);
      setRedoStack([]);

      const totalKm = Math.max(1, computeTraceTotalDistanceKm(trace));
      const idealLegKm =
        routeAct === 'bike'
          ? Math.min(12.5, Math.max(2, Number((totalKm * 0.45).toFixed(1))))
          : Math.min(4.5, Math.max(1, Number((totalKm * 0.45).toFixed(1))));

      let defaultStartKm = 0;
      let defaultEndKm = Math.max(0.8, Number(Math.min(totalKm, idealLegKm).toFixed(1)));

      if (typeof focusKmHint === 'number' && !isNaN(focusKmHint) && totalKm > 2) {
        const clampedFocus = Math.max(0, Math.min(totalKm, focusKmHint));
        if (clampedFocus + idealLegKm <= totalKm) {
          defaultStartKm = Number(clampedFocus.toFixed(1));
          defaultEndKm = Number((clampedFocus + idealLegKm).toFixed(1));
        } else {
          defaultEndKm = Number(totalKm.toFixed(1));
          defaultStartKm = Number(Math.max(0, totalKm - idealLegKm).toFixed(1));
        }
      }

      setIsEditorActive(true);
      setIsSubTracePanelOpen(true);

      applySubTraceSlicing(
        trace,
        route,
        routeAct,
        defaultStartKm,
        defaultEndKm,
        initialReturnMode,
        false
      );
    },
    [defaultActivity, applySubTraceSlicing]
  );

  // Mettre à jour la plage [startKm, endKm] et/ou le mode de retour de la sous-trace
  const updateSubTraceRange = useCallback(
    (startKm: number, endKm: number, returnMode?: SubTraceReturnMode) => {
      const {
        originalTrace: trace,
        originalRoute: route,
        activity: act,
        subTraceReturnMode: curMode,
      } = stateRef.current;
      if (!trace) return;
      const modeToUse = returnMode ?? curMode;
      applySubTraceSlicing(trace, route, act, startKm, endKm, modeToUse, true);
    },
    [applySubTraceSlicing]
  );

  const setSubTraceReturnMode = useCallback(
    (mode: SubTraceReturnMode) => {
      const {
        originalTrace: trace,
        originalRoute: route,
        activity: act,
        subTraceStartKm: sKm,
        subTraceEndKm: eKm,
      } = stateRef.current;
      setSubTraceReturnModeState(mode);
      if (trace) {
        applySubTraceSlicing(trace, route, act, sKm, eKm, mode, true);
      }
    },
    [applySubTraceSlicing]
  );

  const openSubTracePanel = useCallback(() => {
    setIsSegmentsDashboardOpen(false);
    setIsSubTracePanelOpen(true);
    const {
      originalTrace: trace,
      originalRoute: route,
      activity: act,
      subTraceInfo: curInfo,
      subTraceReturnMode: curMode,
    } = stateRef.current;
    if (trace && !curInfo) {
      const totalKm = Math.max(1, computeTraceTotalDistanceKm(trace));
      const defaultEndKm = Math.max(1, Number((totalKm * 0.5).toFixed(1)));
      applySubTraceSlicing(trace, route, act, 0, defaultEndKm, curMode, true);
    }
  }, [applySubTraceSlicing]);

  const closeSubTracePanel = useCallback(() => {
    setIsSubTracePanelOpen(false);
    setSubTracePickTarget(null);
  }, []);

  const toggleSubTracePanel = useCallback(() => {
    setIsSubTracePanelOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsSegmentsDashboardOpen(false);
        const {
          originalTrace: trace,
          originalRoute: route,
          activity: act,
          subTraceInfo: curInfo,
          subTraceReturnMode: curMode,
        } = stateRef.current;
        if (trace && !curInfo) {
          const totalKm = Math.max(1, computeTraceTotalDistanceKm(trace));
          const defaultEndKm = Math.max(1, Number((totalKm * 0.5).toFixed(1)));
          applySubTraceSlicing(trace, route, act, 0, defaultEndKm, curMode, true);
        }
      } else {
        setSubTracePickTarget(null);
      }
      return next;
    });
  }, [applySubTraceSlicing]);

  // Clic sur la trace parente en pointillés sur la carte pour positionner directement A ou B
  const handleParentTraceTapKm = useCallback(
    (clickedKm: number) => {
      const {
        originalTrace: trace,
        originalRoute: route,
        activity: act,
        subTraceStartKm: sKm,
        subTraceEndKm: eKm,
        subTraceReturnMode: mode,
        subTracePickTarget: pickTarget,
      } = stateRef.current;
      if (!trace) return;

      const totalKm = Math.max(1, computeTraceTotalDistanceKm(trace));
      let nextStart = sKm;
      let nextEnd = eKm;

      if (pickTarget === 'start') {
        nextStart = Math.max(0, Math.min(clickedKm, eKm - 0.5));
        setSubTracePickTarget(null);
      } else if (pickTarget === 'end') {
        nextEnd = Math.min(totalKm, Math.max(clickedKm, sKm + 0.5));
        setSubTracePickTarget(null);
      } else {
        // Choisit automatiquement la borne A ou B la plus proche du point touché
        const distToStart = Math.abs(clickedKm - sKm);
        const distToEnd = Math.abs(clickedKm - eKm);
        if (distToStart < distToEnd && clickedKm < eKm - 0.3) {
          nextStart = Math.max(0, clickedKm);
        } else if (clickedKm > sKm + 0.3) {
          nextEnd = Math.min(totalKm, clickedKm);
        } else {
          nextStart = Math.max(0, clickedKm);
          nextEnd = Math.min(totalKm, Math.max(nextStart + 1, eKm));
        }
      }

      applySubTraceSlicing(trace, route, act, nextStart, nextEnd, mode, true);
    },
    [applySubTraceSlicing]
  );

  // Réinitialiser la trace en cours d'édition à son état GPX d'origine exact
  const resetToOriginalTrace = useCallback(() => {
    const { originalTrace: trace, originalRoute: route, activity: act } = {
      originalTrace,
      originalRoute,
      activity: stateRef.current.activity,
    };
    if (!trace) return;
    const { waypoints: curWps, segmentMetas: curMetas, isLoop: curLoop } = stateRef.current;
    pushSnapshot(curWps, curMetas, curLoop);

    const surgicalState = buildInitialSurgicalStateFromTrace(trace, route);
    setWaypoints(surgicalState.waypoints);
    setSegmentMetas(surgicalState.segmentMetas);
    setIsLoop(surgicalState.isLoop);
    setSelectedWaypointIndex(null);
    setHighlightedSegmentIndex(null);
    setSubTraceInfo(null);
    setSubTracePickTarget(null);

    const totalKm = Math.max(1, computeTraceTotalDistanceKm(trace));
    setSubTraceStartKm(0);
    setSubTraceEndKm(totalKm);

    triggerRecalculate(
      surgicalState.waypoints,
      surgicalState.segmentMetas,
      surgicalState.isLoop,
      act,
      'trail',
      true
    );
  }, [originalTrace, originalRoute, pushSnapshot, triggerRecalculate]);

  // Ajout d'un point en fin de parcours
  const addWaypoint = useCallback(
    (lat: number, lng: number) => {
      const newPoint: [number, number] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      pushSnapshot(prevWps, prevMetas, loop);

      const nextWps = [...prevWps, newPoint];
      const nextMetas = [...prevMetas];

      if (nextWps.length >= 2) {
        const newSegIdx = nextWps.length - 2;
        nextMetas[newSegIdx] = { source: mode };
        if (loop) {
          nextMetas[nextWps.length - 1] = { source: mode };
        }
      }

      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      setSelectedWaypointIndex(null);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Insertion chirurgicale d'un point intermédiaire à l'index `index`
  const insertWaypoint = useCallback(
    (index: number, lat: number, lng: number) => {
      const newPoint: [number, number] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      pushSnapshot(prevWps, prevMetas, loop);

      const nextWps = [...prevWps];
      const clampedIndex = Math.max(0, Math.min(index, nextWps.length));
      nextWps.splice(clampedIndex, 0, newPoint);

      const nextMetas = [...prevMetas];
      const splitSegIdx = clampedIndex === 0 ? (loop ? prevWps.length - 1 : 0) : clampedIndex - 1;
      if (nextMetas.length > 0 && splitSegIdx >= 0 && splitSegIdx < nextMetas.length) {
        nextMetas.splice(splitSegIdx, 1, { source: mode }, { source: mode });
      } else {
        const totalSegs = loop ? nextWps.length : Math.max(0, nextWps.length - 1);
        while (nextMetas.length < totalSegs) {
          nextMetas.push({ source: mode });
        }
      }

      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      setSelectedWaypointIndex(clampedIndex);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Déplacement chirurgical d'un point existant (ne recalcule QUE les 2 segments adjacents)
  const updateWaypoint = useCallback(
    (index: number, lat: number, lng: number) => {
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      if (index < 0 || index >= prevWps.length) return;
      pushSnapshot(prevWps, prevMetas, loop);

      const nextWps = [...prevWps];
      nextWps[index] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];

      const totalSegs = loop ? nextWps.length : Math.max(0, nextWps.length - 1);
      const nextMetas: SurgicalSegmentMeta[] = [];
      for (let i = 0; i < totalSegs; i++) {
        nextMetas.push(prevMetas[i] ? { ...prevMetas[i] } : { source: mode });
      }

      if (index < totalSegs) {
        const prevSource = nextMetas[index]?.source;
        nextMetas[index] = {
          source: prevSource === 'direct' ? 'direct' : mode,
        };
      }
      if (index > 0) {
        const prevSource = nextMetas[index - 1]?.source;
        nextMetas[index - 1] = {
          source: prevSource === 'direct' ? 'direct' : mode,
        };
      } else if (loop && totalSegs > 0) {
        const lastIdx = totalSegs - 1;
        const prevSource = nextMetas[lastIdx]?.source;
        nextMetas[lastIdx] = {
          source: prevSource === 'direct' ? 'direct' : mode,
        };
      }

      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      setSelectedWaypointIndex(index);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Déplacer une étape / un segment de `fromIndex` vers `toIndex` et relier automatiquement sur les sentiers
  const reorderWaypoints = useCallback(
    (fromIndex: number, toIndex: number) => {
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      const n = prevWps.length;
      if (
        fromIndex < 0 ||
        fromIndex >= n ||
        toIndex < 0 ||
        toIndex >= n ||
        fromIndex === toIndex
      ) {
        return;
      }

      pushSnapshot(prevWps, prevMetas, loop);

      const newOrder = prevWps.map((_, idx) => idx);
      const [movedIdx] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedIdx);

      const nextWps = newOrder.map((idx) => prevWps[idx]);
      const nextMetas = rebuildSegmentMetasForNewOrder(
        newOrder,
        prevMetas,
        n,
        loop,
        mode
      );

      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      setSelectedWaypointIndex(toIndex);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode, true);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Intervertir directement deux étapes / segments (ex: Étape A <-> Étape B) et relier automatiquement sur les sentiers
  const swapWaypoints = useCallback(
    (indexA: number, indexB: number) => {
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      const n = prevWps.length;
      if (
        indexA < 0 ||
        indexA >= n ||
        indexB < 0 ||
        indexB >= n ||
        indexA === indexB
      ) {
        return;
      }

      pushSnapshot(prevWps, prevMetas, loop);

      const newOrder = prevWps.map((_, idx) => idx);
      const temp = newOrder[indexA];
      newOrder[indexA] = newOrder[indexB];
      newOrder[indexB] = temp;

      const nextWps = newOrder.map((idx) => prevWps[idx]);
      const nextMetas = rebuildSegmentMetasForNewOrder(
        newOrder,
        prevMetas,
        n,
        loop,
        mode
      );

      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      setSelectedWaypointIndex(indexB);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode, true);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Définir l'étape `index` comme nouveau Point de Départ (1) par rotation circulaire de la boucle
  const setStartWaypoint = useCallback(
    (index: number) => {
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      const n = prevWps.length;
      if (index <= 0 || index >= n) return;

      pushSnapshot(prevWps, prevMetas, loop);

      const newOrder: number[] = [];
      for (let i = 0; i < n; i++) {
        newOrder.push((index + i) % n);
      }

      const nextWps = newOrder.map((idx) => prevWps[idx]);
      const nextMetas = rebuildSegmentMetasForNewOrder(
        newOrder,
        prevMetas,
        n,
        loop,
        mode
      );

      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      setSelectedWaypointIndex(0);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode, true);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Basculer un segment spécifique entre suivi des sentiers ('trail') et ligne directe ('direct')
  const toggleSegmentRoutingMode = useCallback(
    (segmentIndex: number) => {
      const {
        waypoints: wps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      const totalSegs = loop ? wps.length : wps.length - 1;
      if (segmentIndex < 0 || segmentIndex >= totalSegs) return;

      pushSnapshot(wps, prevMetas, loop);

      const nextMetas: SurgicalSegmentMeta[] = [];
      for (let i = 0; i < totalSegs; i++) {
        nextMetas.push(prevMetas[i] ? { ...prevMetas[i] } : { source: mode });
      }

      const currentSource = nextMetas[segmentIndex]?.source;
      const targetSource: SegmentRoutingMode =
        currentSource === 'trail'
          ? 'free'
          : currentSource === 'free'
          ? 'direct'
          : 'trail';
      nextMetas[segmentIndex] = {
        source: targetSource,
      };

      setSegmentMetas(nextMetas);
      triggerRecalculate(wps, nextMetas, loop, act, mode, true);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Optimiser automatiquement l'ordre des segments (algorithme 2-Opt anti-croisement) et relier sur sentiers
  const autoOptimizeOrder = useCallback((): boolean => {
    const {
      waypoints: prevWps,
      segmentMetas: prevMetas,
      isLoop: loop,
      activity: act,
      routingMode: mode,
    } = stateRef.current;

    if (prevWps.length < 4) return false;

    const { optimizedWaypoints, newOrderIndices, hasChanged } =
      optimizeWaypointsOrder2Opt(prevWps, loop);

    if (!hasChanged) return false;

    pushSnapshot(prevWps, prevMetas, loop);

    const nextMetas = rebuildSegmentMetasForNewOrder(
      newOrderIndices,
      prevMetas,
      prevWps.length,
      loop,
      mode
    );

    setWaypoints(optimizedWaypoints);
    setSegmentMetas(nextMetas);
    setSelectedWaypointIndex(null);
    triggerRecalculate(optimizedWaypoints, nextMetas, loop, act, mode, true);
    return true;
  }, [pushSnapshot, triggerRecalculate]);

  // Gestion intelligente du toucher/clic sur la carte selon le mode et la sélection active
  const handleMapTap = useCallback(
    (lat: number, lng: number) => {
      const {
        selectedWaypointIndex: selIdx,
        editorMode: mode,
        waypoints: wps,
        isLoop: loop,
        calculatedResult: calcRes,
        subTracePickTarget: pickTarget,
        originalTrace: origTrace,
      } = stateRef.current;

      // Si l'utilisateur est en train de pointer le Départ (A) ou le Demi-tour (B) de sa sous-trace sur la carte
      if (pickTarget && origTrace) {
        const clickedKm = projectLatLngToTraceKm(origTrace, lat, lng);
        handleParentTraceTapKm(clickedKm);
        return;
      }

      if (selIdx !== null && selIdx >= 0 && selIdx < wps.length) {
        updateWaypoint(selIdx, lat, lng);
        return;
      }

      if (mode === 'edit' && wps.length >= 2) {
        const detailedLatLngs = calcRes?.coordinates
          ? calcRes.coordinates.map(([lon, cLat]) => [cLat, lon] as [number, number])
          : undefined;
        const proj = projectPointOntoRouteSegments(
          wps,
          lat,
          lng,
          loop,
          detailedLatLngs,
          calcRes?.legs
        );
        insertWaypoint(proj.insertIndex, lat, lng);
        return;
      }

      addWaypoint(lat, lng);
    },
    [updateWaypoint, insertWaypoint, addWaypoint, handleParentTraceTapKm]
  );

  // Suppression chirurgicale d'un point
  const removeWaypoint = useCallback(
    (index: number) => {
      const {
        waypoints: prevWps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
        routingMode: mode,
      } = stateRef.current;

      if (index < 0 || index >= prevWps.length) return;
      pushSnapshot(prevWps, prevMetas, loop);

      const nextWps = prevWps.filter((_, i) => i !== index);
      const nextMetas = [...prevMetas];

      if (nextMetas.length > 0) {
        if (index === 0) {
          nextMetas.shift();
          if (loop && nextMetas.length > 0) {
            nextMetas[nextMetas.length - 1] = { source: mode };
          }
        } else if (index < nextMetas.length) {
          nextMetas.splice(index - 1, 2, { source: mode });
        } else {
          nextMetas.pop();
        }
      }

      setSelectedWaypointIndex(null);
      setWaypoints(nextWps);
      setSegmentMetas(nextMetas);
      triggerRecalculate(nextWps, nextMetas, loop, act, mode);
    },
    [pushSnapshot, triggerRecalculate]
  );

  // Bascule les segments reliés au point sélectionné entre 'trail' et 'direct'
  const toggleSelectedWaypointDirectMode = useCallback(() => {
    const {
      selectedWaypointIndex: selIdx,
      waypoints: wps,
      segmentMetas: prevMetas,
      isLoop: loop,
      activity: act,
      routingMode: mode,
    } = stateRef.current;

    if (selIdx === null || wps.length < 2) return;
    pushSnapshot(wps, prevMetas, loop);

    const totalSegs = loop ? wps.length : wps.length - 1;
    const nextMetas: SurgicalSegmentMeta[] = [];
    for (let i = 0; i < totalSegs; i++) {
      nextMetas.push(prevMetas[i] ? { ...prevMetas[i] } : { source: mode });
    }

    const incomingIdx = selIdx > 0 ? selIdx - 1 : loop ? totalSegs - 1 : 0;
    const currentSource = nextMetas[incomingIdx]?.source;
    const targetSource: SegmentRoutingMode =
      currentSource === 'trail'
        ? 'free'
        : currentSource === 'free'
        ? 'direct'
        : 'trail';

    if (incomingIdx >= 0 && incomingIdx < totalSegs) {
      nextMetas[incomingIdx] = { source: targetSource };
    }
    if (selIdx < totalSegs) {
      nextMetas[selIdx] = { source: targetSource };
    }

    setSegmentMetas(nextMetas);
    triggerRecalculate(wps, nextMetas, loop, act, mode, true);
  }, [pushSnapshot, triggerRecalculate]);

  // Annulation (Undo)
  const undo = useCallback(() => {
    setSelectedWaypointIndex(null);
    setHistory((prevH) => {
      if (prevH.length === 0) return prevH;
      const lastSnap = prevH[prevH.length - 1];
      const currentSnap: EditorHistorySnapshot = {
        waypoints: stateRef.current.waypoints,
        segmentMetas: stateRef.current.segmentMetas,
        isLoop: stateRef.current.isLoop,
      };
      setRedoStack((r) => [...r, currentSnap]);
      setWaypoints(lastSnap.waypoints);
      setSegmentMetas(lastSnap.segmentMetas);
      setIsLoop(lastSnap.isLoop);
      triggerRecalculate(
        lastSnap.waypoints,
        lastSnap.segmentMetas,
        lastSnap.isLoop,
        stateRef.current.activity,
        stateRef.current.routingMode,
        true
      );
      return prevH.slice(0, -1);
    });
  }, [triggerRecalculate]);

  // Rétablissement (Redo)
  const redo = useCallback(() => {
    setSelectedWaypointIndex(null);
    setRedoStack((prevR) => {
      if (prevR.length === 0) return prevR;
      const nextSnap = prevR[prevR.length - 1];
      const currentSnap: EditorHistorySnapshot = {
        waypoints: stateRef.current.waypoints,
        segmentMetas: stateRef.current.segmentMetas,
        isLoop: stateRef.current.isLoop,
      };
      setHistory((h) => [...h, currentSnap]);
      setWaypoints(nextSnap.waypoints);
      setSegmentMetas(nextSnap.segmentMetas);
      setIsLoop(nextSnap.isLoop);
      triggerRecalculate(
        nextSnap.waypoints,
        nextSnap.segmentMetas,
        nextSnap.isLoop,
        stateRef.current.activity,
        stateRef.current.routingMode,
        true
      );
      return prevR.slice(0, -1);
    });
  }, [triggerRecalculate]);

  // Tout effacer
  const clear = useCallback(() => {
    const { waypoints: prevWps, segmentMetas: prevMetas, isLoop: loop } = stateRef.current;
    if (prevWps.length > 0) {
      pushSnapshot(prevWps, prevMetas, loop);
    }
    setSelectedWaypointIndex(null);
    setHighlightedSegmentIndex(null);
    setWaypoints([]);
    setSegmentMetas([]);
    setCalculatedResult(null);
    setTargetLoopDistanceKm(null);
    setLoopCalibrationPass(null);
  }, [pushSnapshot]);

  // Basculer boucle fermée / parcours ouvert
  const toggleLoop = useCallback(() => {
    const {
      waypoints: wps,
      segmentMetas: prevMetas,
      isLoop: prevLoop,
      activity: act,
      routingMode: mode,
    } = stateRef.current;
    pushSnapshot(wps, prevMetas, prevLoop);

    const nextLoop = !prevLoop;
    const nextMetas = [...prevMetas];
    if (nextLoop && nextMetas.length < wps.length) {
      nextMetas.push({ source: mode });
    } else if (!nextLoop && nextMetas.length >= wps.length) {
      nextMetas.pop();
    }

    setIsLoop(nextLoop);
    setSegmentMetas(nextMetas);
    triggerRecalculate(wps, nextMetas, nextLoop, act, mode, true);
  }, [pushSnapshot, triggerRecalculate]);

  // Inverser le sens de parcours
  const reverseDirection = useCallback(() => {
    const {
      waypoints: prevWps,
      segmentMetas: prevMetas,
      isLoop: loop,
      activity: act,
      routingMode: mode,
    } = stateRef.current;
    if (prevWps.length < 2) return;
    pushSnapshot(prevWps, prevMetas, loop);

    const nextWps = [...prevWps].reverse();
    const totalSegs = loop ? nextWps.length : nextWps.length - 1;
    const nextMetas: SurgicalSegmentMeta[] = [];

    for (let i = 0; i < totalSegs; i++) {
      const oldIdx = totalSegs - 1 - i;
      const oldMeta = prevMetas[oldIdx];
      if (oldMeta?.source === 'original' && oldMeta.originalSlice) {
        nextMetas.push({
          source: 'original',
          originalSlice: [...oldMeta.originalSlice].reverse(),
        });
      } else {
        nextMetas.push({ source: oldMeta?.source || mode });
      }
    }

    setWaypoints(nextWps);
    setSegmentMetas(nextMetas);
    setSelectedWaypointIndex(null);
    triggerRecalculate(nextWps, nextMetas, loop, act, mode, true);
  }, [pushSnapshot, triggerRecalculate]);

  const openSaveModal = useCallback(() => setIsSaveModalOpen(true), []);
  const closeSaveModal = useCallback(() => setIsSaveModalOpen(false), []);
  const openLoopModal = useCallback(() => setIsLoopModalOpen(true), []);
  const closeLoopModal = useCallback(() => setIsLoopModalOpen(false), []);
  const openSegmentsDashboard = useCallback(() => {
    setIsSubTracePanelOpen(false);
    setSubTracePickTarget(null);
    setIsSegmentsDashboardOpen(true);
  }, []);
  const closeSegmentsDashboard = useCallback(() => {
    setIsSegmentsDashboardOpen(false);
    setHighlightedSegmentIndex(null);
  }, []);
  const toggleSegmentsDashboard = useCallback(() => {
    setIsSegmentsDashboardOpen((prev) => {
      if (prev) {
        setHighlightedSegmentIndex(null);
      } else {
        setIsSubTracePanelOpen(false);
        setSubTracePickTarget(null);
      }
      return !prev;
    });
  }, []);

  // Génération automatique d'une boucle calibrée
  const generateProposedLoop = useCallback(
    async (
      startCoords: [number, number],
      targetDistanceKm: number = 15,
      directionAngle: number = 0
    ) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      const act = stateRef.current.activity;
      const requestId = ++currentRequestIdRef.current;

      setEditorMode('create');
      setIsLoop(true);
      setHistory([]);
      setRedoStack([]);
      setSelectedWaypointIndex(null);
      setHighlightedSegmentIndex(null);
      setTargetLoopDistanceKm(targetDistanceKm);
      setLoopCalibrationPass(1);
      setIsEditorActive(true);
      setIsLoopModalOpen(false);
      setIsCalculating(true);

      try {
        const calibrated = await generateCalibratedOutdoorLoop({
          startCoords,
          targetDistanceKm,
          activity: act,
          directionAngle,
          onProgress: (pass, intermediateResult) => {
            if (requestId === currentRequestIdRef.current) {
              setLoopCalibrationPass(pass);
              setCalculatedResult(intermediateResult);
              setWaypoints(intermediateResult.waypointsUsed);
            }
          },
        });

        if (requestId === currentRequestIdRef.current) {
          const cleanWps = calibrated.waypoints;
          const metas: SurgicalSegmentMeta[] = cleanWps.map(() => ({ source: 'trail' }));
          setWaypoints(cleanWps);
          setSegmentMetas(metas);
          if (calibrated.result) {
            setCalculatedResult(calibrated.result);
          } else {
            triggerRecalculate(cleanWps, metas, true, act, 'trail', true);
          }
        }
      } catch (err) {
        console.error('[RouteEditor] Erreur génération de boucle calibrée:', err);
      } finally {
        if (requestId === currentRequestIdRef.current) {
          setIsCalculating(false);
          setLoopCalibrationPass(null);
        }
      }
    },
    [triggerRecalculate]
  );

  const cancel = useCallback(() => {
    setIsEditorActive(false);
    setWaypoints([]);
    setSegmentMetas([]);
    setSelectedWaypointIndex(null);
    setHighlightedSegmentIndex(null);
    setCalculatedResult(null);
    setOriginalRoute(null);
    setOriginalTrace(null);
    setHistory([]);
    setRedoStack([]);
    setTargetLoopDistanceKm(null);
    setLoopCalibrationPass(null);
    setIsSaveModalOpen(false);
    setIsLoopModalOpen(false);
    setIsSegmentsDashboardOpen(false);
    setIsSubTracePanelOpen(false);
    setSubTraceInfo(null);
    setSubTracePickTarget(null);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    isEditorActive,
    editorMode,
    activity,
    setActivity: (act) => {
      setActivity(act);
      const updatedMetas = stateRef.current.segmentMetas.map((m) =>
        m.source === 'original' ? m : { source: stateRef.current.routingMode }
      );
      setSegmentMetas(updatedMetas);
      triggerRecalculate(
        stateRef.current.waypoints,
        updatedMetas,
        stateRef.current.isLoop,
        act,
        stateRef.current.routingMode,
        true
      );
    },
    routingMode,
    setRoutingMode: (mode: SegmentRoutingMode) => {
      setRoutingMode(mode);
      stateRef.current.routingMode = mode;
      const {
        waypoints: wps,
        segmentMetas: prevMetas,
        isLoop: loop,
        activity: act,
      } = stateRef.current;
      if (wps.length >= 2) {
        const totalSegs = loop ? wps.length : wps.length - 1;
        const nextMetas: SurgicalSegmentMeta[] = prevMetas.map((m) =>
          m.source === 'original' ? m : { source: mode }
        );
        while (nextMetas.length < totalSegs) {
          nextMetas.push({ source: mode });
        }
        setSegmentMetas(nextMetas);
        triggerRecalculate(wps, nextMetas, loop, act, mode, true);
      }
    },
    originalRoute,
    originalTrace,
    waypoints,
    segmentMetas,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
    highlightedSegmentIndex,
    setHighlightedSegmentIndex,
    orderAnomalies,
    isLoop,
    calculatedResult,
    isCalculating,
    loopCalibrationPass,
    targetLoopDistanceKm,
    isSaveModalOpen,
    isLoopModalOpen,
    isSegmentsDashboardOpen,
    isSubTracePanelOpen,
    subTraceInfo,
    subTraceStartKm,
    subTraceEndKm,
    subTraceReturnMode,
    subTracePickTarget,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    startCreating,
    startEditing,
    startSubTraceSlicing,
    openSubTracePanel,
    closeSubTracePanel,
    toggleSubTracePanel,
    updateSubTraceRange,
    setSubTraceReturnMode,
    setSubTracePickTarget,
    handleParentTraceTapKm,
    addWaypoint,
    handleMapTap,
    insertWaypoint,
    updateWaypoint,
    removeWaypoint,
    reorderWaypoints,
    swapWaypoints,
    setStartWaypoint,
    toggleSegmentRoutingMode,
    autoOptimizeOrder,
    toggleSelectedWaypointDirectMode,
    resetToOriginalTrace,
    undo,
    redo,
    clear,
    toggleLoop,
    reverseDirection,
    openSaveModal,
    closeSaveModal,
    openLoopModal,
    closeLoopModal,
    openSegmentsDashboard,
    closeSegmentsDashboard,
    toggleSegmentsDashboard,
    generateProposedLoop,
    cancel,
  };
}
