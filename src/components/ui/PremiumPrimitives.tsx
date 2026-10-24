import React from 'react';
import type { ElevationPoint } from '../../types';

export function getCountryFlag(country?: string): string {
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
}

/**
 * Semantic outdoor trail color scale based on route physical difficulty & relief intensity (D+/km).
 * Matches international trail grading (Green = Easy, Blue = Moderate, Orange = Hard, Red = Expert).
 */
export const ROUTE_DIFFICULTY_LEGEND = [
  {
    level: 'easy' as const,
    label: 'Facile',
    subLabel: 'Relief doux',
    color: '#059669', // Emerald Green
  },
  {
    level: 'moderate' as const,
    label: 'Modéré',
    subLabel: 'Vallonné',
    color: '#2563eb', // Royal Blue
  },
  {
    level: 'hard' as const,
    label: 'Sportif',
    subLabel: 'Dénivelé soutenu',
    color: '#ea580c', // Burnt Orange
  },
  {
    level: 'expert' as const,
    label: 'Expert',
    subLabel: 'Escarpé / exigeant',
    color: '#dc2626', // Crimson Red
  },
] as const;

export function getSemanticRouteColor(difficultyLevel?: 'easy' | 'moderate' | 'hard' | 'expert'): string {
  switch (difficultyLevel) {
    case 'easy':
      return '#059669';
    case 'moderate':
      return '#2563eb';
    case 'hard':
      return '#ea580c';
    case 'expert':
      return '#dc2626';
    default:
      return '#2563eb';
  }
}

/**
 * Renders a compact, high-precision SVG elevation sparkline for route catalog cards.
 */
export function MiniElevationSparkline({
  profile,
  id = 'default',
  color,
  isSelected = false,
}: {
  profile?: ElevationPoint[];
  id?: string;
  color?: string;
  isSelected?: boolean;
}) {
  if (!profile || profile.length < 2) return null;

  const width = 78;
  const height = 26;
  const elevations = profile.map((p) => p.elevation);
  const minE = Math.min(...elevations);
  const maxE = Math.max(...elevations);
  const range = Math.max(15, maxE - minE);

  const points = profile.map((p, idx) => {
    const x = (idx / (profile.length - 1)) * width;
    const y = height - 3 - ((p.elevation - minE) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const strokeColor = isSelected ? '#059669' : color || '#10b981';
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const gradId = `spark-grad-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible shrink-0"
      aria-label="Profil altimétrique miniature"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={strokeColor}
            stopOpacity={isSelected ? 0.45 : 0.28}
          />
          <stop
            offset="100%"
            stopColor={strokeColor}
            stopOpacity={0.0}
          />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * High-density telemetry KPI card for RouteDetailView and Analytics panels.
 */
export function KpiTelemetryCard({
  label,
  value,
  unit,
  subLabel,
  accent = 'default',
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  subLabel?: string;
  accent?: 'default' | 'emerald' | 'indigo' | 'amber';
  icon?: React.ReactNode;
}) {
  const valueColors = {
    default: 'text-slate-900 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xs flex flex-col justify-between transition-all hover:border-emerald-300 dark:hover:border-emerald-700/60">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[9px] text-slate-400 dark:text-slate-400 uppercase tracking-wider font-extrabold">
          {label}
        </span>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-base font-extrabold tracking-tight tabular-nums ${valueColors[accent]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-0.5">
            {unit}
          </span>
        )}
      </div>
      {subLabel && (
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
          {subLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Interactive elevation profile chart for the right-hand sidebar (RouteDetailView).
 * Syncs hovered distance along the profile with the orange cursor pin on the map.
 */
export function SidebarElevationChart({
  profile,
  routeId,
  color = '#059669',
  elevationGain,
  minElevation,
  maxElevation,
  onHoverDistance,
}: {
  profile?: ElevationPoint[];
  routeId: string;
  color?: string;
  elevationGain: number;
  minElevation?: number;
  maxElevation?: number;
  onHoverDistance?: (distanceKm: number | null) => void;
}) {
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  if (!profile || profile.length < 2) return null;

  const elevations = profile.map((p) => p.elevation);
  const minE = minElevation ?? Math.min(...elevations);
  const maxE = maxElevation ?? Math.max(...elevations);
  const range = Math.max(20, maxE - minE);

  const width = 320;
  const height = 96;
  const padTop = 12;
  const padBottom = 18;
  const chartH = height - padTop - padBottom;

  const coords = profile.map((p, idx) => {
    const x = (idx / (profile.length - 1)) * width;
    const y = padTop + chartH - ((p.elevation - minE) / range) * chartH;
    return { x, y, pt: p };
  });

  const linePath = `M ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ')}`;
  const areaPath = `${linePath} L ${width},${padTop + chartH} L 0,${padTop + chartH} Z`;
  const gradId = `sidebar-elev-grad-${routeId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const hoveredPoint = hoverIdx !== null && coords[hoverIdx] ? coords[hoverIdx] : null;

  const handlePointerScrub = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.min(profile.length - 1, Math.max(0, Math.round(ratio * (profile.length - 1))));
    setHoverIdx(idx);
    if (onHoverDistance) {
      onHoverDistance(profile[idx].distance);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    handlePointerScrub(e.clientX, e.currentTarget);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons > 0 || e.pointerType === 'mouse') {
      handlePointerScrub(e.clientX, e.currentTarget);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignorer si non capturé
    }
    setHoverIdx(null);
    if (onHoverDistance) {
      onHoverDistance(null);
    }
  };

  return (
    <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span>Profil altimétrique</span>
        </span>
        <div className="flex items-center gap-2 font-mono-kpi font-bold text-slate-600 dark:text-slate-300">
          {hoveredPoint ? (
            <span className="text-amber-600 dark:text-amber-400 font-extrabold">
              km {hoveredPoint.pt.distance.toFixed(1)} · {hoveredPoint.pt.elevation}m
              {hoveredPoint.pt.slope !== undefined && hoveredPoint.pt.slope !== 0
                ? ` (${hoveredPoint.pt.slope > 0 ? '+' : ''}${hoveredPoint.pt.slope}%)`
                : ''}
            </span>
          ) : (
            <>
              <span>Min {minE}m</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>Max {maxE}m</span>
              <span className="text-emerald-600 dark:text-emerald-400">+{elevationGain}m D+</span>
            </>
          )}
        </div>
      </div>

      <div className="relative w-full h-24 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.42} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Horizontal reference grid lines */}
          <line
            x1={0}
            y1={padTop}
            x2={width}
            y2={padTop}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700/70"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={padTop + chartH / 2}
            x2={width}
            y2={padTop + chartH / 2}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700/70"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={padTop + chartH}
            x2={width}
            y2={padTop + chartH}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth={1}
          />

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={padTop}
                x2={hoveredPoint.x}
                y2={padTop + chartH}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r={4.5}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
        <div className="flex justify-between text-[9px] font-mono-kpi text-slate-400 dark:text-slate-500 -mt-3.5 px-0.5 pointer-events-none">
          <span>0 km</span>
          <span>{(profile[profile.length - 1]?.distance / 2 || 0).toFixed(1)} km</span>
          <span>{profile[profile.length - 1]?.distance.toFixed(1)} km</span>
        </div>
      </div>
    </div>
  );
}
