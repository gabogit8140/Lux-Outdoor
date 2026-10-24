import { useState, useCallback, useEffect, useMemo } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';
import type { MapLayerType } from '../components/Map';
import {
  filterAndSearchOffline,
  searchAndGenerateRoutes,
  resolveLocationOffline,
  findNearestLocationOffline,
  REGIONAL_ZONES,
  routeMatchesFilter,
  isRegionalZoneLocation,
} from '../lib/localRouting';
import {
  parseGPXString,
  calculateRouteDifficulty,
  computeRoadBreakdown,
  generateTrackSegments,
} from '../lib/geoUtils';
import { useUserGpxLibrary } from './useUserGpxLibrary';
import { storedTrackToRouteAndTrace, type StoredGpxTrack } from '../lib/gpxStorageService';
import { reverseRouteTrace } from '../lib/routing/reverseRoute';

export function useRouteManager() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [routes, setRoutes] = useState<RouteSuggestions[]>([]);
  const [traces, setTraces] = useState<Record<string, RouteTrace>>({});
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activity, setActivity] = useState<'bike' | 'hike'>('hike');
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showHuntingBattues, setShowHuntingBattues] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayerType>('osmfr');
  const [exploredBounds, setExploredBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const [currentLocation, setCurrentLocation] = useState<string>(REGIONAL_ZONES[0].name);
  const [clickedCoord, setClickedCoord] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

  const [selectedZone, setSelectedZone] = useState<'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR'>('ALL');
  const [mapCenterTarget, setMapCenterTarget] = useState<{
    center: [number, number];
    zoom: number;
    trigger: number;
  }>({
    center: [49.78, 6.13],
    zoom: 10,
    trigger: 0,
  });

  const [distance, setDistance] = useState<[number, number]>([7, 10]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Nouveaux filtres personnels
  const [sourceFilter, setSourceFilter] = useState<'all' | 'imported' | 'official'>('all');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [dPlusFilter, setDPlusFilter] = useState<'all' | 'flat' | 'moderate' | 'hilly'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Intégration du gestionnaire de base de données locale IndexedDB
  const {
    userTracks,
    tripsList,
    importAndPersistGpxFiles,
    saveCustomTrack,
    deleteTrack,
    updateTrackNotes,
    markTrackSynced,
    exportLibrary,
    importLibraryBackup,
  } = useUserGpxLibrary();

  // Filtrage des traces locales importées selon les critères actuels
  const filterUserTracks = useCallback(
    (
      tracks: StoredGpxTrack[],
      currentActivity: 'bike' | 'hike',
      distRange: [number, number],
      filters: string[],
      trip: string | null,
      dPlus: 'all' | 'flat' | 'moderate' | 'hilly',
      query: string
    ) => {
      const effectiveMinD = distRange[0] <= (currentActivity === 'bike' ? 15 : 3) ? 0 : distRange[0];
      const effectiveMaxD =
        distRange[1] >= (currentActivity === 'bike' ? 120 : 35) ? Infinity : distRange[1];

      return tracks.filter((t) => {
        if (t.activity !== currentActivity) return false;

        // Filtre de distance (ouvert aux extrémités du curseur)
        if (t.distanceKm < effectiveMinD || t.distanceKm > effectiveMaxD) {
          return false;
        }

        // Filtre par voyage / dossier
        if (trip && t.tripName !== trip) return false;

        // Filtre par dénivelé (D+)
        if (dPlus === 'flat' && t.elevationGain >= 200) return false;
        if (dPlus === 'moderate' && (t.elevationGain < 200 || t.elevationGain > 600)) return false;
        if (dPlus === 'hilly' && t.elevationGain <= 600) return false;

        // Filtre textuel
        if (query && query.trim().length > 0) {
          const q = query.toLowerCase().trim();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchTrip = t.tripName ? t.tripName.toLowerCase().includes(q) : false;
          const matchNotes = t.userNotes ? t.userNotes.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchDesc && !matchTrip && !matchNotes) return false;
        }

        // Filtres d'ambiance et préférences
        if (filters && filters.length > 0) {
          const fakeItem = {
            route: {
              id: t.id,
              title: t.title,
              description: t.description || '',
              surfaceType: (t as any).surfaceType || '',
              highlights: [],
              elevationGain: t.elevationGain,
              activity: t.activity,
              roadBreakdown: t.roadBreakdown,
              tags: [],
            } as any,
            trace: {
              distance: Math.round(t.distanceKm * 1000),
              coordinates: t.coordinates,
            } as any,
            tags: [],
          };
          for (const f of filters) {
            if (!routeMatchesFilter(fakeItem, f)) {
              return false;
            }
          }
        }

        return true;
      });
    },
    []
  );

  // Fonction centrale pour exécuter le filtrage combiné
  const applyCombinedFilter = useCallback(
    async (
      locationToUse: string,
      distToUse: [number, number],
      filtersToUse: string[],
      activityToUse: 'bike' | 'hike',
      countryToUse?: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR',
      srcFilterToUse = sourceFilter,
      tripToUse = selectedTrip,
      dPlusToUse = dPlusFilter,
      queryToUse = searchQuery,
      boundsToUse: { north: number; south: number; east: number; west: number } | null | undefined = exploredBounds,
    ) => {
      setIsGenerating(true);
      try {
        const combinedRoutes: RouteSuggestions[] = [];
        const combinedTraces: Record<string, RouteTrace> = {};

        // 1. Traces importées dans IndexedDB
        if (srcFilterToUse !== 'official') {
          const matchingUserTracks = filterUserTracks(
            userTracks,
            activityToUse,
            distToUse,
            filtersToUse,
            tripToUse,
            dPlusToUse,
            queryToUse
          );

          matchingUserTracks.forEach((t) => {
            const { route, trace } = storedTrackToRouteAndTrace(t);
            combinedRoutes.push(route);
            combinedTraces[route.id] = trace;
          });
        }

        // 2. Traces officielles du catalogue statique
        if (srcFilterToUse !== 'imported' && !tripToUse) {
          const officialResult = await searchAndGenerateRoutes({
            location: locationToUse,
            distanceKm: distToUse,
            filters: filtersToUse,
            activity: activityToUse,
            country: countryToUse || selectedZone,
            bounds: boundsToUse || undefined,
          });

          // Application des critères personnalisés sur les routes officielles
          let filteredOfficial = officialResult.routes;

          if (dPlusToUse === 'flat') {
            filteredOfficial = filteredOfficial.filter((r) => r.elevationGain < 200);
          } else if (dPlusToUse === 'moderate') {
            filteredOfficial = filteredOfficial.filter(
              (r) => r.elevationGain >= 200 && r.elevationGain <= 600
            );
          } else if (dPlusToUse === 'hilly') {
            filteredOfficial = filteredOfficial.filter((r) => r.elevationGain > 600);
          }

          if (queryToUse && queryToUse.trim().length > 0) {
            const q = queryToUse.toLowerCase().trim();
            filteredOfficial = filteredOfficial.filter(
              (r) =>
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.regionName?.toLowerCase().includes(q)
            );
          }

          filteredOfficial.forEach((r) => {
            if (!combinedTraces[r.id] && officialResult.traces[r.id]) {
              combinedRoutes.push(r);
              combinedTraces[r.id] = officialResult.traces[r.id];
            }
          });

          if (officialResult.locationName) {
            setCurrentLocation(officialResult.locationName);
          }
        }

        setRoutes(combinedRoutes);
        setTraces(combinedTraces);

        // Désélectionner pour avoir une vue d'ensemble propre sur la carte
        setSelectedRouteId(null);
        setIsProfileOpen(false);
      } catch (err) {
        console.error('Erreur lors du filtrage combiné:', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      sourceFilter,
      selectedTrip,
      dPlusFilter,
      searchQuery,
      filterUserTracks,
      userTracks,
      selectedZone,
      exploredBounds,
    ]
  );

  // Chargement initial ou changement de base IndexedDB
  useEffect(() => {
    applyCombinedFilter(
      currentLocation,
      distance,
      activeFilters,
      activity,
      selectedZone,
      sourceFilter,
      selectedTrip,
      dPlusFilter,
      searchQuery,
      exploredBounds
    );
  }, [userTracks]);

  const [isTraceVisibleOnMap, setIsTraceVisibleOnMap] = useState<boolean>(true);

  const selectRoute = useCallback((id: string | null) => {
    setSelectedRouteId(id);
    setIsTraceVisibleOnMap(true);
    if (id) {
      setFocusTrigger((prev) => prev + 1);
    } else {
      setIsProfileOpen(false);
    }
  }, []);

  const changeRegionalZone = useCallback(
    (zoneId: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR') => {
      setSelectedZone(zoneId);
      setExploredBounds(null);
      const zone = REGIONAL_ZONES.find((z) => z.id === zoneId);
      if (zone) {
        setMapCenterTarget({
          center: [zone.center[1], zone.center[0]],
          zoom: zone.zoom,
          trigger: Date.now(),
        });
        setCurrentLocation(zone.name);
      }

      applyCombinedFilter(
        zone?.name || currentLocation,
        distance,
        activeFilters,
        activity,
        zoneId,
        sourceFilter,
        selectedTrip,
        dPlusFilter,
        searchQuery,
        null
      );
      setClickedCoord(null);
    },
    [
      currentLocation,
      distance,
      activeFilters,
      activity,
      sourceFilter,
      selectedTrip,
      dPlusFilter,
      searchQuery,
      applyCombinedFilter,
    ]
  );

  const clearAllFilters = useCallback(() => {
    const fullDist: [number, number] = activity === 'bike' ? [15, 120] : [3, 35];
    const allZone = REGIONAL_ZONES[0];
    setActiveFilters([]);
    setDistance(fullDist);
    setSelectedZone('ALL');
    setCurrentLocation(allZone.name);
    setClickedCoord(null);
    setExploredBounds(null);
    setSourceFilter('all');
    setSelectedTrip(null);
    setDPlusFilter('all');
    setSearchQuery('');

    setMapCenterTarget({
      center: [allZone.center[1], allZone.center[0]],
      zoom: allZone.zoom,
      trigger: Date.now(),
    });

    applyCombinedFilter(
      allZone.name,
      fullDist,
      [],
      activity,
      'ALL',
      'all',
      null,
      'all',
      '',
      null
    );
  }, [activity, applyCombinedFilter]);

  const selectRouteFromClick = useCallback(
    (_lat: number, _lng: number) => {
      // Clicking on the map background outside a trace simply deselects the active trace
      // without altering the visible catalog or generating new traces.
      setSelectedRouteId(null);
      setIsProfileOpen(false);
      setClickedCoord(null);
    },
    []
  );

  const generateRoute = useCallback(
    async (
      location: string,
      distanceKm: [number, number],
      filters: string[],
      currentActivity: 'bike' | 'hike',
      _mapTracesOnly: boolean
    ) => {
      setActivity(currentActivity);
      setIsGenerating(true);
      try {
        const center = resolveLocationOffline(location);
        const nearest = findNearestLocationOffline(center);
        const resolvedName = location || nearest.name;
        setCurrentLocation(resolvedName);

        const result = await searchAndGenerateRoutes({
          location,
          center,
          distanceKm,
          filters,
          activity: currentActivity,
        });

        setRoutes(result.routes);
        setTraces(result.traces);

        if (result.routes.length > 0) {
          setSelectedRouteId(result.routes[0].id);
        } else {
          setSelectedRouteId(null);
          setIsProfileOpen(false);
        }

        setClickedCoord({
          lat: center[1],
          lng: center[0],
          name: `${resolvedName} (${nearest.country})`,
        });

        setFocusTrigger((prev) => prev + 1);
      } catch (error) {
        console.error('Erreur generation route:', error);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const filterMap = useCallback(
    async (
      location: string,
      distanceKm: [number, number],
      filters: string[],
      currentActivity: 'bike' | 'hike',
      country?: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR'
    ) => {
      setActivity(currentActivity);
      let nextBounds = exploredBounds;
      if (!isRegionalZoneLocation(location)) {
        setCurrentLocation(location);
        const center = resolveLocationOffline(location);
        setMapCenterTarget({
          center: [center[1], center[0]],
          zoom: 11,
          trigger: Date.now(),
        });
        setExploredBounds(null);
        nextBounds = null;
      }
      await applyCombinedFilter(
        location,
        distanceKm,
        filters,
        currentActivity,
        country || selectedZone,
        sourceFilter,
        selectedTrip,
        dPlusFilter,
        searchQuery,
        nextBounds
      );
    },
    [applyCombinedFilter, selectedZone, sourceFilter, selectedTrip, dPlusFilter, searchQuery, exploredBounds]
  );

  const searchPublic = useCallback(
    async (
      bounds: { north: number; south: number; east: number; west: number },
      distanceToUse: [number, number],
      filtersToUse: string[]
    ) => {
      setExploredBounds(bounds);
      applyCombinedFilter(
        currentLocation,
        distanceToUse,
        filtersToUse,
        activity,
        selectedZone,
        sourceFilter,
        selectedTrip,
        dPlusFilter,
        searchQuery,
        bounds
      );
    },
    [
      currentLocation,
      activity,
      selectedZone,
      sourceFilter,
      selectedTrip,
      dPlusFilter,
      searchQuery,
      applyCombinedFilter,
    ]
  );

  // Importation et persistance GPX avec support des carnets de voyage
  const importGPX = useCallback(
    async (gpxContent: string, tripName?: string) => {
      try {
        const res = await importAndPersistGpxFiles(
          [{ name: 'trace-importee.gpx', content: gpxContent }],
          activity,
          tripName
        );
        if (res.routes.length > 0) {
          setSelectedRouteId(res.routes[0].id);
          setIsProfileOpen(true);
          setFocusTrigger((prev) => prev + 1);
          return true;
        }
        return false;
      } catch (e: any) {
        console.error('Erreur import GPX:', e);
        throw new Error(e.message || 'Format GPX invalide');
      }
    },
    [activity, importAndPersistGpxFiles]
  );

  const importMultipleGPX = useCallback(
    async (files: { name: string; content: string }[], tripName?: string): Promise<number> => {
      const res = await importAndPersistGpxFiles(files, activity, tripName);
      if (res.routes.length > 0) {
        setSelectedRouteId(res.routes[0].id);
        setIsProfileOpen(true);
        setFocusTrigger((prev) => prev + 1);
        return res.routes.length;
      }
      return 0;
    },
    [activity, importAndPersistGpxFiles]
  );

  // Suppression d'une trace personnelle
  const deleteUserTrack = useCallback(
    async (id: string) => {
      await deleteTrack(id);
      if (selectedRouteId === id) {
        setSelectedRouteId(null);
        setIsProfileOpen(false);
      }
    },
    [deleteTrack, selectedRouteId]
  );

  // Inversion de sens du parcours
  const reverseCurrentRoute = useCallback(() => {
    if (!selectedRouteId || !traces[selectedRouteId]) return;

    setTraces((prev) => {
      const currentTrace = prev[selectedRouteId];
      if (!currentTrace) return prev;
      return {
        ...prev,
        [selectedRouteId]: reverseRouteTrace(currentTrace),
      };
    });

    setRoutes((prev) =>
      prev.map((r) =>
        r.id === selectedRouteId
          ? {
              ...r,
              title: r.title.includes('(Sens inverse)')
                ? r.title.replace(' (Sens inverse)', '')
                : `${r.title} (Sens inverse)`,
            }
          : r
      )
    );
  }, [selectedRouteId, traces]);

  const loadSavedRoute = useCallback((route: RouteSuggestions, trace: RouteTrace) => {
    setRoutes((prev) => {
      if (prev.some((r) => r.id === route.id)) return prev;
      return [route, ...prev];
    });
    setTraces((prev) => ({ ...prev, [route.id]: trace }));
    setSelectedRouteId(route.id);
    setActivity(route.activity);
    setIsProfileOpen(true);
    setFocusTrigger((prev) => prev + 1);
  }, []);

  return {
    isGenerating,
    routes,
    traces,
    selectedRouteId,
    setSelectedRouteId,
    selectRoute,
    isProfileOpen,
    setIsProfileOpen,
    isTraceVisibleOnMap,
    setIsTraceVisibleOnMap,
    toggleTraceVisibility: () => setIsTraceVisibleOnMap((prev) => !prev),
    deselectRoute: () => selectRoute(null),
    activity,
    setActivity,
    generateRoute,
    filterMap,
    clearAllFilters,
    searchPublic,
    selectRouteFromClick,
    importGPX,
    importMultipleGPX,
    reverseCurrentRoute,
    loadSavedRoute,
    focusTrigger,
    showNetwork,
    setShowNetwork,
    showHuntingBattues,
    setShowHuntingBattues,
    mapLayer,
    setMapLayer,
    distance,
    setDistance,
    activeFilters,
    setActiveFilters,
    selectedZone,
    changeRegionalZone,
    mapCenterTarget,
    currentLocation,
    setCurrentLocation,
    clickedCoord,
    // Nouveaux états & méthodes pour gestion voyage & critères personnels
    userTracks,
    tripsList,
    sourceFilter,
    setSourceFilter,
    selectedTrip,
    setSelectedTrip,
    dPlusFilter,
    setDPlusFilter,
    searchQuery,
    setSearchQuery,
    deleteUserTrack,
    updateTrackNotes,
    saveCustomTrack,
    markTrackSynced,
    exportLibrary,
    importLibraryBackup,
  };
}
