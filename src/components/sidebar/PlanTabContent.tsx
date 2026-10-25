import React, { useRef } from 'react';
import {
  MapPin,
  Upload,
  Bike,
  Footprints,
  Droplets,
  TreePine,
  Navigation,
  Mountain,
  Map as MapIcon,
  Sparkles,
  RotateCcw,
  Repeat,
  PenTool,
} from 'lucide-react';
import { TouchDistanceSelector } from '../TouchDistanceSelector';
import { getCountryFlag } from '../ui/PremiumPrimitives';

export const FILTER_OPTIONS = [
  { id: 'loop', label: 'Parcours en Boucle', icon: Repeat },
  { id: 'water', label: 'Rivières & Lacs', icon: Droplets },
  { id: 'forest', label: 'Forêts & Bois', icon: TreePine },
  { id: 'gravel', label: 'Gravier & Chemins', icon: Navigation },
  { id: 'paved', label: '100% Asphalte', icon: Navigation },
  { id: 'low_traffic', label: 'Trafic Très Faible', icon: MapIcon },
  { id: 'flat', label: 'Plat (< 1% pente)', icon: Navigation },
  { id: 'hilly', label: 'Dénivelé / Sportif', icon: Mountain },
];

export const POPULAR_LOCATIONS = [
  { name: 'Luxembourg-Ville', country: 'LU' },
  { name: 'Echternach', country: 'LU' },
  { name: 'Clervaux', country: 'LU' },
  { name: 'Bastogne', country: 'BE' },
  { name: 'Bouillon', country: 'BE' },
  { name: 'Spa', country: 'BE' },
  { name: 'Trier', country: 'DE' },
  { name: 'Saarschleife', country: 'DE' },
  { name: 'Maastricht', country: 'NL' },
  { name: 'Thionville', country: 'FR' },
];

interface PlanTabContentProps {
  activity: 'bike' | 'hike';
  bikeType?: 'road' | 'vtt';
  onActivityChange: (activity: 'bike' | 'hike', bikeType?: 'road' | 'vtt') => void;
  location: string;
  setLocation: (loc: string) => void;
  onSelectLocation?: (loc: string, country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR') => void;
  distance: [number, number];
  setDistance: (d: [number, number]) => void;
  activeFilters: string[];
  toggleFilter: (id: string) => void;
  onImportGPX: (content: string) => boolean;
  onFilterMap: () => void;
  onClearAllFilters?: () => void;
  onGenerate: (isMapTracesOnly: boolean) => void;
  isGenerating: boolean;
  onStartCreateRoute?: () => void;
  onOpenLoopModal?: () => void;
}

export function PlanTabContent({
  activity,
  bikeType = 'road',
  onActivityChange,
  location,
  setLocation,
  onSelectLocation,
  distance,
  setDistance,
  activeFilters,
  toggleFilter,
  onImportGPX,
  onFilterMap,
  onClearAllFilters,
  onGenerate,
  isGenerating,
  onStartCreateRoute,
  onOpenLoopModal,
}: PlanTabContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportGPX(content);
        if (!ok) {
          alert('Impossible de lire le fichier GPX. Vérifiez le format.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3.5">
      {/* Activity Toggle */}
      <section className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
            Activité sportive
          </h3>
          {onClearAllFilters && (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[10px] transition-colors cursor-pointer"
              title="Enlever tous les filtres (distances, critères, zone et lieu)"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Enlever tous les filtres</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onActivityChange('bike', 'road')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold rounded-xl transition-all border cursor-pointer ${
              activity === 'bike' && bikeType !== 'vtt'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            }`}
            title="Vélo de route & Pistes cyclables (Asphalte)"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Route</span>
          </button>
          <button
            onClick={() => onActivityChange('bike', 'vtt')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold rounded-xl transition-all border cursor-pointer ${
              activity === 'bike' && bikeType === 'vtt'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            }`}
            title="VTT / Mountain Bike (Sentiers & Bois)"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>VTT</span>
          </button>
          <button
            onClick={() => onActivityChange('hike')}
            className={`py-2 px-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold rounded-xl transition-all border cursor-pointer ${
              activity === 'hike'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            }`}
            title="Randonnée à pied / Sentiers"
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>À pied</span>
          </button>
        </div>
      </section>

      {/* Nouveau tracé interactif & Générateur automatique de boucle */}
      {(onStartCreateRoute || onOpenLoopModal) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {onStartCreateRoute && (
            <button
              type="button"
              onClick={onStartCreateRoute}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/90 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs active:scale-98"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <PenTool className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 block truncate">
                    Tracer sur carte
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">
                    Point par point
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">
                →
              </span>
            </button>
          )}

          {onOpenLoopModal && (
            <button
              type="button"
              onClick={onOpenLoopModal}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/5 dark:from-purple-950/40 dark:to-pink-950/30 border border-purple-200/90 dark:border-purple-800/80 hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs active:scale-98"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 block truncate">
                    Boucle auto
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">
                    Départ + distance
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0 ml-1">
                →
              </span>
            </button>
          )}
        </div>
      )}

      {/* Location Input & Popular Shortcuts */}
      <section className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mb-2">
          Lieu ou Ville (Rayon 200 km)
        </h3>
        <div className="relative mb-2.5">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (onSelectLocation) onSelectLocation(location);
                else onFilterMap();
              }
            }}
            onBlur={() => {
              if (location && location.trim().length > 0) {
                if (onSelectLocation) onSelectLocation(location);
              }
            }}
            placeholder="ex: Luxembourg, Bastogne, Trier, Echternach..."
            className="pl-9 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = location.toLowerCase() === loc.name.toLowerCase();
            return (
              <button
                key={loc.name}
                onClick={() => {
                  setLocation(loc.name);
                  if (onSelectLocation) {
                    onSelectLocation(loc.name, loc.country as any);
                  } else {
                    onFilterMap();
                  }
                }}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                <span>{getCountryFlag(loc.country)}</span>
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Touch Distance Selector */}
      <section className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3">
        <TouchDistanceSelector
          activity={activity}
          distance={distance}
          onChange={setDistance}
        />
      </section>

      {/* Surface & Experience Filters */}
      <section className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mb-2">
          Critères & Préférences
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilters.includes(opt.id);
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => toggleFilter(opt.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl transition-all border cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-600/20'
                    : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* GPX Import Button */}
      <section>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Importer un fichier GPX existant</span>
        </button>
      </section>

      {/* Plan Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        {onClearAllFilters && (
          <button
            type="button"
            onClick={onClearAllFilters}
            disabled={isGenerating}
            className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Enlever tous les filtres (Tout afficher)</span>
          </button>
        )}
        <button
          onClick={onFilterMap}
          disabled={isGenerating || !location}
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <MapIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Filtrer les circuits ({distance[0]}–{distance[1]} km)</span>
        </button>
        <button
          onClick={() => onGenerate(false)}
          disabled={isGenerating || !location}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Générer circuit sur mesure</span>
        </button>
      </div>
    </div>
  );
}
