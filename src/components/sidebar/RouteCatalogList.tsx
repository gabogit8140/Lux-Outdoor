import React from 'react';
import { Star, Footprints, Bike, Globe, ExternalLink } from 'lucide-react';
import type { RouteSuggestions, RouteTrace } from '../../types';

interface RouteCatalogListProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  location?: string;
  distance: [number, number];
  activity: 'bike' | 'hike';
  clickedCoord?: { lat: number; lng: number; name: string } | null;
}

const getCountryFlag = (country?: string) => {
  switch (country) {
    case 'LU':
      return '🇱🇺';
    case 'BE':
      return '🇧🇪';
    case 'DE':
      return '🇩🇪';
    case 'NL':
      return '🇳🇱';
    case 'FR':
      return '🇫🇷';
    default:
      return '🇪🇺';
  }
};

export function RouteCatalogList({
  routes,
  traces,
  selectedRouteId,
  onSelectRoute,
  location,
  distance,
  activity,
  clickedCoord,
}: RouteCatalogListProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium px-0.5">
        <span className="font-bold text-stone-700 flex items-center gap-1">
          {activity === 'hike' ? (
            <Footprints className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Bike className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>
            {routes.length} trace{routes.length > 1 ? 's' : ''}{' '}
            {location ? `autour de ${location}` : 'disponibles'}
          </span>
        </span>
        <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold text-[10px]">
          {distance[0]}–{distance[1]} km
        </span>
      </div>

      {clickedCoord && (
        <div className="bg-emerald-50 text-emerald-800 text-[11px] px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center justify-between">
          <span className="font-semibold truncate">📍 Clic carte : {clickedCoord.name}</span>
          <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded font-bold shrink-0">
            Actif
          </span>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center space-y-1.5">
          <p className="text-xs font-bold text-stone-600">Aucun tracé ne correspond à ces critères</p>
          <p className="text-[11px] text-stone-400">
            Essayez d'élargir la distance ou de désélectionner certains filtres.
          </p>
        </div>
      ) : (
        routes.map((r) => {
          const isSelected = r.id === selectedRouteId;
          const diff = r.difficulty;
          const tr = traces[r.id];
          const distKm = tr ? (tr.distance / 1000).toFixed(1) : undefined;

          return (
            <div
              key={r.id}
              onClick={() => onSelectRoute(r.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-stone-50/80 hover:bg-white border-stone-200/80 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{getCountryFlag(r.country)}</span>
                  <h4 className="font-bold text-xs text-stone-900 truncate">{r.title}</h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-extrabold text-emerald-700 block">
                    {r.elevationGain}m D+
                  </span>
                  {distKm && (
                    <span className="text-[10px] text-stone-400 font-semibold">{distKm} km</span>
                  )}
                </div>
              </div>

              {r.regionName && (
                <div className="text-[10px] text-stone-400 font-medium mt-0.5">
                  {r.regionName}
                </div>
              )}

              <p className="text-[11px] text-stone-600 line-clamp-1 mt-1 leading-snug">
                {r.description}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-stone-500 flex-wrap">
                {r.isUserImported && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[9px] shadow-2xs">
                    📍 Mon tracé
                  </span>
                )}

                {r.tripName && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[9px]">
                    ✈️ {r.tripName}
                  </span>
                )}

                <span className="px-1.5 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700 truncate max-w-[150px]">
                  {r.surfaceType}
                </span>

                {diff && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${diff.badgeBg} ${diff.badgeText}`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: diff.dotColor }}
                    />
                    {diff.label}
                  </span>
                )}

                {r.roadBreakdown && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                    {r.roadBreakdown.carFreePercentage}% sans voiture
                  </span>
                )}

                {r.userRating && (
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold ml-auto">
                    <Star className="w-3 h-3 fill-current" /> {r.userRating}/5
                  </span>
                )}
              </div>

              {/* Source website link */}
              {r.sourceUrl && (
                <div className="mt-2 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-stone-400 font-medium">Source :</span>
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline truncate max-w-[200px]"
                    title={`Visiter ${r.sourceLabel || r.sourceUrl}`}
                  >
                    <Globe className="w-3 h-3 shrink-0 text-emerald-600" />
                    <span className="truncate">{r.sourceLabel || 'Site source'}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                  </a>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
