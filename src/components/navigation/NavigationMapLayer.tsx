import React, { useEffect, useMemo } from 'react';
import { Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { UseOutdoorNavigationReturn } from '../../hooks/useOutdoorNavigation';

interface NavigationMapLayerProps {
  navigation: UseOutdoorNavigationReturn;
  recenterTrigger?: number;
}

// Icône de géolocalisation pulsante avec flèche d'orientation directionnelle (boussole)
const createNavigationUserIcon = (heading: number, isOffTrack: boolean) => {
  const color = isOffTrack ? '#f59e0b' : '#10b981';
  const glowColor = isOffTrack ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.45)';

  return L.divIcon({
    className: 'nav-user-location-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Halo d'impulsion GPS -->
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${glowColor}; animation: pulse 2s infinite;"></div>
        
        <!-- Faisceau de visée / Cap boussole -->
        <div style="position: absolute; width: 44px; height: 44px; transform: rotate(${heading}deg); transform-origin: center center; pointer-events: none;">
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid ${color};"></div>
        </div>

        <!-- Pastille centrale marcheur -->
        <div style="width: 20px; height: 20px; border-radius: 50%; background: #ffffff; border: 3.5px solid ${color}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 2;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

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
        icon={createNavigationUserIcon(heading, isOffTrack)}
        zIndexOffset={1000}
      />
    </>
  );
}
