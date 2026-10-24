import React, { useState, useMemo } from 'react';
import type { RouteSuggestions, RouteTrace } from './types';
import { Sidebar, type MobileSheetSize } from './components/Sidebar';
import { MapDisplay } from './components/Map';
import { Favorites } from './components/Favorites';
import { TraceProfile } from './components/TraceProfile';
import { PWAInstallModal } from './components/PWAInstallModal';
import { GpxDatabaseModal } from './components/GpxDatabaseModal';
import { MapFilterBar } from './components/MapFilterBar';
import { SaveTraceModal } from './components/editor/SaveTraceModal';
import { LoopGeneratorModal } from './components/editor/LoopGeneratorModal';
import { NavigationCockpit } from './components/navigation/NavigationCockpit';
import { TopLeftCommandDock } from './components/navigation/TopLeftCommandDock';
import { SAFE_AREA_TOP_BAR } from './lib/layout/safeArea';
import { Heart, CheckCircle, Compass, EyeOff } from 'lucide-react';
import { useRouteManager } from './hooks/useRouteManager';
import { useRouteEditor } from './hooks/useRouteEditor';
import { useOutdoorNavigation } from './hooks/useOutdoorNavigation';
import { useFavorites, type SavedFavorite, type FavoriteCategory } from './hooks/useFavorites';
import { useMushroomSpots } from './hooks/useMushroomSpots';
import { NewMushroomSpotModal } from './components/mushrooms/NewMushroomSpotModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { CATALOG_ROUTES } from './lib/routeCatalog';

export default function App() {
  // Desktop (>=1024px) opens side-by-side cockpit by default; Phone & Tablet (<1024px) start 100% map and open split-view on demand
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    } catch {
      return true;
    }
  });
  const [mobileSheetSize, setMobileSheetSize] = useState<MobileSheetSize>('split');
  const [hoveredDistanceKm, setHoveredDistanceKm] = useState<number | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [previewRouteId, setPreviewRouteId] = useState<string | null>(null);
  const [mapInteractedTrigger, setMapInteractedTrigger] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [favoritesInitialTab, setFavoritesInitialTab] = useState<'todo' | 'rated' | 'sync'>('todo');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isGpxModalOpen, setIsGpxModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('trace_outdoor_theme') === 'dark';
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('trace_outdoor_theme', isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [isDarkMode]);

  // Détection automatique du paramètre ?sync=CODE lors du scan d'un QR Code
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncParam = params.get('sync');
      if (syncParam) {
        connectPairingCode(syncParam).then((res) => {
          showToast(res.message);
          window.history.replaceState({}, document.title, window.location.pathname);
          setFavoritesInitialTab('sync');
          setIsFavoritesOpen(true);
        });
      }
    } catch {
      // Ignore
    }
  }, [connectPairingCode]);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const {
    isGenerating,
    routes,
    traces,
    selectedRouteId,
    setSelectedRouteId,
    selectRoute,
    isProfileOpen,
    setIsProfileOpen,
    isTraceVisibleOnMap,
    toggleTraceVisibility,
    deselectRoute,
    activity,
    setActivity,
    generateRoute,
    filterMap,
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
    saveCustomTrack,
    markTrackSynced,
    exportLibrary,
    importLibraryBackup,
    clearAllFilters,
  } = useRouteManager();

  const editor = useRouteEditor(activity);
  const navigation = useOutdoorNavigation();
  const [navRecenterTrigger, setNavRecenterTrigger] = useState(0);

  const {
    favorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    saveFavorite,
    updateFavorite,
    deleteFavorite,
    pairingCode,
    isSyncing,
    connectPairingCode,
    disconnectPairing,
  } = useFavorites();

  const {
    spots: mushroomSpots,
    isSpottingMode,
    setIsSpottingMode,
    pendingSpotCoord,
    setPendingSpotCoord,
    addSpot: addMushroomSpot,
    deleteSpot: deleteMushroomSpot,
  } = useMushroomSpots();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Tracé en direct généré en temps réel au fur et à mesure que l'utilisateur clique ou glisse sur la carte
  const editorActiveRoute = useMemo((): { route: RouteSuggestions; trace: RouteTrace } | null => {
    if (!editor.isEditorActive) return null;
    const res = editor.calculatedResult;
    const distKm = res?.distanceKm ?? (editor.waypoints.length >= 2 ? 0.5 : 0);
    const elevGain = res?.elevationGain ?? 35;

    const liveRoute: RouteSuggestions = {
      id: 'editor-live-route',
      type: 'custom',
      title: editor.originalRoute ? `${editor.originalRoute.title} (modifié)` : 'Nouveau parcours en direct',
      description: res
        ? `Tracé outdoor en temps réel sur les sentiers (${res.distanceKm} km, +${res.elevationGain}m D+)`
        : 'Cliquez sur la carte ou glissez le tracé pour ajouter des étapes.',
      highlights: [
        editor.isLoop ? 'Boucle fermée automatique' : 'Itinéraire point à point',
        res ? `${res.roadBreakdown?.carFreePercentage ?? 85}% sur voies et sentiers apaisés` : 'Tracé en cours de saisie',
        res ? `${res.distanceKm} km sur sentiers réels` : `${editor.waypoints.length} point(s) posé(s)`,
      ],
      surfaceType: editor.activity === 'hike' ? 'Sentiers naturels & chemins forestiers' : 'Pistes cyclables & voies apaisées',
      difficulty: res?.difficulty || {
        level: 'moderate',
        label: editor.isCalculating ? 'Calcul sentiers...' : 'En cours',
        dotColor: '#7c3aed',
        badgeBg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:border-purple-800',
        badgeText: 'text-purple-800 dark:text-purple-300',
        dPlusPerKm: 15,
        effortScore: 40,
      },
      elevationGain: elevGain,
      elevationLoss: res?.elevationLoss ?? elevGain,
      minElevation: res?.elevationProfile?.length ? Math.min(...res.elevationProfile.map((p) => p.elevation)) : 250,
      maxElevation: res?.elevationProfile?.length ? Math.max(...res.elevationProfile.map((p) => p.elevation)) : 380,
      activity: editor.activity,
      country: 'LU',
      regionName: 'Parcours personnalisé',
      surfaceDistribution: res?.surfaceDistribution || [
        { type: editor.activity === 'hike' ? 'Sentier naturel' : 'Piste cyclable', percentage: 85 },
        { type: 'Petite route apaisée', percentage: 15 },
      ],
      roadBreakdown: res?.roadBreakdown || {
        carFreePercentage: 85,
        sharedRoadPercentage: 15,
        carFreeKm: Number((distKm * 0.85).toFixed(1)),
        sharedRoadKm: Number((distKm * 0.15).toFixed(1)),
        carFreeLabel: 'Sentiers & voies sans voiture',
        sharedRoadLabel: 'Routes secondaires',
        safetyRating: 'high',
      },
      waypoints: editor.waypoints,
      instructions: [],
      tags: ['custom', editor.activity],
    };

    const liveTrace: RouteTrace = {
      distance: (res?.distanceKm ?? 0) * 1000,
      duration: (res?.durationMinutes ?? 0) * 60,
      coordinates: res?.coordinates ?? editor.waypoints,
      elevationProfile: res?.elevationProfile ?? [],
      segments: res?.segments,
    };

    return { route: liveRoute, trace: liveTrace };
  }, [
    editor.isEditorActive,
    editor.calculatedResult,
    editor.originalRoute,
    editor.activity,
    editor.isLoop,
    editor.waypoints,
    editor.isCalculating,
  ]);

  // Active route displayed in the right-hand profile (immediate on map hover, selection or live trace editor)
  const displayedRouteId = hoveredRouteId || selectedRouteId || previewRouteId;
  const displayedRoute = editorActiveRoute ? editorActiveRoute.route : (routes.find((r) => r.id === displayedRouteId) || null);
  const displayedTrace = editorActiveRoute ? editorActiveRoute.trace : (displayedRouteId ? traces[displayedRouteId] || null : null);

  const handleSaveFavorite = (
    category?: FavoriteCategory,
    userNotes?: string,
    hasMushrooms?: boolean,
    userRating?: number
  ) => {
    const targetId = selectedRouteId || displayedRouteId;
    const route = routes.find((r) => r.id === targetId);
    if (!route || !targetId) return;
    const trace = traces[targetId];
    if (!trace) return;

    saveFavorite(route, trace, category, userNotes, hasMushrooms, userRating);
    showToast('Circuit et observations enregistrés dans vos favoris !');
  };

  const handleToggleFilter = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter((f) => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(newFilters);
    filterMap(currentLocation, distance, newFilters, activity, selectedZone);
  };

  const handleDistanceChange = (newDistance: [number, number]) => {
    setDistance(newDistance);
    filterMap(currentLocation, newDistance, activeFilters, activity, selectedZone);
  };

  const handleActivityChange = (newActivity: 'bike' | 'hike') => {
    if (activity === newActivity) return;
    setActivity(newActivity);
    const newDist: [number, number] = newActivity === 'bike' ? [45, 60] : [7, 10];
    setDistance(newDist);
    setSelectedRouteId(null);
    setHoveredRouteId(null);
    setPreviewRouteId(null);
    setIsProfileOpen(false);

    // Switch base map layer away from CyclOSM when entering hiking mode so cycle paths are not displayed
    if (newActivity === 'hike' && mapLayer === 'cyclosm') {
      setMapLayer('osmfr');
    } else if (newActivity === 'bike' && mapLayer === 'osmfr') {
      setMapLayer('cyclosm');
    }

    filterMap(currentLocation, newDist, activeFilters, newActivity, selectedZone);
    showToast(newActivity === 'bike' ? 'Mode Vélo activé (45–60 km)' : 'Mode Randonnée à pied activé (7–10 km)');
  };

  const handleClearFilters = () => {
    clearAllFilters();
    showToast('Tous les filtres ont été enlevés — toutes les traces sont affichées');
  };

  const handleDeselectAll = () => {
    deselectRoute();
    setHoveredRouteId(null);
    setPreviewRouteId(null);
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;
  const selectedTrace = selectedRouteId ? traces[selectedRouteId] || null : null;

  return (
    <div className="flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans h-[100dvh] overflow-hidden select-none transition-colors duration-200">
      {/* Premium Glass Toast Notification */}
      {notification && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[2000] bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-[0_12px_32px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3"
          style={{ top: SAFE_AREA_TOP_BAR }}
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="tracking-tight">{notification}</span>
        </div>
      )}

      {/* Main Map Viewport (Always visible: 100% when panel closed, 44%–70% top split on phone, 55%–75% left split on tablet/desktop) */}
      <main className="w-full relative flex-1 min-h-[42dvh] md:min-w-[55%] h-full z-0 overflow-hidden transition-all duration-300">
        {/* Floating Top Left Command Dock (Sidebar, Favoris, Base GPX, Studio Tracé, Thème, PWA) */}
        <TopLeftCommandDock
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          favoritesCount={favorites.length}
          onOpenFavorites={() => {
            setFavoritesInitialTab('todo');
            setIsFavoritesOpen(true);
          }}
          onOpenSyncModal={() => {
            setFavoritesInitialTab('sync');
            setIsFavoritesOpen(true);
          }}
          tracksCount={userTracks.length + CATALOG_ROUTES.length}
          onOpenGpxModal={() => setIsGpxModalOpen(true)}
          isEditorActive={editor.isEditorActive}
          onToggleEditor={() => {
            if (editor.isEditorActive) {
              editor.cancel();
            } else {
              editor.startCreating(activity);
              setIsSidebarOpen(false);
            }
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isInstalled={isInstalled}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* Floating On-Map Premium Circuit Filters */}
        {!editor.isEditorActive && (
          <MapFilterBar
            activity={activity}
            onActivityChange={handleActivityChange}
            distance={distance}
            onDistanceChange={handleDistanceChange}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            onClearFilters={handleClearFilters}
            routesCount={routes.length}
            isGenerating={isGenerating}
            currentLocation={currentLocation}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            tripsList={tripsList}
            selectedTrip={selectedTrip}
            onSelectTrip={setSelectedTrip}
            dPlusFilter={dPlusFilter}
            onDPlusFilterChange={setDPlusFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            userTracksCount={userTracks.length}
          />
        )}

        {/* Leaflet Map */}
        <MapDisplay
          routes={routes}
          traces={traces}
          activity={activity}
          selectedRouteId={selectedRouteId}
          hoveredRouteId={hoveredRouteId}
          onSelectRoute={(id) => {
            selectRoute(id);
            setPreviewRouteId(id);
            setMapInteractedTrigger((prev) => prev + 1);
            if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setIsSidebarOpen(true);
            }
          }}
          onHoverRoute={(id) => {
            setHoveredRouteId(id);
            if (id) {
              setPreviewRouteId(id);
              setMapInteractedTrigger((prev) => prev + 1);
              if (typeof window !== 'undefined' && window.innerWidth >= 768 && !isSidebarOpen) {
                setIsSidebarOpen(true);
              }
            }
          }}
          onSearchBounds={(bounds) => {
            searchPublic(bounds, distance, activeFilters);
          }}
          onMapClick={(lat, lng) => {
            selectRouteFromClick(lat, lng);
          }}
          isGenerating={isGenerating}
          focusTrigger={focusTrigger}
          showNetwork={showNetwork}
          setShowNetwork={setShowNetwork}
          showHuntingBattues={showHuntingBattues}
          setShowHuntingBattues={setShowHuntingBattues}
          mapLayer={mapLayer}
          setMapLayer={setMapLayer}
          hoveredDistanceKm={hoveredDistanceKm}
          mapCenterTarget={mapCenterTarget}
          clickedCoord={clickedCoord}
          isTraceVisible={isTraceVisibleOnMap}
          onToggleTraceVisibility={toggleTraceVisibility}
          editor={editor}
          navigation={navigation}
          recenterTrigger={navRecenterTrigger}
          onStartNavigation={(r, t) => {
            navigation.startNavigation(r, t);
            setIsSidebarOpen(false);
            showToast(`Guidage démarré : ${r.title}`);
          }}
          onDeselectRoute={handleDeselectAll}
          onOpenDetails={() => setIsSidebarOpen(true)}
          isDetailsOpen={isSidebarOpen}
          onReverseRoute={() => {
            reverseCurrentRoute();
            showToast('Sens de parcours inversé.');
          }}
          favorites={favorites}
          onLoadFavorite={(r, t) => {
            loadSavedRoute(r, t);
            showToast(`Circuit "${r.title}" chargé sur la carte.`);
          }}
          mushroomSpots={mushroomSpots}
          onDeleteMushroomSpot={(id) => {
            deleteMushroomSpot(id);
            showToast('Coin à champignons supprimé.');
          }}
          isSpottingMode={isSpottingMode}
          onToggleSpottingMode={() => setIsSpottingMode((prev) => !prev)}
          onMapClickSpotCoord={(coord) => setPendingSpotCoord(coord)}
        />

        {/* Bottom Elevation Profile Bar (Shown when Sidebar is closed and profile drawer is open) */}
        {!isSidebarOpen && isProfileOpen && selectedRoute && selectedTrace && (
          <TraceProfile
            route={selectedRoute}
            trace={selectedTrace}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpen={() => setIsProfileOpen(true)}
            onHoverDistance={setHoveredDistanceKm}
            isTraceVisible={isTraceVisibleOnMap}
            onToggleTraceVisibility={toggleTraceVisibility}
            onDeselect={handleDeselectAll}
          />
        )}

        {/* Mobile & Tablet Floating Quick Navigation Dock when panel is closed and not in mushroom spotting mode */}
        {!isSidebarOpen && !isProfileOpen && !selectedRoute && !isSpottingMode && (
          <div
            className="absolute left-3 right-3 z-[410] lg:hidden pointer-events-none flex justify-center transition-all"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.75rem)' }}
          >
            <div className="pointer-events-auto bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)] border border-white/70 dark:border-slate-700/80 p-1.5 flex items-center gap-1.5 max-w-xs w-full justify-between">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explorer les circuits ({routes.length})</span>
              </button>
              <button
                onClick={() => setIsFavoritesOpen(true)}
                className="p-2 rounded-xl text-rose-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all relative shrink-0 cursor-pointer"
                title="Mes favoris"
              >
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Non-blocking Adaptive Split Panel:
          - Phone (<768px): True bottom split sheet (30dvh / 44dvh / 56dvh) with ZERO map backdrop so upper 44%–70% map is always live & interactive!
          - Tablet (768px–1024px) & Desktop (>=1024px): Right-hand studio column (w-80 / w-96 / w-[400px]) alongside the main map. */}
      {isSidebarOpen && (
        <aside
          className={`relative z-20 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-out shadow-[0_-12px_35px_-10px_rgba(15,23,42,0.18)] md:shadow-[-12px_0_45px_-15px_rgba(15,23,42,0.18)] w-full md:w-80 lg:w-96 xl:w-[400px] shrink-0 rounded-t-3xl md:rounded-none overflow-hidden ${
            mobileSheetSize === 'compact'
              ? 'h-[30dvh] md:h-full'
              : mobileSheetSize === 'tall'
                ? 'h-[56dvh] md:h-full'
                : 'h-[44dvh] md:h-full'
          }`}
        >
          <Sidebar
            onGenerate={generateRoute}
            onFilterMap={filterMap}
            onImportGPX={(content) => {
              const ok = importGPX(content);
              if (ok) showToast('Fichier GPX importé avec succès !');
              return ok;
            }}
            onReverseRoute={() => {
              reverseCurrentRoute();
              showToast('Sens de parcours inversé.');
            }}
            routes={routes}
            selectedRouteId={selectedRouteId}
            hoveredRouteId={hoveredRouteId}
            onSelectRoute={(id) => {
              selectRoute(id);
              setPreviewRouteId(id);
              setHoveredRouteId(null);
            }}
            onHoverRoute={(id) => setHoveredRouteId(id)}
            onHoverDistance={setHoveredDistanceKm}
            isGenerating={isGenerating}
            route={displayedRoute}
            trace={displayedTrace}
            traces={traces}
            onSaveFavorite={handleSaveFavorite}
            activity={activity}
            onActivityChange={handleActivityChange}
            distance={distance}
            setDistance={handleDistanceChange}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            onClearAllFilters={handleClearFilters}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onOpenGpxModal={() => setIsGpxModalOpen(true)}
            isInstalled={isInstalled}
            currentLocation={currentLocation}
            onLocationChange={setCurrentLocation}
            clickedCoord={clickedCoord}
            onClose={() => setIsSidebarOpen(false)}
            isTraceVisible={isTraceVisibleOnMap}
            onToggleTraceVisibility={toggleTraceVisibility}
            onDeselectRoute={handleDeselectAll}
            isHoverPreview={!selectedRouteId || (Boolean(hoveredRouteId) && hoveredRouteId !== selectedRouteId)}
            mapInteractedTrigger={mapInteractedTrigger}
            mobileSheetSize={mobileSheetSize}
            onChangeMobileSheetSize={setMobileSheetSize}
            showHuntingBattues={showHuntingBattues}
            onToggleHuntingBattues={() => setShowHuntingBattues(!showHuntingBattues)}
            onEditRoute={(r, t) => {
              editor.startEditing(r, t);
              setIsSidebarOpen(true);
            }}
            onStartCreateRoute={() => {
              editor.startCreating(activity);
              setIsSidebarOpen(true);
            }}
            editor={editor}
            onStartNavigation={(r, t) => {
              navigation.startNavigation(r, t);
              setIsSidebarOpen(false); // Mode plein écran carte en navigation
              showToast(`Guidage démarré : ${r.title}`);
            }}
            isNavigating={navigation.isNavigating}
          />
        </aside>
      )}

      {/* Favorites Modal */}
      <Favorites
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onDelete={deleteFavorite}
        onLoad={(r, t) => {
          loadSavedRoute(r, t);
          showToast(`Tracé "${r.title}" chargé sur la carte.`);
        }}
        onUpdateFavorite={updateFavorite}
        pairingCode={pairingCode}
        isSyncing={isSyncing}
        onConnectPairingCode={connectPairingCode}
        onDisconnectPairing={disconnectPairing}
        initialTab={favoritesInitialTab}
      />

      {/* Modal d'ajout d'un nouveau coin à champignons */}
      <NewMushroomSpotModal
        isOpen={Boolean(pendingSpotCoord)}
        coordinate={pendingSpotCoord}
        onClose={() => setPendingSpotCoord(null)}
        onSave={(name, variety, coords, notes) => {
          addMushroomSpot(name, variety, coords, notes);
          showToast(`Coin à champignons "${name}" enregistré sur la carte ! 🍄`);
        }}
      />

      {/* PWA Install Modal (Step-by-step for iPhone Safari and 1-click for Android/Desktop) */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isIOS={isIOS}
        isInstallable={isInstallable}
        onInstall={install}
      />

      {/* GPX Database, Batch Drop & GitHub Maintenance Modal */}
      <GpxDatabaseModal
        isOpen={isGpxModalOpen}
        onClose={() => setIsGpxModalOpen(false)}
        onImportMultiple={importMultipleGPX}
        totalOfficialCount={CATALOG_ROUTES.length}
        bikeCount={CATALOG_ROUTES.filter((r) => r.route.activity === 'bike').length}
        hikeCount={CATALOG_ROUTES.filter((r) => r.route.activity === 'hike').length}
        activity={activity}
        userTracks={userTracks}
        tripsList={tripsList}
        onDeleteTrack={deleteUserTrack}
        onMarkTrackSynced={markTrackSynced}
        onExportLibrary={exportLibrary}
        onImportLibraryBackup={importLibraryBackup}
        onSelectTrack={(id) => {
          selectRoute(id);
          setIsSidebarOpen(true);
        }}
      />

      {/* Modal d'enregistrement GPX pour nouveaux parcours et variantes */}
      <SaveTraceModal
        editor={editor}
        tripsList={tripsList}
        onSaveTrack={saveCustomTrack}
        onSelectSavedRoute={(id) => {
          selectRoute(id);
          setIsSidebarOpen(true);
        }}
        showToast={showToast}
      />

      {/* Modal de génération automatique de boucle outdoor */}
      <LoopGeneratorModal
        editor={editor}
        mapCenter={mapCenterTarget ? [mapCenterTarget.lng, mapCenterTarget.lat] : [6.13, 49.61]}
      />

      {/* Cockpit de Guidage Terrain Tête-Haute (100% Hors-Ligne, 0 API) */}
      <NavigationCockpit
        navigation={navigation}
        onRecenter={() => setNavRecenterTrigger((prev) => prev + 1)}
      />
    </div>
  );
}
