import React, { useEffect, useRef } from 'react';
import { Star, Footprints, Bike, Globe, ExternalLink, ShieldCheck, RotateCcw, Repeat, ArrowRight } from 'lucide-react';
import type { RouteSuggestions, RouteTrace } from '../../types';
import {
  getCountryFlag,
  MiniElevationSparkline,
  getSemanticRouteColor,
  ROUTE_DIFFICULTY_LEGEND,
} from '../ui/PremiumPrimitives';
import { isRouteLoop, isVttRoute } from '../../lib/localRouting';

interface RouteCatalogListProps {
  routes: RouteSuggestions[];
  traces: Record<string, RouteTrace>;
  selectedRouteId: string | null;
  hoveredRouteId?: string | null;
  onSelectRoute: (id: string) => void;
  onHoverRoute?: (id: string | null) => void;
  location?: string;
  distance: [number, number];
  activity: 'bike' | 'hike';
  clickedCoord?: { lat: number; lng: number; name: string } | null;
  onClearAllFilters?: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/** Détection des appareils tactiles sans souris (tablette iPad, téléphone iPhone / Android) */
function isTouchDeviceWithoutMouse(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

export function RouteCatalogList({
  routes,
  traces,
  selectedRouteId,
  hoveredRouteId,
  onSelectRoute,
  onHoverRoute,
  location,
  distance,
  activity,
  clickedCoord,
  onClearAllFilters,
  scrollContainerRef,
}: RouteCatalogListProps) {
  const lastActiveIdRef = useRef<string | null>(null);

  // Synchronisation automatique de la trace supérieure au défilement sur tablette et smartphone
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container || !isTouchDeviceWithoutMouse() || routes.length === 0) return;

    // 1. Sélection par défaut de la trace supérieure au chargement
    if (!hoveredRouteId || !routes.some((r) => r.id === hoveredRouteId)) {
      const initialId = routes[0].id;
      lastActiveIdRef.current = initialId;
      onHoverRoute?.(initialId);
    } else {
      lastActiveIdRef.current = hoveredRouteId;
    }

    let rafId: number | null = null;

    // 2. Détection de la carte située au sommet de la vue lors du défilement
    const updateTopRouteOnScroll = () => {
      const cardElements = container.querySelectorAll<HTMLElement>('[data-route-card-id]');
      if (!cardElements.length) return;

      const containerRect = container.getBoundingClientRect();
      // Ligne de détection : 50px sous la limite supérieure du conteneur
      const targetY = containerRect.top + 50;

      let topCardId: string | null = null;

      for (let i = 0; i < cardElements.length; i++) {
        const el = cardElements[i];
        const rect = el.getBoundingClientRect();

        // Première carte dont la partie basse dépasse le seuil haut
        if (rect.bottom >= targetY) {
          topCardId = el.getAttribute('data-route-card-id');
          break;
        }
      }

      if (topCardId && topCardId !== lastActiveIdRef.current) {
        lastActiveIdRef.current = topCardId;
        onHoverRoute?.(topCardId);
      }
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateTopRouteOnScroll();
        rafId = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollContainerRef, routes, onHoverRoute]);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 min-w-0 truncate">
          {activity === 'hike' ? (
            <Footprints className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Bike className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span className="truncate">
            {routes.length} trace{routes.length > 1 ? 's' : ''}{' '}
            {location ? `· ${location}` : 'disponibles'}
          </span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold font-mono-kpi text-[10px] border border-slate-200/70 dark:border-slate-700">
            {distance[0]}–{distance[1]} km
          </span>
          {onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[10px] transition-colors cursor-pointer"
              title="Enlever tous les filtres et afficher toutes les traces"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Tout afficher</span>
            </button>
          )}
        </div>
      </div>

      {/* Semantic Difficulty Color Code Guide */}
      <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-[10px]">
        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] shrink-0">
          Relief :
        </span>
        <div className="flex items-center gap-2.5 flex-wrap">
          {ROUTE_DIFFICULTY_LEGEND.map((item) => (
            <span
              key={item.level}
              className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300"
              title={`${item.label} — ${item.subLabel}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      {clickedCoord && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-[11px] px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <span className="font-semibold truncate">📍 Clic carte : {clickedCoord.name}</span>
          <span className="text-[10px] bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold shrink-0">
            Actif
          </span>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="p-6 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2.5">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Aucun tracé ne correspond à ces critères
          </p>
          <p className="text-[11px] text-slate-400">
            Essayez d'élargir la distance ou d'enlever tous les filtres actifs.
          </p>
          {onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Enlever tous les filtres</span>
            </button>
          )}
        </div>
      ) : (
        routes.map((r) => {
          const isSelected = r.id === selectedRouteId;
          const isHovered = r.id === hoveredRouteId;
          const diff = r.difficulty;
          const tr = traces[r.id];
          const distKm = tr ? (tr.distance / 1000).toFixed(1) : undefined;
          const routeColor = getSemanticRouteColor(diff?.level);
          const isLoop = isRouteLoop({ route: r, trace: tr });

          return (
            <div
              key={r.id}
              data-route-card-id={r.id}
              onClick={() => onSelectRoute(r.id)}
              onMouseEnter={() => onHoverRoute?.(r.id)}
              onMouseLeave={() => onHoverRoute?.(null)}
              className={`group p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-600/10 ring-2 ring-emerald-500/20'
                  : isHovered
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/25'
                  : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400/70 dark:hover:border-emerald-500/60 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              {/* Top Row: Color Dot + Flag + Title + Telemetry Metrics */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                      style={{ backgroundColor: routeColor }}
                      title={`Difficulté : ${diff?.label || 'Modéré'} (${diff?.dPlusPerKm || 0} m D+/km)`}
                    />
                    <span className="text-sm shrink-0">{getCountryFlag(r.country)}</span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {r.title}
                    </h4>
                    {isHovered && !isSelected && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                        Sélectionné
                      </span>
                    )}
                  </div>
                  {r.regionName && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                      {r.regionName}
                    </div>
                  )}
                </div>

                {/* Right: Inline Elevation Sparkline + Tabular KPIs */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {tr?.elevationProfile && tr.elevationProfile.length >= 2 && (
                    <MiniElevationSparkline
                      id={r.id}
                      profile={tr.elevationProfile}
                      isSelected={isSelected}
                      color={routeColor}
                    />
                  )}
                  <div className="text-right">
                    {distKm && (
                      <span className="text-xs font-extrabold font-mono-kpi text-slate-900 dark:text-white block leading-tight">
                        {distKm} <span className="text-[10px] font-semibold text-slate-400">km</span>
                      </span>
                    )}
                    <span className="text-[11px] font-bold font-mono-kpi text-emerald-600 dark:text-emerald-400 block leading-tight">
                      +{r.elevationGain}m
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-1.5 leading-snug">
                {r.description}
              </p>

              {/* Badges Row */}
              <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-semibold text-slate-500 flex-wrap">
                {r.isUserImported && (
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-[9px] shadow-2xs">
                    📍 Mon tracé
                  </span>
                )}

                {r.tripName && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[9px]">
                    ✈️ {r.tripName}
                  </span>
                )}

                {r.activity === 'bike' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] border ${
                      isVttRoute(r)
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isVttRoute(r) ? '🚵 VTT' : '🚴 Route'}
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[9px] border ${
                    isLoop
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                  title={
                    isLoop
                      ? 'Parcours en boucle (retour au point de départ)'
                      : 'Parcours linéaire (point A vers point B)'
                  }
                >
                  {isLoop ? <Repeat className="w-2.5 h-2.5" /> : <ArrowRight className="w-2.5 h-2.5" />}
                  {isLoop ? 'Boucle' : 'Linéaire'}
                </span>

                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/70 border border-slate-200/70 dark:border-slate-600 text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
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
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 font-bold font-mono-kpi text-[9px] border border-emerald-500/20">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {r.roadBreakdown.carFreePercentage}% sans voiture
                  </span>
                )}

                {r.userRating && (
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold ml-auto">
                    <Star className="w-3 h-3 fill-current" /> {r.userRating}/5
                  </span>
                )}
              </div>

              {/* Source website link */}
              {r.sourceUrl && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Fiche officielle :</span>
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline truncate max-w-[210px]"
                    title={`Visiter ${r.sourceLabel || r.sourceUrl}`}
                  >
                    <Globe className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
