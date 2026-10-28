import React, { useMemo, useState } from 'react';
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
  projectPointOntoRouteSegments,
} from '../../lib/routing/routeGeometry';
import { projectLatLngToTraceKm } from '../../lib/routing/elasticTraceEditor';

const createWaypointIcon = (
  index: number,
  isStart: boolean,
  isSelected: boolean = false,
  isOriginalAnchor: boolean = false,
  customRoleLabel?: string | null
) => {
  const isTurnaround = customRoleLabel === 'Demi-tour B';
  const bg = isSelected
    ? '#f59e0b'
    : isStart
    ? '#059669'
    : isTurnaround
    ? '#d97706'
    : isOriginalAnchor
    ? '#475569'
    : '#6366f1';

  const size = isSelected || isTurnaround ? 34 : isOriginalAnchor && !isStart ? 26 : 30;
  const fontSize = isSelected || isTurnaround ? 13 : isOriginalAnchor && !isStart ? 11 : 12;

  const shadow = isSelected
    ? 'border: 3.5px solid white; box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.45), 0 6px 20px rgba(245, 158, 11, 0.85); transform: scale(1.12);'
    : isTurnaround
    ? 'border: 3px solid white; box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.35), 0 4px 14px rgba(15,23,42,0.5);'
    : 'border: 2.5px solid white; box-shadow: 0 4px 12px rgba(15,23,42,0.45);';

  const labelBadge = isSelected
    ? `<div style="position: absolute; top: -24px; font-size: 9.5px; font-weight: 900; background: #f59e0b; color: #0f172a; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.35); text-transform: uppercase; letter-spacing: 0.4px; border: 1.5px solid white;">Glisser ou toucher carte</div>`
    : customRoleLabel
    ? `<div style="position: absolute; top: -22px; font-size: 9px; font-weight: 900; background: ${
        isStart ? '#059669' : '#d97706'
      }; color: #ffffff; padding: 1.5px 7px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 3px 10px rgba(0,0,0,0.35); text-transform: uppercase; letter-spacing: 0.4px; border: 1.5px solid white;">${customRoleLabel}</div>`
    : '';

  return L.divIcon({
    className: 'editor-waypoint-icon',
    html: `<div style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; position: relative; touch-action: none; -webkit-user-select: none; user-select: none;">
      ${labelBadge}
      <div style="background-color: ${bg}; width: ${size}px; height: ${size}px; border-radius: 50%; ${shadow} display: flex; align-items: center; justify-content: center; font-size: ${fontSize}px; color: white; font-weight: 900; cursor: grab; user-select: none; pointer-events: none; transition: transform 0.15s ease;">
        ${index + 1}
      </div>
    </div>`,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
};

const createMidpointHandleIcon = () =>
  L.divIcon({
    className: 'editor-midpoint-handle-icon',
    html: `<div style="width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; touch-action: none; -webkit-user-select: none; user-select: none;">
      <div style="background-color: #ffffff; width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid #7c3aed; box-shadow: 0 3px 10px rgba(124,58,237,0.5); display: flex; align-items: center; justify-content: center; font-size: 15px; color: #6d28d9; font-weight: 900; cursor: pointer; user-select: none; line-height: 1; pointer-events: none;">
        +
      </div>
    </div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });

/**
 * Réticule de visée décalé au-dessus du doigt pendant un glisser-déposer tactile
 * pour que l'utilisateur voie précisément l'intersection de sentier sous son pouce.
 */
const createDragReticleIcon = (label: string) =>
  L.divIcon({
    className: 'editor-drag-reticle-icon',
    html: `<div style="width: 80px; height: 90px; position: relative; pointer-events: none; display: flex; flex-direction: column; align-items: center;">
      <div style="background: rgba(15, 23, 42, 0.92); color: #f8fafc; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 9999px; border: 1.5px solid #f59e0b; box-shadow: 0 6px 16px rgba(0,0,0,0.4); white-space: nowrap; margin-bottom: 4px;">
        🎯 ${label}
      </div>
      <div style="width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #f59e0b; background: rgba(245, 158, 11, 0.18); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 3px rgba(15,23,42,0.35);">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #f59e0b;"></div>
      </div>
    </div>`,
    iconSize: [80, 90],
    iconAnchor: [40, 35],
  });

const waypointIconCache = new Map<string, L.DivIcon>();

const getWaypointIcon = (
  index: number,
  isStart: boolean,
  isSelected: boolean = false,
  isOriginalAnchor: boolean = false,
  customRoleLabel?: string | null
): L.DivIcon => {
  const key = `${index}_${isStart ? 1 : 0}_${isSelected ? 1 : 0}_${isOriginalAnchor ? 1 : 0}_${customRoleLabel || ''}`;
  let icon = waypointIconCache.get(key);
  if (!icon) {
    icon = createWaypointIcon(index, isStart, isSelected, isOriginalAnchor, customRoleLabel);
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

interface DragPreviewState {
  lat: number;
  lng: number;
  prevCoord: [number, number] | null; // [lat, lng]
  nextCoord: [number, number] | null; // [lat, lng]
  label: string;
}

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
    editorMode,
    waypoints,
    segmentMetas,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
    handleMapTap,
    insertWaypoint,
    updateWaypoint,
    calculatedResult,
    isCalculating,
    isLoop,
  } = editor;

  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);

  // Intercepte les touchers/clics sur la carte selon le contexte (ajout, déplacement du point sélectionné, ou insertion locale)
  useMapEvents({
    click(e) {
      if (!isEditorActive) return;
      if (Date.now() - lastLayerClickTimeRef.current < 280) {
        return;
      }
      handleMapTap(e.latlng.lat, e.latlng.lng);
    },
  });

  // Coordonnées du tracé calculé [lat, lon]
  const calculatedLatLngs = useMemo(() => {
    return calculatedResult?.coordinates
      ? calculatedResult.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])
      : [];
  }, [calculatedResult?.coordinates]);

  // Poignées intermédiaires déplaçables au milieu exact de chaque segment
  const midpointHandles = useMemo(() => {
    return calculateMidpointHandles(
      waypoints,
      calculatedLatLngs,
      isLoop,
      calculatedResult?.legs
    );
  }, [waypoints, calculatedLatLngs, isLoop, calculatedResult?.legs]);

  // Toucher/clic n'importe où sur la trace calculée : projette sur le segment exact et insère un point immédiatement déplaçable
  const handlePolylineClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    lastLayerClickTimeRef.current = Date.now();
    const proj = projectPointOntoRouteSegments(
      waypoints,
      e.latlng.lat,
      e.latlng.lng,
      isLoop,
      calculatedLatLngs,
      calculatedResult?.legs
    );
    insertWaypoint(proj.insertIndex, proj.snappedLat, proj.snappedLng);
    setSelectedWaypointIndex(proj.insertIndex);
  };

  if (!isEditorActive) {
    return null;
  }

  // Ligne directrice reliant les waypoints bruts avant le premier calcul
  const directWaypointsLatLngs = waypoints.map(([lon, lat]) => [lat, lon] as [number, number]);
  if (isLoop && directWaypointsLatLngs.length >= 2) {
    directWaypointsLatLngs.push(directWaypointsLatLngs[0]);
  }

  // Ligne élastique temps réel pendant le glisser-déposer d'un point
  const elasticDragPositions: [number, number][] = [];
  if (dragPreview) {
    if (dragPreview.prevCoord) elasticDragPositions.push(dragPreview.prevCoord);
    elasticDragPositions.push([dragPreview.lat, dragPreview.lng]);
    if (dragPreview.nextCoord) elasticDragPositions.push(dragPreview.nextCoord);
  }

  return (
    <>
      {/* 0. Trace parente complète en filigrane pointillé lorsque le Studio Sous-Trace est actif */}
      {isTraceVisible &&
        editor.subTraceInfo &&
        editor.subTraceInfo.parentCoordsLatLng.length >= 2 && (
          <>
            <Polyline
              positions={editor.subTraceInfo.parentCoordsLatLng}
              eventHandlers={{
                click: (e) => {
                  if (!editor.originalTrace) return;
                  L.DomEvent.stopPropagation(e);
                  lastLayerClickTimeRef.current = Date.now();
                  const clickedKm = projectLatLngToTraceKm(
                    editor.originalTrace,
                    e.latlng.lat,
                    e.latlng.lng
                  );
                  editor.handleParentTraceTapKm(clickedKm);
                },
              }}
              pathOptions={{
                color: '#475569',
                weight: 22,
                opacity: 0.01,
              }}
            />
            <Polyline
              positions={editor.subTraceInfo.parentCoordsLatLng}
              interactive={false}
              pathOptions={{
                color: '#64748b',
                weight: 4,
                dashArray: '5, 8',
                opacity: 0.65,
              }}
            />
          </>
        )}

      {/* 1. Ligne directrice provisoire avant le premier calcul */}
      {isTraceVisible && directWaypointsLatLngs.length >= 2 && !calculatedResult && (
        <Polyline
          positions={directWaypointsLatLngs}
          pathOptions={{
            color: '#8b5cf6',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.7,
          }}
        />
      )}

      {/* 2. Tracé actif avec Hit-Box tactile élargie (28px) pour toucher/insérer à n'importe quel endroit au doigt */}
      {isTraceVisible && calculatedLatLngs.length >= 2 && (
        <>
          {/* Hit-box tactile transparente 28px pour attraper la trace facilement sur mobile */}
          <Polyline
            positions={calculatedLatLngs}
            eventHandlers={{
              click: handlePolylineClick,
            }}
            pathOptions={{
              color: '#6366f1',
              weight: 28,
              opacity: 0.01,
            }}
          />

          {/* Halo blanc sous-jacent pour un contraste optimal */}
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
                    opacity: isCalculating ? 0.72 : 1,
                  })}
                >
                  <Tooltip sticky direction="top">
                    <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <span className={`w-2.5 h-2.5 rounded-full ${badge.dotBgClass}`} />
                      <span>{badge.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{seg.label}</div>
                    <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
                      Touchez n&apos;importe où sur la ligne pour insérer un point ici
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
            />
          )}

          {/* Surbrillance pointillée des segments en mode 'direct' (liaison hors-sentier) */}
          {calculatedResult?.legs?.map((leg, lIdx) => {
            if (leg.mode !== 'direct') return null;
            const pos = leg.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
            return (
              <Polyline
                key={`direct-leg-${lIdx}`}
                positions={pos}
                interactive={false}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 4,
                  dashArray: '6, 6',
                  opacity: 0.95,
                }}
              />
            );
          })}

          {/* Surbrillance lumineuse du segment sélectionné ou survolé dans le Dashboard d'organisation */}
          {editor.highlightedSegmentIndex !== null &&
            calculatedResult?.legs?.[editor.highlightedSegmentIndex] && (
              <Polyline
                positions={calculatedResult.legs[
                  editor.highlightedSegmentIndex
                ].coordinates.map(([lon, lat]) => [lat, lon] as [number, number])}
                interactive={false}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 8,
                  opacity: 0.9,
                }}
              />
            )}
        </>
      )}

      {/* Trait de guidage discret lorsque la trace est masquée pour inspecter le fond de carte */}
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

      {/* Fil élastique temps réel pendant le glisser-déposer d'un point */}
      {dragPreview && elasticDragPositions.length >= 2 && (
        <Polyline
          positions={elasticDragPositions}
          interactive={false}
          pathOptions={{
            color: '#f59e0b',
            weight: 3.5,
            dashArray: '5, 5',
            opacity: 0.9,
          }}
        />
      )}

      {/* Réticule de précision décalé au-dessus du doigt pendant le drag */}
      {dragPreview && (
        <Marker
          position={[dragPreview.lat, dragPreview.lng]}
          icon={createDragReticleIcon(dragPreview.label)}
          interactive={false}
          zIndexOffset={2000}
        />
      )}

      {/* 3. Poignées "+" d'insertion et d'étirement élastique au centre de chaque segment */}
      {isTraceVisible &&
        !isCalculating &&
        midpointHandles.map((handle, hIdx) => {
          const prevWp = waypoints[handle.segmentIndex % waypoints.length];
          const nextWp = waypoints[(handle.segmentIndex + 1) % waypoints.length];
          return (
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
                  insertWaypoint(handle.insertIndex, handle.lat, handle.lng);
                  setSelectedWaypointIndex(handle.insertIndex);
                },
                dragstart: (e) => {
                  map.dragging.disable();
                  lastLayerClickTimeRef.current = Date.now();
                  const pos = e.target.getLatLng();
                  setDragPreview({
                    lat: pos.lat,
                    lng: pos.lng,
                    prevCoord: prevWp ? [prevWp[1], prevWp[0]] : null,
                    nextCoord: nextWp ? [nextWp[1], nextWp[0]] : null,
                    label: `Nouvelle étape ${handle.insertIndex + 1}`,
                  });
                },
                drag: (e) => {
                  const pos = e.target.getLatLng();
                  setDragPreview((prev) =>
                    prev ? { ...prev, lat: pos.lat, lng: pos.lng } : null
                  );
                },
                dragend: (e) => {
                  map.dragging.enable();
                  setDragPreview(null);
                  lastLayerClickTimeRef.current = Date.now();
                  const pos = e.target.getLatLng();
                  insertWaypoint(handle.insertIndex, pos.lat, pos.lng);
                  setSelectedWaypointIndex(handle.insertIndex);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  Glissez ou touchez « + » pour dévier ce tronçon
                </span>
              </Tooltip>
            </Marker>
          );
        })}

      {/* 4. Marqueurs interactifs de waypoints numérotés */}
      {waypoints.map(([lon, lat], index) => {
        const isStart = index === 0;
        const isSelected = selectedWaypointIndex === index;

        // Détecte si ce point est une ancre d'origine intacte en mode édition
        const incomingMeta =
          index > 0
            ? segmentMetas[index - 1]
            : isLoop
            ? segmentMetas[waypoints.length - 1]
            : undefined;
        const outgoingMeta = segmentMetas[index];
        const isOriginalAnchor =
          editorMode === 'edit' &&
          (!incomingMeta || incomingMeta.source === 'original') &&
          (!outgoingMeta || outgoingMeta.source === 'original');

        const prevWp =
          index > 0
            ? waypoints[index - 1]
            : isLoop && waypoints.length > 2
            ? waypoints[waypoints.length - 1]
            : null;
        const nextWp =
          index < waypoints.length - 1
            ? waypoints[index + 1]
            : isLoop && waypoints.length > 2
            ? waypoints[0]
            : null;

        const isTurnaroundPoint =
          Boolean(editor.subTraceInfo) &&
          index === editor.subTraceInfo?.turnaroundWaypointIndex;
        const customRoleLabel = editor.subTraceInfo
          ? isStart
            ? 'Départ A'
            : isTurnaroundPoint
            ? 'Demi-tour B'
            : null
          : null;

        return (
          <Marker
            key={`editor-wp-${index}`}
            position={[lat, lon]}
            icon={getWaypointIcon(
              index,
              isStart,
              isSelected,
              isOriginalAnchor,
              customRoleLabel
            )}
            draggable={true}
            autoPan={true}
            zIndexOffset={isSelected ? 1000 : isStart || isTurnaroundPoint ? 600 : 100}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                lastLayerClickTimeRef.current = Date.now();
                // Bascule la sélection de ce point
                setSelectedWaypointIndex(isSelected ? null : index);
              },
              dragstart: (e) => {
                map.dragging.disable();
                lastLayerClickTimeRef.current = Date.now();
                setSelectedWaypointIndex(index);
                const pos = e.target.getLatLng();
                setDragPreview({
                  lat: pos.lat,
                  lng: pos.lng,
                  prevCoord: prevWp ? [prevWp[1], prevWp[0]] : null,
                  nextCoord: nextWp ? [nextWp[1], nextWp[0]] : null,
                  label: isStart ? 'Départ' : `Étape ${index + 1}`,
                });
              },
              drag: (e) => {
                const pos = e.target.getLatLng();
                setDragPreview((prev) =>
                  prev ? { ...prev, lat: pos.lat, lng: pos.lng } : null
                );
              },
              dragend: (e) => {
                map.dragging.enable();
                setDragPreview(null);
                lastLayerClickTimeRef.current = Date.now();
                const pos = e.target.getLatLng();
                updateWaypoint(index, pos.lat, pos.lng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -16]} opacity={0.95}>
              <div className="text-center text-[10px] leading-tight">
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {isSelected
                    ? `🎯 Étape ${index + 1} sélectionnée`
                    : isStart
                    ? 'Point de départ (1)'
                    : isOriginalAnchor
                    ? `Ancre verrouillée ${index + 1}`
                    : `Étape ${index + 1}`}
                </span>
                <span className="block text-slate-500 text-[9px] mt-0.5">
                  {isSelected
                    ? 'Glissez-la ou touchez la carte pour la déplacer'
                    : 'Glissez pour dévier uniquement ce secteur'}
                </span>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
