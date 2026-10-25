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
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Gauge,
  Layers,
  Repeat,
} from 'lucide-react';
import { TouchDistanceSelector } from './TouchDistanceSelector';
import { isRegionalZoneLocation } from '../lib/localRouting';
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
  onActivityChange: (activity: 'bike' | 'hike') => void;
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
}

export function MapFilterBar({
  activity,
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
}: MapFilterBarProps) {
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);

  const distanceMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (distanceMenuRef.current && !distanceMenuRef.current.contains(e.target as Node)) {
        setIsDistanceOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bikeDistancePresets: { label: string; range: [number, number]; desc: string }[] = [
    { label: '45–60 km', range: [45, 60], desc: 'Sortie classique (défaut)' },
    { label: '< 30 km', range: [15, 30], desc: 'Balade rapide (1h–1h30)' },
    { label: '30–45 km', range: [30, 45], desc: 'Sortie modérée (2h)' },
    { label: '60–85 km', range: [60, 85], desc: 'Endurance sportive (3h–4h30)' },
    { label: '85+ km', range: [85, 120], desc: 'Grande aventure / Gran Fondo' },
    { label: 'Toutes', range: [15, 120], desc: 'Vue panoramique (toutes les traces)' },
  ];

  const hikeDistancePresets: { label: string; range: [number, number]; desc: string }[] = [
    { label: '7–10 km', range: [7, 10], desc: 'Rando classique (défaut)' },
    { label: '< 7 km', range: [3, 7], desc: 'Promenade courte (1h–1h30)' },
    { label: '10–15 km', range: [10, 15], desc: 'Demi-journée (2h30–3h30)' },
    { label: '15–22 km', range: [15, 22], desc: 'Randonnée sportive' },
    { label: '18+ km', range: [18, 35], desc: 'Grande randonnée / Trail' },
    { label: 'Toutes', range: [3, 35], desc: 'Vue panoramique (toutes les traces)' },
  ];

  const distancePresets = activity === 'bike' ? bikeDistancePresets : hikeDistancePresets;

  const minRange = activity === 'bike' ? 15 : 3;
  const maxRange = activity === 'bike' ? 120 : 35;
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
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_35px_-5px_rgba(15,23,42,0.16)] border border-white/70 dark:border-slate-700/80 p-1 sm:p-1.5 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar min-w-0">
            {/* Left: Sport / Activity Segmented Control */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => onActivityChange('bike')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activity === 'bike'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                title="Circuits à vélo (cyclotourisme, gravel, route)"
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vélo</span>
              </button>
              <button
                onClick={() => onActivityChange('hike')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              {/* Distance Popover Button */}
              <div className="relative" ref={distanceMenuRef}>
                <button
                  onClick={() => {
                    setIsDistanceOpen(!isDistanceOpen);
                    setIsZoneOpen(false);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDistanceOpen
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Ajuster la distance recherchée"
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

                {/* Distance Dropdown Popover (Mobile full-width card, Tablet/Desktop anchored popover) */}
                {isDistanceOpen && (
                  <div
                    className="fixed inset-x-3 sm:absolute sm:inset-x-auto sm:top-11 sm:right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 sm:w-80 z-[500] animate-in fade-in zoom-in-95"
                    style={{ top: SAFE_AREA_TOP_POPOVER }}
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Distance souhaitée</span>
                        <span className="text-[11px] font-bold font-mono-kpi text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {distance[0]} à {distance[1]} km
                        </span>
                      </span>
                      <button
                        onClick={() => setIsDistanceOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Modern Touch Distance Selector */}
                    <TouchDistanceSelector
                      activity={activity}
                      distance={distance}
                      onChange={onDistanceChange}
                      compact={true}
                    />

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => setIsDistanceOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-sm"
                      >
                        Appliquer
                      </button>
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200/90 dark:border-rose-800/80 bg-rose-50/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 hover:border-rose-300 transition-all shadow-2xs active:scale-95 cursor-pointer touch-manipulation"
                  title="Enlever tous les filtres et afficher toutes les traces"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Sans filtre</span>
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onActivityChange('bike')}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      activity === 'bike'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Vélo / Gravel / Route</span>
                  </button>
                  <button
                    onClick={() => onActivityChange('hike')}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      activity === 'hike'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span>Randonnée à pied / Sentiers</span>
                  </button>
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
                <RotateCcw className="w-3.5 h-3.5" />
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
    </>
  );
}
