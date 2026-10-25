import React from 'react';
import { checkHuntingSeason } from '../../lib/safety/huntingService';
import { HuntingRifleIcon } from '../ui/HuntingRifleIcon';
import { TOUCH_MAP_BUTTON_CLASS } from '../../lib/layout/touchDimensions';

interface HuntingBattuesDockButtonProps {
  showHuntingBattues: boolean;
  onToggleHuntingBattues?: () => void;
}

/**
 * Bouton d'action direct pour afficher/masquer les battues de chasse sur la carte.
 * Conditionné strictement par la saison officielle de chasse / battues au Luxembourg
 * (Octobre à fin Février). Hors-saison, le bouton n'apparaît pas sur la carte,
 * exactement comme le bouton des champignons hors saison mycologique.
 */
export function HuntingBattuesDockButton({
  showHuntingBattues,
  onToggleHuntingBattues,
}: HuntingBattuesDockButtonProps) {
  const { isHuntingSeason } = checkHuntingSeason();

  if (!isHuntingSeason || !onToggleHuntingBattues) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggleHuntingBattues}
      className={`${TOUCH_MAP_BUTTON_CLASS} relative group transition-all ${
        showHuntingBattues
          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 shadow-amber-600/35 ring-2 ring-amber-400/60 scale-105'
          : 'bg-white/95 dark:bg-slate-900/95 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 border-white/80 dark:border-slate-700/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-400/60'
      }`}
      title={
        showHuntingBattues
          ? 'Battues de chasse activées — Cliquer pour désactiver'
          : 'Saison de chasse active : Consulter les dates & zones de battues (Geoportail.lu)'
      }
      aria-label="Afficher ou masquer les battues de chasse"
    >
      <HuntingRifleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
      {showHuntingBattues && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}
    </button>
  );
}
