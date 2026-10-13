import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import type { RouteSuggestions, RouteTrace } from '../types';
import { Mountain, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, Car, Globe, ExternalLink } from 'lucide-react';

interface TraceProfileProps {
  route: RouteSuggestions;
  trace: RouteTrace;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onHoverDistance?: (distanceKm: number | null) => void;
}

export function TraceProfile({
  route,
  trace,
  isOpen,
  onClose,
  onOpen,
  onHoverDistance,
}: TraceProfileProps) {
  const profile = trace.elevationProfile || [];

  if (!isOpen) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto max-w-[95vw]">
        <button
          onClick={onOpen}
          className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full shadow-xl text-xs font-semibold text-stone-700 flex items-center gap-2 sm:gap-2.5 hover:bg-white hover:text-emerald-700 transition-all border border-stone-200/90 hover:shadow-2xl hover:border-emerald-300 active:scale-98 group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Mountain className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-stone-900 truncate max-w-[120px] sm:max-w-[200px]">
            {route.title}
          </span>
          {route.roadBreakdown && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              {route.roadBreakdown.carFreePercentage}% sans voiture
            </span>
          )}
          <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            {route.elevationGain}m D+
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-colors shrink-0" />
        </button>
      </div>
    );
  }

  const elevGain = route.elevationGain || 0;
  const elevLoss = route.elevationLoss || elevGain;
  const minElev = route.minElevation ?? (profile.length > 0 ? Math.min(...profile.map((p) => p.elevation)) : 0);
  const maxElev = route.maxElevation ?? (profile.length > 0 ? Math.max(...profile.map((p) => p.elevation)) : 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[400] bg-white/95 backdrop-blur-md shadow-[0_-10px_35px_-10px_rgba(0,0,0,0.15)] border-t border-stone-200 transition-all duration-300 p-2.5 sm:p-3 md:p-4 max-h-[48vh] sm:max-h-[50vh] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-stone-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Mountain className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-bold text-stone-900 truncate max-w-[150px] sm:max-w-xs md:max-w-sm">
                {route.title}
              </h3>
              {route.sourceUrl && (
                <a
                  href={route.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors shrink-0"
                  title={`Site officiel : ${route.sourceLabel || route.sourceUrl}`}
                >
                  <Globe className="w-3 h-3 text-emerald-700" />
                  <span className="truncate max-w-[110px]">{route.sourceLabel?.split(' ')[0] || 'Source'}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 text-[11px] font-semibold text-stone-600 shrink-0">
            {route.roadBreakdown && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {route.roadBreakdown.carFreePercentage}% sans voiture
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-700">
              <ArrowUpRight className="w-3.5 h-3.5" /> {elevGain}m D+
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <ArrowDownRight className="w-3.5 h-3.5" /> {elevLoss}m D-
            </span>
            <span className="hidden md:inline text-stone-400">|</span>
            <span className="hidden md:inline text-stone-500">
              Min: {minElev}m · Max: {maxElev}m
            </span>

            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors ml-1"
              title="Réduire"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Chart & Surface / Road type layout */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-stretch">
          {/* Elevation Area Chart */}
          <div className="flex-1 h-28 md:h-36 relative">
            <ResponsiveContainer key={`profile-container-${route.id}`} width="100%" height="100%">
              <AreaChart
                data={profile}
                margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0 && onHoverDistance) {
                    onHoverDistance(e.activePayload[0].payload.distance);
                  }
                }}
                onMouseLeave={() => {
                  if (onHoverDistance) onHoverDistance(null);
                }}
              >
                <defs>
                  <linearGradient id={`colorElevation-${route.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="distance"
                  tickLine={false}
                  axisLine={{ stroke: '#e7e5e4' }}
                  tick={{ fill: '#78716c', fontSize: 10 }}
                  tickFormatter={(val) => `${val}km`}
                />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#78716c', fontSize: 10 }}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isCarFreeRatio = (route.roadBreakdown?.carFreePercentage || 75) / 100;
                      const totalDistKm = (trace.distance / 1000) || 1;
                      const curDist = data.distance;
                      const isRoad = curDist < totalDistKm * ((1 - isCarFreeRatio) * 0.45) || curDist > totalDistKm * (1 - (1 - isCarFreeRatio) * 0.55);

                      return (
                        <div className="bg-stone-900/90 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg backdrop-blur-xs border border-stone-800">
                          <p className="font-bold text-emerald-400">{data.elevation} m d'altitude</p>
                          <p className="text-stone-300">Distance: {data.distance} km</p>
                          {data.slope !== undefined && (
                            <p className="text-stone-400">Pente: {data.slope}%</p>
                          )}
                          <p className={`text-[10px] font-bold mt-0.5 ${isRoad ? 'text-amber-400' : 'text-emerald-300'}`}>
                            {isRoad ? '🚗 Route partagée avec voitures' : '🌿 Voie sans voiture (protégée)'}
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
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#colorElevation-${route.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic & Surface Breakdown Panel */}
          <div className="w-full md:w-64 shrink-0 bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/80 flex flex-col justify-center gap-2">
            {/* Road traffic breakdown */}
            {route.roadBreakdown && (
              <div className="space-y-1 pb-1.5 border-b border-stone-200">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3 text-orange-500" />
                    Partage de voirie
                  </span>
                  <span className="text-emerald-700 font-extrabold">
                    {route.roadBreakdown.carFreePercentage}% sans voiture
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden flex shadow-2xs">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${route.roadBreakdown.carFreePercentage}%` }}
                    title={`Voie sans voiture : ${route.roadBreakdown.carFreeKm} km`}
                  />
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${route.roadBreakdown.sharedRoadPercentage}%` }}
                    title={`Route avec voitures : ${route.roadBreakdown.sharedRoadKm} km`}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-emerald-800 font-semibold">
                    🌿 {route.roadBreakdown.carFreeKm} km (sans voiture)
                  </span>
                  <span className="text-orange-800 font-semibold">
                    🚗 {route.roadBreakdown.sharedRoadKm} km (avec voitures)
                  </span>
                </div>
              </div>
            )}

            {/* Surface Breakdown */}
            {route.surfaceDistribution && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  <Layers className="w-3 h-3 text-emerald-600" />
                  Revêtement ({route.surfaceType})
                </div>
                {route.surfaceDistribution.slice(0, 2).map((surf, i) => (
                  <div key={i} className="text-[11px]">
                    <div className="flex justify-between text-stone-600 font-medium mb-0.5">
                      <span className="truncate pr-1 text-[10px]">{surf.type}</span>
                      <span className="font-bold text-stone-800 shrink-0 text-[10px]">{surf.percentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
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
