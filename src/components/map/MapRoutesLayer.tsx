import React, { useState } from 'react';
import { Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { RouteSuggestions, RouteTrace } from '../../types';

const createIcon = (color: string, label?: string) => {
  const size = 16;
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 8px; color: white; font-weight: bold;">${
      label || ''
    }</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createStartIcon = () =>
  L.divIcon({
    className: 'custom-start-icon',
    html: `<div style="background-color: #059669; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">D</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

interface MapRoutesLayerProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  hoveredDistanceKm?: number | null;
  clickedCoord?: { lat: number; lng: number; name: string } | null;
  lastLayerClickTimeRef: React.MutableRefObject<number>;
  activity: 'bike' | 'hike';
}

export function MapRoutesLayer({
  routes,
  traces,
  selectedRouteId,
  onSelectRoute,
  hoveredDistanceKm,
  clickedCoord,
  lastLayerClickTimeRef,
  activity,
}: MapRoutesLayerProps) {
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;
  const selectedTrace = selectedRouteId ? traces[selectedRouteId] || null : null;

  // Calculate coordinates of the hovered point on the elevation chart
  let hoverPointCoord: [number, number] | null = null;
  if (selectedTrace && hoveredDistanceKm !== null && hoveredDistanceKm !== undefined) {
    const coords = (
      Array.isArray(selectedTrace.coordinates[0]?.[0])
        ? (selectedTrace.coordinates as [number, number][][]).flat()
        : (selectedTrace.coordinates as [number, number][])
    );
    if (coords && coords.length > 0) {
      const totalDistKm = selectedTrace.distance / 1000;
      const ratio = Math.max(0, Math.min(1, hoveredDistanceKm / (totalDistKm || 1)));
      const idx = Math.min(coords.length - 1, Math.floor(ratio * (coords.length - 1)));
      const c = coords[idx];
      if (
        c &&
        typeof c[0] === 'number' &&
        typeof c[1] === 'number' &&
        !isNaN(c[0]) &&
        !isNaN(c[1]) &&
        isFinite(c[0]) &&
        isFinite(c[1])
      ) {
        hoverPointCoord = [c[1], c[0]]; // [lat, lon]
      }
    }
  }

  return (
    <>
      {/* Route Traces */}
      {routes.map((r) => {
        const t = traces[r.id];
        if (!t || !t.coordinates || t.coordinates.length === 0) return null;

        const isSelected = selectedRouteId === r.id;
        let polylinePositions: [number, number][] | [number, number][][] = [];
        let startPos: [number, number] | null = null;

        if (t.coordinates.length > 0) {
          if (Array.isArray(t.coordinates[0][0])) {
            polylinePositions = (t.coordinates as [number, number][][]).map((segment) =>
              segment.map((c) => [c[1], c[0]] as [number, number])
            );
            if (polylinePositions.length > 0 && polylinePositions[0].length > 0) {
              startPos = polylinePositions[0][0] as [number, number];
            }
          } else {
            polylinePositions = (t.coordinates as [number, number][]).map(
              (c) => [c[1], c[0]] as [number, number]
            );
            if (polylinePositions.length > 0) {
              startPos = polylinePositions[0] as [number, number];
            }
          }
        }

        const isHovered = hoveredRouteId === r.id;
        const isCustom = r.type === 'custom';

        // Vibrant colors for each region and activity
        let color = isCustom ? '#059669' : '#2563eb';
        if (r.country === 'BE') color = isCustom ? '#059669' : '#d97706'; // Ardennes
        if (r.country === 'DE') color = isCustom ? '#059669' : '#dc2626'; // Eifel / Mosel
        if (r.country === 'NL') color = isCustom ? '#059669' : '#ea580c'; // Limburg
        if (r.country === 'FR') color = isCustom ? '#059669' : '#7c3aed'; // Lorraine

        // When in hiking mode, give pedestrian trails high visibility
        if (activity === 'hike' && !isSelected && !selectedRouteId) {
          if (r.country === 'LU') color = '#0284c7';
        }

        if (selectedRouteId && !isSelected) {
          color = '#94a3b8'; // Muted slate so selected trace pops
        }
        if (isHovered && !isSelected) {
          color = '#10b981';
        }

        const handleSelect = (e: L.LeafletMouseEvent) => {
          lastLayerClickTimeRef.current = Date.now();
          L.DomEvent.stop(e);
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          onSelectRoute(r.id!);
        };

        return (
          <React.Fragment key={`route-${r.id}`}>
            {/* Wide invisible tap target for finger touches on mobile */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                weight: 32,
                color: 'transparent',
                interactive: true,
                className: isSelected ? 'cursor-default' : 'cursor-pointer',
              }}
              eventHandlers={{
                click: handleSelect,
                mouseover: () => {
                  if (!isSelected) setHoveredRouteId(r.id!);
                },
                mouseout: () => setHoveredRouteId(null),
              }}
            >
              <Tooltip
                sticky
                direction="top"
                className="rounded-xl shadow-lg !p-2 font-sans border border-stone-100"
              >
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  {r.country && (
                    <span className="text-[10px] uppercase font-bold px-1 rounded bg-stone-100 text-stone-600">
                      {r.country}
                    </span>
                  )}
                  {r.title}
                </div>
                <div className="text-[11px] text-stone-500 font-semibold mt-0.5">
                  {(t.distance / 1000).toFixed(1)} km · {r.elevationGain}m D+
                </div>
              </Tooltip>
            </Polyline>

            {/* Glowing outline for selected route */}
            {isSelected && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#ffffff',
                  weight: 11,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                  interactive: false,
                }}
              />
            )}

            {/* Segment breakdown for selected route (Car-free vs Shared roads) */}
            {isSelected && t.segments && t.segments.length > 0 ? (
              t.segments.map((seg, sIdx) => {
                const isCarFree = seg.roadType === 'car_free';
                const segPositions = seg.coordinates.map((c) => [c[1], c[0]] as [number, number]);
                return (
                  <Polyline
                    key={`seg-${r.id}-${sIdx}`}
                    positions={segPositions}
                    pathOptions={{
                      color: isCarFree ? '#059669' : '#ea580c',
                      weight: 7,
                      opacity: 1,
                      dashArray: isCarFree ? undefined : '10, 7',
                      lineCap: 'round',
                      lineJoin: 'round',
                      interactive: true,
                    }}
                  >
                    <Tooltip
                      sticky
                      direction="top"
                      className="rounded-xl shadow-lg !p-2 font-sans border border-stone-100 text-xs"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCarFree ? 'bg-emerald-600' : 'bg-orange-500'
                          }`}
                        />
                        <span>
                          {isCarFree
                            ? activity === 'hike'
                              ? '🌿 Sentier 0 voiture'
                              : '🌿 Voie sans voiture'
                            : '🚗 Route ouverte aux voitures'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{seg.label}</div>
                    </Tooltip>
                  </Polyline>
                );
              })
            ) : (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color,
                  weight: isSelected ? 6 : isHovered ? 5.5 : 3,
                  opacity: isSelected ? 1 : isHovered ? 1 : selectedRouteId ? 0.25 : 0.7,
                  lineCap: 'round',
                  lineJoin: 'round',
                  dashArray: !isSelected && r.type === 'custom' ? '6, 5' : undefined,
                  interactive: true,
                }}
                eventHandlers={{
                  click: handleSelect,
                  mouseover: () => {
                    if (!isSelected) setHoveredRouteId(r.id!);
                  },
                  mouseout: () => setHoveredRouteId(null),
                }}
              />
            )}

            {/* Start marker on selected route */}
            {isSelected && startPos && (
              <Marker position={startPos} icon={createStartIcon()} interactive={false}>
                <Tooltip direction="top" offset={[0, -10]}>
                  Point de départ
                </Tooltip>
              </Marker>
            )}
          </React.Fragment>
        );
      })}

      {/* Waypoint Markers on Selected Route */}
      {selectedRoute &&
        selectedRoute.waypoints &&
        selectedRoute.waypoints.length > 1 &&
        selectedRoute.waypoints.map((wp, idx) => {
          if (idx === 0) return null; // Already shown as Start icon "D"
          const isEnd = idx === selectedRoute.waypoints.length - 1;
          const color = isEnd ? '#dc2626' : '#2563eb';
          const label = isEnd ? 'A' : `${idx}`;
          return (
            <Marker
              key={`wp-${idx}`}
              position={[wp[1], wp[0]]}
              icon={createIcon(color, label)}
              interactive={false}
            />
          );
        })}

      {/* Hover cursor on the elevation profile chart */}
      {hoverPointCoord && (
        <Marker
          position={hoverPointCoord}
          icon={L.divIcon({
            className: 'elevation-hover-pin',
            html: `<div style="background-color: #f59e0b; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(245, 158, 11, 0.8); animation: pulse 1.5s infinite;"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
          interactive={false}
        />
      )}

      {/* Clicked coordinate pin */}
      {clickedCoord && (
        <Marker
          position={[clickedCoord.lat, clickedCoord.lng]}
          icon={L.divIcon({
            className: 'custom-click-pin',
            html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">📍</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup className="rounded-2xl">
            <div className="text-xs font-semibold p-1">
              <span className="font-bold text-stone-900 block">{clickedCoord.name}</span>
              <span className="text-[10px] text-stone-500">
                Génération en cours autour de ce point...
              </span>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
