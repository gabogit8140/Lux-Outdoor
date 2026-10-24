import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import type { RouteSuggestions, RouteTrace } from '../types';
import { Mountain, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, ShieldAlert, Car, Globe, ExternalLink, MapPin, Eye, EyeOff, X } from 'lucide-react';
import { getHuntingSafetyInfo } from '../lib/safety/huntingService';

interface TraceProfileProps {
  route: RouteSuggestions;
  trace: RouteTrace;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onHoverDistance?: (distanceKm: number | null) => void;
  isTraceVisible?: boolean;
  onToggleTraceVisibility?: () => void;
  onDeselect?: () => void;
}

export function TraceProfile({
  route,
  trace,
  isOpen,
  onClose,
  onOpen,
  onHoverDistance,
  isTraceVisible = true,
  onToggleTraceVisibility,
  onDeselect,
}: TraceProfileProps) {
  const profile = trace.elevationProfile || [];
  const huntingInfo = getHuntingSafetyInfo({
    country: route.country,
    coords: route.waypoints,
    regionName: route.regionName,
  });

  if (!isOpen) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto max-w-[95vw]">
        <button
          onClick={onOpen}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-3.5 sm:px-4 py-2 rounded-full shadow-[0_10px_30px_-5px_rgba(15,23,42,0.2)] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 sm:gap-2.5 hover:bg-white dark:hover:bg-slate-900 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all border border-white/70 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 active:scale-98 group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <Mountain className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[200px]">
            {route.title}
          </span>
          {route.roadBreakdown && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold font-mono-kpi whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {route.roadBreakdown.carFreePercentage}% sans voiture
            </span>
          )}
          <span className="text-[11px] font-bold font-mono-kpi text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
            +{route.elevationGain}m D+
          </span>
          {onToggleTraceVisibility && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggleTraceVisibility();
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0"
              title={
                isTraceVisible
                  ? 'Masquer la trace pour voir les routes dessous'
                  : 'Afficher la trace sur la carte'
              }
            >
              {isTraceVisible ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
            </span>
          )}
          {onDeselect && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDeselect();
              }}
              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full text-slate-400 hover:text-rose-600 transition-colors shrink-0"
              title="Enlever la sélection (fermer)"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
        </button>
      </div>
    );
  }

  const elevGain = route.elevationGain || 0;
  const elevLoss = route.elevationLoss || elevGain;
  const minElev =
    route.minElevation ?? (profile.length > 0 ? Math.min(...profile.map((p) => p.elevation)) : 0);
  const maxElev =
    route.maxElevation ?? (profile.length > 0 ? Math.max(...profile.map((p) => p.elevation)) : 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[400] bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl shadow-[0_-12px_40px_-10px_rgba(15,23,42,0.2)] border-t border-slate-200/80 dark:border-slate-800 transition-all duration-300 p-2.5 sm:p-3 md:p-4 max-h-[48vh] sm:max-h-[50vh] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mountain className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs md:max-w-sm">
                {route.title}
              </h3>
              {route.sourceUrl && (
                <a
                  href={route.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold transition-colors shrink-0"
                  title={`Fiche officielle : ${route.sourceLabel || route.sourceUrl}`}
                >
                  <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate max-w-[130px]">
                    {route.sourceLabel?.split(':')[0]?.trim() || 'Fiche officielle'}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
              {huntingInfo.officialMapUrl && (
                <a
                  href={huntingInfo.officialMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold transition-colors shrink-0"
                  title={`Vérifier les battues : ${huntingInfo.officialMapLabel}`}
                >
                  <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Battues ({huntingInfo.country})</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
              {route.geoportailUrl && (
                <a
                  href={route.geoportailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition-colors shrink-0"
                  title="Ouvrir le tracé dans la carte cadastrale Geoportail.lu"
                >
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Geoportail</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0 font-mono-kpi">
            {route.roadBreakdown && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {route.roadBreakdown.carFreePercentage}% sans voiture
              </span>
            )}
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{elevGain}m
            </span>
            <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" /> -{elevLoss}m
            </span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">
              Min: {minElev}m · Max: {maxElev}m
            </span>

            {onToggleTraceVisibility && (
              <button
                onClick={onToggleTraceVisibility}
                className={`px-2.5 py-1 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all border cursor-pointer ml-1 ${
                  isTraceVisible
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-xs font-extrabold'
                }`}
                title={
                  isTraceVisible
                    ? 'Masquer la trace pour voir les routes dessous'
                    : 'Afficher la trace sur la carte'
                }
              >
                {isTraceVisible ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-white" />
                )}
                <span className="hidden sm:inline">
                  {isTraceVisible ? 'Masquer la trace' : 'Afficher la trace'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-0.5 cursor-pointer"
              title="Réduire"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {onDeselect && (
              <button
                onClick={onDeselect}
                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Enlever la trace sélectionnée"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Chart & Surface / Road type layout */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-stretch">
          {/* Elevation Area Chart */}
          <div className="flex-1 h-28 md:h-36 relative">
            <ResponsiveContainer key={`profile-container-${route.id}-${(trace as any)?.reverseKey || 0}`} width="100%" height="100%">
              <AreaChart
                data={profile}
                margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0 && onHoverDistance) {
                    onHoverDistance(e.activePayload[0].payload.distance);
                  }
                }}
                onTouchMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0 && onHoverDistance) {
                    onHoverDistance(e.activePayload[0].payload.distance);
                  }
                }}
                onTouchStart={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0 && onHoverDistance) {
                    onHoverDistance(e.activePayload[0].payload.distance);
                  }
                }}
                onMouseLeave={() => {
                  if (onHoverDistance) onHoverDistance(null);
                }}
                onTouchEnd={() => {
                  if (onHoverDistance) onHoverDistance(null);
                }}
              >
                <defs>
                  <linearGradient id={`colorElevation-${route.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="55%" stopColor="#0d9488" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="distance"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.4 }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${val}km`}
                />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isCarFreeRatio = (route.roadBreakdown?.carFreePercentage || 75) / 100;
                      const totalDistKm = trace.distance / 1000 || 1;
                      const curDist = data.distance;
                      const isRoad =
                        curDist < totalDistKm * ((1 - isCarFreeRatio) * 0.45) ||
                        curDist > totalDistKm * (1 - (1 - isCarFreeRatio) * 0.55);

                      return (
                        <div className="bg-slate-900/95 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl backdrop-blur-md border border-slate-700/80 font-mono-kpi">
                          <p className="font-bold text-emerald-400">
                            {data.elevation} m d'altitude
                          </p>
                          <p className="text-slate-300">Distance : {data.distance} km</p>
                          {data.slope !== undefined && (
                            <p className="text-slate-400">Pente : {data.slope}%</p>
                          )}
                          <p
                            className={`text-[10px] font-sans font-bold mt-1 ${
                              isRoad ? 'text-amber-400' : 'text-emerald-300'
                            }`}
                          >
                            {isRoad
                              ? '🚗 Route partagée avec voitures'
                              : '🌿 Voie sans voiture (protégée)'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  key={`area-${route.id}`}
                  type="monotone"
                  dataKey="elevation"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#colorElevation-${route.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic & Surface Breakdown Panel */}
          <div className="w-full md:w-64 shrink-0 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-center gap-2">
            {/* Road traffic breakdown */}
            {route.roadBreakdown && (
              <div className="space-y-1 pb-1.5 border-b border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3 text-orange-500" />
                    Partage de voirie
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono-kpi">
                    {route.roadBreakdown.carFreePercentage}% sans voiture
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-2xs">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${route.roadBreakdown.carFreePercentage}%` }}
                    title={`Voie sans voiture : ${route.roadBreakdown.carFreeKm} km`}
                  />
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${route.roadBreakdown.sharedRoadPercentage}%` }}
                    title={`Route avec voitures : ${route.roadBreakdown.sharedRoadKm} km`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono-kpi">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    🌿 {route.roadBreakdown.carFreeKm} km
                  </span>
                  <span className="text-orange-700 dark:text-orange-400 font-semibold">
                    🚗 {route.roadBreakdown.sharedRoadKm} km
                  </span>
                </div>
              </div>
            )}

            {/* Surface Breakdown */}
            {route.surfaceDistribution && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">Revêtement ({route.surfaceType})</span>
                </div>
                {route.surfaceDistribution.slice(0, 2).map((surf, i) => (
                  <div key={i} className="text-[11px]">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium mb-0.5">
                      <span className="truncate pr-1 text-[10px]">{surf.type}</span>
                      <span className="font-bold font-mono-kpi text-slate-800 dark:text-slate-100 shrink-0 text-[10px]">
                        {surf.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${surf.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
