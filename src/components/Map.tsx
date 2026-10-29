import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { HuntingRifleIcon } from './ui/HuntingRifleIcon';
import type { RouteSuggestions, RouteTrace } from '../types';
import {
  MapTileLayers,
  type MapLayerType,
  LUXEMBOURG_CENTER,
  LUXEMBOURG_BOUNDS,
} from './map/MapTileLayers';
import { MapLayersMenu } from './map/MapLayersMenu';
import {
  DesktopZoomControl,
  LocateControl,
  MapResizer,
  MapCenterWatcher,
  MapController,
  MapClicker,
} from './map/MapControls';
import { MapRoutesLayer } from './map/MapRoutesLayer';
import { MapFavoritesLayer } from './map/MapFavoritesLayer';
import { MapMushroomLayer } from './map/MapMushroomLayer';
import { SelectedPlaceMapLayer } from './map/SelectedPlaceMapLayer';
import { MushroomDockButton } from './mushrooms/MushroomDockButton';
import { HuntingBattuesDockButton } from './hunting/HuntingBattuesDockButton';
import type { SavedFavorite } from '../hooks/useFavorites';
import type { PlaceEntry } from '../lib/routing/gazetteer';
import type { MushroomSpot } from '../types/mushroom';
import { MapRouteQuickDock } from './map/MapRouteQuickDock';
import { openWazeNavigation } from '../lib/navigation/wazeNavigation';
import { MapEditorLayer } from './map/MapEditorLayer';
import { TraceEditorBar } from './editor/TraceEditorBar';
import { NavigationMapLayer } from './navigation/NavigationMapLayer';
import { ROUTE_DIFFICULTY_LEGEND } from './ui/PremiumPrimitives';
import { SAFE_AREA_TOP_BAR, SAFE_AREA_RIGHT_DOCK } from '../lib/layout/safeArea';
import { TOUCH_MAP_BUTTON_CLASS } from '../lib/layout/touchDimensions';
import { fitMapToLuxembourg } from '../lib/layout/mapViewport';
import type { UseRouteEditorReturn } from '../hooks/useRouteEditor';
import type { UseOutdoorNavigationReturn } from '../hooks/useOutdoorNavigation';

export { LUXEMBOURG_CENTER, LUXEMBOURG_BOUNDS, type MapLayerType };

/**
 * Cadre automatiquement l'ensemble du territoire luxembourgeois à l'ouverture,
 * avec une marge supérieure réservée pour dégager la barre de filtres flottante.
 */
function InitialLuxembourgFitter() {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (hasFittedRef.current) return;
    hasFittedRef.current = true;
    fitMapToLuxembourg(map, false);
  }, [map]);

  return null;
}

/**
 * Conteneur pour les boutons de contrôle situés en haut à droite de la carte.
 * Utilise la classe Leaflet officielle `.leaflet-control` et désactive la propagation des clics
 * vers le canvas Leaflet sous-jacent afin que tous les boutons soient 100% cliquables
 * sur ordinateur comme sur écran tactile mobile / iPad.
 */
function MapRightControlsDock({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute z-[450] flex flex-col gap-2 pointer-events-auto"
      style={{
        top: SAFE_AREA_TOP_BAR,
        right: SAFE_AREA_RIGHT_DOCK,
      }}
    >
      {children}
    </div>
  );
}

interface MapProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  activity: 'bike' | 'hike';
  selectedRouteId: string | null;
  hoveredRouteId?: string | null;
  onSelectRoute: (id: string, clickedLatLng?: [number, number]) => void;
  onHoverRoute?: (id: string | null) => void;
  onSearchBounds: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  onMapClick: (lat: number, lng: number) => void;
  isGenerating: boolean;
  focusTrigger: number;
  showNetwork: boolean;
  setShowNetwork: (show: boolean) => void;
  showHuntingBattues?: boolean;
  setShowHuntingBattues?: (show: boolean) => void;
  mapLayer: MapLayerType;
  setMapLayer: (layer: MapLayerType) => void;
  hoveredDistanceKm?: number | null;
  mapCenterTarget?: { center: [number, number]; zoom: number; trigger: number };
  clickedCoord?: { lat: number; lng: number; name: string } | null;
  isTraceVisible?: boolean;
  onToggleTraceVisibility?: () => void;
  editor?: UseRouteEditorReturn;
  navigation?: UseOutdoorNavigationReturn;
  recenterTrigger?: number;
  onStartNavigation?: (route: RouteSuggestions, trace: RouteTrace) => void;
  onDeselectRoute?: () => void;
  onOpenDetails?: () => void;
  isDetailsOpen?: boolean;
  onReverseRoute?: () => void;
  favorites?: SavedFavorite[];
  onLoadFavorite?: (route: RouteSuggestions, trace: RouteTrace) => void;
  mushroomSpots?: MushroomSpot[];
  onDeleteMushroomSpot?: (id: string) => void;
  isSpottingMode?: boolean;
  onToggleSpottingMode?: () => void;
  onMapClickSpotCoord?: (coord: [number, number]) => void;
  selectedPlace?: PlaceEntry | null;
  onClearSelectedPlace?: () => void;
  onUserLocationChange?: (coords: [number, number]) => void;
  onEditRoute?: (route: RouteSuggestions, trace: RouteTrace) => void;
  onSliceSubTrace?: (route: RouteSuggestions, trace: RouteTrace) => void;
  isDetectingCycleway?: boolean;
  isCyclewaysVisible?: boolean;
  onToggleCyclewaysVisibility?: () => void;
}

export function MapDisplay({
  routes,
  traces,
  activity,
  selectedRouteId,
  hoveredRouteId,
  onSelectRoute,
  onHoverRoute,
  onSearchBounds,
  onMapClick,
  isGenerating,
  focusTrigger,
  showNetwork,
  setShowNetwork,
  showHuntingBattues,
  setShowHuntingBattues,
  mapLayer,
  setMapLayer,
  hoveredDistanceKm,
  mapCenterTarget,
  clickedCoord,
  isTraceVisible = true,
  onToggleTraceVisibility,
  editor,
  navigation,
  recenterTrigger = 0,
  onStartNavigation,
  onDeselectRoute,
  onOpenDetails,
  isDetailsOpen = false,
  onReverseRoute,
  onEditRoute,
  favorites,
  onLoadFavorite,
  mushroomSpots,
  onDeleteMushroomSpot,
  isSpottingMode = false,
  onToggleSpottingMode,
  onMapClickSpotCoord,
  selectedPlace,
  onClearSelectedPlace,
  onUserLocationChange,
  onSliceSubTrace,
  isDetectingCycleway = false,
  isCyclewaysVisible = true,
  onToggleCyclewaysVisibility,
}: MapProps) {
  const [show200kmRadius, setShow200kmRadius] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const lastLayerClickTimeRef = useRef<number>(0);

  const selectedRoute = selectedRouteId ? routes.find((r) => r.id === selectedRouteId) || null : null;
  const selectedTrace = selectedRouteId ? traces[selectedRouteId] || null : null;
  const isRouteReversed = Boolean((selectedTrace as any)?.isReversed);

  // When switching to hike mode, seamlessly switch away from CyclOSM so cycleways are not shown
  useEffect(() => {
    if (activity === 'hike' && mapLayer === 'cyclosm') {
      setMapLayer('osmfr');
    }
  }, [activity, mapLayer, setMapLayer]);

  const handleUserLocationChange = React.useCallback(
    (coords: [number, number]) => {
      setUserCoords(coords);
      if (onUserLocationChange) onUserLocationChange(coords);
    },
    [onUserLocationChange]
  );

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={LUXEMBOURG_CENTER}
        zoom={9.75}
        zoomSnap={0.25}
        zoomControl={false}
        touchZoom={true}
        className="w-full h-full"
      >
        <InitialLuxembourgFitter />
        <MapResizer />
        <MapClicker
          onMapClick={onMapClick}
          isGenerating={isGenerating}
          lastLayerClickTimeRef={lastLayerClickTimeRef}
          isEditorActive={editor?.isEditorActive}
          isSpottingMode={isSpottingMode}
        />
        <MapCenterWatcher target={mapCenterTarget} />
        <MapController selectedTrace={selectedTrace} focusTrigger={focusTrigger} />

        {/* Base Tile Layers and Overlays (CyclOSM is strictly disabled in hike mode) */}
        <MapTileLayers
          activity={activity}
          mapLayer={mapLayer}
          showNetwork={showNetwork}
          show200kmRadius={show200kmRadius}
          showHuntingBattues={showHuntingBattues}
        />

        {/* Real-time Trail Route Editor Layer */}
        {editor && (
          <MapEditorLayer
            editor={editor}
            lastLayerClickTimeRef={lastLayerClickTimeRef}
            isTraceVisible={isTraceVisible}
          />
        )}

        {/* Real-time Offline GPS Outdoor Navigation Layer */}
        {navigation?.isNavigating && (
          <NavigationMapLayer
            navigation={navigation}
            recenterTrigger={recenterTrigger}
          />
        )}

        {/* Route Traces, Segments, Tooltips and Elevation Hover Pin (strictement masqués pendant la création/modification d'une trace) */}
        {!editor?.isEditorActive && (
          <MapRoutesLayer
            routes={routes}
            traces={traces}
            selectedRouteId={selectedRouteId}
            hoveredRouteId={hoveredRouteId}
            onSelectRoute={onSelectRoute}
            onHoverRoute={onHoverRoute}
            hoveredDistanceKm={hoveredDistanceKm}
            clickedCoord={clickedCoord}
            lastLayerClickTimeRef={lastLayerClickTimeRef}
            activity={activity}
            isTraceVisible={isTraceVisible}
            isCyclewaysVisible={isCyclewaysVisible}
            onStartNavigation={onStartNavigation}
            favorites={favorites}
          />
        )}

        {/* Favoris notés affichés sur la carte (masqués pendant l'édition de trace pour garder la carte lisible) */}
        {!editor?.isEditorActive && favorites && favorites.length > 0 && onLoadFavorite && (
          <MapFavoritesLayer
            favorites={favorites}
            routes={routes}
            onSelectFavorite={onLoadFavorite}
            selectedRouteId={selectedRouteId}
          />
        )}

        {/* Coins à champignons repérés sur la carte */}
        <MapMushroomLayer
          spots={mushroomSpots || []}
          onDeleteSpot={onDeleteMushroomSpot || (() => {})}
          isSpottingMode={isSpottingMode}
          onMapClickSpotCoord={onMapClickSpotCoord || (() => {})}
        />

        {/* Point remarquable / POI ou Ville sélectionnée */}
        <SelectedPlaceMapLayer
          selectedPlace={selectedPlace || null}
          onClear={onClearSelectedPlace}
        />

        {/* Controls Top Right:
            - Desktop Zoom Control: Hidden on mobile (touch devices zoom with 2 fingers)
            - Locate Control: Geolocation button with smooth zoom to user position
            - Layer Selector Menu: Available on both desktop and mobile
            - Dedicated Hunting Rifle Button: Quick 1-click hunting battues toggle
            - Trace Visibility Toggle (Eye / EyeOff)
            - Reverse Circuit Button (RefreshCw)
        */}
        <MapRightControlsDock>
          <DesktopZoomControl />
          <LocateControl
            isNavigating={Boolean(navigation?.isNavigating)}
            onLocationChange={handleUserLocationChange}
          />
          <MapLayersMenu
            activity={activity}
            mapLayer={mapLayer}
            setMapLayer={setMapLayer}
            showNetwork={showNetwork}
            setShowNetwork={setShowNetwork}
            show200kmRadius={show200kmRadius}
            showHuntingBattues={showHuntingBattues}
            setShow200kmRadius={setShow200kmRadius}
            setShowHuntingBattues={setShowHuntingBattues}
            isCyclewaysVisible={isCyclewaysVisible}
            onToggleCycleways={onToggleCyclewaysVisibility}
          />

          {/* 🍄 Bouton Spotter un coin à champignons (modulaire, saisonnier Luxembourg) */}
          <MushroomDockButton
            isSpottingMode={isSpottingMode}
            onToggleSpottingMode={onToggleSpottingMode}
            mushroomSpots={mushroomSpots}
          />
          {/* 🎯 Bouton Battues de chasse (modulaire, conditionné à la saison de chasse au Luxembourg) */}
          {setShowHuntingBattues && (
            <HuntingBattuesDockButton
              showHuntingBattues={Boolean(showHuntingBattues)}
              onToggleHuntingBattues={() => setShowHuntingBattues(!showHuntingBattues)}
            />
          )}

          {/* Direct 1-Click Trace Visibility Toggle Button (Masquer / Démasquer les traces sur la carte, TOUJOURS PRÉSENT) */}
          {onToggleTraceVisibility && (
            <button
              type="button"
              onClick={onToggleTraceVisibility}
              className={`${TOUCH_MAP_BUTTON_CLASS} relative group transition-all ${
                isTraceVisible
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-600/35 ring-2 ring-emerald-400/50'
                  : 'bg-white/95 dark:bg-slate-900/95 text-rose-500 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-400/60'
              }`}
              title={
                isTraceVisible
                  ? selectedRouteId || editor?.isEditorActive
                    ? 'Masquer la trace sur la carte (pour voir le réseau sous-jacent)'
                    : 'Masquer les traces sur la carte (pour voir la carte vierge)'
                  : selectedRouteId || editor?.isEditorActive
                    ? 'Afficher la trace sur la carte'
                    : 'Afficher les traces sur la carte'
              }
              aria-label={isTraceVisible ? 'Masquer les traces' : 'Afficher les traces'}
            >
              {isTraceVisible ? (
                <Eye className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              ) : (
                <EyeOff className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              )}
            </button>
          )}

          {/* Direct 1-Click Reverse Route Direction Button (Inverser le sens du circuit) */}
          {!editor?.isEditorActive && selectedRouteId && onReverseRoute && (
            <button
              type="button"
              onClick={onReverseRoute}
              className={`${TOUCH_MAP_BUTTON_CLASS} relative group transition-all ${
                isRouteReversed
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-600/35 ring-2 ring-emerald-400/50'
                  : 'text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 border-white/80 dark:border-slate-700/80 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
              title={
                isRouteReversed
                  ? 'Sens inversé activé — Cliquer pour rétablir le sens d’origine'
                  : 'Inverser le sens du parcours (les flèches et le dénivelé s’inversent)'
              }
              aria-label="Inverser le sens du parcours"
            >
              <RefreshCw
                className={`w-4 h-4 shrink-0 transition-transform duration-500 ${
                  isRouteReversed ? 'rotate-180 text-white' : 'group-hover:rotate-180'
                }`}
              />
            </button>
          )}
        </MapRightControlsDock>
      </MapContainer>

      {/* Mushroom Spotting Active Banner - Ancré en bas sans aucun élément concurrent */}
      {isSpottingMode && (
        <div
          className="fixed md:absolute left-1/2 -translate-x-1/2 z-[1000] bg-stone-900/95 dark:bg-black/95 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-orange-500 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[92vw] pointer-events-auto"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
        >
          <span className="text-2xl animate-bounce shrink-0">🍄</span>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold text-orange-300">Mode Repérage Champignons actif</div>
            <div className="text-[11px] text-stone-200 truncate">Touchez la carte où vous avez trouvé des champignons</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {userCoords && onMapClickSpotCoord && (
              <button
                type="button"
                onClick={() => onMapClickSpotCoord(userCoords)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                À ma position GPS
              </button>
            )}
            {onToggleSpottingMode && (
              <button
                type="button"
                onClick={onToggleSpottingMode}
                className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Route Editor Studio Bar */}
      {editor?.isEditorActive && (
        <TraceEditorBar
          editor={editor}
          isTraceVisible={isTraceVisible}
          onToggleTraceVisibility={onToggleTraceVisibility}
        />
      )}

      {/* Floating Selected Route Quick Action Dock on Map (Waze + Navigation Terrain) */}
      {selectedRoute &&
        selectedTrace &&
        !isDetailsOpen &&
        !navigation?.isNavigating &&
        !editor?.isEditorActive &&
        onStartNavigation && (
          <MapRouteQuickDock
            route={selectedRoute}
            trace={selectedTrace}
            userCoords={userCoords}
            onStartNavigation={onStartNavigation}
            onOpenWaze={openWazeNavigation}
            onClose={() => onDeselectRoute?.()}
            onOpenDetails={onOpenDetails}
            activity={activity}
            isTraceVisible={isTraceVisible}
            onToggleTraceVisibility={onToggleTraceVisibility}
            onReverseRoute={onReverseRoute}
            onEditRoute={onEditRoute}
            onSliceSubTrace={onSliceSubTrace}
          />
        )}

      {/* Floating Cycleway Detection Indicator (Bike Layer Click) */}
      {isDetectingCycleway && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[460] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900/92 text-white backdrop-blur-xl px-3.5 py-2 rounded-2xl shadow-xl border border-sky-400/40 flex items-center gap-2 text-xs font-bold">
            <span className="animate-spin h-3.5 w-3.5 border-2 border-sky-400 rounded-full border-t-transparent shrink-0" />
            <span>🛤️ Identification de la piste cyclable sur la couche vélo...</span>
          </div>
        </div>
      )}

      {/* Floating Semantic Color Legend (Bottom-Left, masqué en mode repérage ou éditeur pour dégager totalement le bas) */}
      {!isSpottingMode && !editor?.isEditorActive && (
        <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 md:left-4 z-[400] pointer-events-auto max-w-[calc(100%-1.25rem)]">
          <div className="glass-topbar px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-[11px] overflow-x-auto no-scrollbar whitespace-nowrap">
            {selectedRouteId ? (
              <>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Voirie :
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>Sans voiture</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
                  <span>Route partagée</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 hidden sm:inline">
                  Difficulté / Relief :
                </span>
                {ROUTE_DIFFICULTY_LEGEND.map((item) => (
                  <span
                    key={item.level}
                    className="inline-flex items-center gap-1 sm:gap-1.5 font-bold text-slate-700 dark:text-slate-200"
                    title={`${item.label} — ${item.subLabel}`}
                  >
                    <span
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ring-1 ring-white dark:ring-slate-900 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
