import React, { useState } from 'react';
import { Sidebar, type MobileSheetSize } from './components/Sidebar';
import { MapDisplay } from './components/Map';
import { Favorites } from './components/Favorites';
import { TraceProfile } from './components/TraceProfile';
import { PWAInstallModal } from './components/PWAInstallModal';
import { GpxDatabaseModal } from './components/GpxDatabaseModal';
import { MapFilterBar } from './components/MapFilterBar';
import { Heart, Menu, X, CheckCircle, Smartphone, Compass, FolderGit2, EyeOff, Moon, Sun } from 'lucide-react';
import { useRouteManager } from './hooks/useRouteManager';
import { useFavorites } from './hooks/useFavorites';
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
    markTrackSynced,
    exportLibrary,
    importLibraryBackup,
    clearAllFilters,
  } = useRouteManager();

  const {
    favorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    saveFavorite,
    updateFavorite,
    deleteFavorite,
  } = useFavorites();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Active route displayed in the right-hand profile (immediate on map hover or selection)
  const displayedRouteId = hoveredRouteId || selectedRouteId || previewRouteId;
  const displayedRoute = routes.find((r) => r.id === displayedRouteId) || null;
  const displayedTrace = displayedRouteId ? traces[displayedRouteId] || null : null;

  const handleSaveFavorite = (userRating?: number, userNotes?: string) => {
    const targetId = selectedRouteId || displayedRouteId;
    const route = routes.find((r) => r.id === targetId);
    if (!route || !targetId) return;
    const trace = traces[targetId];
    if (!trace) return;

    const saved = saveFavorite(route, trace, userRating, userNotes);
    if (saved) {
      showToast('Itinéraire et notes enregistrés dans vos favoris !');
    } else {
      showToast('Cet itinéraire est déjà présent dans vos favoris.');
    }
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
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="tracking-tight">{notification}</span>
        </div>
      )}

      {/* Main Map Viewport (Always visible: 100% when panel closed, 44%–70% top split on phone, 55%–75% left split on tablet/desktop) */}
      <main className="w-full relative flex-1 min-h-[42dvh] md:min-w-[55%] h-full z-0 overflow-hidden transition-all duration-300">
        {/* Floating Top Left Frosted Glass Command Dock */}
        <div
          className="absolute z-[400] flex flex-col gap-1 sm:gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/70 dark:border-slate-700/80 rounded-2xl p-1 sm:p-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.14)] transition-all"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 0.65rem)',
            left: 'calc(env(safe-area-inset-left, 0px) + 0.65rem)',
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`rounded-xl p-2 transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            title={isSidebarOpen ? 'Masquer le panneau (100% carte)' : 'Ouvrir le panneau des circuits'}
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="h-px bg-slate-200/80 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => setIsFavoritesOpen(true)}
            className="rounded-xl p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all text-slate-600 dark:text-slate-300 hover:text-rose-600 relative cursor-pointer group"
            title="Bibliothèque des favoris & carnet de terrain"
          >
            <Heart className="w-4 h-4 fill-rose-500/15 text-rose-500 group-hover:scale-110 transition-transform" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
                {favorites.length}
              </span>
            )}
          </button>

          {/* GPX Database & Offline Maintenance Button */}
          <button
            onClick={() => setIsGpxModalOpen(true)}
            className="rounded-xl p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-600 relative group cursor-pointer"
            title={`Base GPX & Carnets de voyage (${userTracks.length + CATALOG_ROUTES.length} traces)`}
          >
            <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 bg-slate-900 dark:bg-emerald-600 text-white font-mono-kpi font-bold text-[8px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
              {userTracks.length + CATALOG_ROUTES.length}
            </span>
          </button>

          {/* Dark / Light Cockpit Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-amber-400 cursor-pointer group"
            title={isDarkMode ? 'Passer en mode Clair (Alpine)' : 'Passer en mode Sombre (Cockpit Pro)'}
            aria-label="Changer le thème"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 group-hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Install PWA Button on map (visible on mobile / desktop when not in standalone) */}
          {!isInstalled && (
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="rounded-xl p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all text-slate-600 dark:text-slate-300 hover:text-emerald-600 group cursor-pointer"
              title="Installer sur iPhone / App mobile"
            >
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Floating On-Map Premium Circuit Filters */}
        <MapFilterBar
          activity={activity}
          onActivityChange={handleActivityChange}
          distance={distance}
          onDistanceChange={handleDistanceChange}
          activeFilters={activeFilters}
          onToggleFilter={handleToggleFilter}
          onClearFilters={handleClearFilters}
          selectedZone={selectedZone}
          onSelectZone={(z) => changeRegionalZone(z)}
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
            setIsSidebarOpen(true);
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
        />

        {/* Floating indicator when trace is hidden to inspect roads below */}
        {!isTraceVisibleOnMap && selectedRoute && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-[420] bg-slate-900/95 text-white px-3.5 py-1.5 rounded-2xl text-xs font-semibold shadow-2xl border border-slate-700/80 backdrop-blur-xl flex items-center gap-2 animate-in fade-in transition-all max-w-[92%]"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.6rem)' }}
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Trace masquée (routes visibles)</span>
            <button
              onClick={toggleTraceVisibility}
              className="ml-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm transition-all cursor-pointer shrink-0"
            >
              Réafficher
            </button>
          </div>
        )}

        {/* Bottom Elevation Profile Bar (Shown only when Sidebar is closed so it never duplicates or blocks the map in split view) */}
        {!isSidebarOpen && selectedRoute && selectedTrace && (
          <TraceProfile
            route={selectedRoute}
            trace={selectedTrace}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpen={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setIsSidebarOpen(true);
              } else {
                setIsProfileOpen(true);
              }
            }}
            onHoverDistance={setHoveredDistanceKm}
            isTraceVisible={isTraceVisibleOnMap}
            onToggleTraceVisibility={toggleTraceVisibility}
            onDeselect={handleDeselectAll}
          />
        )}

        {/* Mobile & Tablet Floating Quick Navigation Dock when panel is closed */}
        {!isSidebarOpen && !isProfileOpen && !selectedRoute && (
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
            selectedZone={selectedZone}
            onSelectZone={changeRegionalZone}
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
    </div>
  );
}
