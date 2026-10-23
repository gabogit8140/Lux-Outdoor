import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Compass,
  Footprints,
  Bike,
  Navigation,
  MapPin,
  Check,
} from 'lucide-react';
import type { UseRouteEditorReturn } from '../../hooks/useRouteEditor';

interface LoopGeneratorModalProps {
  editor: UseRouteEditorReturn;
  mapCenter?: [number, number]; // [lon, lat]
}

export function LoopGeneratorModal({ editor, mapCenter }: LoopGeneratorModalProps) {
  const { isLoopModalOpen, closeLoopModal, generateProposedLoop, activity, setActivity, waypoints } =
    editor;

  // Distance cible par défaut selon l'activité
  const [distanceKm, setDistanceKm] = useState<number>(activity === 'bike' ? 28 : 8);
  const [direction, setDirection] = useState<'random' | 'north' | 'east' | 'south' | 'west'>('random');

  if (!isLoopModalOpen) return null;

  // Détermine les coordonnées de départ
  const effectiveStart: [number, number] =
    waypoints.length > 0
      ? waypoints[0]
      : mapCenter && !isNaN(mapCenter[0])
      ? mapCenter
      : [6.13, 49.61]; // Luxembourg par défaut

  const handleGenerate = () => {
    // Convertir la direction cardinale en angle radian
    let angle = Math.random() * Math.PI * 2;
    if (direction === 'north') angle = Math.PI / 2;
    if (direction === 'east') angle = 0;
    if (direction === 'south') angle = (3 * Math.PI) / 2;
    if (direction === 'west') angle = Math.PI;

    generateProposedLoop(effectiveStart, distanceKm, angle);
  };

  const presetDistances =
    activity === 'bike' ? [15, 25, 35, 50, 75] : [5, 8, 12, 16, 25];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Générer une boucle outdoor
              </h2>
              <p className="text-xs text-purple-100 opacity-90">
                L'application trace un circuit sur les sentiers réels
              </p>
            </div>
          </div>
          <button
            onClick={closeLoopModal}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Sport Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Activité
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActivity('hike');
                  setDistanceKm(12);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activity === 'hike'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Footprints className="w-4 h-4 text-emerald-600" />
                <span>Rando / Marche</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivity('bike');
                  setDistanceKm(30);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activity === 'bike'
                    ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bike className="w-4 h-4 text-teal-600" />
                <span>Vélo / Gravel</span>
              </button>
            </div>
          </div>

          {/* Point de départ */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Point de départ & arrivée</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {waypoints.length > 0 ? 'Point 1 sur carte' : 'Centre de la carte'}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Lat : {effectiveStart[1].toFixed(4)}° • Lon : {effectiveStart[0].toFixed(4)}°
            </div>
          </div>

          {/* Target Distance */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span>Distance souhaitée</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {distanceKm} km
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 mb-3">
              {presetDistances.map((d) => (
                <button
                  key={`dist-chip-${d}`}
                  type="button"
                  onClick={() => setDistanceKm(d)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    distanceKm === d
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                  }`}
                >
                  {d}k
                </button>
              ))}
            </div>

            {/* Distance Slider */}
            <input
              type="range"
              min={activity === 'bike' ? 10 : 3}
              max={activity === 'bike' ? 90 : 45}
              step={1}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Direction Orientation */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Orientation de la boucle
            </label>
            <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold text-center">
              {[
                { id: 'random', label: 'Aléatoire' },
                { id: 'north', label: 'Nord' },
                { id: 'east', label: 'Est' },
                { id: 'south', label: 'Sud' },
                { id: 'west', label: 'Ouest' },
              ].map((dir) => (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setDirection(dir.id as any)}
                  className={`py-2 px-1 rounded-xl border transition-all cursor-pointer min-h-[38px] flex items-center justify-center ${
                    direction === dir.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeLoopModal}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[42px] flex items-center justify-center"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Générer le tracé ({distanceKm} km)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
