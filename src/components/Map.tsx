import React, { useState, useRef, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
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

export { LUXEMBOURG_CENTER, type MapLayerType };

interface MapProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  activity: 'bike' | 'hike';
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
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
  mapLayer: MapLayerType;
  setMapLayer: (layer: MapLayerType) => void;
  hoveredDistanceKm?: number | null;
  mapCenterTarget?: { center: [number, number]; zoom: number; trigger: number };
  clickedCoord?: { lat: number; lng: number; name: string } | null;
}

export function MapDisplay({
  routes,
  traces,
  activity,
  selectedRouteId,
  onSelectRoute,
  onSearchBounds,
  onMapClick,
  isGenerating,
  focusTrigger,
  showNetwork,
  setShowNetwork,
  mapLayer,
  setMapLayer,
  hoveredDistanceKm,
  mapCenterTarget,
  clickedCoord,
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
        />
        <MapCenterWatcher target={mapCenterTarget} />
        <MapController selectedTrace={selectedTrace} focusTrigger={focusTrigger} />

        {/* Base Tile Layers and Overlays (CyclOSM is strictly disabled in hike mode) */}
        <MapTileLayers
          activity={activity}
          mapLayer={mapLayer}
          showNetwork={showNetwork}
          show200kmRadius={show200kmRadius}
        />

        {/* Route Traces, Segments, Tooltips and Elevation Hover Pin */}
        <MapRoutesLayer
          routes={routes}
          traces={traces}
          selectedRouteId={selectedRouteId}
          onSelectRoute={onSelectRoute}
          hoveredDistanceKm={hoveredDistanceKm}
          clickedCoord={clickedCoord}
          lastLayerClickTimeRef={lastLayerClickTimeRef}
          activity={activity}
        />

        {/* Panning Search Control */}
        <SearchAreaControl onSearch={onSearchBounds} isGenerating={isGenerating} />

        {/* Controls Top Right:
            - Desktop Zoom Control: Hidden on mobile (touch devices zoom with 2 fingers)
            - Layer Selector Menu: Available on both desktop and mobile
        */}
        <div className="leaflet-top leaflet-right absolute top-16 md:top-4 right-3 md:right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
          <DesktopZoomControl />
          <MapLayersMenu
            activity={activity}
            mapLayer={mapLayer}
            setMapLayer={setMapLayer}
            showNetwork={showNetwork}
            setShowNetwork={setShowNetwork}
            show200kmRadius={show200kmRadius}
            setShow200kmRadius={setShow200kmRadius}
          />
        </div>
      </MapContainer>
    </div>
  );
}
