import React, { useMemo } from 'react';
import { Polyline, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
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

const createWaypointIcon = (index: number, isStart: boolean, isSelected: boolean = false) => {
  const bg = isSelected ? '#f59e0b' : isStart ? '#059669' : '#6366f1';
  const shadow = isSelected
    ? 'border: 3.5px solid white; box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.55), 0 6px 20px rgba(245, 158, 11, 0.85); transform: scale(1.15);'
    : 'border: 3px solid white; box-shadow: 0 4px 14px rgba(15,23,42,0.45);';
  const labelBadge = isSelected
    ? `<div style="position: absolute; top: -22px; font-size: 9px; font-weight: 900; background: #f59e0b; color: #1e1b4b; padding: 1.5px 7px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: 0.5px; border: 1.5px solid white;">Point à bouger</div>`
    : '';

  return L.divIcon({
    className: 'editor-waypoint-icon',
    // Hit-box 50x50px Apple/Android tactile avec touch-action: none
    html: `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; position: relative; touch-action: none; -webkit-user-select: none; user-select: none;">
      ${labelBadge}
      <div style="background-color: ${bg}; width: 32px; height: 32px; border-radius: 50%; ${shadow} display: flex; align-items: center; justify-content: center; font-size: 13px; color: white; font-weight: 900; cursor: grab; user-select: none; pointer-events: none; transition: transform 0.15s ease;">
        ${index + 1}
      </div>
    </div>`,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

const createMidpointHandleIcon = () =>
  L.divIcon({
    className: 'editor-midpoint-handle-icon',
    // Hit-box 44x44px Apple/Android tactile avec poignée 24px
    html: `<div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; touch-action: none; -webkit-user-select: none; user-select: none;">
      <div style="background-color: #ffffff; width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid #8b5cf6; box-shadow: 0 3px 12px rgba(124,58,237,0.55); display: flex; align-items: center; justify-content: center; font-size: 16px; color: #7c3aed; font-weight: 900; cursor: pointer; user-select: none; line-height: 1; pointer-events: none;">
        +
      </div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const waypointIconCache = new Map<string, L.DivIcon>();

const getWaypointIcon = (index: number, isStart: boolean, isSelected: boolean = false): L.DivIcon => {
  const key = `${index}_${isStart ? 1 : 0}_${isSelected ? 1 : 0}`;
  let icon = waypointIconCache.get(key);
  if (!icon) {
    icon = createWaypointIcon(index, isStart, isSelected);
    waypointIconCache.set(key, icon);
  }
  return icon;
};

let cachedMidpointIcon: L.DivIcon | null = null;
const getMidpointHandleIcon = (): L.DivIcon => {
  if (!cachedMidpointIcon) {
    cachedMidpointIcon = createMidpointHandleIcon();
  }
  return cachedMidpointIcon;
};

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
  const map = useMap();
  const {
    isEditorActive,
    waypoints,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
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

  // Coordonnées du tracé d'origine en arrière-plan (mode édition d'une trace existante)
  const originalLatLngs = useMemo(() => {
    if (editor.editorMode !== 'edit' || !editor.originalTrace?.coordinates) return [];
    const coords = editor.originalTrace.coordinates;
    if (Array.isArray(coords[0]?.[0])) {
      return (coords as [number, number][][]).flat().map(([lon, lat]) => [lat, lon] as [number, number]);
    }
    return (coords as [number, number][]).map(([lon, lat]) => [lat, lon] as [number, number]);
  }, [editor.editorMode, editor.originalTrace]);

  // Poignées intermédiaires déplaçables au milieu de chaque tronçon pour détourner le parcours facilement
  const midpointHandles = useMemo(() => {
    return calculateMidpointHandles(waypoints, calculatedLatLngs, isLoop);
  }, [waypoints, calculatedLatLngs, isLoop]);

  // Clic direct sur la trace calculée pour choisir cet endroit et insérer le point à déplacer
  const handlePolylineClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    lastLayerClickTimeRef.current = Date.now();
    const insertIdx = findClosestWaypointInsertIndex(
      waypoints,
      e.latlng.lat,
      e.latlng.lng,
      isLoop,
      calculatedLatLngs
    );
    insertWaypoint(insertIdx, e.latlng.lat, e.latlng.lng);
    setSelectedWaypointIndex(insertIdx);
  };

  // Clic direct sur la trace d'origine pour choisir l'endroit exact à dévier/modifier
  const handleOriginalPolylineClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    lastLayerClickTimeRef.current = Date.now();
    const insertIdx = findClosestWaypointInsertIndex(
      waypoints,
      e.latlng.lat,
      e.latlng.lng,
      isLoop,
      originalLatLngs
    );
    insertWaypoint(insertIdx, e.latlng.lat, e.latlng.lng);
    setSelectedWaypointIndex(insertIdx);
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
      {/* 0. Tracé d'origine servant de repère interactif : l'utilisateur peut cliquer dessus pour choisir l'endroit à bouger */}
      {isTraceVisible && originalLatLngs.length >= 2 && (
        <Polyline
          positions={originalLatLngs}
          eventHandlers={{
            click: handleOriginalPolylineClick,
          }}
          pathOptions={{
            color: '#a855f7',
            weight: 6, // Hit-box tactile élargie pour sélectionner facilement du doigt
            dashArray: '8, 8',
            opacity: 0.75,
          }}
        >
          <Tooltip sticky direction="top">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>Tracé d&apos;origine intact</span>
            </div>
            <div className="text-[11px] text-amber-300 font-extrabold mt-0.5">
              👉 Touchez ici pour choisir cet endroit comme point à déplacer !
            </div>
          </Tooltip>
        </Polyline>
      )}

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

      {/* 3. Poignées de détournement de parcours (1-touch clic ou Drag & Drop sur tactile) */}
      {isTraceVisible &&
        !isCalculating &&
        midpointHandles.map((handle, hIdx) => (
          <Marker
            key={`midpoint-${hIdx}-${handle.insertIndex}`}
            position={[handle.lat, handle.lng]}
            icon={getMidpointHandleIcon()}
            draggable={true}
            autoPan={true}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                lastLayerClickTimeRef.current = Date.now();
                // 1-touch tactile : toucher le bouton "+" insère immédiatement l'étape détournée et la sélectionne
                insertWaypoint(handle.insertIndex, handle.lat, handle.lng);
                setSelectedWaypointIndex(handle.insertIndex);
              },
              dragstart: () => {
                map.dragging.disable();
                lastLayerClickTimeRef.current = Date.now();
              },
              dragend: (e) => {
                map.dragging.enable();
                lastLayerClickTimeRef.current = Date.now();
                const marker = e.target;
                const pos = marker.getLatLng();
                insertWaypoint(handle.insertIndex, pos.lat, pos.lng);
                setSelectedWaypointIndex(handle.insertIndex);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                Touchez ou glissez pour détourner ici
              </span>
            </Tooltip>
          </Marker>
        ))}

      {/* 4. Marqueurs interactifs de waypoints numérotés (déplaçables par glisser-déposer sur tactile) */}
      {waypoints.map(([lon, lat], index) => {
        const isStart = index === 0;
        const isSelected = selectedWaypointIndex === index;
        return (
          <Marker
            key={`editor-wp-${index}`}
            position={[lat, lon]}
            icon={getWaypointIcon(index, isStart, isSelected)}
            draggable={true}
            autoPan={true}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                lastLayerClickTimeRef.current = Date.now();
                // Sélectionne ce point pour le bouger
                setSelectedWaypointIndex(index);
              },
              dragstart: () => {
                map.dragging.disable();
                lastLayerClickTimeRef.current = Date.now();
                setSelectedWaypointIndex(index);
              },
              dragend: (e) => {
                map.dragging.enable();
                lastLayerClickTimeRef.current = Date.now();
                const marker = e.target;
                const pos = marker.getLatLng();
                updateWaypoint(index, pos.lat, pos.lng);
                setSelectedWaypointIndex(index);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -16]} opacity={0.95}>
              <div className="text-center text-[10px] leading-tight">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {isSelected
                    ? '🎯 Point sélectionné à déplacer'
                    : isStart
                    ? 'Point de départ'
                    : `Étape ${index + 1}`}
                </span>
                <span className="block text-slate-500 text-[9px] mt-0.5">
                  {isSelected
                    ? 'Glissez ce point sur la carte pour dévier le tracé'
                    : 'Touchez pour choisir ce point à bouger'}
                </span>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
