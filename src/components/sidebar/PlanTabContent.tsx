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
} from 'lucide-react';
import { TouchDistanceSelector } from '../TouchDistanceSelector';

export const FILTER_OPTIONS = [
  { id: 'water', label: 'Rivières & Lacs', icon: Droplets },
  { id: 'forest', label: 'Forêts & Bois', icon: TreePine },
  { id: 'gravel', label: 'Gravier & Chemins', icon: Navigation },
  { id: 'paved', label: '100% Asphalte', icon: Navigation },
  { id: 'low_traffic', label: 'Trafic Très Faible', icon: MapIcon },
  { id: 'flat', label: 'Plat (< 1% pente)', icon: Navigation },
  { id: 'hilly', label: 'Dénivelé / Sportif', icon: Mountain },
];

export const POPULAR_LOCATIONS = [
  { name: 'Luxembourg', country: 'LU' },
  { name: 'Bastogne', country: 'BE' },
  { name: 'Bouillon', country: 'BE' },
  { name: 'Spa', country: 'BE' },
  { name: 'Trier', country: 'DE' },
  { name: 'Saarschleife', country: 'DE' },
  { name: 'Maastricht', country: 'NL' },
  { name: 'Valkenburg', country: 'NL' },
  { name: 'Thionville', country: 'FR' },
  { name: 'Metz', country: 'FR' },
];

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

interface PlanTabContentProps {
  activity: 'bike' | 'hike';
  onActivityChange: (activity: 'bike' | 'hike') => void;
  location: string;
  setLocation: (loc: string) => void;
  distance: [number, number];
  setDistance: (d: [number, number]) => void;
  activeFilters: string[];
  toggleFilter: (id: string) => void;
  onImportGPX: (content: string) => boolean;
  onFilterMap: () => void;
  onGenerate: (isMapTracesOnly: boolean) => void;
  isGenerating: boolean;
}

export function PlanTabContent({
  activity,
  onActivityChange,
  location,
  setLocation,
  distance,
  setDistance,
  activeFilters,
  toggleFilter,
  onImportGPX,
  onFilterMap,
  onGenerate,
  isGenerating,
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
    <div className="space-y-4">
      {/* Activity Toggle */}
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1.5">
          Activité sportive
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onActivityChange('bike')}
            className={`py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
              activity === 'bike'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Bike className="w-4 h-4" /> Vélo / Gravel
          </button>
          <button
            onClick={() => onActivityChange('hike')}
            className={`py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold rounded-xl transition-all border cursor-pointer ${
              activity === 'hike'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Footprints className="w-4 h-4" /> Randonnée à pied
          </button>
        </div>
      </section>

      {/* Location Input & Popular Shortcuts */}
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1.5">
          Lieu ou Ville (200 km)
        </h3>
        <div className="relative mb-2">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex: Luxembourg, Bastogne, Trier, Bouillon..."
            className="pl-9 w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs text-stone-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => setLocation(loc.name)}
              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                location.toLowerCase() === loc.name.toLowerCase()
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{getCountryFlag(loc.country)}</span>
              <span>{loc.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Touch Distance Selector */}
      <section>
        <TouchDistanceSelector
          activity={activity}
          distance={distance}
          onChange={setDistance}
        />
      </section>

      {/* Surface & Experience Filters */}
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1.5">
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
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl transition-all border cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {opt.label}
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
          className="w-full py-2 px-3 border border-dashed border-stone-300 hover:border-emerald-500 rounded-xl text-stone-600 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 bg-stone-50/60 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-stone-400" />
          <span>Importer un fichier GPX existant</span>
        </button>
      </section>

      {/* Plan Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onFilterMap}
          disabled={isGenerating || !location}
          className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <MapIcon className="w-4 h-4 text-emerald-700" />
          Filtrer les circuits ({distance[0]}–{distance[1]} km)
        </button>
        <button
          onClick={() => onGenerate(false)}
          disabled={isGenerating || !location}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Générer circuit sur mesure
        </button>
      </div>
    </div>
  );
}
