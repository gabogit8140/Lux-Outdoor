import React, { useState } from 'react';
import {
  X,
  Map as MapIcon,
  Calendar,
  Trash2,
  Download,
  Play,
  Mountain,
  Bike,
  Footprints,
  Star,
  Edit3,
  Check,
  MessageSquare,
} from 'lucide-react';
import type { SavedFavorite } from '../hooks/useFavorites';
import type { RouteSuggestions, RouteTrace } from '../types';
import { downloadGPX } from '../lib/gpx';

interface FavoritesProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: SavedFavorite[];
  onDelete: (id: string) => void;
  onLoad: (route: RouteSuggestions, trace: RouteTrace) => void;
  onUpdateFavorite?: (id: string, userRating?: number, userNotes?: string) => void;
}

export function Favorites({
  isOpen,
  onClose,
  favorites,
  onDelete,
  onLoad,
  onUpdateFavorite,
}: FavoritesProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEditNotes = (fav: SavedFavorite) => {
    setEditingNoteId(fav.id);
    setTempNotes(fav.userNotes || '');
  };

  const handleSaveNotes = (favId: string) => {
    if (onUpdateFavorite) {
      onUpdateFavorite(favId, undefined, tempNotes.trim());
    }
    setEditingNoteId(null);
  };

  const handleSetRating = (favId: string, rating: number) => {
    if (onUpdateFavorite) {
      onUpdateFavorite(favId, rating, undefined);
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-100 flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Bibliothèque & Carnet de terrain
              </h2>
              <p className="text-xs text-stone-500">
                {favorites.length} {favorites.length > 1 ? 'itinéraires enregistrés' : 'itinéraire enregistré'} · Vos notes réelles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-3.5">
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <MapIcon className="w-12 h-12 mx-auto text-stone-200 mb-3" />
              <p className="text-sm font-semibold text-stone-700">Aucun itinéraire sauvegardé</p>
              <p className="text-xs mt-1 text-stone-400 max-w-sm mx-auto">
                Choisissez ou générez un circuit sur la carte, puis cliquez sur "Sauvegarder" pour lui attribuer votre note et vos observations de terrain.
              </p>
            </div>
          ) : (
            favorites.map((fav) => {
              const diff = fav.route.difficulty;
              const isEditingThis = editingNoteId === fav.id;

              return (
                <div
                  key={fav.id}
                  className="bg-stone-50 hover:bg-white rounded-2xl p-4 border border-stone-200/80 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-md flex flex-col gap-3 group"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Activity */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
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

                        {/* Calculated Difficulty Badge */}
                        {diff && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.badgeBg} ${diff.badgeText}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: diff.dotColor }}
                            />
                            {diff.label} ({diff.dPlusPerKm}m/km)
                          </span>
                        )}

                        {/* Region & Country */}
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

                      <h3 className="font-bold text-sm text-stone-900 truncate">
                        {fav.title}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                        {fav.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onDelete(fav.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Supprimer des favoris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Personal Rating & Field Notes Section (Option 3) */}
                  <div className="bg-white/80 rounded-xl p-2.5 border border-stone-200/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        Votre note personnelle :
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleSetRating(fav.id, star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                            title={`Attribuer ${star} étoile(s)`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                (fav.userRating || 0) >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-stone-300 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Field Notes Display / Edit */}
                    {isEditingThis ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Écrivez vos observations de terrain (état du sentier, point d'eau, panoramas...)"
                          rows={2}
                          className="w-full text-xs p-2 bg-stone-50 border border-emerald-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 text-[11px] text-stone-500 hover:bg-stone-100 rounded"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveNotes(fav.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-1.5 text-stone-600">
                          <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span className={fav.userNotes ? 'italic' : 'text-stone-400 italic'}>
                            {fav.userNotes || 'Aucune note de terrain ajoutée.'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStartEditNotes(fav)}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          {fav.userNotes ? 'Modifier' : 'Ajouter'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs font-semibold text-stone-600">
                      <span className="text-emerald-700 font-bold">
                        {fav.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <Mountain className="w-3.5 h-3.5 text-stone-400" />
                        {fav.elevationGain}m D+
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          downloadGPX(fav.title, fav.trace.coordinates, fav.trace.elevationProfile)
                        }
                        className="px-2.5 py-1.5 text-xs text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Télécharger GPX"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-500" />
                        GPX
                      </button>
                      <button
                        onClick={() => {
                          onLoad(fav.route, fav.trace);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Ouvrir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
