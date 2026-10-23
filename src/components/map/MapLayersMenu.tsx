import React, { useState, useRef, useEffect } from 'react';
import { Layers, Compass, Globe, ExternalLink } from 'lucide-react';
import { HuntingRifleIcon } from '../ui/HuntingRifleIcon';
import type { MapLayerType } from './MapTileLayers';

interface MapLayersMenuProps {
  activity: 'bike' | 'hike';
  mapLayer: MapLayerType;
  setMapLayer: (layer: MapLayerType) => void;
  showNetwork: boolean;
  setShowNetwork: (show: boolean) => void;
  show200kmRadius: boolean;
  setShow200kmRadius: (show: boolean) => void;
  showHuntingBattues?: boolean;
  setShowHuntingBattues?: (show: boolean) => void;
}

export function MapLayersMenu({
  activity,
  mapLayer,
  setMapLayer,
  showNetwork,
  setShowNetwork,
  show200kmRadius,
  setShow200kmRadius,
  showHuntingBattues = false,
  setShowHuntingBattues,
}: MapLayersMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-2xl shadow-lg backdrop-blur-xl flex items-center justify-center transition-all border cursor-pointer ${
          isOpen
            ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-emerald-600/25'
            : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border-white/70 dark:border-slate-700/80'
        }`}
        title="Fonds de carte & calques régionaux"
        aria-label="Fonds de carte & calques"
      >
        <Layers className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 min-w-[245px] z-[500] text-xs space-y-2 animate-in fade-in zoom-in-95">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 tracking-wider">
            Fonds de carte
          </div>

          {/* OSM France (Ideal for hiking & general nature) */}
          <button
            onClick={() => {
              setMapLayer('osmfr');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
              mapLayer === 'osmfr'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold">OSM France</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                Sentiers pédestres & nature
              </span>
            </div>
            {activity === 'hike' && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                Recommandé rando
              </span>
            )}
          </button>

          {/* OpenTopoMap */}
          <button
            onClick={() => {
              setMapLayer('topo');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
              mapLayer === 'topo'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold">OpenTopoMap</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                Relief & courbes de niveau
              </span>
            </div>
          </button>

          {/* CyclOSM Plein Air (Only in bike mode) */}
          {activity === 'bike' && (
            <button
              onClick={() => {
                setMapLayer('cyclosm');
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                mapLayer === 'cyclosm'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold">CyclOSM Plein Air</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  Pistes cyclables & véloroutes
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded-md font-bold">
                Recommandé vélo
              </span>
            </button>
          )}

          {/* Standard OpenStreetMap */}
          <button
            onClick={() => {
              setMapLayer('osm');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
              mapLayer === 'osm'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold">OpenStreetMap</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                Cartographie standard
              </span>
            </div>
          </button>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 tracking-wider">
              Calques & Repères
            </div>

            {/* Waymarked Trails Overlay Toggle */}
            <button
              onClick={() => setShowNetwork(!showNetwork)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                showNetwork
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {activity === 'bike' ? 'Réseau RAVeL & Véloroutes' : 'Sentiers balisés & GR'}
                </span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                  showNetwork
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {showNetwork ? 'Actif' : 'Masqué'}
              </span>
            </button>

            {/* In-app WMS Layer Toggle for Luxembourg Battues Layer 444 */}
            {setShowHuntingBattues && (
              <button
                onClick={() => setShowHuntingBattues(!showHuntingBattues)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                  showHuntingBattues
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <HuntingRifleIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Battues de chasse (LU)</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                    showHuntingBattues
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {showHuntingBattues ? 'Actif' : 'Masqué'}
                </span>
              </button>
            )}

            {/* Direct Link to Geoportail.lu Battues Layer 444 */}
            <a
              href="https://map.geoportail.lu/theme/main?version=3&zoom=9&X=682599&Y=6379000&lang=fr&layers=444&opacities=1"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-medium border border-transparent hover:border-amber-200 dark:hover:border-amber-800/60 cursor-pointer"
              title="Consulter les dates et zones de battues déclarées au Luxembourg (Couche 444)"
            >
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Battues (Geoportail.lu)</span>
              </div>
              <ExternalLink className="w-3 h-3 text-amber-600/70 dark:text-amber-400/70" />
            </a>

            {/* 200 km Boundary Toggle */}
            <button
              onClick={() => setShow200kmRadius(!show200kmRadius)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                show200kmRadius
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Zone 200 km Grande Région</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                  show200kmRadius
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {show200kmRadius ? 'Actif' : 'Masqué'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
