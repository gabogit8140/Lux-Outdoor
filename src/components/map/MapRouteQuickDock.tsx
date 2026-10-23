import React, { useMemo, useState } from 'react';
import type { RouteSuggestions, RouteTrace } from '../../types';
import { Navigation, Car, X, Footprints, Bike, ChevronRight, MapPin } from 'lucide-react';
import {
  calculateDistanceKm,
  formatDriveDistance,
  getRouteStartCoordinates,
} from '../../lib/navigation/wazeNavigation';
import { exportToKomoot } from '../../lib/navigation/komootExport';
import { KomootIcon } from '../ui/KomootIcon';
import { KomootExportModal } from '../navigation/KomootExportModal';

interface MapRouteQuickDockProps {
  route: RouteSuggestions;
  trace: RouteTrace;
  userCoords?: [number, number] | null;
  onStartNavigation: (route: RouteSuggestions, trace: RouteTrace) => void;
  onOpenWaze: (lat: number, lng: number) => void;
  onClose: () => void;
  onOpenDetails?: () => void;
  activity: 'bike' | 'hike';
}

export function MapRouteQuickDock({
  route,
  trace,
  userCoords,
  onStartNavigation,
  onOpenWaze,
  onClose,
  onOpenDetails,
  activity,
}: MapRouteQuickDockProps) {
  // Coordonnées GPS du point de départ de la trace (normalisées [lat, lng])
  const startCoords = useMemo<[number, number] | null>(() => {
    return getRouteStartCoordinates(route, trace);
  }, [route, trace]);

  // Distance entre la position actuelle de l'utilisateur et le point de départ
  const distanceToStart = useMemo<number | null>(() => {
    if (!userCoords || !startCoords) return null;
    return calculateDistanceKm(userCoords, startCoords);
  }, [userCoords, startCoords]);

  const [isKomootModalOpen, setIsKomootModalOpen] = useState(false);

  const handleExportKomoot = async () => {
    setIsKomootModalOpen(true);
    try {
      await exportToKomoot(route.title, trace.coordinates, trace.elevationProfile);
    } catch {
      // Modal handles fallback
    }
  };

  return (
    <div
      className="absolute bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-[440] w-[calc(100%-1.5rem)] max-w-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-white/15 dark:border-slate-700/80 ring-1 ring-black/20 flex flex-col gap-2.5">
        {/* Ligne 1: Titre, métriques et bouton fermer */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm text-white">
              {activity === 'bike' ? (
                <Bike className="w-4 h-4" />
              ) : (
                <Footprints className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
                {route.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                <span className="font-bold text-emerald-400">
                  {route.distanceKm ? `${route.distanceKm} km` : `${route.distance} km`}
                </span>
                <span>•</span>
                <span className="font-semibold">+{route.elevationGain}m D+</span>
                {distanceToStart !== null && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
                      <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                      à {formatDriveDistance(distanceToStart)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Désélectionner ce tracé"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ligne 2: Boutons d'actions rapides (Waze + Komoot + Guidage Terrain) */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {/* Bouton Waze pour le trajet voiture vers le départ */}
          {startCoords && (
            <button
              type="button"
              onClick={() => onOpenWaze(startCoords[0], startCoords[1])}
              className="py-2 px-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/30 transition-all cursor-pointer border border-sky-400/30"
              title="Ouvrir Waze pour naviguer en voiture jusqu'au départ du circuit"
            >
              <Car className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
              <span className="truncate">Waze départ</span>
            </button>
          )}

          {/* Bouton Komoot (Apple Watch & GPS) */}
          <button
            type="button"
            onClick={handleExportKomoot}
            className="py-2 px-2 bg-gradient-to-r from-[#7DB434] to-[#588523] hover:from-[#71a52e] hover:to-[#4a721c] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-lime-950/30 transition-all cursor-pointer border border-lime-300/35"
            title="Envoyer vers Komoot pour guidage Apple Watch & GPS (2 taps)"
          >
            <KomootIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Komoot</span>
          </button>

          {/* Bouton Démarrer la navigation rando/vélo sur le terrain */}
          <button
            type="button"
            onClick={() => onStartNavigation(route, trace)}
            className="py-2 px-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/35 transition-all cursor-pointer border border-emerald-400/40"
            title="Lancer le guidage direct sur le terrain (100% hors-ligne, GPS)"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0 fill-white animate-pulse" />
            <span className="truncate">Guidage</span>
          </button>
        </div>

        {/* Lien optionnel pour voir le profil complet / dénivelé */}
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1 py-0.5 transition-colors cursor-pointer"
          >
            <span>Voir profil complet & dénivelé</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <KomootExportModal
        isOpen={isKomootModalOpen}
        onClose={() => setIsKomootModalOpen(false)}
        route={route}
        trace={trace}
      />
    </div>
  );
}
