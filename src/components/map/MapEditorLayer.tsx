import React, { useMemo } from 'react';
import { Polyline, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';
import {
  getHaloUnderlayPathOptions,
  getRoadSegmentPathOptions,
  getRoadSegmentBadge,
} from '../../lib/routing/polylineStyles';
import {
  calculateMidpointHandles,
  findClosestWaypointInsertIndex,
} from '../../lib/routing/routeGeometry';

const createWaypointIcon = (index: number, isStart: boolean) => {
  const bg = isStart ? '#059669' : '#6366f1';
  return L.divIcon({
    className: 'editor-waypoint-icon',
    // Hit-box 36x36px optimisée pour le toucher tactile (doigt sur smartphone/tablette)
    html: `<div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; touch-action: none;">
      <div style="background-color: ${bg}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: 900; cursor: grab; user-select: none;">
        ${index + 1}
      </div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createMidpointHandleIcon = () =>
  L.divIcon({
    className: 'editor-midpoint-handle-icon',
    // Hit-box 34x34px tactile avec poignée visible de 20px
    html: `<div style="width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; touch-action: none;">
      <div style="background-color: #ffffff; width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid #8b5cf6; box-shadow: 0 2px 10px rgba(124,58,237,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px; color: #7c3aed; font-weight: 900; cursor: grab; user-select: none; line-height: 1;">
        +
      </div>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

interface MapEditorLayerProps {
  editor: UseRouteEditorReturn;
  lastLayerClickTimeRef: React.MutableRefObject<number>;
  isTraceVisible?: boolean;
}

export function MapEditorLayer({
  editor,
  lastLayerClickTimeRef,
  isTraceVisible = true,
}: MapEditorLayerProps) {
  const {
    isEditorActive,
    waypoints,
    addWaypoint,
    insertWaypoint,
    updateWaypoint,
    removeWaypoint,
    calculatedResult,
    isCalculating,
    isLoop,
  } = editor;

  // Intercepte les clics sur la carte pour ajouter des points en mode éditeur
  useMapEvents({
    click(e) {
      if (!isEditorActive) return;

      // Ignore si un marqueur ou calque vient d'être cliqué
      if (Date.now() - lastLayerClickTimeRef.current < 300) {
        return;
      }

      addWaypoint(e.latlng.lat, e.latlng.lng);
    },
  });

  // Coordonnées du tracé calculé par BRouter suivant les sentiers
  const calculatedLatLngs = useMemo(() => {
    return calculatedResult?.coordinates
      ? calculatedResult.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])
      : [];
  }, [calculatedResult?.coordinates]);

  // Poignées intermédiaires déplaçables au milieu de chaque tronçon pour détourner le parcours facilement
  const midpointHandles = useMemo(() => {
    return calculateMidpointHandles(waypoints, calculatedLatLngs, isLoop);
  }, [waypoints, calculatedLatLngs, isLoop]);

  // Clic direct sur la trace pour insérer un nouveau point entre les étapes les plus proches
  const handlePolylineClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    lastLayerClickTimeRef.current = Date.now();
    const insertIdx = findClosestWaypointInsertIndex(waypoints, e.latlng.lat, e.latlng.lng, isLoop);
    insertWaypoint(insertIdx, e.latlng.lat, e.latlng.lng);
  };

  if (!isEditorActive) {
    return null;
  }

  // Ligne droite en pointillés reliant les waypoints bruts (affichée pendant le calcul ou si 1 point)
  const directWaypointsLatLngs = waypoints.map(([lon, lat]) => [lat, lon] as [number, number]);
  if (isLoop && directWaypointsLatLngs.length >= 2) {
    directWaypointsLatLngs.push(directWaypointsLatLngs[0]);
  }

  return (
    <>
      {/* 1. Ligne directrice en pointillés provisoire (affichée uniquement avant le premier calcul réussi) */}
      {isTraceVisible && directWaypointsLatLngs.length >= 2 && !calculatedResult && (
        <Polyline
          positions={directWaypointsLatLngs}
          pathOptions={{
            color: '#8b5cf6',
            weight: 2.5,
            dashArray: '6, 8',
            opacity: 0.6,
          }}
        />
      )}

      {/* 2. Tracé officiel adoptant les codes visuels du reste de l'application (Vert 0 voiture, Orange route partagée) */}
      {isTraceVisible && calculatedLatLngs.length >= 2 && (
        <>
          {/* Halo blanc sous-jacent pour un contraste optimal sur les fonds de carte */}
          <Polyline
            positions={calculatedLatLngs}
            pathOptions={getHaloUnderlayPathOptions()}
          />

          {/* Tronçons segmentés : Vert émeraude (#059669) = Sentier 0 voiture / Orange (#ea580c) = Route partagée */}
          {calculatedResult?.segments && calculatedResult.segments.length > 0 ? (
            calculatedResult.segments.map((seg, sIdx) => {
              const isCarFree = seg.roadType === 'car_free';
              const segPositions = seg.coordinates.map(
                (c) => [c[1], c[0]] as [number, number]
              );
              const badge = getRoadSegmentBadge(isCarFree, editor.activity);
              return (
                <Polyline
                  key={`editor-seg-${sIdx}`}
                  positions={segPositions}
                  eventHandlers={{
                    click: handlePolylineClick,
                  }}
                  pathOptions={getRoadSegmentPathOptions(isCarFree, {
                    opacity: isCalculating ? 0.7 : 1,
                  })}
                >
                  <Tooltip sticky direction="top">
                    <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className={`w-2.5 h-2.5 rounded-full ${badge.dotBgClass}`} />
                      <span>{badge.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{seg.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 italic">
                      Glissez le point blanc ou cliquez pour détourner
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })
          ) : (
            <Polyline
              positions={calculatedLatLngs}
              eventHandlers={{
                click: handlePolylineClick,
              }}
              pathOptions={getRoadSegmentPathOptions(true)}
            >
              <Tooltip sticky className="font-semibold text-xs">
                <span>{calculatedResult?.distanceKm} km • +{calculatedResult?.elevationGain}m D+</span>
              </Tooltip>
            </Polyline>
          )}
        </>
      )}

      {/* Trait de guidage ultra-fin et discret lorsque la trace est masquée pour révéler les sentiers sous-jacents */}
      {!isTraceVisible && calculatedLatLngs.length >= 2 && (
        <Polyline
          positions={calculatedLatLngs}
          pathOptions={{
            color: '#8b5cf6',
            weight: 1.5,
            opacity: 0.25,
            dashArray: '4, 8',
            interactive: false,
          }}
        />
      )}

      {/* 3. Poignées de détournement de parcours (Drag & Drop au milieu des tronçons) */}
      {isTraceVisible &&
        !isCalculating &&
        midpointHandles.map((handle, hIdx) => (
          <Marker
            key={`midpoint-${hIdx}-${handle.insertIndex}-${handle.lat.toFixed(4)}-${handle.lng.toFixed(4)}`}
            position={[handle.lat, handle.lng]}
            icon={createMidpointHandleIcon()}
            draggable={true}
            eventHandlers={{
              dragstart: () => {
                lastLayerClickTimeRef.current = Date.now();
              },
              dragend: (e) => {
                lastLayerClickTimeRef.current = Date.now();
                const marker = e.target;
                const pos = marker.getLatLng();
                insertWaypoint(handle.insertIndex, pos.lat, pos.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                Glissez pour détourner le tracé ici
              </span>
            </Tooltip>
          </Marker>
        ))}

      {/* 4. Marqueurs interactifs de waypoints numérotés (déplaçables par glisser-déposer) */}
      {waypoints.map(([lon, lat], index) => {
        const isStart = index === 0;
        return (
          <Marker
            key={`editor-wp-${index}-${lon}-${lat}`}
            position={[lat, lon]}
            icon={createWaypointIcon(index, isStart)}
            draggable={true}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                lastLayerClickTimeRef.current = Date.now();
                // Si plus de 2 points, cliquer sur un waypoint le supprime
                if (waypoints.length > 2) {
                  removeWaypoint(index);
                }
              },
              dragstart: () => {
                lastLayerClickTimeRef.current = Date.now();
              },
              dragend: (e) => {
                lastLayerClickTimeRef.current = Date.now();
                const marker = e.target;
                const pos = marker.getLatLng();
                updateWaypoint(index, pos.lat, pos.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -14]} opacity={0.9}>
              <div className="text-center text-[10px] leading-tight">
                <span className="font-bold">
                  {isStart ? 'Point de départ' : `Étape ${index + 1}`}
                </span>
                <span className="block text-slate-500 text-[9px]">
                  Glisser pour déplacer {waypoints.length > 2 && '• Cliquer pour supprimer'}
                </span>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
