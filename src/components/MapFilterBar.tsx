import React, { useState, useRef, useEffect } from 'react';
import {
  Bike,
  Footprints,
  SlidersHorizontal,
  ChevronDown,
  Droplets,
  TreePine,
  Mountain,
  Navigation,
  RotateCcw,
  FilterX,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Gauge,
  Layers,
  Repeat,
  Search,
  MapPin,
} from 'lucide-react';
import { TouchDistanceSelector } from './TouchDistanceSelector';
import { isRegionalZoneLocation, type PlaceEntry } from '../lib/localRouting';
import { CitySearchModal } from './search/CitySearchModal';
import { SAFE_AREA_TOP_BAR, SAFE_AREA_TOP_POPOVER } from '../lib/layout/safeArea';

export interface MapFilterOption {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'safety' | 'surface' | 'scenery' | 'elevation';
}

export const MAP_FILTER_OPTIONS: MapFilterOption[] = [
  {
    id: 'loop',
    label: 'Parcours en boucle',
    shortLabel: 'Boucle',
    icon: Repeat,
    description: 'Circuit fermé revenant au point de départ (idéal parking ou gare)',
    category: 'safety',
  },
  {
    id: 'low_traffic',
    label: 'Voies sans voiture',
    shortLabel: 'Sans voiture',
    icon: ShieldCheck,
    description: 'Voies vertes, pistes réservées (PC, RAVeL) & zéro trafic automobile',
    category: 'safety',
  },
  {
    id: 'water',
    label: 'Rivières & Lacs',
    shortLabel: 'Au fil de l’eau',
    icon: Droplets,
    description: 'Parcours pittoresques longeant vallées fluviales, lacs et cours d’eau',
    category: 'scenery',
  },
  {
    id: 'forest',
    label: 'Forêts & Nature',
    shortLabel: 'En forêt',
    icon: TreePine,
    description: 'Immersion sous canopée, massifs boisés et parcs naturels préservés',
    category: 'scenery',
  },
  {
    id: 'gravel',
    label: 'Gravel & Chemins',
    shortLabel: 'Gravel',
    icon: Navigation,
    description: 'Chemins stabilisés, pistes forestières et pistes blanches',
    category: 'surface',
  },
  {
    id: 'paved',
    label: '100% Asphalte',
    shortLabel: 'Asphalte',
    icon: Navigation,
    description: 'Revêtement bitumé très roulant, adapté vélo de route ou roller',
    category: 'surface',
  },
  {
    id: 'flat',
    label: 'Plat & Roulant',
    shortLabel: 'Plat (<1.5%)',
    icon: Gauge,
    description: 'Dénivelé très doux, idéal balades tranquilles et débutants',
    category: 'elevation',
  },
  {
    id: 'hilly',
    label: 'Dénivelé & Sportif',
    shortLabel: 'Dénivelé D+',
    icon: Mountain,
    description: 'Relief vallonné, côtes d’entraînement et points de vue en crête',
    category: 'elevation',
  },
];

interface MapFilterBarProps {
  activity: 'bike' | 'hike';
  bikeType?: 'road' | 'vtt';
  onActivityChange: (activity: 'bike' | 'hike', bikeType?: 'road' | 'vtt') => void;
  distance: [number, number];
  onDistanceChange: (distance: [number, number]) => void;
  activeFilters: string[];
  onToggleFilter: (filterId: string) => void;
  onClearFilters: () => void;
  routesCount: number;
  isGenerating: boolean;
  currentLocation?: string;
  sourceFilter?: 'all' | 'imported' | 'official';
  onSourceFilterChange?: (s: 'all' | 'imported' | 'official') => void;
  tripsList?: string[];
  selectedTrip?: string | null;
  onSelectTrip?: (trip: string | null) => void;
  dPlusFilter?: 'all' | 'flat' | 'moderate' | 'hilly';
  onDPlusFilterChange?: (d: 'all' | 'flat' | 'moderate' | 'hilly') => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  userTracksCount?: number;
  favoritesCount?: number;
  mushroomSpotsCount?: number;
  onSelectCity?: (city: PlaceEntry) => void;
  onResetCity?: () => void;
  userCoords?: [number, number] | null;
}

export function MapFilterBar({
  activity,
  bikeType = 'road',
  onActivityChange,
  distance,
  onDistanceChange,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  routesCount,
  isGenerating,
  currentLocation,
  sourceFilter = 'all',
  onSourceFilterChange,
  tripsList = [],
  selectedTrip = null,
  onSelectTrip,
  dPlusFilter = 'all',
  onDPlusFilterChange,
  searchQuery = '',
  onSearchQueryChange,
  userTracksCount = 0,
  favoritesCount = 0,
  mushroomSpotsCount = 0,
  onSelectCity,
  onResetCity,
  userCoords,
}: MapFilterBarProps) {
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);
  const [showCustomDistance, setShowCustomDistance] = useState(false);
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);

  const distanceMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (distanceMenuRef.current && !distanceMenuRef.current.contains(e.target as Node)) {
        setIsDistanceOpen(false);
        setShowCustomDistance(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bikeDistancePresets: { label: string; range: [number, number]; desc: string; icon: string }[] = [
    { label: '45–60 km', range: [45, 60], desc: 'Sortie classique (défaut)', icon: '🚴' },
    { label: '< 30 km', range: [15, 30], desc: 'Balade rapide (1h–1h30)', icon: '⚡' },
    { label: '30–45 km', range: [30, 45], desc: 'Sortie modérée (2h)', icon: '🌿' },
    { label: '60–85 km', range: [60, 85], desc: 'Endurance sportive (3h–4h30)', icon: '⛰️' },
    { label: '85+ km', range: [85, 120], desc: 'Grande aventure / Gran Fondo', icon: '🏆' },
    { label: 'Toutes les distances', range: [15, 120], desc: '15 à 120 km (vue panoramique)', icon: '🌐' },
  ];

  const hikeDistancePresets: { label: string; range: [number, number]; desc: string; icon: string }[] = [
    { label: '7–10 km', range: [7, 10], desc: 'Rando classique (défaut)', icon: '🥾' },
    { label: '< 7 km', range: [3, 7], desc: 'Promenade courte (1h–1h30)', icon: '🌿' },
    { label: '10–15 km', range: [10, 15], desc: 'Demi-journée (2h30–3h30)', icon: '⛰️' },
    { label: '15–22 km', range: [15, 22], desc: 'Randonnée sportive (4h–5h)', icon: '🧭' },
    { label: '22+ km', range: [22, 35], desc: 'Grande randonnée / Trail (6h+)', icon: '🏃' },
    { label: 'Toutes les distances', range: [3, 35], desc: '3 à 35 km (vue panoramique)', icon: '🌐' },
  ];

  const vttDistancePresets: { label: string; range: [number, number]; desc: string; icon: string }[] = [
    { label: '20–35 km', range: [20, 35], desc: 'Sortie VTT classique (défaut)', icon: '🚵' },
    { label: '< 20 km', range: [10, 20], desc: 'Boucle VTT courte / découverte', icon: '🌿' },
    { label: '35–50 km', range: [35, 50], desc: 'Raid VTT sportif & D+', icon: '⛰️' },
    { label: '50+ km', range: [50, 80], desc: 'Endurance / Marathon VTT', icon: '🏆' },
    { label: 'Toutes les distances', range: [10, 80], desc: '10 à 80 km (tous les circuits VTT)', icon: '🌐' },
  ];

  const distancePresets = activity === 'bike' ? (bikeType === 'vtt' ? vttDistancePresets : bikeDistancePresets) : hikeDistancePresets;

  const minRange = activity === 'bike' ? (bikeType === 'vtt' ? 10 : 15) : 3;
  const maxRange = activity === 'bike' ? (bikeType === 'vtt' ? 80 : 120) : 35;
  const step = activity === 'bike' ? 5 : 1;

  // Active filters count (excluding default)
  const nonDefaultFiltersCount =
    activeFilters.length +
    (sourceFilter !== 'all' ? 1 : 0) +
    (selectedTrip ? 1 : 0) +
    (dPlusFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  const isFullDistanceRange = distance[0] <= minRange && distance[1] >= maxRange;
  const hasLocationFilter = !isRegionalZoneLocation(currentLocation);

  // True whenever any filter, distance bracket, or city restriction is active
  const hasAnyActiveFilter =
    nonDefaultFiltersCount > 0 ||
    !isFullDistanceRange ||
    hasLocationFilter;

  return (
    <>
      {/* Floating On-Map Bar Container */}
      <div
        className="absolute left-14 sm:left-16 right-14 sm:right-14 md:right-16 z-[420] pointer-events-none flex flex-col gap-1.5 transition-all"
        style={{ top: SAFE_AREA_TOP_BAR }}
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-1.5">
          {/* Primary Top Island: Activity Switcher + Zone Dropdown + Distance Chip + Full Filters Button + Circuit Count */}
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_35px_-5px_rgba(15,23,42,0.16)] border border-white/70 dark:border-slate-700/80 p-1 sm:p-1.5 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar min-w-0">
            {/* Left: Sport / Activity Segmented Control (Route, VTT, À pied) */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => onActivityChange('bike', 'road')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activity === 'bike' && bikeType !== 'vtt'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                title="Vélo de route, cyclotourisme, pistes cyclables & voies vertes (Asphalte)"
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Route</span>
              </button>
              <button
                onClick={() => onActivityChange('bike', 'vtt')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activity === 'bike' && bikeType === 'vtt'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                title="VTT & Mountain Bike (Singles, sentiers naturels & chemins forestiers)"
              >
                <Mountain className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">VTT</span>
              </button>
              <button
                onClick={() => onActivityChange('hike')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activity === 'hike'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                title="Randonnées à pied et sentiers pédestres"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">À pied</span>
              </button>
            </div>

            {/* Middle Controls (Distance & Zone Dropdowns) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* City Search Trigger Pill */}
              <div
                className={`inline-flex items-center rounded-xl border transition-all text-xs font-semibold ${
                  hasLocationFilter
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsCitySearchOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 cursor-pointer text-left"
                  title="Rechercher une ville pour centrer la carte et filtrer les circuits"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap font-bold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs max-w-[85px] sm:max-w-[125px] truncate">
                    {hasLocationFilter && currentLocation ? currentLocation : 'Ville'}
                  </span>
                  {!hasLocationFilter && <Search className="w-3 h-3 text-slate-400 shrink-0" />}
                </button>

                {hasLocationFilter && onResetCity && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetCity();
                    }}
                    className="p-1 pr-1.5 sm:pr-2 hover:text-rose-600 dark:hover:text-rose-400 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer flex items-center justify-center"
                    title="Supprimer ce filtre de ville (réinitialiser à toute la région)"
                    aria-label="Supprimer le filtre de ville"
                  >
                    <X className="w-3.5 h-3.5 hover:scale-115 transition-transform" />
                  </button>
                )}
              </div>

              {/* Distance Dropdown Menu (Direct 1-click selection) */}
              <div className="relative" ref={distanceMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsDistanceOpen(!isDistanceOpen);
                    if (isDistanceOpen) setShowCustomDistance(false);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDistanceOpen
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Choisir rapidement une distance"
                  aria-haspopup="true"
                  aria-expanded={isDistanceOpen}
                >
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hidden xs:inline">⚡</span>
                  <span className="whitespace-nowrap font-bold font-mono-kpi text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs">
                    {distance[0]}–{distance[1]} km
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform ${
                      isDistanceOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu attached under the pill */}
                {isDistanceOpen && (
                  <div
                    className="fixed inset-x-3 sm:absolute sm:inset-x-auto sm:top-full sm:mt-1.5 sm:right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_50px_-10px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-slate-700/90 p-1.5 sm:w-72 z-[550] animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      top: typeof window !== 'undefined' && window.innerWidth < 640
                        ? 'calc(env(safe-area-inset-top, 0px) + 5.6rem)'
                        : undefined
                    }}
                  >
                    <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Distance du parcours
                      </span>
                      <span className="text-[10px] font-bold font-mono-kpi px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {distance[0]}–{distance[1]} km
                      </span>
                    </div>

                    {/* Presets List - 1-Click Fast Selection */}
                    <div className="space-y-0.5">
                      {distancePresets.map((preset) => {
                        const isSelected =
                          distance[0] === preset.range[0] && distance[1] === preset.range[1];
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              onDistanceChange(preset.range);
                              setIsDistanceOpen(false);
                              setShowCustomDistance(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base leading-none shrink-0">{preset.icon}</span>
                              <div className="min-w-0">
                                <div
                                  className={`text-xs font-bold font-mono-kpi ${
                                    isSelected
                                      ? 'text-white'
                                      : 'text-slate-800 dark:text-slate-100'
                                  }`}
                                >
                                  {preset.label}
                                </div>
                                <div
                                  className={`text-[10px] truncate ${
                                    isSelected
                                      ? 'text-emerald-100'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {preset.desc}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Expandable Precision Slider */}
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      {!showCustomDistance ? (
                        <button
                          type="button"
                          onClick={() => setShowCustomDistance(true)}
                          className="w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Curseur au kilomètre près...</span>
                        </button>
                      ) : (
                        <div className="pt-2 px-1 pb-1 space-y-2">
                          <TouchDistanceSelector
                            activity={activity}
                            distance={distance}
                            onChange={onDistanceChange}
                            compact={true}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsDistanceOpen(false);
                              setShowCustomDistance(false);
                            }}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
                          >
                            Appliquer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* Quick User Tracks Pill */}
              {userTracksCount > 0 && onSourceFilterChange && (
                <button
                  onClick={() =>
                    onSourceFilterChange(sourceFilter === 'imported' ? 'all' : 'imported')
                  }
                  className={`hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    sourceFilter === 'imported'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                  title="Afficher uniquement mes traces importées"
                >
                  <span className="text-xs">📍</span>
                  <span className="hidden lg:inline text-[11px]">Mes Traces</span>
                  <span
                    className={`text-[10px] font-black font-mono-kpi px-1.5 rounded-full ${
                      sourceFilter === 'imported' ? 'bg-white text-emerald-800' : 'bg-emerald-200/60 dark:bg-emerald-900'
                    }`}
                  >
                    {userTracksCount}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Clear All Filters + Full Filters Modal Button + Circuit Counter */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Direct 1-Click "Enlever tous les filtres" Button in Top Bar */}
              {hasAnyActiveFilter && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200/90 dark:border-rose-800/80 bg-rose-50/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 hover:border-rose-300 transition-all shadow-2xs active:scale-95 cursor-pointer touch-manipulation"
                  title="Enlever tous les filtres et afficher toutes les traces"
                  aria-label="Enlever tous les filtres"
                >
                  <FilterX className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">Sans filtre</span>
                </button>
              )}

              {/* Full Filters Button with Badge */}
              <button
                onClick={() => setIsAllFiltersOpen(true)}
                className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  nonDefaultFiltersCount > 0
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="Ouvrir tous les filtres de sélection de circuits"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Filtres</span>
                {nonDefaultFiltersCount > 0 && (
                  <span
                    className={`text-[10px] font-black font-mono-kpi px-1.5 py-0.2 rounded-full ${
                      nonDefaultFiltersCount > 0
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {nonDefaultFiltersCount}
                  </span>
                )}
              </button>

              {/* Circuits Counter Badge */}
              <div
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-bold font-mono-kpi shrink-0"
                title={`${routesCount} circuits trouvés dans ce secteur`}
              >
                {isGenerating ? (
                  <span className="animate-spin h-3 w-3 border-2 border-emerald-600 rounded-full border-t-transparent" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                )}
                <span>
                  {routesCount} <span className="hidden lg:inline font-sans">{routesCount > 1 ? 'circuits' : 'circuit'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Horizontal Scrollable Quick-Filter Chips Bar (Visible on Phone, Tablet & Desktop) */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 scroll-smooth">
            {/* Quick Favorites Filter Chip */}
            {favoritesCount > 0 && (
              <button
                type="button"
                onClick={() => onToggleFilter('favorites')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border backdrop-blur-xl cursor-pointer ${
                  activeFilters.includes('favorites')
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 shadow-md shadow-orange-500/25 ring-1 ring-amber-300'
                    : 'bg-white/95 dark:bg-slate-900/95 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs'
                }`}
                title="Filtrer pour n'afficher que mes circuits favoris enregistrés"
              >
                <span>⭐</span>
                <span>Mes favoris ({favoritesCount})</span>
                {activeFilters.includes('favorites') && <Check className="w-3 h-3 text-white" />}
              </button>
            )}

            {/* Quick Mushroom Spots Filter Chip */}
            {mushroomSpotsCount > 0 && (
              <button
                type="button"
                onClick={() => onToggleFilter('mushrooms')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border backdrop-blur-xl cursor-pointer ${
                  activeFilters.includes('mushrooms')
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400 shadow-md shadow-orange-600/25 ring-1 ring-orange-300'
                    : 'bg-white/95 dark:bg-slate-900/95 text-orange-800 dark:text-orange-300 border-orange-300/80 dark:border-orange-900/60 hover:bg-orange-50 dark:hover:bg-orange-950/40 shadow-xs'
                }`}
                title="Filtrer pour afficher les circuits étiquetés ou proches de mes coins à champignons"
              >
                <span>🍄</span>
                <span>Coins champignons ({mushroomSpotsCount})</span>
                {activeFilters.includes('mushrooms') && <Check className="w-3 h-3 text-white" />}
              </button>
            )}

            {MAP_FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilters.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => onToggleFilter(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border backdrop-blur-xl cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400/30'
                      : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-white/70 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-xs'
                  }`}
                  title={opt.description}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  />
                  <span>{opt.shortLabel}</span>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Premium Filter Drawer / Modal */}
      {isAllFiltersOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Filtres de sélection</h3>
                  <p className="text-[11px] text-stone-500">
                    Circuits outdoor sur mesure · Vélo & Randonnée
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllFiltersOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-stone-700">
              {/* Activity Selection */}
              <section>
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-2">
                  Pratique sportive
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onActivityChange('bike', 'road')}
                    className={`py-2.5 px-1.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                      activity === 'bike' && bikeType !== 'vtt'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span className="text-[11px] sm:text-xs">Route & Pistes</span>
                  </button>
                  <button
                    onClick={() => onActivityChange('bike', 'vtt')}
                    className={`py-2.5 px-1.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                      activity === 'bike' && bikeType === 'vtt'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Mountain className="w-4 h-4" />
                    <span className="text-[11px] sm:text-xs">VTT</span>
                  </button>
                  <button
                    onClick={() => onActivityChange('hike')}
                    className={`py-2.5 px-1.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                      activity === 'hike'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span className="text-[11px] sm:text-xs">Randonnée</span>
                  </button>
                </div>
              </section>

              {/* Ville / Commune de référence */}
              <section className="bg-stone-50/70 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-stone-200/70 dark:border-slate-700/70">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-slate-400">
                    Ville / Commune de départ
                  </label>
                  {hasLocationFilter && onResetCity && (
                    <button
                      onClick={() => {
                        onResetCity();
                        setIsAllFiltersOpen(false);
                      }}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Réinitialiser (Toute la région)
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsAllFiltersOpen(false);
                      setIsCitySearchOpen(true);
                    }}
                    className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-stone-800 dark:text-white hover:border-emerald-500 transition-all font-medium text-xs text-left cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold truncate">
                        {hasLocationFilter && currentLocation ? currentLocation : 'Toutes les villes (cliquez pour choisir)'}
                      </span>
                    </span>
                    <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
                  </button>
                  {hasLocationFilter && onResetCity && (
                    <button
                      type="button"
                      onClick={() => onResetCity()}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 hover:border-rose-400 text-stone-500 hover:text-rose-600 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                      title="Supprimer ce filtre de ville"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </section>

              {/* Recherche par mot-clé */}
              {onSearchQueryChange && (
                <section>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1.5">
                    Recherche par mot-clé
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: lac, mullerthal, forêt, nom de trace..."
                      value={searchQuery}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-emerald-600 font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => onSearchQueryChange('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Origine des parcours & Carnets de voyage */}
              {onSourceFilterChange && (
                <section className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/70 space-y-2.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">
                    Origine des circuits
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onSourceFilterChange('all')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        sourceFilter === 'all'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => onSourceFilterChange('imported')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        sourceFilter === 'imported'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>📍 Mes traces</span>
                      {userTracksCount > 0 && (
                        <span className="text-[9px] px-1 rounded-full bg-stone-200/60 text-stone-800">
                          {userTracksCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onSourceFilterChange('official')}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        sourceFilter === 'official'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      Officiels
                    </button>
                  </div>

                  {/* Filtre par carnet de voyage si des voyages existent */}
                  {tripsList.length > 0 && onSelectTrip && (
                    <div className="pt-2 border-t border-stone-200/60">
                      <label className="text-[10px] font-bold text-stone-500 block mb-1">
                        Filtrer par séjour / carnet de voyage :
                      </label>
                      <select
                        value={selectedTrip || ''}
                        onChange={(e) => onSelectTrip(e.target.value || null)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl font-medium focus:outline-emerald-600"
                      >
                        <option value="">Tous les séjours / voyages</option>
                        {tripsList.map((tr) => (
                          <option key={tr} value={tr}>
                            ✈️ {tr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </section>
              )}

              {/* Dénivelé D+ personnalisé */}
              {onDPlusFilterChange && (
                <section>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-2">
                    Dénivelé positif (D+)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <button
                      onClick={() => onDPlusFilterChange('all')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                        dPlusFilter === 'all'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => onDPlusFilterChange('flat')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                        dPlusFilter === 'flat'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                      title="Moins de 200m de dénivelé"
                    >
                      Plat (&lt;200m)
                    </button>
                    <button
                      onClick={() => onDPlusFilterChange('moderate')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                        dPlusFilter === 'moderate'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                      title="Entre 200m et 600m de dénivelé"
                    >
                      200–600m
                    </button>
                    <button
                      onClick={() => onDPlusFilterChange('hilly')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                        dPlusFilter === 'hilly'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                      title="Plus de 600m de dénivelé"
                    >
                      Sportif (&gt;600m)
                    </button>
                  </div>
                </section>
              )}

              {/* Modern Touch Distance Selector */}
              <section className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/70">
                <TouchDistanceSelector
                  activity={activity}
                  distance={distance}
                  onChange={onDistanceChange}
                />
              </section>

              {/* Safety & Road Type Filters */}
              <section>
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-2">
                  Sécurité & Voies Réservées
                </label>
                <div className="space-y-1.5">
                  {MAP_FILTER_OPTIONS.filter((f) => f.category === 'safety').map((opt) => {
                    const isActive = activeFilters.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onToggleFilter(opt.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs'
                            : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{opt.label}</div>
                            <div className="text-[11px] text-stone-500">{opt.description}</div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isActive && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Terrain & Scenery Criteria */}
              <section>
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-2">
                  Environnement & Relief
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MAP_FILTER_OPTIONS.filter((f) => f.category !== 'safety').map((opt) => {
                    const isActive = activeFilters.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onToggleFilter(opt.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs'
                            : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isActive ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{opt.label}</div>
                          <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                            {opt.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
              <button
                onClick={onClearFilters}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Enlever tous les filtres</span>
              </button>
              <button
                onClick={() => setIsAllFiltersOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Voir les {routesCount} circuits</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* City Search Modal */}
      <CitySearchModal
        isOpen={isCitySearchOpen}
        onClose={() => setIsCitySearchOpen(false)}
        onSelectCity={(city) => {
          if (onSelectCity) onSelectCity(city);
        }}
        onResetToAll={onResetCity}
        currentLocation={currentLocation}
        userCoords={userCoords}
      />
    </>
  );
}
