import React, { useEffect, useMemo } from 'react';
import { Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import type { UseOutdoorNavigationReturn } from '../../hooks/useOutdoorNavigation';
import { createDirectionalUserIcon } from '../../lib/navigation/userLocationIcon';

interface NavigationMapLayerProps {
  navigation: UseOutdoorNavigationReturn;
  recenterTrigger?: number;
}

export function NavigationMapLayer({ navigation, recenterTrigger }: NavigationMapLayerProps) {
  const map = useMap();
  const {
    isNavigating,
    userPosition,
    heading,
    isOffTrack,
    distanceToTrackMeters,
    projected,
    isCompassOriented,
  } = navigation;

  // Recentrage automatique ou manuel de la carte sur l'utilisateur
  useEffect(() => {
    if (!isNavigating || !userPosition) return;

    map.panTo([userPosition[1], userPosition[0]], {
      animate: true,
      duration: 0.8,
    });
  }, [isNavigating, userPosition, recenterTrigger, map]);

  // Si l'utilisateur est hors-sentier, tracer un trait de rappel visuel vers le point le plus proche sur la trace
  const offTrackLeadLine = useMemo(() => {
    if (!isOffTrack || !userPosition || !projected) return null;
    return [
      [userPosition[1], userPosition[0]] as [number, number],
      [projected.nearestPoint[1], projected.nearestPoint[0]] as [number, number],
    ];
  }, [isOffTrack, userPosition, projected]);

  if (!isNavigating || !userPosition) {
    return null;
  }

  return (
    <>
      {/* 1. Ligne de rappel vers le sentier en cas de hors-piste */}
      {offTrackLeadLine && (
        <Polyline
          positions={offTrackLeadLine}
          pathOptions={{
            color: '#f59e0b',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.9,
          }}
        >
          <Tooltip permanent direction="center">
            <span className="font-bold text-amber-900 text-[10px]">
              +{distanceToTrackMeters} m
            </span>
          </Tooltip>
        </Polyline>
      )}

      {/* 2. Marqueur dynamique de l'utilisateur avec cap et impulsion */}
      <Marker
        position={[userPosition[1], userPosition[0]]}
        icon={createDirectionalUserIcon({ heading, isOffTrack, color: '#10b981' })}
        zIndexOffset={1000}
      />
    </>
  );
}
