import { useState, useCallback, useRef, useEffect } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';
import {
  computeOutdoorRouteFromWaypoints,
  simplifyRouteToWaypoints,
  type CalculatedRouteResult,
} from '../lib/routing/outdoorRouter';
import { generateLoopAnchors } from '../lib/routing/loopGenerator';

export interface UseRouteEditorReturn {
  isEditorActive: boolean;
  editorMode: 'create' | 'edit';
  activity: 'bike' | 'hike';
  setActivity: (a: 'bike' | 'hike') => void;
  originalRoute: RouteSuggestions | null;
  originalTrace: RouteTrace | null;
  waypoints: [number, number][]; // [lon, lat]
  selectedWaypointIndex: number | null;
  setSelectedWaypointIndex: (index: number | null) => void;
  isLoop: boolean;
  calculatedResult: CalculatedRouteResult | null;
  isCalculating: boolean;
  isSaveModalOpen: boolean;
  isLoopModalOpen: boolean;
  canUndo: boolean;
  startCreating: (act?: 'bike' | 'hike') => void;
  startEditing: (route: RouteSuggestions, trace: RouteTrace) => void;
  addWaypoint: (lat: number, lng: number) => void;
  insertWaypoint: (index: number, lat: number, lng: number) => void;
  updateWaypoint: (index: number, lat: number, lng: number) => void;
  removeWaypoint: (index: number) => void;
  undo: () => void;
  clear: () => void;
  toggleLoop: () => void;
  reverseDirection: () => void;
  openSaveModal: () => void;
  closeSaveModal: () => void;
  openLoopModal: () => void;
  closeLoopModal: () => void;
  generateProposedLoop: (
    startCoords: [number, number],
    targetDistanceKm: number,
    directionAngle?: number
  ) => void;
  cancel: () => void;
}

export function useRouteEditor(defaultActivity: 'bike' | 'hike' = 'hike'): UseRouteEditorReturn {
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [activity, setActivity] = useState<'bike' | 'hike'>(defaultActivity);
  const [originalRoute, setOriginalRoute] = useState<RouteSuggestions | null>(null);
  const [originalTrace, setOriginalTrace] = useState<RouteTrace | null>(null);

  // Liste ordonnée des points de passage [lon, lat]
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);

  // Étape sélectionnée activement comme point à déplacer
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);

  // Par défaut, les nouvelles traces sont des boucles qui reviennent au point de départ
  const [isLoop, setIsLoop] = useState<boolean>(true);

  // Résultat du calcul de tracé sur les sentiers réels
  const [calculatedResult, setCalculatedResult] = useState<CalculatedRouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Historique pour l'annulation (Undo)
  const [history, setHistory] = useState<[number, number][][]>([]);

  // Modale de sauvegarde & modale générateur de boucle
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestIdRef = useRef<number>(0);

  // Synchronise le calcul chaque fois que les waypoints, la boucle ou le sport changent
  const triggerRecalculate = useCallback(
    (pts: [number, number][], loop: boolean, act: 'bike' | 'hike') => {
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

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const result = await computeOutdoorRouteFromWaypoints(pts, {
            activity: act,
            isLoop: loop,
          });
          if (requestId === currentRequestIdRef.current) {
            setCalculatedResult(result);
            // Synchronise les waypoints si des impasses/points isolés ont été nettoyés
            if (result?.waypointsUsed && result.waypointsUsed.length >= 2) {
              const hasRelocated = result.waypointsUsed.some((wp, idx) => {
                const prev = pts[idx];
                if (!prev) return false;
                return Math.hypot(wp[0] - prev[0], wp[1] - prev[1]) > 0.0003;
              });
              if (hasRelocated) {
                const cleanWps = result.waypointsUsed.slice(0, pts.length);
                setWaypoints(cleanWps);
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
      }, 200);
    },
    []
  );

  // Démarrer la création ex-nihilo d'un nouveau tracé
  const startCreating = useCallback(
    (act?: 'bike' | 'hike') => {
      const chosenAct = act || defaultActivity;
      setEditorMode('create');
      setActivity(chosenAct);
      setOriginalRoute(null);
      setOriginalTrace(null);
      setWaypoints([]);
      setSelectedWaypointIndex(null);
      setHistory([]);
      setIsLoop(true); // Par défaut boucle fermée
      setCalculatedResult(null);
      setIsEditorActive(true);
    },
    [defaultActivity]
  );

  // Démarrer la modification d'un tracé existant pour en faire une nouvelle variante
  const startEditing = useCallback(
    (route: RouteSuggestions, trace: RouteTrace) => {
      setEditorMode('edit');
      const routeAct = route.activity || defaultActivity;
      setActivity(routeAct);
      setOriginalRoute(route);
      setOriginalTrace(trace);
      setSelectedWaypointIndex(null);

      // Extraction des points de passage clés via simplification RDP
      let coords: [number, number][] = [];
      if (Array.isArray(trace.coordinates[0]?.[0])) {
        coords = (trace.coordinates as [number, number][][]).flat();
      } else {
        coords = trace.coordinates as [number, number][];
      }

      // Nombre de points adaptatif selon la distance pour préserver la fidélité de l'itinéraire initial
      const distKm =
        trace.distance && trace.distance > 0
          ? trace.distance / 1000
          : (route as any).distanceKm || 10;
      const targetCount = Math.max(6, Math.min(18, Math.round(distKm / 2.2)));

      const initialWaypoints = simplifyRouteToWaypoints(coords, targetCount);
      setWaypoints(initialWaypoints);
      setHistory([]);

      // Détecter si la trace d'origine est une boucle
      const first = coords[0];
      const last = coords[coords.length - 1];
      const isOriginallyLoop =
        first && last
          ? Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.005
          : true;
      setIsLoop(isOriginallyLoop);

      setIsEditorActive(true);
      triggerRecalculate(initialWaypoints, isOriginallyLoop, routeAct);
    },
    [defaultActivity, triggerRecalculate]
  );

  // Ajout d'un point par clic sur la carte
  const addWaypoint = useCallback(
    (lat: number, lng: number) => {
      const newPoint: [number, number] = [lng, lat];
      setWaypoints((prev) => {
        setHistory((h) => [...h, prev]);
        const next = [...prev, newPoint];
        setSelectedWaypointIndex(next.length - 1);
        triggerRecalculate(next, isLoop, activity);
        return next;
      });
    },
    [isLoop, activity, triggerRecalculate]
  );

  // Insertion d'un point intermédiaire (drag & drop sur le tracé ou clic sur la ligne)
  const insertWaypoint = useCallback(
    (index: number, lat: number, lng: number) => {
      const newPoint: [number, number] = [lng, lat];
      setWaypoints((prev) => {
        setHistory((h) => [...h, prev]);
        const next = [...prev];
        const clampedIndex = Math.max(0, Math.min(index, next.length));
        next.splice(clampedIndex, 0, newPoint);
        setSelectedWaypointIndex(clampedIndex);
        triggerRecalculate(next, isLoop, activity);
        return next;
      });
    },
    [isLoop, activity, triggerRecalculate]
  );

  // Déplacement d'un point existant (drag & drop sur la carte)
  const updateWaypoint = useCallback(
    (index: number, lat: number, lng: number) => {
      setSelectedWaypointIndex(index);
      setWaypoints((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        setHistory((h) => [...h, prev]);
        const next = [...prev];
        next[index] = [lng, lat];
        triggerRecalculate(next, isLoop, activity);
        return next;
      });
    },
    [isLoop, activity, triggerRecalculate]
  );

  // Suppression d'un point
  const removeWaypoint = useCallback(
    (index: number) => {
      setSelectedWaypointIndex(null);
      setWaypoints((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        setHistory((h) => [...h, prev]);
        const next = prev.filter((_, i) => i !== index);
        triggerRecalculate(next, isLoop, activity);
        return next;
      });
    },
    [isLoop, activity, triggerRecalculate]
  );

  // Annulation (Undo)
  const undo = useCallback(() => {
    setSelectedWaypointIndex(null);
    setHistory((prevH) => {
      if (prevH.length === 0) return prevH;
      const lastState = prevH[prevH.length - 1];
      setWaypoints(lastState);
      triggerRecalculate(lastState, isLoop, activity);
      return prevH.slice(0, -1);
    });
  }, [isLoop, activity, triggerRecalculate]);

  // Tout effacer
  const clear = useCallback(() => {
    setSelectedWaypointIndex(null);
    setWaypoints((prev) => {
      if (prev.length > 0) {
        setHistory((h) => [...h, prev]);
      }
      return [];
    });
    setCalculatedResult(null);
  }, []);

  // Inverser la boucle
  const toggleLoop = useCallback(() => {
    setIsLoop((prevLoop) => {
      const nextLoop = !prevLoop;
      triggerRecalculate(waypoints, nextLoop, activity);
      return nextLoop;
    });
  }, [waypoints, activity, triggerRecalculate]);

  // Inverser le sens de parcours
  const reverseDirection = useCallback(() => {
    setWaypoints((prev) => {
      if (prev.length < 2) return prev;
      setHistory((h) => [...h, prev]);
      const next = [...prev].reverse();
      triggerRecalculate(next, isLoop, activity);
      return next;
    });
  }, [isLoop, activity, triggerRecalculate]);

  const openSaveModal = useCallback(() => setIsSaveModalOpen(true), []);
  const closeSaveModal = useCallback(() => setIsSaveModalOpen(false), []);
  const openLoopModal = useCallback(() => setIsLoopModalOpen(true), []);
  const closeLoopModal = useCallback(() => setIsLoopModalOpen(false), []);

  // Génération automatique d'une boucle calibrée à partir d'un point de départ et d'une distance cible
  const generateProposedLoop = useCallback(
    (
      startCoords: [number, number],
      targetDistanceKm: number = 15,
      directionAngle: number = 0
    ) => {
      const anchors = generateLoopAnchors({
        startCoords,
        targetDistanceKm,
        activity,
        directionAngle,
      });

      setEditorMode('create');
      setIsLoop(true);
      setHistory([]);
      setWaypoints(anchors);
      setIsEditorActive(true);
      setIsLoopModalOpen(false);
      triggerRecalculate(anchors, true, activity);
    },
    [activity, triggerRecalculate]
  );

  const cancel = useCallback(() => {
    setIsEditorActive(false);
    setWaypoints([]);
    setSelectedWaypointIndex(null);
    setCalculatedResult(null);
    setOriginalRoute(null);
    setOriginalTrace(null);
    setHistory([]);
    setIsSaveModalOpen(false);
    setIsLoopModalOpen(false);
  }, []);

  // Nettoyage du timer
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
      triggerRecalculate(waypoints, isLoop, act);
    },
    originalRoute,
    originalTrace,
    waypoints,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
    isLoop,
    calculatedResult,
    isCalculating,
    isSaveModalOpen,
    isLoopModalOpen,
    canUndo: history.length > 0,
    startCreating,
    startEditing,
    addWaypoint,
    insertWaypoint,
    updateWaypoint,
    removeWaypoint,
    undo,
    clear,
    toggleLoop,
    reverseDirection,
    openSaveModal,
    closeSaveModal,
    openLoopModal,
    closeLoopModal,
    generateProposedLoop,
    cancel,
  };
}
