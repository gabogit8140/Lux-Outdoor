import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMap, Marker, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Locate, LocateFixed, Loader2 } from 'lucide-react';
import { TOUCH_MAP_BUTTON_CLASS } from '../../lib/layout/touchDimensions';

interface LocateControlProps {
  isNavigating?: boolean;
  onLocationChange?: (coords: [number, number]) => void;
}

// Icône Leaflet pour le repère de position utilisateur (pastille bleue pulsante)
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
 * Une boîte englobante de 10 000 m (rayon de 5 km dans chaque direction) garantit un cadrage réactif parfait
 * sur smartphone en mode portrait comme sur tablette ou écran d'ordinateur.
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
 * Bouton de géolocalisation autonome avec zoom fluide sur la position de l'utilisateur.
 * Affiche la position avec pastille animée et cercle de précision.
 */
export function LocateControl({ isNavigating = false, onLocationChange }: LocateControlProps) {
  const map = useMap();
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Démarre la surveillance GPS continue dès le chargement de l'application
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
        setCoords(userCoords);
        setAccuracy(position.coords.accuracy);
        setIsLocating(false);
        setIsActive(true);
        onLocationChange?.(userCoords);
      },
      (error) => {
        setIsLocating(false);
        // Gestion discrète sans message bloquant au démarrage (l'erreur ne s'affichera que sur clic explicite)
        console.debug('Acquisition position initiale en attente ou refusée:', error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
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
  }, [onLocationChange]);

  // Déclenchement du recentrage immédiat sur la position connue de l'utilisateur
  const handleRecenterOnUser = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

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

          // Recentrer avec cadrage réactif
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

      {/* Marqueur et cercle de précision sur la carte (masqué si le guidage dynamique est actif car NavigationMapLayer s'en charge) */}
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
          <Marker position={coords} icon={locateUserIcon}>
            <Tooltip direction="top" offset={[0, -10]}>
              <span className="text-xs font-semibold text-slate-900">
                Vous êtes ici {accuracy ? `(±${Math.round(accuracy)}m)` : ''}
              </span>
            </Tooltip>
          </Marker>
        </>
      )}
    </>
  );
}
