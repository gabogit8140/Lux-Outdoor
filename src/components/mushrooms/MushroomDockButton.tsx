import React from 'react';
import { isMushroomSeasonInLuxembourg, type MushroomSpot } from '../../types/mushroom';
import { TOUCH_MAP_BUTTON_CLASS } from '../../lib/layout/touchDimensions';

interface MushroomDockButtonProps {
  isSpottingMode: boolean;
  onToggleSpottingMode?: () => void;
  mushroomSpots?: MushroomSpot[];
}

/**
 * Bouton d'action pour activer le repérage de coins à champignons.
 * Conditionné strictement par la saison mycologique au Luxembourg (Avril-Mai & Août-Novembre).
 */
export function MushroomDockButton({
  isSpottingMode,
  onToggleSpottingMode,
  mushroomSpots,
}: MushroomDockButtonProps) {
  if (!isMushroomSeasonInLuxembourg() || !onToggleSpottingMode) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggleSpottingMode}
      className={`${TOUCH_MAP_BUTTON_CLASS} relative group transition-all ${
        isSpottingMode
          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-orange-400 shadow-orange-600/35 ring-2 ring-orange-400/50 scale-105'
          : 'text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 border-white/80 dark:border-slate-700/80 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40'
      }`}
      title={
        isSpottingMode
          ? 'Mode repérage actif — Cliquez sur la carte pour poser un coin'
          : 'Saison mycologique active : Spotter un coin à champignons sur la carte'
      }
      aria-label="Spotter un coin à champignons"
    >
      <span className="text-base leading-none">🍄</span>
      {mushroomSpots && mushroomSpots.length > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
          {mushroomSpots.length}
        </span>
      )}
    </button>
  );
}
