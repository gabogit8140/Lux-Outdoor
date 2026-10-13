import React, { useState, useRef, useEffect } from 'react';
import { Layers, Compass, Globe } from 'lucide-react';
import type { MapLayerType } from './MapTileLayers';

interface MapLayersMenuProps {
  activity: 'bike' | 'hike';
  mapLayer: MapLayerType;
  setMapLayer: (layer: MapLayerType) => void;
  showNetwork: boolean;
  setShowNetwork: (show: boolean) => void;
  show200kmRadius: boolean;
  setShow200kmRadius: (show: boolean) => void;
}

export function MapLayersMenu({
  activity,
  mapLayer,
  setMapLayer,
  showNetwork,
  setShowNetwork,
  show200kmRadius,
  setShow200kmRadius,
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
        className={`w-8 h-8 rounded-xl shadow-md flex items-center justify-center transition-colors border ${
          isOpen
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-stone-600 hover:text-emerald-700 border-stone-200'
        }`}
        title="Fonds de carte & calques régionaux"
        aria-label="Fonds de carte & calques"
      >
        <Layers className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 p-3 min-w-[240px] z-[500] text-xs space-y-2 animate-in fade-in zoom-in-95">
          <div className="text-[10px] uppercase font-bold text-stone-400 px-1 tracking-wider">
            Fonds de carte
          </div>

          {/* OSM France (Ideal for hiking & general nature) */}
          <button
            onClick={() => {
              setMapLayer('osmfr');
              setIsOpen(false);
            }}
            className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between ${
              mapLayer === 'osmfr'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                : 'hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold">OSM France</span>
              <span className="text-[10px] text-stone-500 font-normal">
                Sentiers pédestres & nature
              </span>
            </div>
            {activity === 'hike' && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
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
            className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between ${
              mapLayer === 'topo'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                : 'hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold">OpenTopoMap</span>
              <span className="text-[10px] text-stone-500 font-normal">
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
              className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between ${
                mapLayer === 'cyclosm'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold">CyclOSM Plein Air</span>
                <span className="text-[10px] text-stone-500 font-normal">
                  Pistes cyclables & véloroutes
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
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
            className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors flex items-center justify-between ${
              mapLayer === 'osm'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                : 'hover:bg-stone-100 text-stone-700'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold">OpenStreetMap</span>
              <span className="text-[10px] text-stone-500 font-normal">
                Cartographie standard
              </span>
            </div>
          </button>

          <div className="border-t border-stone-200 pt-2 space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-400 px-1 tracking-wider">
              Calques & Répères
            </div>

            {/* Waymarked Trails Overlay Toggle */}
            <button
              onClick={() => setShowNetwork(!showNetwork)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between ${
                showNetwork
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'hover:bg-stone-100 text-stone-700 font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {activity === 'bike' ? 'Réseau RAVeL & Véloroutes' : 'Sentiers balisés & GR'}
                </span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                  showNetwork ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {showNetwork ? 'Actif' : 'Masqué'}
              </span>
            </button>

            {/* 200 km Boundary Toggle */}
            <button
              onClick={() => setShow200kmRadius(!show200kmRadius)}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-between ${
                show200kmRadius
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'hover:bg-stone-100 text-stone-700 font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zone 200 km Grande Région</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                  show200kmRadius ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
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
