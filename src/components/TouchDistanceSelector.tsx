import React from 'react';
import { Minus, Plus, Sparkles, Compass } from 'lucide-react';

interface TouchDistanceSelectorProps {
  activity: 'bike' | 'hike';
  distance: [number, number];
  onChange: (distance: [number, number]) => void;
  compact?: boolean;
}

interface Preset {
  id: string;
  label: string;
  sub: string;
  range: [number, number];
  icon?: string;
}

export function TouchDistanceSelector({
  activity,
  distance,
  onChange,
  compact = false,
}: TouchDistanceSelectorProps) {
  const isBike = activity === 'bike';
  const minLimit = isBike ? 15 : 3;
  const maxLimit = isBike ? 120 : 35;
  const step = isBike ? 5 : 1;

  const presets: Preset[] = isBike
    ? [
        { id: 'default', label: '45–60 km', sub: 'Sortie classique (défaut)', range: [45, 60], icon: '🚴' },
        { id: 'short', label: '< 30 km', sub: 'Balade rapide (1h)', range: [15, 30], icon: '⚡' },
        { id: 'medium', label: '30–45 km', sub: 'Sortie modérée (2h)', range: [30, 45], icon: '🌿' },
        { id: 'long', label: '60–85 km', sub: 'Sportive & D+ (3h30)', range: [60, 85], icon: '⛰️' },
        { id: 'epic', label: '85+ km', sub: 'Grande aventure', range: [85, 120], icon: '🏆' },
        { id: 'all', label: 'Toutes', sub: '15 à 120 km', range: [15, 120], icon: '🌐' },
      ]
    : [
        { id: 'default', label: '7–10 km', sub: 'Rando classique (défaut)', range: [7, 10], icon: '🥾' },
        { id: 'short', label: '< 7 km', sub: 'Promenade courte (1h)', range: [3, 7], icon: '🌿' },
        { id: 'medium', label: '10–15 km', sub: 'Demi-journée (3h)', range: [10, 15], icon: '⛰️' },
        { id: 'long', label: '15–22 km', sub: 'Rando sportive', range: [15, 22], icon: '🧭' },
        { id: 'epic', label: '22+ km', sub: 'Grande rando / Trail', range: [22, 35], icon: '🏃' },
        { id: 'all', label: 'Toutes', sub: '3 à 35 km (vue globale)', range: [3, 35], icon: '🌐' },
      ];

  const currentMin = distance[0];
  const currentMax = distance[1];

  const handleAdjustMin = (delta: number) => {
    const nextMin = Math.max(minLimit, Math.min(currentMax - step, currentMin + delta));
    onChange([nextMin, currentMax]);
  };

  const handleAdjustMax = (delta: number) => {
    const nextMax = Math.min(maxLimit, Math.max(currentMin + step, currentMax + delta));
    onChange([currentMin, nextMax]);
  };

  // Percentage calculations for visual track
  const minPercent = Math.max(0, Math.min(100, ((currentMin - minLimit) / (maxLimit - minLimit)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((currentMax - minLimit) / (maxLimit - minLimit)) * 100));

  return (
    <div className="space-y-3 select-none">
      {/* Visual Quick Presets for 1-tap mobile selection */}
      <div>
        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
          <span>Sélection rapide au doigt</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono-kpi text-xs">
            {currentMin} km – {currentMax} km
          </span>
        </div>

        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'} gap-1.5`}>
          {presets.map((preset) => {
            const isSelected = currentMin === preset.range[0] && currentMax === preset.range[1];
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.range)}
                className={`py-2 px-2.5 rounded-xl text-left border transition-all active:scale-[0.98] cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25 ring-1 ring-emerald-500/40'
                    : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold font-mono-kpi text-xs truncate">
                    {preset.icon && <span className="mr-1 font-sans">{preset.icon}</span>}
                    {preset.label}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </div>
                {!compact && (
                  <p
                    className={`text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {preset.sub}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Range Indicator Bar */}
      <div className="space-y-1">
        <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700">
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-200"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(4, maxPercent - minPercent)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono-kpi px-0.5">
          <span>{minLimit} km</span>
          <span className="text-slate-500 dark:text-slate-400 font-semibold">
            Étendue : {currentMax - currentMin} km
          </span>
          <span>{maxLimit} km</span>
        </div>
      </div>

      {/* Touch Steppers: Large, comfortable 44px thumb-friendly targets */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* Min Stepper */}
        <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center mb-1">
            Distance Min
          </span>
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleAdjustMin(-step)}
              disabled={currentMin <= minLimit}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
              aria-label="Diminuer la distance minimum"
            >
              <Minus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center font-extrabold font-mono-kpi text-slate-900 dark:text-white text-sm sm:text-base min-w-[50px]">
              {currentMin} <span className="text-xs font-semibold text-slate-400">km</span>
            </div>
            <button
              type="button"
              onClick={() => handleAdjustMin(step)}
              disabled={currentMin >= currentMax - step}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
              aria-label="Augmenter la distance minimum"
            >
              <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Max Stepper */}
        <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center mb-1">
            Distance Max
          </span>
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleAdjustMax(-step)}
              disabled={currentMax <= currentMin + step}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
              aria-label="Diminuer la distance maximum"
            >
              <Minus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="text-center font-extrabold font-mono-kpi text-slate-900 dark:text-white text-sm sm:text-base min-w-[50px]">
              {currentMax} <span className="text-xs font-semibold text-slate-400">km</span>
            </div>
            <button
              type="button"
              onClick={() => handleAdjustMax(step)}
              disabled={currentMax >= maxLimit}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
              aria-label="Augmenter la distance maximum"
            >
              <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
