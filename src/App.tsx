import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapDisplay } from './components/Map';
import { Favorites } from './components/Favorites';
import { TraceProfile } from './components/TraceProfile';
import { PWAInstallModal } from './components/PWAInstallModal';
import { GpxDatabaseModal } from './components/GpxDatabaseModal';
import { MapFilterBar } from './components/MapFilterBar';
import { Heart, Menu, X, CheckCircle, Smartphone, Compass, FolderGit2 } from 'lucide-react';
import { useRouteManager } from './hooks/useRouteManager';
import { useFavorites } from './hooks/useFavorites';
import { usePWAInstall } from './hooks/usePWAInstall';
import { CATALOG_ROUTES } from './lib/routeCatalog';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Full screen map by default on launch
  const [hoveredDistanceKm, setHoveredDistanceKm] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isGpxModalOpen, setIsGpxModalOpen] = useState(false);

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

  const handleSaveFavorite = (userRating?: number, userNotes?: string) => {
    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route || !selectedRouteId) return;
    const trace = traces[selectedRouteId];
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
    const newDist: [number, number] = newActivity === 'bike' ? [25, 60] : [5, 18];
    setDistance(newDist);
    setSelectedRouteId(null);
    setIsProfileOpen(false);

    // Switch base map layer away from CyclOSM when entering hiking mode so cycle paths are not displayed
    if (newActivity === 'hike' && mapLayer === 'cyclosm') {
      setMapLayer('osmfr');
    } else if (newActivity === 'bike' && mapLayer === 'osmfr') {
      setMapLayer('cyclosm');
    }

    filterMap(currentLocation, newDist, activeFilters, newActivity, selectedZone);
    showToast(newActivity === 'bike' ? 'Mode Vélo activé (25–60 km)' : 'Mode Randonnée à pied activé (5–18 km)');
  };

  const handleClearFilters = () => {
    const defaultFilters = ['low_traffic'];
    const defaultDist: [number, number] = activity === 'bike' ? [25, 60] : [5, 18];
    setActiveFilters(defaultFilters);
    setDistance(defaultDist);
    if (selectedZone !== 'ALL') {
      changeRegionalZone('ALL');
    } else {
      filterMap(currentLocation, defaultDist, defaultFilters, activity, 'ALL');
    }
    showToast('Filtres réinitialisés');
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;
  const selectedTrace = selectedRouteId ? traces[selectedRouteId] || null : null;

  return (
    <div className="flex flex-col md:flex-row bg-stone-50 text-stone-900 font-sans h-[100dvh] overflow-hidden select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[2000] bg-stone-900/90 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Main Map Viewport (Full height on mobile and desktop) */}
      <main className="w-full relative flex-1 h-full z-0 overflow-hidden">
        {/* Floating Top Left Controls */}
        <div
          className="absolute z-[400] flex flex-col gap-2 transition-all"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
            left: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-2.5 shadow-md hover:border-emerald-600 hover:text-emerald-700 transition-all text-stone-600"
            title={isSidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsFavoritesOpen(true)}
            className="bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-2.5 shadow-md hover:border-emerald-600 hover:text-emerald-700 transition-all text-stone-600 relative"
            title="Bibliothèque des favoris"
          >
            <Heart className="w-4 h-4 fill-rose-50 text-rose-500" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {/* GPX Database & Offline Maintenance Button */}
          <button
            onClick={() => setIsGpxModalOpen(true)}
            className="bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-2.5 shadow-md hover:border-emerald-600 hover:text-emerald-700 transition-all text-stone-600 relative group"
            title={`Base GPX & Carnets de voyage (${userTracks.length + CATALOG_ROUTES.length} traces)`}
          >
            <FolderGit2 className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 bg-stone-900 text-white font-extrabold text-[8px] px-1 rounded-full flex items-center justify-center">
              {userTracks.length + CATALOG_ROUTES.length}
            </span>
          </button>

          {/* Install PWA Button on map (visible on mobile / desktop when not in standalone) */}
          {!isInstalled && (
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-2.5 shadow-md hover:border-emerald-600 hover:text-emerald-700 transition-all text-stone-600 group"
              title="Installer sur iPhone / App mobile"
            >
              <Smartphone className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
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
          onSelectRoute={(id) => {
            selectRoute(id);
            setIsSidebarOpen(true);
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
          mapLayer={mapLayer}
          setMapLayer={setMapLayer}
          hoveredDistanceKm={hoveredDistanceKm}
          mapCenterTarget={mapCenterTarget}
          clickedCoord={clickedCoord}
        />

        {/* Bottom Elevation Profile Bar */}
        {selectedRoute && selectedTrace && (
          <TraceProfile
            route={selectedRoute}
            trace={selectedTrace}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpen={() => setIsProfileOpen(true)}
            onHoverDistance={setHoveredDistanceKm}
          />
        )}

        {/* Mobile Floating Quick Navigation Dock */}
        {!isSidebarOpen && !isProfileOpen && !selectedRoute && (
          <div
            className="fixed left-3 right-3 z-[410] md:hidden pointer-events-none flex justify-center transition-all"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
          >
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/90 p-1.5 flex items-center gap-1.5 max-w-sm w-full justify-between">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs active:scale-95 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Explorer les circuits ({routes.length})</span>
              </button>
              <button
                onClick={() => setIsFavoritesOpen(true)}
                className="p-2.5 rounded-xl text-rose-500 bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all relative shrink-0"
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

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-[490] md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel: Sliding Bottom Sheet on Mobile, Sticky Drawer on Desktop */}
      <div
        className={`fixed md:relative bottom-0 left-0 right-0 md:inset-auto z-[500] md:z-10 bg-white md:border-l border-stone-200 transition-all duration-300 md:duration-0 ease-out shadow-2xl md:shadow-[-10px_0_40px_-15px_rgba(0,0,0,0.15)] w-full md:w-88 lg:w-96 shrink-0 ${
          isSidebarOpen
            ? 'h-[82vh] md:h-full translate-y-0 rounded-t-3xl md:rounded-none block'
            : 'translate-y-full md:translate-y-0 hidden md:block'
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
          onSelectRoute={(id) => selectRoute(id)}
          isGenerating={isGenerating}
          route={selectedRoute}
          trace={selectedTrace}
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
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenGpxModal={() => setIsGpxModalOpen(true)}
          isInstalled={isInstalled}
          currentLocation={currentLocation}
          onLocationChange={setCurrentLocation}
          clickedCoord={clickedCoord}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

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
