import React, { useState } from 'react';
import {
  Download,
  Share2,
  Bookmark,
  Star,
  ListOrdered,
  ChevronRight,
  RefreshCw,
  Car,
  Footprints,
  Bike,
  Globe,
  ExternalLink,
  MapPin,
  Eye,
  EyeOff,
  X,
  Route,
  Mountain,
  Clock,
  Wand2,
  Navigation,
} from 'lucide-react';
import type { RouteSuggestions, RouteTrace } from '../../types';
import { HuntingSafetyAlert } from '../ui/HuntingSafetyAlert';
import {
  KpiTelemetryCard,
  getCountryFlag,
  SidebarElevationChart,
  getSemanticRouteColor,
} from '../ui/PremiumPrimitives';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';
import { openWazeNavigation, getRouteStartCoordinates } from '../../lib/navigation/wazeNavigation';
import { KomootIcon } from '../ui/KomootIcon';
import { exportGpxDirect } from '../../lib/navigation/mobileSchemes';

import {
  type FavoriteCategory,
  FAVORITE_CATEGORIES,
} from '../../lib/favorites/favoriteCategories';
import { isVttRoute } from '../../lib/localRouting';

interface RouteDetailViewProps {
  route: RouteSuggestions;
  trace: RouteTrace | null;
  activity: 'bike' | 'hike';
  pendingRating?: number;
  setPendingRating?: (rating: number) => void;
  pendingCategory?: FavoriteCategory | null;
  setPendingCategory?: (category: FavoriteCategory | null) => void;
  pendingHasMushrooms?: boolean;
  setPendingHasMushrooms?: (has: boolean) => void;
  pendingNotes: string;
  setPendingNotes: (notes: string) => void;
  onSaveFavorite: (
    category?: FavoriteCategory,
    userNotes?: string,
    hasMushrooms?: boolean,
    userRating?: number
  ) => void;
  onReverseRoute: () => void;
  isTraceVisible?: boolean;
  onToggleTraceVisibility?: () => void;
  onDeselect?: () => void;
  onHoverDistance?: (distanceKm: number | null) => void;
  isHoverPreview?: boolean;
  onLockRoute?: (id: string) => void;
  onBackToCatalog?: () => void;
  showHuntingBattues?: boolean;
  onToggleHuntingBattues?: () => void;
  onEditRoute?: (route: RouteSuggestions, trace: RouteTrace) => void;
  editor?: UseRouteEditorReturn;
  onStartNavigation?: (route: RouteSuggestions, trace: RouteTrace) => void;
  isNavigating?: boolean;
}

export function RouteDetailView({
  route,
  trace,
  activity,
  pendingRating = 0,
  setPendingRating,
  pendingCategory = null,
  setPendingCategory,
  pendingHasMushrooms = false,
  setPendingHasMushrooms,
  pendingNotes,
  setPendingNotes,
  onSaveFavorite,
  onReverseRoute,
  isTraceVisible = true,
  onToggleTraceVisibility,
  onDeselect,
  onHoverDistance,
  isHoverPreview = false,
  onLockRoute,
  onBackToCatalog,
  showHuntingBattues,
  onToggleHuntingBattues,
  onEditRoute,
  editor,
  onStartNavigation,
  isNavigating = false,
}: RouteDetailViewProps) {
  const [showRoadbook, setShowRoadbook] = useState(false);
  const semanticColor = getSemanticRouteColor(route.difficulty?.level);

  const handleExportKomoot = () => {
    if (!trace) return;
    exportGpxDirect(route.title, trace.coordinates, trace.elevationProfile);
  };

  const startCoords = getRouteStartCoordinates(route, trace);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: route.title,
          text: `Découvrez ce circuit : ${route.title} (${
            trace ? (trace.distance / 1000).toFixed(1) : ''
          } km, +${route.elevationGain}m D+)`,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien du parcours copié dans le presse-papier !');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Live Trace Editor Status & Control Banner */}
      {editor?.isEditorActive && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/15 to-purple-500/10 border border-purple-300 dark:border-purple-800 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                Mode Tracé en direct
              </span>
            </div>
            {editor.isCalculating ? (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold animate-pulse">
                Calcul sentiers réels...
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {editor.waypoints.length} étape(s) posée(s)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            Glissez les points sur la carte pour dévier le tracé. Les dénivelés et surfaces s'ajustent en direct ci-dessous.
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-purple-200 dark:border-purple-800/60">
            <button
              onClick={editor.openSaveModal}
              disabled={!editor.calculatedResult || editor.waypoints.length < 2}
              className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sauvegarder GPX</span>
            </button>
            <button
              onClick={editor.openLoopModal}
              className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Générer automatiquement une boucle"
            >
              <Wand2 className="w-3.5 h-3.5 text-yellow-300" />
              <span>Boucle auto</span>
            </button>
            <button
              onClick={editor.cancel}
              className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Quitter
            </button>
          </div>
        </div>
      )}

      {/* Top quick navigation & Hover Preview banner */}
      <div className="flex items-center justify-between gap-2">
        {onBackToCatalog && (
          <button
            onClick={onBackToCatalog}
            className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
          >
            <span>← Liste des traces</span>
          </button>
        )}
        {isHoverPreview ? (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Aperçu au survol
            </span>
            {onLockRoute && (
              <button
                onClick={() => onLockRoute(route.id)}
                className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors cursor-pointer"
              >
                Sélectionner
              </button>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ml-auto">
            ✓ Tracé sélectionné
          </span>
        )}
      </div>

      {/* Route Hero Header Card */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-emerald-950/30 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {route.isUserImported && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs">
                  📍 Mon Tracé
                </span>
              )}
              {route.tripName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ✈️ {route.tripName}
                </span>
              )}
              {route.country && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1">
                  <span>{getCountryFlag(route.country)}</span>
                  <span>{route.country}</span>
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${route.difficulty.badgeBg} ${route.difficulty.badgeText}`}
              >
                {route.difficulty.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                activity === 'hike'
                  ? 'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                  : isVttRoute(route)
                  ? 'bg-amber-500/10 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-500/20'
                  : 'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
              }`}>
                {activity === 'hike' ? (
                  <>
                    <Footprints className="w-3 h-3" /> Rando
                  </>
                ) : isVttRoute(route) ? (
                  <>
                    <Mountain className="w-3 h-3" /> VTT
                  </>
                ) : (
                  <>
                    <Bike className="w-3 h-3" /> Vélo route
                  </>
                )}
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug pt-0.5">
              {route.title}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {route.description}
        </p>

        {/* Surface type description */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Revêtement :</span>
          <span>{route.surfaceType}</span>
        </div>

        {/* Visibility on Map & Deselect Route Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          {onToggleTraceVisibility && (
            <button
              onClick={onToggleTraceVisibility}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                isTraceVisible
                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-sm font-extrabold'
              }`}
              title={
                isTraceVisible
                  ? 'Masquer la trace pour voir les routes dessous'
                  : 'Afficher la trace sur la carte'
              }
            >
              {isTraceVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Masquer</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-white" />
                  <span>Démasquer</span>
                </>
              )}
            </button>
          )}

          {onDeselect && (
            <button
              onClick={onDeselect}
              className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Enlever la sélection et revenir à la liste"
            >
              <X className="w-3.5 h-3.5" />
              <span>Enlever</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Source Website & Cadastral Geoportail.lu for the GPX */}
      {(route.sourceUrl || route.sourceLabel || route.geoportailUrl) && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/70 rounded-2xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-emerald-800/80 dark:text-emerald-400 tracking-wider block">
                  Fiche officielle & Source du tracé
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {route.sourceLabel || 'Page officielle du parcours'}
                </span>
              </div>
            </div>
            {route.sourceUrl && (
              <a
                href={route.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Ouvrir la page officielle dédiée à ce tracé"
              >
                <span>Fiche officielle</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {route.geoportailUrl && (
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-emerald-900/80 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Cadastre & Topographie (ACT) :</span>
              </span>
              <a
                href={route.geoportailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 underline flex items-center gap-1"
                title="Consulter le tracé sur la carte topographique officielle de Geoportail.lu"
              >
                <span>Geoportail.lu</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* High-Density Bento KPI Telemetry Cards */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTelemetryCard
          label="Distance"
          value={trace ? (trace.distance / 1000).toFixed(1) : '--'}
          unit="km"
          icon={<Route className="w-3 h-3" />}
        />
        <KpiTelemetryCard
          label="Dénivelé D+"
          value={`+${route.elevationGain}`}
          unit="m"
          accent="emerald"
          icon={<Mountain className="w-3 h-3" />}
        />
        <KpiTelemetryCard
          label="Durée estim."
          value={
            trace
              ? `${Math.floor(trace.duration / 3600)}h${String(
                  Math.round((trace.duration % 3600) / 60)
                ).padStart(2, '0')}`
              : '--'
          }
          icon={<Clock className="w-3 h-3" />}
        />
      </div>

      {/* Interactive Elevation Profile Chart inside Right Sidebar */}
      {trace?.elevationProfile && trace.elevationProfile.length >= 2 && (
        <SidebarElevationChart
          key={`${route.id}-${(trace as any)?.reverseKey || 0}`}
          profile={trace.elevationProfile}
          routeId={route.id}
          color={semanticColor}
          elevationGain={route.elevationGain}
          minElevation={route.minElevation}
          maxElevation={route.maxElevation}
          onHoverDistance={onHoverDistance}
        />
      )}

      {/* Road Breakdown & Traffic Safety (Wording adapted strictly to activity) */}
      {route.roadBreakdown && (
        <section className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-orange-500" />
              Sécurité & Trafic routier
            </h3>
            <span
              className={`text-[10px] font-bold font-mono-kpi px-2 py-0.5 rounded-full ${
                route.roadBreakdown.safetyRating === 'maximal'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : route.roadBreakdown.safetyRating === 'high'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {route.roadBreakdown.carFreePercentage}% sans voiture
            </span>
          </div>

          {/* Segmented color bar */}
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${route.roadBreakdown.carFreePercentage}%` }}
              title={`Voie sans voiture : ${route.roadBreakdown.carFreeKm} km (${route.roadBreakdown.carFreePercentage}%)`}
            />
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${route.roadBreakdown.sharedRoadPercentage}%` }}
              title={`Route avec voitures : ${route.roadBreakdown.sharedRoadKm} km (${route.roadBreakdown.sharedRoadPercentage}%)`}
            />
          </div>

          {/* Detailed cards for car-free vs shared road */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/70">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Voie sans voiture</span>
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 font-extrabold font-mono-kpi text-sm mt-0.5">
                {route.roadBreakdown.carFreeKm} km
                <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400/80 ml-1">
                  ({route.roadBreakdown.carFreePercentage}%)
                </span>
              </div>
              <div className="text-[10px] text-emerald-800/80 dark:text-emerald-300/70 mt-0.5 leading-tight">
                {activity === 'hike'
                  ? 'Sentiers pédestres, chemins de terre & voies sans voiture'
                  : 'Voies vertes, pistes cyclables & sentiers réservés'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/70">
              <div className="flex items-center gap-1.5 font-bold text-orange-950 dark:text-orange-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span>Route partagée</span>
              </div>
              <div className="text-orange-700 dark:text-orange-400 font-extrabold font-mono-kpi text-sm mt-0.5">
                {route.roadBreakdown.sharedRoadKm} km
                <span className="text-[10px] font-normal text-orange-600 dark:text-orange-400/80 ml-1">
                  ({route.roadBreakdown.sharedRoadPercentage}%)
                </span>
              </div>
              <div className="text-[10px] text-orange-800/80 dark:text-orange-300/70 mt-0.5 leading-tight">
                Petites routes ouvertes à la circulation automobile
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hunting & Battue Safety Information (Luxembourg & Greater Region) */}
      <HuntingSafetyAlert
        country={route.country}
        coords={route.waypoints}
        regionName={route.regionName}
        showHuntingBattues={showHuntingBattues}
        onToggleHuntingBattues={onToggleHuntingBattues}
      />

      {/* Highlights */}
      {route.highlights && route.highlights.length > 0 && (
        <section className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mb-1.5">
            Points d'intérêt & Atouts
          </h3>
          <ul className="space-y-1">
            {route.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-200 items-start">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Personal Rating, Category & Field Notes */}
      <section className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Évaluation & Carnet de terrain
          </span>
          <span className="text-[10px] text-slate-400">
            {pendingCategory ? 'Trace notée' : 'Trace à faire'}
          </span>
        </div>

        {/* Boutons de catégories d'évaluation (Top, Bien, Ne pas refaire) */}
        <div className="grid grid-cols-3 gap-1.5">
          {(['top', 'bien', 'ne_pas_refaire'] as FavoriteCategory[]).map((catKey) => {
            const meta = FAVORITE_CATEGORIES[catKey];
            const isSelected = pendingCategory === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => {
                  if (setPendingCategory) {
                    setPendingCategory(isSelected ? null : catKey);
                  }
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                  isSelected
                    ? `${meta.bgColor} ${meta.borderColor} ${meta.textColor} ring-2 ring-emerald-500/30 shadow-sm scale-102`
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
                title={meta.shortDescription}
              >
                <span className="text-base">{meta.icon}</span>
                <span className="text-[11px] font-semibold">{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bouton additionnel Coin champignons */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              if (setPendingHasMushrooms) {
                setPendingHasMushrooms(!pendingHasMushrooms);
              }
            }}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              pendingHasMushrooms
                ? 'bg-orange-500/15 border-orange-400 text-orange-800 dark:text-orange-300 ring-2 ring-orange-500/30'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <span className="text-sm">🍄</span>
            <span>Coin à champignons</span>
            {pendingHasMushrooms && (
              <span className="text-[10px] ml-auto font-normal text-orange-700 dark:text-orange-300">
                Activé sur la carte
              </span>
            )}
          </button>
        </div>

        <div className="relative mt-1">
          <textarea
            value={pendingNotes}
            onChange={(e) => setPendingNotes(e.target.value)}
            placeholder="Notes de terrain personnelles (ex: vue panoramique au km 6, fontaine d'eau potable, passages ombragés...)"
            rows={2}
            className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Bouton d'enregistrement de l'évaluation et du carnet */}
        <button
          type="button"
          onClick={() =>
            onSaveFavorite(
              pendingCategory || undefined,
              pendingNotes,
              pendingHasMushrooms,
              pendingRating
            )
          }
          className="w-full mt-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
          title="Enregistrer ce tracé et votre appréciation"
        >
          <Bookmark className="w-3.5 h-3.5 fill-white/20" />
          <span>
            {pendingCategory
              ? `Enregistrer comme trace notée (${FAVORITE_CATEGORIES[pendingCategory].icon})`
              : 'Enregistrer dans "Traces à faire"'}
          </span>
        </button>
      </section>

      {/* Roadbook / Turn-by-Turn Accordion */}
      {route.instructions && route.instructions.length > 0 && (
        <section className="border border-slate-200/80 dark:border-slate-700/80 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowRoadbook(!showRoadbook)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Feuille de route ({route.instructions.length} étapes)
            </span>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showRoadbook ? 'rotate-90' : ''
              }`}
            />
          </button>
          {showRoadbook && (
            <div className="p-3 bg-white dark:bg-slate-900 space-y-2 max-h-48 overflow-y-auto text-xs">
              {route.instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="font-mono-kpi font-bold text-[10px] text-emerald-700 dark:text-emerald-400 shrink-0 w-12 text-right">
                    {inst.distanceKm} km
                  </span>
                  <span>{inst.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Action Buttons: Start Navigation, Edit/Variant, Reverse, Export GPX, Save Favorite */}
      <div className="space-y-2 pt-1">
        {onStartNavigation && trace && (
          <button
            onClick={() => onStartNavigation(route, trace)}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
            title="Démarrer le guidage terrain tête-haute (100% hors-ligne, GPS direct)"
          >
            <Navigation className="w-4 h-4 fill-white animate-pulse" />
            <span>{isNavigating ? 'Reprendre le guidage terrain' : 'Démarrer le guidage terrain'}</span>
          </button>
        )}

        {startCoords && (
          <button
            type="button"
            onClick={() => openWazeNavigation(startCoords[0], startCoords[1])}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 active:scale-95 transition-all cursor-pointer border border-sky-400/30"
            title="Ouvrir Waze pour naviguer en voiture jusqu'au départ de la trace"
          >
            <Car className="w-4 h-4 text-cyan-200" />
            <span>Y aller avec Waze (guidage voiture vers départ)</span>
          </button>
        )}

        {trace && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleExportKomoot}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#7DB434] via-[#6ca028] to-[#588523] hover:from-[#71a52e] hover:to-[#4e771c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-lime-950/25 active:scale-95 transition-all cursor-pointer border border-lime-300/35"
              title="Ouvrir dans Komoot pour guidage Apple Watch & GPS"
            >
              <KomootIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">Envoyer vers Komoot (Apple Watch & GPS)</span>
            </button>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">
              Export GPX propre + option Raccourci iOS automatique
            </p>
          </div>
        )}

        {onEditRoute && trace && (
          <button
            onClick={() => onEditRoute(route, trace)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            title="Modifier ce tracé sur la carte et créer un nouveau parcours stocké dans un GPX séparé"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Modifier ce parcours (Variante GPX)</span>
          </button>
        )}

        <button
          onClick={onReverseRoute}
          className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          title="Inverser le sens de parcours du circuit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Inverser le sens du circuit</span>
        </button>


        <button
          onClick={handleShare}
          className="w-full py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>Partager ce parcours</span>
        </button>
      </div>
    </div>
  );
}
