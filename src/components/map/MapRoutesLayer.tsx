import React, { useState, useMemo } from 'react';
import { Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { RouteSuggestions, RouteTrace } from '../../types';
import { getSemanticRouteColor } from '../ui/PremiumPrimitives';
import { Car, Navigation } from 'lucide-react';
import { openWazeNavigation } from '../../lib/navigation/wazeNavigation';
import {
  getHaloUnderlayPathOptions,
  getRoadSegmentPathOptions,
  getRoadSegmentBadge,
} from '../../lib/routing/polylineStyles';
import { TOUCH_POLYLINE_HIT_WEIGHT } from '../../lib/layout/touchDimensions';

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

const createRouteStartPin = (color: string, isHovered: boolean) => {
  const size = isHovered ? 14 : 10;
  return L.divIcon({
    className: 'route-start-dot',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.35); transition: all 150ms ease;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface MapRoutesLayerProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  selectedRouteId: string | null;
  hoveredRouteId?: string | null;
  onSelectRoute: (id: string) => void;
  onHoverRoute?: (id: string | null) => void;
  hoveredDistanceKm?: number | null;
  clickedCoord?: { lat: number; lng: number; name: string } | null;
  lastLayerClickTimeRef: React.MutableRefObject<number>;
  activity: 'bike' | 'hike';
  isTraceVisible?: boolean;
  onStartNavigation?: (route: RouteSuggestions, trace: RouteTrace) => void;
}

export function MapRoutesLayer({
  routes,
  traces,
  selectedRouteId,
  hoveredRouteId: externalHoveredRouteId,
  onSelectRoute,
  onHoverRoute,
  hoveredDistanceKm,
  clickedCoord,
  lastLayerClickTimeRef,
  activity,
  isTraceVisible = true,
  onStartNavigation,
}: MapRoutesLayerProps) {
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
  const hoveredRouteId =
    externalHoveredRouteId !== undefined ? externalHoveredRouteId : internalHoveredId;

  const handleHoverChange = (id: string | null) => {
    setInternalHoveredId(id);
    if (onHoverRoute) {
      onHoverRoute(id);
    }
  };

  const activeRouteIdForElevation = selectedRouteId || hoveredRouteId;
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;
  const activeTraceForElevation = activeRouteIdForElevation
    ? traces[activeRouteIdForElevation] || null
    : null;

  // Precompute Leaflet [lat, lon] positions and semantic colors once per route list update
  const preparedRoutes = useMemo(() => {
    return routes
      .map((r) => {
        const t = traces[r.id];
        if (!t || !t.coordinates || t.coordinates.length === 0) return null;

        let polylinePositions: [number, number][] | [number, number][][] = [];
        let startPos: [number, number] | null = null;

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

        const semanticColor = getSemanticRouteColor(r.difficulty?.level);
        return { r, t, polylinePositions, startPos, semanticColor };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [routes, traces]);

  const selectedPrepared = useMemo(
    () => preparedRoutes.find((item) => item.r.id === selectedRouteId) || null,
    [preparedRoutes, selectedRouteId]
  );

  const hoveredPrepared = useMemo(
    () =>
      hoveredRouteId && hoveredRouteId !== selectedRouteId
        ? preparedRoutes.find((item) => item.r.id === hoveredRouteId) || null
        : null,
    [preparedRoutes, hoveredRouteId, selectedRouteId]
  );

  // Calculate coordinates of the hovered point on the elevation chart
  let hoverPointCoord: [number, number] | null = null;
  if (
    activeTraceForElevation &&
    hoveredDistanceKm !== null &&
    hoveredDistanceKm !== undefined
  ) {
    const coords = Array.isArray(activeTraceForElevation.coordinates[0]?.[0])
      ? (activeTraceForElevation.coordinates as [number, number][][]).flat()
      : (activeTraceForElevation.coordinates as [number, number][]);
    if (coords && coords.length > 0) {
      const totalDistKm = activeTraceForElevation.distance / 1000;
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
      {/* PASS 1 (Bottom SVG Layer): Permanently mounted white under-casings for all routes */}
      {preparedRoutes.map(({ r, polylinePositions }) => {
        const isSelected = selectedRouteId === r.id;
        const isHovered = hoveredRouteId === r.id;
        const isAnotherFocused =
          Boolean(selectedRouteId && !isSelected) ||
          Boolean(hoveredRouteId && !isHovered && !isSelected);

        return (
          <Polyline
            key={`casing-${r.id}`}
            positions={polylinePositions}
            pathOptions={{
              color: '#ffffff',
              weight: isSelected || isHovered ? 0 : isAnotherFocused ? 3.5 : 5.5,
              opacity: isSelected || isHovered ? 0 : isAnotherFocused ? 0.28 : 0.75,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false,
            }}
          />
        );
      })}

      {/* PASS 2 (Middle SVG Layer): Permanently mounted semantic colored strokes + interactive hit targets */}
      {preparedRoutes.map(({ r, t, polylinePositions, startPos, semanticColor }) => {
        const isSelected = selectedRouteId === r.id;
        const isHovered = hoveredRouteId === r.id;
        const isAnotherFocused =
          Boolean(selectedRouteId && !isSelected) ||
          Boolean(hoveredRouteId && !isHovered && !isSelected);

        const strokeColor = selectedRouteId && !isSelected ? '#94a3b8' : semanticColor;

        const handleSelect = (e: L.LeafletMouseEvent) => {
          lastLayerClickTimeRef.current = Date.now();
          L.DomEvent.stop(e);
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          onSelectRoute(r.id!);
        };

        return (
          <React.Fragment key={`route-fg-${r.id}`}>
            {/* Foreground polyline (unconditionally mounted so SVG DOM z-order is permanently above Pass 1) */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: strokeColor,
                weight: isSelected || isHovered ? 0 : isAnotherFocused ? 2.2 : 3.2,
                opacity: isSelected || isHovered ? 0 : isAnotherFocused ? 0.42 : 0.92,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: r.type === 'custom' ? '6, 5' : undefined,
                interactive: false,
              }}
            />

            {/* Permanently mounted wide invisible tap/hover target (optimized for mobile touch) */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                weight: TOUCH_POLYLINE_HIT_WEIGHT,
                color: 'transparent',
                interactive: true,
                className: 'cursor-pointer touch-manipulation',
              }}
              eventHandlers={{
                click: handleSelect,
                mouseover: () => {
                  if (!isSelected) handleHoverChange(r.id!);
                },
                mouseout: () => {
                  if (hoveredRouteId === r.id) handleHoverChange(null);
                },
              }}
            >
              {!isSelected && (
                <Tooltip sticky direction="top">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/80"
                      style={{ backgroundColor: semanticColor }}
                    />
                    {r.country && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/15 text-emerald-300">
                        {r.country}
                      </span>
                    )}
                    <span>{r.title}</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold font-mono-kpi mt-0.5 flex items-center gap-1.5">
                    <span>
                      {(t.distance / 1000).toFixed(1)} km · +{r.elevationGain}m D+
                    </span>
                    {r.difficulty && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] text-white font-extrabold"
                        style={{ backgroundColor: semanticColor }}
                      >
                        {r.difficulty.label}
                      </span>
                    )}
                  </div>
                </Tooltip>
              )}
            </Polyline>

            {/* Start dot marker on unselected routes */}
            {!isSelected && !selectedRouteId && startPos && (!hoveredRouteId || isHovered) && (
              <Marker
                position={startPos}
                icon={createRouteStartPin(semanticColor, isHovered)}
                eventHandlers={{
                  click: handleSelect,
                  mouseover: () => handleHoverChange(r.id!),
                  mouseout: () => {
                    if (hoveredRouteId === r.id) handleHoverChange(null);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <span className="font-bold text-white">{r.title}</span>
                  <span className="text-emerald-400 font-mono-kpi ml-1.5">
                    ({(t.distance / 1000).toFixed(1)} km · {r.difficulty?.label})
                  </span>
                </Tooltip>
              </Marker>
            )}
          </React.Fragment>
        );
      })}

      {/* PASS 3 (Top Active SVG Layer): Hovered and Selected routes rendered last so they ALWAYS sit on top of all other traces */}
      {hoveredPrepared && (
        <React.Fragment key={`top-hovered-${hoveredPrepared.r.id}`}>
          <Polyline
            positions={hoveredPrepared.polylinePositions}
            pathOptions={{
              color: '#ffffff',
              weight: 9,
              opacity: 0.96,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false,
            }}
          />
          <Polyline
            positions={hoveredPrepared.polylinePositions}
            pathOptions={{
              color: hoveredPrepared.semanticColor,
              weight: 5.5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
              interactive: false,
            }}
          />
        </React.Fragment>
      )}

      {selectedPrepared && (
        <React.Fragment key={`top-selected-${selectedPrepared.r.id}-${isTraceVisible ? 'vis' : 'hid'}`}>
          {isTraceVisible ? (
            <>
              <Polyline
                positions={selectedPrepared.polylinePositions}
                pathOptions={getHaloUnderlayPathOptions()}
              />
              {selectedPrepared.t.segments && selectedPrepared.t.segments.length > 0 ? (
                selectedPrepared.t.segments.map((seg, sIdx) => {
                  const isCarFree = seg.roadType === 'car_free';
                  const segPositions = seg.coordinates.map(
                    (c) => [c[1], c[0]] as [number, number]
                  );
                  return (
                    <Polyline
                      key={`seg-${selectedPrepared.r.id}-${sIdx}`}
                      positions={segPositions}
                      pathOptions={getRoadSegmentPathOptions(isCarFree)}
                    >
                      <Tooltip sticky direction="top">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isCarFree ? 'bg-emerald-400' : 'bg-orange-400'
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
                        <div className="text-[11px] text-slate-300 mt-0.5">{seg.label}</div>
                      </Tooltip>
                    </Polyline>
                  );
                })
              ) : (
                <Polyline
                  positions={selectedPrepared.polylinePositions}
                  pathOptions={{
                    color: selectedPrepared.semanticColor,
                    weight: 6.5,
                    opacity: 1,
                    lineCap: 'round',
                    lineJoin: 'round',
                    interactive: true,
                  }}
                />
              )}
            </>
          ) : (
            <Polyline
              positions={selectedPrepared.polylinePositions}
              pathOptions={{
                color: '#059669',
                weight: 2,
                opacity: 0.35,
                dashArray: '3, 8',
                lineCap: 'round',
                lineJoin: 'round',
                interactive: true,
              }}
            >
              <Tooltip sticky direction="top">
                <span className="text-emerald-300 font-bold">
                  Trace masquée (routes visibles dessous)
                </span>
              </Tooltip>
            </Polyline>
          )}

          {selectedPrepared.startPos && (
            <Marker position={selectedPrepared.startPos} icon={createStartIcon()} interactive={true}>
              <Popup offset={[0, -10]} className="trail-start-popup">
                <div className="p-1 min-w-[200px] text-slate-900 flex flex-col gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                      Point de départ
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 line-clamp-1 block">
                      {selectedPrepared.r.title}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWazeNavigation(selectedPrepared.startPos![0], selectedPrepared.startPos![1]);
                      }}
                      className="w-full py-1.5 px-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>Waze (Voiture)</span>
                    </button>
                    {onStartNavigation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartNavigation(selectedPrepared.r, selectedPrepared.t);
                        }}
                        className="w-full py-1.5 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-white" />
                        <span>Démarrer le guidage</span>
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]}>
                Point de départ ({selectedPrepared.r.title})
              </Tooltip>
            </Marker>
          )}
        </React.Fragment>
      )}

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
