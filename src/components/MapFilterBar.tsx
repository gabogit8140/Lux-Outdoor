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
  Globe,
  RotateCcw,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Gauge,
  Layers,
} from 'lucide-react';
import { TouchDistanceSelector } from './TouchDistanceSelector';
import { REGIONAL_ZONES } from '../lib/localRouting';

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
  selectedZone: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  onSelectZone: (zone: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR') => void;
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
}

export function MapFilterBar({
  activity,
  onActivityChange,
  distance,
  onDistanceChange,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  selectedZone,
  onSelectZone,
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
}: MapFilterBarProps) {
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);
  const [isZoneOpen, setIsZoneOpen] = useState(false);
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);

  const distanceMenuRef = useRef<HTMLDivElement>(null);
  const zoneMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (distanceMenuRef.current && !distanceMenuRef.current.contains(e.target as Node)) {
        setIsDistanceOpen(false);
      }
      if (zoneMenuRef.current && !zoneMenuRef.current.contains(e.target as Node)) {
        setIsZoneOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeZoneObj = REGIONAL_ZONES.find((z) => z.id === selectedZone) || REGIONAL_ZONES[0];

  const bikeDistancePresets: { label: string; range: [number, number]; desc: string }[] = [
    { label: 'Toutes', range: [15, 120], desc: 'Vue panoramique (toutes les traces)' },
    { label: '< 30 km', range: [15, 30], desc: 'Balade rapide (1h–1h30)' },
    { label: '25–60 km', range: [25, 60], desc: 'Sortie classique (2h–3h)' },
    { label: '55–85 km', range: [55, 85], desc: 'Endurance sportive (3h–4h30)' },
    { label: '85+ km', range: [85, 120], desc: 'Grande aventure / Gran Fondo' },
  ];

  const hikeDistancePresets: { label: string; range: [number, number]; desc: string }[] = [
    { label: 'Toutes', range: [3, 35], desc: 'Vue panoramique (toutes les traces)' },
    { label: '5–18 km', range: [5, 18], desc: 'Classique & demi-journée (2h–4h)' },
    { label: '< 7 km', range: [3, 7], desc: 'Promenade courte (1h)' },
    { label: '7–12 km', range: [7, 12], desc: 'Auto-pédestres officiels (2h–3h)' },
    { label: '18+ km', range: [18, 35], desc: 'Grande randonnée / Trail' },
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
  const hasActiveCustomFilters =
    nonDefaultFiltersCount > 0 ||
    selectedZone !== 'ALL' ||
    (activity === 'bike'
      ? distance[0] !== 30 || distance[1] !== 50
      : distance[0] !== 7 || distance[1] !== 10);

  return (
    <>
      {/* Floating On-Map Bar Container */}
      <div className="absolute top-3 left-14 right-3 sm:right-16 md:right-20 z-[420] pointer-events-none flex flex-col gap-2">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-1.5">
          {/* Primary Top Island: Activity Switcher + Zone Dropdown + Distance Chip + Full Filters Button + Circuit Count */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/90 p-1.5 flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Left: Sport / Activity Segmented Control */}
            <div className="flex items-center bg-stone-100/90 p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => onActivityChange('bike')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activity === 'bike'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
                title="Circuits à vélo (cyclotourisme, gravel, route)"
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Vélo</span>
              </button>
              <button
                onClick={() => onActivityChange('hike')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activity === 'hike'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
                title="Randonnées à pied et sentiers pédestres"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">À pied</span>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDistanceOpen
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'bg-white border-stone-200/80 text-stone-700 hover:border-emerald-300 hover:bg-stone-50'
                  }`}
                  title="Ajuster la distance recherchée"
                >
                  <span className="text-[11px] font-bold text-emerald-700">⚡</span>
                  <span className="whitespace-nowrap font-bold text-stone-800">
                    {distance[0]}–{distance[1]} km
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-stone-400 transition-transform ${
                      isDistanceOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {/* Distance Dropdown Popover */}
                {isDistanceOpen && (
                  <div className="absolute top-11 left-0 sm:left-auto sm:right-0 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 p-4 w-72 sm:w-80 z-[500] animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span>Distance souhaitée</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {distance[0]} à {distance[1]} km
                        </span>
                      </span>
                      <button
                        onClick={() => setIsDistanceOpen(false)}
                        className="text-stone-400 hover:text-stone-600 p-1"
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

                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                      <button
                        onClick={() => setIsDistanceOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Transborder Zone Selector Button */}
              <div className="relative" ref={zoneMenuRef}>
                <button
                  onClick={() => {
                    setIsZoneOpen(!isZoneOpen);
                    setIsDistanceOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isZoneOpen
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'bg-white border-stone-200/80 text-stone-700 hover:border-emerald-300 hover:bg-stone-50'
                  }`}
                  title="Changer de zone transfrontalière (200 km)"
                >
                  <span className="text-sm">{activeZoneObj.flag}</span>
                  <span className="hidden md:inline font-bold text-stone-800">
                    {activeZoneObj.id === 'ALL' ? 'Grande Région' : activeZoneObj.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-stone-400 transition-transform ${
                      isZoneOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {/* Zone Dropdown Popover */}
                {isZoneOpen && (
                  <div className="absolute top-11 left-0 sm:left-auto sm:right-0 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 p-2.5 w-64 z-[500] animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1 mb-1.5 border-b border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        Zone (Rayon 200 km)
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">BE · DE · NL · LU · FR</span>
                    </div>

                    <div className="space-y-1">
                      {REGIONAL_ZONES.map((zone) => {
                        const isSelected = selectedZone === zone.id;
                        return (
                          <button
                            key={zone.id}
                            onClick={() => {
                              onSelectZone(zone.id);
                              setIsZoneOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                : 'hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{zone.flag}</span>
                              <span>{zone.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
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
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    sourceFilter === 'imported'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
                  }`}
                  title="Afficher uniquement mes traces importées"
                >
                  <span className="text-xs">📍</span>
                  <span className="hidden lg:inline text-[11px]">Mes Traces</span>
                  <span
                    className={`text-[10px] font-black px-1.5 rounded-full ${
                      sourceFilter === 'imported' ? 'bg-white text-emerald-800' : 'bg-emerald-200/60'
                    }`}
                  >
                    {userTracksCount}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Full Filters Modal Button + Circuit Counter */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Full Filters Button with Badge */}
              <button
                onClick={() => setIsAllFiltersOpen(true)}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  nonDefaultFiltersCount > 0
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white border-stone-200/90 text-stone-700 hover:border-emerald-300 hover:bg-stone-50'
                }`}
                title="Ouvrir tous les filtres de sélection de circuits"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtres</span>
                {nonDefaultFiltersCount > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
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
                className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100/90 border border-stone-200 text-stone-700 text-xs font-bold shrink-0"
                title={`${routesCount} circuits trouvés dans ce secteur`}
              >
                {isGenerating ? (
                  <span className="animate-spin h-3 w-3 border-2 border-emerald-600 rounded-full border-t-transparent" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span>
                  {routesCount} <span className="hidden sm:inline">{routesCount > 1 ? 'circuits' : 'circuit'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Horizontal Scrollable Quick-Filter Chips Bar (Desktop only, hidden on mobile) */}
          <div className="pointer-events-auto hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 scroll-smooth">
            {MAP_FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilters.includes(opt.id);
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => onToggleFilter(opt.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border backdrop-blur-md shadow-xs ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-700/20 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-white/95 text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-emerald-300'
                  }`}
                  title={opt.description}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-white' : 'text-emerald-700'
                    }`}
                  />
                  <span>{opt.shortLabel}</span>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}

            {/* Quick Reset Button if customized */}
            {hasActiveCustomFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 bg-white/90 border border-stone-200/80 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
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
                    Circuits outdoor sur mesure · Grande Région (200 km)
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

              {/* Regional Zone Selector */}
              <section>
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-2">
                  Secteur Géographique (Rayon 200 km)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {REGIONAL_ZONES.map((zone) => {
                    const isSelected = selectedZone === zone.id;
                    return (
                      <button
                        key={zone.id}
                        onClick={() => onSelectZone(zone.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="text-base">{zone.flag}</div>
                        <div className="text-[11px] font-bold mt-0.5 truncate">{zone.name.split(' ')[0]}</div>
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
                className="text-stone-500 hover:text-stone-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
              <button
                onClick={() => setIsAllFiltersOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-700/20 flex items-center gap-2"
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
