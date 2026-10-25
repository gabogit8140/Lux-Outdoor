import React from 'react';
import { MapPin, Calendar, Trash2, Navigation } from 'lucide-react';
import type { MushroomSpot } from '../../types/mushroom';
import { COMMON_MUSHROOM_VARIETIES } from '../../types/mushroom';

interface MushroomSpotsTabProps {
  mushroomSpots: MushroomSpot[];
  onDeleteSpot?: (id: string) => void;
  onSelectSpot?: (coordinates: [number, number]) => void;
}

export function MushroomSpotsTab({
  mushroomSpots,
  onDeleteSpot,
  onSelectSpot,
}: MushroomSpotsTabProps) {
  const getVarietyMeta = (varietyName: string) => {
    return (
      COMMON_MUSHROOM_VARIETIES.find((v) => v.label === varietyName) || {
        label: varietyName,
        emoji: '🍄',
        color: '#ea580c',
      }
    );
  };

  if (mushroomSpots.length === 0) {
    return (
      <div className="p-8 text-center text-stone-500 dark:text-slate-400">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-3xl mb-3.5 shadow-xs">
          🍄
        </div>
        <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
          Aucun coin à champignons repéré
        </h3>
        <p className="text-xs mt-1.5 text-stone-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Pendant la saison mycologique au Luxembourg, cliquez sur le bouton <strong>🍄</strong> en haut à droite de la carte, puis touchez l'écran pour marquer vos trouvailles en forêt.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-3">
      <div className="flex items-center justify-between px-1 text-xs text-stone-500 dark:text-slate-400">
        <span className="font-bold text-stone-700 dark:text-stone-300">
          {mushroomSpots.length} {mushroomSpots.length > 1 ? 'coins repérés' : 'coin repéré'}
        </span>
        <span className="text-[11px]">Synchronisés en temps réel via le Cloud</span>
      </div>

      {mushroomSpots.map((spot) => {
        const meta = getVarietyMeta(spot.variety);

        return (
          <div
            key={spot.id}
            className="bg-stone-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-2xl p-4 border border-stone-200/80 dark:border-slate-700/80 hover:border-orange-300 dark:hover:border-orange-500 transition-all shadow-2xs hover:shadow-md flex flex-col gap-2.5 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-xl flex items-center justify-center shrink-0 shadow-2xs border border-orange-200 dark:border-orange-900/40">
                  {meta.emoji}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {spot.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-orange-700 dark:text-orange-400">
                      {spot.variety}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {spot.coordinates[0].toFixed(4)}°N, {spot.coordinates[1].toFixed(4)}°E
                    </span>
                  </div>
                </div>
              </div>

              {onDeleteSpot && (
                <button
                  type="button"
                  onClick={() => onDeleteSpot(spot.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Supprimer ce coin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {spot.notes && (
              <p className="text-xs italic text-stone-600 dark:text-slate-400 bg-stone-100/70 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-stone-200/60 dark:border-slate-800">
                « {spot.notes} »
              </p>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-slate-800/80">
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(spot.dateAdded).toLocaleDateString('fr-FR')}
              </span>

              {onSelectSpot && (
                <button
                  type="button"
                  onClick={() => onSelectSpot(spot.coordinates)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Voir sur la carte</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
