import React, { useState, useEffect } from 'react';
import { Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import type { SavedFavorite } from '../../hooks/useFavorites';
import type { RouteSuggestions, RouteTrace } from '../../types';
import {
  createFavoriteMarkerIcon,
  resolveFavoriteCategory,
  FAVORITE_CATEGORIES,
} from '../../lib/favorites/favoriteCategories';
import { Mountain, Play, ArrowRight } from 'lucide-react';
import { getAdaptiveMarkerDimensions } from '../../lib/layout/markerZoomScale';
import { DEFAULT_MAP_ZOOM } from '../../lib/layout/mapViewport';

interface MapFavoritesLayerProps {
  favorites: SavedFavorite[];
  onSelectFavorite: (route: RouteSuggestions, trace: RouteTrace) => void;
  selectedRouteId?: string | null;
}

export function MapFavoritesLayer({
  favorites,
  onSelectFavorite,
  selectedRouteId,
}: MapFavoritesLayerProps) {
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_MAP_ZOOM);

  const map = useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });

  useEffect(() => {
    if (map) {
      setCurrentZoom(map.getZoom());
    }
  }, [map]);

  const { tier, size } = getAdaptiveMarkerDimensions(currentZoom);

  // Sélectionne uniquement les traces notées ou associées au tag champignons
  const ratedFavorites = favorites.filter((fav) => {
    const cat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
    return Boolean(cat || fav.hasMushrooms);
  });

  if (ratedFavorites.length === 0) return null;

  return (
    <>
      {ratedFavorites.map((fav) => {
        const cat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
        if (!cat) return null;

        const coords = fav.trace?.coordinates;
        if (!coords || coords.length === 0) return null;

        let startPos: [number, number] | null = null;
        if (Array.isArray(coords[0]?.[0])) {
          const firstSeg = coords[0] as [number, number][];
          if (firstSeg.length > 0) {
            startPos = [firstSeg[0][1], firstSeg[0][0]]; // [lat, lng]
          }
        } else {
          const flatCoords = coords as [number, number][];
          if (flatCoords.length > 0) {
            startPos = [flatCoords[0][1], flatCoords[0][0]]; // [lat, lng]
          }
        }

        if (!startPos) return null;

        const meta = FAVORITE_CATEGORIES[cat] || FAVORITE_CATEGORIES.top;
        const isSelected = selectedRouteId === fav.route.id;

        return (
          <Marker
            key={`fav-marker-${fav.id}-${cat}-${isSelected ? 'sel' : 'norm'}-${tier}`}
            position={startPos}
            icon={createFavoriteMarkerIcon(cat, fav.hasMushrooms, isSelected, currentZoom)}
            zIndexOffset={isSelected ? 1000 : 750}
            eventHandlers={{
              click: () => {
                onSelectFavorite(fav.route, fav.trace);
              },
            }}
          >
            {/* Tooltip rapide au survol */}
            <Tooltip direction="top" offset={[0, Math.round(-size / 2 - 2)]} opacity={0.95}>
              <div className="text-center font-sans">
                <div className="flex items-center justify-center gap-1 font-bold text-xs">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  {fav.hasMushrooms && cat !== 'champignons' && <span>· 🍄</span>}
                </div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 max-w-[180px] truncate">
                  {fav.title}
                </div>
                <div className="text-[10px] text-slate-500">
                  {fav.distanceKm} km · {fav.elevationGain}m D+
                </div>
              </div>
            </Tooltip>

            {/* Popup détaillée au clic */}
            <Popup className="custom-popup" offset={[0, -12]}>
              <div className="p-1 min-w-[210px] max-w-[260px] font-sans">
                <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${meta.bgColor} ${meta.borderColor} ${meta.textColor}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                  {fav.hasMushrooms && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200">
                      🍄 Champignons
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 line-clamp-2 leading-snug">
                  {fav.title}
                </h4>

                <div className="flex items-center gap-3 my-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {fav.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Mountain className="w-3 h-3 text-slate-400" />
                    {fav.elevationGain}m D+
                  </span>
                </div>

                {fav.userNotes && (
                  <p className="text-[11px] italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700/60 mb-2.5">
                    "{fav.userNotes}"
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => onSelectFavorite(fav.route, fav.trace)}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Afficher le circuit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
