import React, { useState, useMemo } from 'react';
import {
  X,
  Map as MapIcon,
  ListTodo,
  Cloud,
  Radio,
} from 'lucide-react';
import type { SavedFavorite, FavoriteCategory } from '../hooks/useFavorites';
import type { RouteSuggestions, RouteTrace } from '../types';
import { resolveFavoriteCategory } from '../lib/favorites/favoriteCategories';
import {
  FavoritesFilterBar,
  type FavoritesFilterType,
  type FavoritesCategoryCounts,
} from './favorites/FavoritesFilterBar';
import { FavoriteCard } from './favorites/FavoriteCard';
import { FavoritesSyncTab } from './favorites/FavoritesSyncTab';

interface FavoritesProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: SavedFavorite[];
  onDelete: (id: string) => void;
  onLoad: (route: RouteSuggestions, trace: RouteTrace) => void;
  onUpdateFavorite?: (
    id: string,
    category?: FavoriteCategory | null,
    userNotes?: string,
    hasMushrooms?: boolean,
    userRating?: number
  ) => void;
  pairingCode?: string | null;
  isSyncing?: boolean;
  onConnectPairingCode?: (code?: string) => Promise<{ success: boolean; message: string }>;
  onDisconnectPairing?: () => void;
  initialTab?: TabType;
}

type TabType = 'tracks' | 'sync' | 'todo' | 'rated' | 'favorites';

export function Favorites({
  isOpen,
  onClose,
  favorites,
  onDelete,
  onLoad,
  onUpdateFavorite,
  pairingCode,
  isSyncing,
  onConnectPairingCode,
  onDisconnectPairing,
  initialTab = 'tracks',
}: FavoritesProps) {
  const [activeTab, setActiveTab] = useState<'tracks' | 'sync'>(() =>
    initialTab === 'sync' ? 'sync' : 'tracks'
  );

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'sync' ? 'sync' : 'tracks');
    }
  }, [isOpen, initialTab]);

  const [activeFilter, setActiveFilter] = useState<FavoritesFilterType>('all');

  // Comptage par catégorie pour la barre de filtres
  const counts: FavoritesCategoryCounts = useMemo(() => {
    let todo = 0;
    let top = 0;
    let bien = 0;
    let avoid = 0;
    let shrooms = 0;

    favorites.forEach((fav) => {
      const cat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
      if (fav.hasMushrooms || cat === 'champignons') shrooms++;
      if (cat === 'top') top++;
      else if (cat === 'bien') bien++;
      else if (cat === 'ne_pas_refaire') avoid++;
      else if (!fav.hasMushrooms) todo++;
    });

    return { all: favorites.length, todo, top, bien, avoid, shrooms };
  }, [favorites]);

  // Filtrage direct et unifié des favoris
  const displayedFavorites = useMemo(() => {
    if (activeFilter === 'all') return favorites;
    return favorites.filter((fav) => {
      const cat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
      if (activeFilter === 'todo') {
        return !cat && !fav.hasMushrooms;
      }
      if (activeFilter === 'champignons') {
        return fav.hasMushrooms || cat === 'champignons';
      }
      return cat === activeFilter;
    });
  }, [favorites, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-100 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Bibliothèque & Carnet de terrain
                </h2>
                {pairingCode ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60">
                    <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                    Sync Cloud ({pairingCode})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400">
                    Local
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {favorites.length} {favorites.length > 1 ? 'itinéraires enregistrés' : 'itinéraire enregistré'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Clean Tabs: Mes circuits enregistrés | Synchronisation Cloud & QR Code */}
        <div className="flex border-b border-stone-200 dark:border-slate-800 bg-stone-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'tracks'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 shadow-xs'
                : 'text-stone-600 dark:text-slate-400 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Mes circuits enregistrés</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'tracks'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {favorites.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-xs'
                : 'text-stone-600 dark:text-slate-400 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Synchronisation Cloud & QR Code</span>
            <span className="sm:hidden">Synchro & QR</span>
            {pairingCode && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Filter Bar (uniquement visible quand des circuits existent) */}
        {activeTab === 'tracks' && (
          <FavoritesFilterBar
            activeFilter={activeFilter}
            counts={counts}
            onSelectFilter={setActiveFilter}
          />
        )}

        {/* Tab 1: Mes circuits enregistrés */}
        {activeTab === 'tracks' && (
          <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-3.5">
            {favorites.length === 0 ? (
              <div className="text-center py-12 px-4 text-stone-500 dark:text-slate-400">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 shadow-xs">
                  <MapIcon className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                  Votre carnet de terrain est vide
                </h3>
                <p className="text-xs mt-1.5 text-stone-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Sélectionnez ou créez un parcours sur la carte, puis cliquez sur <strong>« Sauvegarder »</strong> pour l'ajouter à vos favoris, consigner vos impressions et l'exporter.
                </p>
              </div>
            ) : displayedFavorites.length === 0 ? (
              <div className="text-center py-10 px-4 text-stone-500 dark:text-slate-400">
                <p className="text-xs font-semibold">Aucun itinéraire ne correspond à ce filtre.</p>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Afficher tous les itinéraires ({favorites.length})
                </button>
              </div>
            ) : (
              displayedFavorites.map((fav) => (
                <FavoriteCard
                  key={fav.id}
                  favorite={fav}
                  onDelete={onDelete}
                  onLoad={(route, trace) => {
                    onLoad(route, trace);
                    onClose();
                  }}
                  onUpdateFavorite={onUpdateFavorite}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Synchronisation Cloud & QR Code */}
        {activeTab === 'sync' && (
          <FavoritesSyncTab
            pairingCode={pairingCode}
            isSyncing={isSyncing}
            totalFavorites={favorites.length}
            onConnectPairingCode={onConnectPairingCode}
            onDisconnectPairing={onDisconnectPairing}
          />
        )}
      </div>
    </div>
  );
}
