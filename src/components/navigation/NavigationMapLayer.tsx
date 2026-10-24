import React, { useEffect, useMemo } from 'react';
import { Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { UseOutdoorNavigationReturn } from '../../hooks/useOutdoorNavigation';

interface NavigationMapLayerProps {
  navigation: UseOutdoorNavigationReturn;
  recenterTrigger?: number;
}

// Icône de géolocalisation avec cône directionnel d'orientation (faisceau lumineux de boussole)
const createNavigationUserIcon = (heading: number, isOffTrack: boolean) => {
  const color = isOffTrack ? '#f59e0b' : '#10b981';
  const glowColor = isOffTrack ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.45)';
  const gradId = `navConeGrad_${isOffTrack ? 'warn' : 'ok'}`;

  return L.divIcon({
    className: 'nav-user-location-marker',
    html: `
      <div style="position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
        <!-- Cône directionnel d'orientation (faisceau lumineux de boussole) -->
        <svg width="120" height="120" viewBox="0 0 120 120" style="position: absolute; top: 0; left: 0; transform: rotate(${heading}deg); transform-origin: 60px 60px; pointer-events: none; transition: transform 0.16s ease-out;">
          <defs>
            <radialGradient id="${gradId}" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.65" />
              <stop offset="35%" stop-color="${color}" stop-opacity="0.38" />
              <stop offset="70%" stop-color="${color}" stop-opacity="0.12" />
              <stop offset="100%" stop-color="${color}" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- Cône triangulaire arrondi (ouverture 55°) projeté vers l'avant -->
          <path d="M 60 60 L 35 14 A 54 54 0 0 1 85 14 Z" fill="url(#${gradId})" />

          <!-- Flèche de visée fine au sommet du cône -->
          <line x1="60" y1="48" x2="60" y2="18" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.8" />
          <polygon points="60,11 56,20 64,20" fill="${color}" opacity="0.95" />
        </svg>

        <!-- Halo d'impulsion GPS -->
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${glowColor}; animation: pulse 2s infinite;"></div>

        <!-- Pastille centrale marcheur avec contour blanc net -->
        <div style="position: relative; width: 20px; height: 20px; border-radius: 50%; background: #ffffff; border: 3.5px solid ${color}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 2;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></div>
        </div>
      </div>
    `,
    iconSize: [120, 120],
    iconAnchor: [60, 60],
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
