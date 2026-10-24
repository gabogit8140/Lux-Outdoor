import React, { useState } from 'react';
import {
  Calendar,
  Trash2,
  Download,
  Play,
  Mountain,
  Bike,
  Footprints,
  Edit3,
  Check,
  MessageSquare,
} from 'lucide-react';
import type { SavedFavorite, FavoriteCategory } from '../../hooks/useFavorites';
import type { RouteSuggestions, RouteTrace } from '../../types';
import { downloadGPX } from '../../lib/gpx';
import {
  FAVORITE_CATEGORIES,
  resolveFavoriteCategory,
} from '../../lib/favorites/favoriteCategories';

interface FavoriteCardProps {
  favorite: SavedFavorite;
  onDelete: (id: string) => void;
  onLoad: (route: RouteSuggestions, trace: RouteTrace) => void;
  onUpdateFavorite?: (
    id: string,
    category?: FavoriteCategory | null,
    userNotes?: string,
    hasMushrooms?: boolean,
    userRating?: number
  ) => void;
}

export function FavoriteCard({
  favorite: fav,
  onDelete,
  onLoad,
  onUpdateFavorite,
}: FavoriteCardProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(fav.userNotes || '');

  const diff = fav.route.difficulty;
  const currentCat = resolveFavoriteCategory(fav.category, fav.userRating, fav.hasMushrooms);
  const currentMeta = currentCat ? FAVORITE_CATEGORIES[currentCat] : null;

  const handleSaveNotes = () => {
    if (onUpdateFavorite) {
      onUpdateFavorite(fav.id, undefined, tempNotes.trim());
    }
    setIsEditingNotes(false);
  };

  const handleToggleCategory = (targetCat: FavoriteCategory) => {
    if (!onUpdateFavorite) return;

    if (targetCat === 'champignons') {
      const nextMushrooms = !fav.hasMushrooms;
      onUpdateFavorite(fav.id, undefined, undefined, nextMushrooms);
      return;
    }

    if (currentCat === targetCat) {
      onUpdateFavorite(fav.id, null, undefined, fav.hasMushrooms, 0);
    } else {
      onUpdateFavorite(fav.id, targetCat, undefined, fav.hasMushrooms);
    }
  };

  const getCountryFlag = (country?: string) => {
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
  };

  return (
    <div className="bg-stone-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-2xl p-4 border border-stone-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-500 transition-all shadow-2xs hover:shadow-md flex flex-col gap-3 group">
      {/* Card Header & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {currentMeta && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${currentMeta.bgColor} ${currentMeta.borderColor} ${currentMeta.textColor}`}
              >
                <span>{currentMeta.icon}</span>
                <span>{currentMeta.label}</span>
              </span>
            )}

            {fav.hasMushrooms && currentCat !== 'champignons' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300/80">
                🍄 Champignons
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
              {fav.activity === 'bike' ? (
                <>
                  <Bike className="w-3 h-3" /> Vélo
                </>
              ) : (
                <>
                  <Footprints className="w-3 h-3" /> Rando
                </>
              )}
            </span>

            {diff && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.badgeBg} ${diff.badgeText}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: diff.dotColor }}
                />
                {diff.label}
              </span>
            )}

            {fav.country && (
              <span className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
                {getCountryFlag(fav.country)} {fav.country}
              </span>
            )}

            <span className="text-[10px] text-stone-400 flex items-center gap-1 ml-auto">
              <Calendar className="w-3 h-3" />
              {new Date(fav.dateSaved).toLocaleDateString('fr-FR')}
            </span>
          </div>

          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
            {fav.title}
          </h3>
          <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-1 mt-0.5">
            {fav.description}
          </p>
        </div>

        <button
          onClick={() => onDelete(fav.id)}
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Supprimer des favoris"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Rating & Categorization Controls */}
      <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-2.5 border border-stone-200/60 dark:border-slate-700/60 flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400 tracking-wider">
            {currentCat ? 'Appréciation terrain :' : 'Noter ce circuit :'}
          </span>

          <div className="flex items-center gap-1.5">
            {(['top', 'bien', 'ne_pas_refaire'] as FavoriteCategory[]).map((catKey) => {
              const meta = FAVORITE_CATEGORIES[catKey];
              const isSelected = currentCat === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => handleToggleCategory(catKey)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                    isSelected
                      ? `${meta.bgColor} ${meta.borderColor} ${meta.textColor} ring-2 ring-emerald-500/30 scale-102 shadow-2xs`
                      : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
                  }`}
                  title={meta.shortDescription}
                >
                  <span>{meta.icon}</span>
                  <span className="hidden sm:inline text-[11px]">{meta.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleToggleCategory('champignons')}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                fav.hasMushrooms || currentCat === 'champignons'
                  ? 'bg-orange-500/15 border-orange-400 text-orange-800 dark:text-orange-300 ring-2 ring-orange-500/30 shadow-2xs'
                  : 'bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100'
              }`}
              title="Marquer comme coin propice aux champignons"
            >
              <span>🍄</span>
              <span className="hidden sm:inline text-[11px]">Champignons</span>
            </button>
          </div>
        </div>

        {/* Field Notes Display / Edit */}
        {isEditingNotes ? (
          <div className="space-y-1.5 pt-1">
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Écrivez vos observations de terrain (état du sentier, point d'eau, panoramas...)"
              rows={2}
              className="w-full text-xs p-2 bg-stone-50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-600 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800 dark:text-stone-200"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => {
                  setTempNotes(fav.userNotes || '');
                  setIsEditingNotes(false);
                }}
                className="px-2 py-1 text-[11px] text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 rounded cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 text-xs pt-1">
            <div className="flex items-start gap-1.5 text-stone-600 dark:text-slate-400">
              <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span className={fav.userNotes ? 'italic' : 'text-stone-400 dark:text-slate-500 italic'}>
                {fav.userNotes || 'Aucune note de terrain ajoutée.'}
              </span>
            </div>
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              {fav.userNotes ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Stats & Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 dark:text-slate-300">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {fav.distanceKm} km
          </span>
          <span className="flex items-center gap-1 text-stone-500 dark:text-slate-400">
            <Mountain className="w-3.5 h-3.5 text-stone-400" />
            {fav.elevationGain}m D+
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              downloadGPX(fav.title, fav.trace.coordinates, fav.trace.elevationProfile)
            }
            className="px-2.5 py-1.5 text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-700 rounded-xl font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Télécharger GPX"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            GPX
          </button>
          <button
            onClick={() => onLoad(fav.route, fav.trace)}
            className="px-3.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Ouvrir
          </button>
        </div>
      </div>
    </div>
  );
}
