import React from 'react';
import { Bike } from 'lucide-react';
import { TOUCH_MAP_BUTTON_CLASS } from '../../lib/layout/touchDimensions';

interface CycleNetworkDockButtonProps {
  showNetwork: boolean;
  onToggle: () => void;
}

/**
 * Bouton d'accès direct sur la carte (mode vélo) pour afficher ou masquer
 * l'intégralité du réseau officiel des pistes cyclables, véloroutes,
 * fietssnelwegen et carrefours numérotés (Knooppunten).
 */
export function CycleNetworkDockButton({
  showNetwork,
  onToggle,
}: CycleNetworkDockButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${TOUCH_MAP_BUTTON_CLASS} relative group transition-all ${
        showNetwork
          ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white border-purple-400 shadow-purple-600/35 ring-2 ring-purple-400/60 scale-105'
          : 'bg-white/95 dark:bg-slate-900/95 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 border-white/80 dark:border-slate-700/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-400/60'
      }`}
      title={
        showNetwork
          ? 'Réseau complet des Pistes Cyclables & Véloroutes affiché (Waymarked Trails / EV / PC / Knooppunten) — Cliquer pour masquer'
          : 'Afficher toutes les Pistes Cyclables & Véloroutes (EuroVelo, PC, Fietssnelwegen, Réseau balisé complet)'
      }
      aria-label="Afficher ou masquer toutes les pistes cyclables"
    >
      <Bike className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
      <span
        className={`absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded-full border shadow-xs leading-tight ${
          showNetwork
            ? 'bg-purple-800 text-white border-purple-300'
            : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
        }`}
      >
        PC
      </span>
      {showNetwork && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
        </span>
      )}
    </button>
  );
}
