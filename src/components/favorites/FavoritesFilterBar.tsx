import React from 'react';
import type { FavoriteCategory } from '../../hooks/useFavorites';

export type FavoritesFilterType = 'all' | 'todo' | 'top' | 'bien' | 'ne_pas_refaire' | 'champignons';

export interface FavoritesCategoryCounts {
  all: number;
  todo: number;
  top: number;
  bien: number;
  avoid: number;
  shrooms: number;
}

interface FavoritesFilterBarProps {
  activeFilter: FavoritesFilterType;
  counts: FavoritesCategoryCounts;
  onSelectFilter: (filter: FavoritesFilterType) => void;
}

/**
 * Barre de filtres horizontale haute densité pour le carnet de favoris.
 * Affiche uniquement les catégories non vides avec protection contre tout retour à la ligne.
 */
export function FavoritesFilterBar({
  activeFilter,
  counts,
  onSelectFilter,
}: FavoritesFilterBarProps) {
  if (counts.all === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-50 dark:bg-slate-900/90 border-b border-stone-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar whitespace-nowrap text-xs">
      <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 shrink-0 mr-1">
        Filtrer :
      </span>

      <button
        type="button"
        onClick={() => onSelectFilter('all')}
        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
          activeFilter === 'all'
            ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
            : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
        }`}
      >
        Tous ({counts.all})
      </button>

      {counts.top > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter('top')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeFilter === 'top'
              ? 'bg-amber-500/15 border-amber-400 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30 border shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
          }`}
        >
          <span>🏆</span>
          <span>Top ({counts.top})</span>
        </button>
      )}

      {counts.bien > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter('bien')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeFilter === 'bien'
              ? 'bg-emerald-500/15 border-emerald-400 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30 border shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
          }`}
        >
          <span>👍</span>
          <span>Bien ({counts.bien})</span>
        </button>
      )}

      {counts.avoid > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter('ne_pas_refaire')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeFilter === 'ne_pas_refaire'
              ? 'bg-rose-500/15 border-rose-400 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30 border shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
          }`}
        >
          <span>⛔</span>
          <span>À éviter ({counts.avoid})</span>
        </button>
      )}

      {counts.shrooms > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter('champignons')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeFilter === 'champignons'
              ? 'bg-orange-500/15 border-orange-400 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/30 border shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
          }`}
        >
          <span>🍄</span>
          <span>Coins ({counts.shrooms})</span>
        </button>
      )}

      {counts.todo > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter('todo')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeFilter === 'todo'
              ? 'bg-blue-500/15 border-blue-400 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/30 border shadow-xs'
              : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
          }`}
        >
          <span>⏳</span>
          <span>À faire ({counts.todo})</span>
        </button>
      )}
    </div>
  );
}
