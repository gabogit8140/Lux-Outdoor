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
        { id: 'short', label: '< 30 km', sub: 'Balade rapide (1h)', range: [15, 30], icon: '⚡' },
        { id: 'medium', label: '30–55 km', sub: 'Sortie classique (2h)', range: [30, 55], icon: '🚴' },
        { id: 'long', label: '55–85 km', sub: 'Sportive & D+ (3h30)', range: [55, 85], icon: '⛰️' },
        { id: 'epic', label: '85+ km', sub: 'Grande aventure', range: [85, 120], icon: '🏆' },
        { id: 'all', label: 'Toutes', sub: '15 à 120 km', range: [15, 120], icon: '🌐' },
      ]
    : [
        { id: 'all', label: 'Toutes', sub: '3 à 35 km (vue globale)', range: [3, 35], icon: '🌐' },
        { id: 'standard', label: '5–18 km', sub: 'Classique & demi-journée (défaut)', range: [5, 18], icon: '🥾' },
        { id: 'short', label: '< 7 km', sub: 'Promenade courte (1h)', range: [3, 7], icon: '🌿' },
        { id: 'long', label: '7–12 km', sub: 'Auto-pédestres officiels', range: [7, 12], icon: '⛰️' },
        { id: 'epic', label: '18+ km', sub: 'Grande rando / Trail', range: [18, 35], icon: '🏃' },
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
        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1.5">
          <span>Sélection rapide au doigt</span>
          <span className="text-emerald-700 font-extrabold text-xs">
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
                className={`py-2 px-2.5 rounded-xl text-left border transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-700/25 ring-1 ring-emerald-500'
                    : 'bg-stone-50/90 border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs truncate">
                    {preset.icon && <span className="mr-1">{preset.icon}</span>}
                    {preset.label}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </div>
                {!compact && (
                  <p
                    className={`text-[10px] mt-0.5 truncate ${
                      isSelected ? 'text-emerald-100' : 'text-stone-400'
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
        <div className="relative h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-200"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(4, maxPercent - minPercent)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 font-medium px-0.5">
          <span>{minLimit} km</span>
          <span className="text-stone-500 font-semibold">
            Étendue : {currentMax - currentMin} km
          </span>
          <span>{maxLimit} km</span>
        </div>
      </div>

      {/* Touch Steppers: Large, comfortable 44px thumb-friendly targets */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* Min Stepper */}
        <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block text-center mb-1">
            Distance Min
          </span>
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleAdjustMin(-step)}
              disabled={currentMin <= minLimit}
              className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs text-stone-700 flex items-center justify-center hover:bg-stone-50 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
              aria-label="Diminuer la distance minimum"
            >
              <Minus className="w-4 h-4 text-stone-600" />
            </button>
            <div className="text-center font-extrabold text-stone-900 text-sm sm:text-base min-w-[50px]">
              {currentMin} <span className="text-xs font-semibold text-stone-400">km</span>
            </div>
            <button
              type="button"
              onClick={() => handleAdjustMin(step)}
              disabled={currentMin >= currentMax - step}
              className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs text-stone-700 flex items-center justify-center hover:bg-stone-50 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
              aria-label="Augmenter la distance minimum"
            >
              <Plus className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        {/* Max Stepper */}
        <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block text-center mb-1">
            Distance Max
          </span>
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleAdjustMax(-step)}
              disabled={currentMax <= currentMin + step}
              className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs text-stone-700 flex items-center justify-center hover:bg-stone-50 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
              aria-label="Diminuer la distance maximum"
            >
              <Minus className="w-4 h-4 text-stone-600" />
            </button>
            <div className="text-center font-extrabold text-stone-900 text-sm sm:text-base min-w-[50px]">
              {currentMax} <span className="text-xs font-semibold text-stone-400">km</span>
            </div>
            <button
              type="button"
              onClick={() => handleAdjustMax(step)}
              disabled={currentMax >= maxLimit}
              className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs text-stone-700 flex items-center justify-center hover:bg-stone-50 hover:border-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
              aria-label="Augmenter la distance maximum"
            >
              <Plus className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
