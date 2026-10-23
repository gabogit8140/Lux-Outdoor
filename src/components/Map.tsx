import React, { useState, useRef, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import { HuntingRifleIcon } from './ui/HuntingRifleIcon';
import type { RouteSuggestions, RouteTrace } from '../types';
import {
  MapTileLayers,
  type MapLayerType,
  LUXEMBOURG_CENTER,
} from './map/MapTileLayers';
import { MapLayersMenu } from './map/MapLayersMenu';
import {
  DesktopZoomControl,
  SearchAreaControl,
  MapResizer,
  MapCenterWatcher,
  MapController,
  MapClicker,
} from './map/MapControls';
import { MapRoutesLayer } from './map/MapRoutesLayer';
import { MapEditorLayer } from './map/MapEditorLayer';
import { TraceEditorBar } from './editor/TraceEditorBar';
import { ROUTE_DIFFICULTY_LEGEND } from './ui/PremiumPrimitives';
import type { UseRouteEditorReturn } from '../hooks/useRouteEditor';

export { LUXEMBOURG_CENTER, type MapLayerType };

interface MapProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  activity: 'bike' | 'hike';
  selectedRouteId: string | null;
  hoveredRouteId?: string | null;
  onSelectRoute: (id: string) => void;
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
}: MapProps) {
  const [show200kmRadius, setShow200kmRadius] = useState(false);
  const lastLayerClickTimeRef = useRef<number>(0);

  const selectedTrace = selectedRouteId ? traces[selectedRouteId] || null : null;

  // When switching to hike mode, seamlessly switch away from CyclOSM so cycleways are not shown
  useEffect(() => {
    if (activity === 'hike' && mapLayer === 'cyclosm') {
      setMapLayer('osmfr');
    }
  }, [activity, mapLayer, setMapLayer]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={LUXEMBOURG_CENTER}
        zoom={9}
        zoomControl={false}
        touchZoom={true}
        className="w-full h-full"
      >
        <MapResizer />
        <MapClicker
          onMapClick={onMapClick}
          isGenerating={isGenerating}
          lastLayerClickTimeRef={lastLayerClickTimeRef}
          isEditorActive={editor?.isEditorActive}
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

        {/* Route Traces, Segments, Tooltips and Elevation Hover Pin */}
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
        />

        {/* Panning Search Control */}
        <SearchAreaControl onSearch={onSearchBounds} isGenerating={isGenerating} />

        {/* Controls Top Right:
            - Desktop Zoom Control: Hidden on mobile (touch devices zoom with 2 fingers)
            - Layer Selector Menu: Available on both desktop and mobile
            - Dedicated Hunting Rifle Button: Quick 1-click hunting battues toggle
        */}
        <div
          className="absolute top-14 sm:top-16 md:top-3 right-2.5 md:right-4 z-[450] flex flex-col gap-2 pointer-events-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <DesktopZoomControl />
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
          />
          {/* Direct 1-Click Battues / Hunting Rifle Toggle Button */}
          {setShowHuntingBattues && (
            <button
              type="button"
              style={{ pointerEvents: 'auto' }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowHuntingBattues(!showHuntingBattues);
              }}
              className={`w-9 h-9 rounded-2xl shadow-lg backdrop-blur-xl flex items-center justify-center transition-all border cursor-pointer relative group ${
                showHuntingBattues
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 shadow-amber-600/35 ring-2 ring-amber-400/60'
                  : 'bg-white/95 dark:bg-slate-900/95 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 border-white/80 dark:border-slate-700/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-400/60'
              }`}
              title={
                showHuntingBattues
                  ? 'Battues de chasse activées — Cliquer pour désactiver'
                  : 'Consulter les dates & zones de battues de chasse (Geoportail.lu)'
              }
              aria-label="Afficher ou masquer les battues de chasse"
            >
              <HuntingRifleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              {showHuntingBattues && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
            </button>
          )}
        </div>
      </MapContainer>

      {/* Floating Route Editor Studio Bar */}
      {editor?.isEditorActive && (
        <TraceEditorBar
          editor={editor}
          isTraceVisible={isTraceVisible}
          onToggleTraceVisibility={onToggleTraceVisibility}
        />
      )}

      {/* Floating Semantic Color Legend (Bottom-Left) */}
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
    </div>
  );
}
