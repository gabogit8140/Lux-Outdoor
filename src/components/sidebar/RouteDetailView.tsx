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
} from 'lucide-react';
import type { RouteSuggestions, RouteTrace } from '../../types';
import { downloadGPX } from '../../lib/gpx';

interface RouteDetailViewProps {
  route: RouteSuggestions;
  trace: RouteTrace | null;
  activity: 'bike' | 'hike';
  pendingRating: number;
  setPendingRating: (rating: number) => void;
  pendingNotes: string;
  setPendingNotes: (notes: string) => void;
  onSaveFavorite: (userRating?: number, userNotes?: string) => void;
  onReverseRoute: () => void;
}

export function RouteDetailView({
  route,
  trace,
  activity,
  pendingRating,
  setPendingRating,
  pendingNotes,
  setPendingNotes,
  onSaveFavorite,
  onReverseRoute,
}: RouteDetailViewProps) {
  const [showRoadbook, setShowRoadbook] = useState(false);

  const handleExportGPX = () => {
    if (!trace) return;
    downloadGPX(route.title, trace.coordinates, trace.elevationProfile);
  };

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
    <div className="space-y-4">
      {/* Route Header Card */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {route.isUserImported && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                  📍 Mon Tracé
                </span>
              )}
              {route.tripName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✈️ {route.tripName}
                </span>
              )}
              {route.country && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-700 uppercase">
                  {route.country}
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${route.difficulty.badgeBg} ${route.difficulty.badgeText}`}
              >
                {route.difficulty.label}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                {activity === 'hike' ? (
                  <>
                    <Footprints className="w-3 h-3" /> Rando
                  </>
                ) : (
                  <>
                    <Bike className="w-3 h-3" /> Vélo
                  </>
                )}
              </span>
            </div>
            <h2 className="text-sm font-bold text-stone-900 leading-snug">{route.title}</h2>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">{route.description}</p>

        {/* Surface type description */}
        <div className="text-[11px] text-stone-500 font-medium pt-1 border-t border-stone-200/60 flex items-center gap-1">
          <span className="font-semibold text-stone-700">Revêtement :</span>
          <span>{route.surfaceType}</span>
        </div>
      </div>

      {/* Official Source Website for the GPX */}
      {(route.sourceUrl || route.sourceLabel) && (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-emerald-800/80 tracking-wider block">
                Site officiel source du tracé GPX
              </span>
              <span className="text-xs font-bold text-stone-900 truncate block">
                {route.sourceLabel || 'Site officiel'}
              </span>
            </div>
          </div>
          {route.sourceUrl && (
            <a
              href={route.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Ouvrir le site source officiel du tracé"
            >
              <span>Consulter</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mb-0.5">
            Distance
          </span>
          <span className="text-sm font-extrabold text-stone-900">
            {trace ? (trace.distance / 1000).toFixed(1) : '--'}
            <span className="text-[10px] text-stone-500 ml-0.5 font-semibold">km</span>
          </span>
        </div>

        <div className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mb-0.5">
            Dénivelé D+
          </span>
          <span className="text-sm font-extrabold text-emerald-700">
            {route.elevationGain}
            <span className="text-[10px] text-stone-500 ml-0.5 font-semibold">m</span>
          </span>
        </div>

        <div className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mb-0.5">
            Durée estim.
          </span>
          <span className="text-sm font-extrabold text-stone-900">
            {trace
              ? `${Math.floor(trace.duration / 3600)}h${String(
                  Math.round((trace.duration % 3600) / 60)
                ).padStart(2, '0')}`
              : '--'}
          </span>
        </div>
      </div>

      {/* Road Breakdown & Traffic Safety (Wording adapted strictly to activity) */}
      {route.roadBreakdown && (
        <section className="bg-stone-50/80 p-3 rounded-xl border border-stone-200 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-orange-500" />
              Sécurité & Trafic routier
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                route.roadBreakdown.safetyRating === 'maximal'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : route.roadBreakdown.safetyRating === 'high'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {route.roadBreakdown.carFreePercentage}% sans voiture
            </span>
          </div>

          {/* Segmented color bar */}
          <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-emerald-600 transition-all"
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
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-200/60">
            <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span>Voie sans voiture</span>
              </div>
              <div className="text-emerald-700 font-extrabold text-sm mt-0.5">
                {route.roadBreakdown.carFreeKm} km
                <span className="text-[10px] font-normal text-emerald-600 ml-1">
                  ({route.roadBreakdown.carFreePercentage}%)
                </span>
              </div>
              <div className="text-[10px] text-emerald-800/80 mt-0.5 leading-tight">
                {activity === 'hike'
                  ? 'Sentiers pédestres, chemins de terre & voies sans voiture'
                  : 'Voies vertes, pistes cyclables & sentiers réservés'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-orange-50/70 border border-orange-200/80">
              <div className="flex items-center gap-1.5 font-bold text-orange-950 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span>Route partagée</span>
              </div>
              <div className="text-orange-700 font-extrabold text-sm mt-0.5">
                {route.roadBreakdown.sharedRoadKm} km
                <span className="text-[10px] font-normal text-orange-600 ml-1">
                  ({route.roadBreakdown.sharedRoadPercentage}%)
                </span>
              </div>
              <div className="text-[10px] text-orange-800/80 mt-0.5 leading-tight">
                Petites routes ouvertes à la circulation automobile
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Highlights */}
      {route.highlights && route.highlights.length > 0 && (
        <section className="bg-stone-50/70 p-3 rounded-xl border border-stone-100">
          <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1.5">
            Points d'intérêt & Atouts
          </h3>
          <ul className="space-y-1">
            {route.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-xs text-stone-700 items-start">
                <span className="text-emerald-600 font-bold leading-none mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Personal Rating & Field Notes */}
      <section className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/70 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Votre avis personnel :
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setPendingRating(star)}
                className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                title={`Attribuer ${star} étoile(s)`}
              >
                <Star
                  className={`w-4 h-4 ${
                    pendingRating >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-300 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={pendingNotes}
            onChange={(e) => setPendingNotes(e.target.value)}
            placeholder="Notes de terrain personnelles (ex: vue panoramique au km 6, fontaine d'eau potable, passages ombragés...)"
            rows={2}
            className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-stone-800 placeholder:text-stone-400 resize-none"
          />
        </div>
      </section>

      {/* Roadbook / Turn-by-Turn Accordion */}
      {route.instructions && route.instructions.length > 0 && (
        <section className="border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRoadbook(!showRoadbook)}
            className="w-full px-3 py-2 bg-stone-50 hover:bg-stone-100 flex items-center justify-between text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
              Feuille de route ({route.instructions.length} étapes)
            </span>
            <ChevronRight
              className={`w-4 h-4 text-stone-400 transition-transform ${
                showRoadbook ? 'rotate-90' : ''
              }`}
            />
          </button>
          {showRoadbook && (
            <div className="p-3 bg-white space-y-2 max-h-48 overflow-y-auto text-xs">
              {route.instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-2 text-stone-600">
                  <span className="font-mono font-bold text-[10px] text-emerald-700 shrink-0 w-12 text-right">
                    {inst.distanceKm} km
                  </span>
                  <span>{inst.text}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Action Buttons: Reverse, Export GPX, Save Favorite */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onReverseRoute}
          className="w-full py-2 px-3 border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          title="Inverser le sens de parcours du circuit"
        >
          <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
          <span>Inverser le sens du circuit</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportGPX}
            className="py-2.5 px-3 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Exporter au format GPX pour GPS Garmin / Wahoo / Komoot"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter GPX</span>
          </button>

          <button
            onClick={() => onSaveFavorite(pendingRating, pendingNotes)}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="Enregistrer ce tracé dans vos favoris"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-1.5 text-stone-500 hover:text-stone-800 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>Partager ce parcours</span>
        </button>
      </div>
    </div>
  );
}
