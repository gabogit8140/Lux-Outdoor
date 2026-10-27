import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMap, useMapEvents, Marker, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Locate, LocateFixed, Loader2 } from 'lucide-react';
import { TOUCH_MAP_BUTTON_CLASS } from '../../lib/layout/touchDimensions';
import { createDirectionalUserIcon } from '../../lib/navigation/userLocationIcon';
import { calculateBearing, distanceMeters } from '../../lib/navigation/navigationMath';

interface LocateControlProps {
  isNavigating?: boolean;
  onLocationChange?: (coords: [number, number]) => void;
}

// Seuil de zoom à partir duquel la carte affiche le niveau de détail d'un tracé/sentier
const TRACE_ZOOM_THRESHOLD = 12;

// Icône compacte pour le zoom pays (pastille bleue pulsante)
const locateUserIcon = L.divIcon({
  className: 'locate-user-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <!-- Halo pulsant d'onde radio -->
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(14, 165, 233, 0.35); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
      <!-- Anneau blanc de contraste -->
      <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; border: 3.5px solid #0284c7; box-shadow: 0 2px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 2;">
        <!-- Centre bleu vif -->
        <div style="width: 5px; height: 5px; border-radius: 50%; background: #0284c7;"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/**
 * Zoom fluide vers la position de l'utilisateur tout en gardant une vision d'ensemble (~5 km visibles autour).
 */
const flyToUserArea = (map: L.Map, userCoords: [number, number]) => {
  const areaBounds = L.latLng(userCoords[0], userCoords[1]).toBounds(10000);
  map.flyToBounds(areaBounds, {
    animate: true,
    duration: 1.2,
    maxZoom: 13,
  });
};

/**
 * Bouton de géolocalisation autonome avec affichage du cône directionnel d'orientation.
 * Au niveau de zoom sentier (>= 12), affiche en permanence le faisceau lumineux d'orientation.
 */
export function LocateControl({ isNavigating = false, onLocationChange }: LocateControlProps) {
  const map = useMap();
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(() => map.getZoom());
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const prevCoordsRef = useRef<[number, number] | null>(null);
  const lastOrientationTimeRef = useRef<number>(0);
  const lastHeadingRef = useRef<number>(0);
  const lastGpsUpdateTimeRef = useRef<number>(0);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  // Surveillance dynamique du niveau de zoom de la carte
  useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });

  // Capteur d'orientation matériel continu (Boussole / Gyroscope iOS Safari et Android)
  // Throttlé à 5Hz (200ms) et filtre à >= 4° pour préserver le CPU et la batterie iPhone
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastOrientationTimeRef.current < 200) {
        return;
      }

      let compass = 0;
      if ((e as any).webkitCompassHeading) {
        compass = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        compass = 360 - e.alpha;
      }
      if (!isNaN(compass)) {
        const rounded = Math.round(compass);
        if (Math.abs(rounded - lastHeadingRef.current) >= 4) {
          lastOrientationTimeRef.current = now;
          lastHeadingRef.current = rounded;
          setHeading(rounded);
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, { passive: true } as any);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Démarre la surveillance GPS continue UNE SEULE FOIS (sans boucle de redémarrage hardware)
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }

    setIsLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        // Évite le réveil GPU/CPU sur micro-dérive GPS si l'utilisateur ne s'est pas déplacé
        const now = Date.now();
        const prev = prevCoordsRef.current;
        const movedDistance = prev ? distanceMeters(prev, userCoords) : Infinity;

        if (movedDistance < 2.5 && now - lastGpsUpdateTimeRef.current < 3000) {
          return;
        }

        lastGpsUpdateTimeRef.current = now;
        prevCoordsRef.current = userCoords;
        setCoords(userCoords);
        setAccuracy(position.coords.accuracy);
        setIsLocating(false);
        setIsActive(true);
        onLocationChangeRef.current?.(userCoords);

        // Récupération du cap de déplacement GPS ou calcul géométrique
        if (position.coords.heading !== null && !isNaN(position.coords.heading) && position.coords.heading >= 0) {
          const roundedHeading = Math.round(position.coords.heading);
          if (Math.abs(roundedHeading - lastHeadingRef.current) >= 4) {
            lastHeadingRef.current = roundedHeading;
            setHeading(roundedHeading);
          }
        } else if (prev && movedDistance > 3) {
          const calcBearing = Math.round(calculateBearing(prev, userCoords));
          if (Math.abs(calcBearing - lastHeadingRef.current) >= 4) {
            lastHeadingRef.current = calcBearing;
            setHeading(calcBearing);
          }
        }
      },
      (error) => {
        setIsLocating(false);
        console.debug('Acquisition position initiale en attente ou refusée:', error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Déclenchement du recentrage immédiat sur la position connue de l'utilisateur
  const handleRecenterOnUser = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Sur iOS Safari, sollicite l'autorisation boussole lors du geste utilisateur
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission().catch(() => {});
      }

      if (!('geolocation' in navigator)) {
        setErrorMessage("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
      }

      setErrorMessage(null);

      // Si les coordonnées sont déjà identifiées, recentrer instantanément
      if (coords) {
        flyToUserArea(map, coords);
        return;
      }

      // Si les coordonnées ne sont pas encore prêtes, forcer une acquisition rapide et recentrer
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const userCoords: [number, number] = [lat, lng];

          setCoords(userCoords);
          setAccuracy(position.coords.accuracy);
          setIsLocating(false);
          setIsActive(true);
          onLocationChange?.(userCoords);

          flyToUserArea(map, userCoords);
        },
        (error) => {
          setIsLocating(false);
          let message = 'Signal GPS introuvable.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Veuillez autoriser la géolocalisation dans votre navigateur.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Délai dépassé pour acquérir la position GPS.';
          }
          setErrorMessage(message);
          setTimeout(() => setErrorMessage(null), 4000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        }
      );
    },
    [coords, map, onLocationChange]
  );

  const isTraceZoom = currentZoom >= TRACE_ZOOM_THRESHOLD;

  const directionalIcon = useMemo(() => {
    return createDirectionalUserIcon({
      heading,
      color: '#0284c7',
      glowColor: 'rgba(2, 132, 199, 0.45)',
    });
  }, [heading]);

  return (
    <>
      {/* Bouton de localisation dans la barre de contrôle */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleRecenterOnUser}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={isLocating}
          className={`${TOUCH_MAP_BUTTON_CLASS} ${
            isActive
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-600/35 ring-2 ring-emerald-400/50'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border-white/80 dark:border-slate-700/80 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
          }`}
          title={
            isActive
              ? 'Recentrer la carte sur ma position'
              : 'Me localiser et recentrer la carte'
          }
          aria-label="Recentrer sur ma position"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          ) : isActive ? (
            <LocateFixed className="w-4 h-4" />
          ) : (
            <Locate className="w-4 h-4" />
          )}
        </button>

        {/* Message d'erreur discret en cas de refus d'autorisation ou timeout */}
        {errorMessage && (
          <div className="absolute right-11 top-0 bg-slate-900/95 text-rose-300 text-xs px-2.5 py-1.5 rounded-xl border border-rose-500/40 shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-right-2">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Marqueur et cône directionnel (masqué si le guidage actif NavigationMapLayer est déjà en cours) */}
      {!isNavigating && coords && (
        <>
          {accuracy && accuracy > 10 && (
            <Circle
              center={coords}
              radius={Math.min(accuracy, 2000)}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '3, 4',
              }}
            />
          )}
          <Marker
            position={coords}
            icon={isTraceZoom ? directionalIcon : locateUserIcon}
            zIndexOffset={950}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <span className="text-xs font-semibold text-slate-900">
                Vous êtes ici {accuracy ? `(±${Math.round(accuracy)}m)` : ''} · Cap {heading}°
              </span>
            </Tooltip>
          </Marker>
        </>
      )}
    </>
  );
}
