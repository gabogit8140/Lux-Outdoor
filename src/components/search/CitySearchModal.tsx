import { isGenericHomepageUrl } from '../../lib/routeSourceResolver';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MapPin,
  X,
  Check,
  Globe,
  ArrowRight,
  CornerDownLeft,
  ExternalLink,
  Sparkles,
  Navigation,
} from 'lucide-react';
import {
  GAZETTEER,
  searchPlaces,
  haversineDistanceKm,
  getCountryFlag,
  getCountryLabel,
  type PlaceEntry,
  type PlaceCategory,
} from '../../lib/routing/gazetteer';
import { SAFE_AREA_TOP_POPOVER } from '../../lib/layout/safeArea';

export interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: PlaceEntry) => void;
  onResetToAll?: () => void;
  currentLocation?: string;
  userCoords?: [number, number] | null;
}

const POPULAR_CITY_KEYS = [
  'luxembourg',
  'vianden-chateau',
  'schiessentuempel-cascade',
  'echternach',
  'bourscheid-chateau',
  'bouillon-chateau',
  'saarschleife-cloef',
  'burg-eltz',
  'porta-nigra-trier',
  'citadelle-bitche',
  'drielandenpunt-vaals',
  'lac-haute-sure-burfelt',
  'bastogne-war-museum',
  'herou-nisramont',
  'fond-de-Gras-minett',
];

function getCategoryBadge(category?: PlaceCategory) {
  switch (category) {
    case 'castle':
      return {
        label: 'Château fort',
        icon: '🏰',
        badgeClass:
          'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      };
    case 'nature':
      return {
        label: 'Site naturel & Gorges',
        icon: '🌲',
        badgeClass:
          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    case 'lake':
      return {
        label: 'Lac & Cascade',
        icon: '🌊',
        badgeClass:
          'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      };
    case 'viewpoint':
      return {
        label: 'Belvédère & Panorama',
        icon: '🌄',
        badgeClass:
          'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    case 'heritage':
      return {
        label: 'Patrimoine UNESCO & Histoire',
        icon: '🏛️',
        badgeClass:
          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      };
    case 'city':
    default:
      return {
        label: 'Commune / Ville',
        icon: '🏙️',
        badgeClass:
          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      };
  }
}

export function CitySearchModal({
  isOpen,
  onClose,
  onSelectCity,
  onResetToAll,
  currentLocation,
  userCoords,
}: CitySearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<
    'ALL' | 'LU' | 'BE' | 'DE' | 'FR' | 'NL'
  >('ALL');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'ALL'>('ALL');
  const [sortByDistance, setSortByDistance] = useState(true);
  const [liveGpsCoords, setLiveGpsCoords] = useState<[number, number] | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened & attempt live GPS
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLiveGpsCoords([pos.coords.longitude, pos.coords.latitude]);
          },
          (err) => {
            console.debug('[POI Search] Geolocation:', err.message);
          },
          { timeout: 8000, maximumAge: 60000 }
        );
      }
    }
  }, [isOpen]);

  // Unified user coordinates [lon, lat]
  const effectiveUserCoords = useMemo<[number, number]>(() => {
    if (liveGpsCoords) return liveGpsCoords;
    if (userCoords) {
      if (userCoords[0] > 35) {
        return [userCoords[1], userCoords[0]];
      }
      return userCoords;
    }
    // Fallback: Luxembourg-Ville center
    return [6.131935, 49.611622];
  }, [liveGpsCoords, userCoords]);

  // Results computed with searchPlaces across countries, categories and distance
  const results = useMemo(() => {
    return searchPlaces(
      query,
      50,
      selectedCountry,
      selectedCategory,
      effectiveUserCoords,
      sortByDistance
    );
  }, [query, selectedCountry, selectedCategory, effectiveUserCoords, sortByDistance]);

  // Popular shortcuts
  const popularCities = useMemo(() => {
    return POPULAR_CITY_KEYS.map((k) => GAZETTEER.find((p) => p.key === k)).filter(
      Boolean
    ) as PlaceEntry[];
  }, []);

  // Reset highlight on query/country/category change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, selectedCountry, selectedCategory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0
        );
      } else if (e.key === 'Enter') {
        if (results[highlightedIndex]) {
          e.preventDefault();
          onSelectCity(results[highlightedIndex]);
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, highlightedIndex, onSelectCity, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-highlighted="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1600] flex items-start justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ marginTop: SAFE_AREA_TOP_POPOVER }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche de villes, communes et points d'intérêt"
      >
        {/* Header / Search Input */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  Villes & Points d'intérêt (POI)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {GAZETTEER.length} communes & sites d'exception à 200 km à la ronde
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Vianden, Bouillon, Burg Eltz, Schiessentümpel, Consdorf, Bitche..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-emerald-600 focus:border-emerald-600 text-slate-900 dark:text-white font-semibold placeholder:font-normal placeholder:text-slate-400 shadow-2xs"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Country Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {[
              { id: 'ALL', label: 'Tout (200 km)', flag: '🌍' },
              { id: 'LU', label: 'Luxembourg', flag: '🇱🇺' },
              { id: 'BE', label: 'Belgique', flag: '🇧🇪' },
              { id: 'DE', label: 'Allemagne', flag: '🇩🇪' },
              { id: 'FR', label: 'France', flag: '🇫🇷' },
              { id: 'NL', label: 'Pays-Bas', flag: '🇳🇱' },
            ].map((c) => {
              const isSelected = selectedCountry === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountry(c.id as any)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Chips (POI Types) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {[
              { id: 'ALL', label: 'Tous types', icon: '🌟' },
              { id: 'city', label: 'Villes & Communes', icon: '🏙️' },
              { id: 'castle', label: 'Châteaux & Forts', icon: '🏰' },
              { id: 'nature', label: 'Gorges & Rochers', icon: '🌲' },
              { id: 'lake', label: 'Lacs & Cascades', icon: '🌊' },
              { id: 'viewpoint', label: 'Belvédères', icon: '🌄' },
              { id: 'heritage', label: 'Patrimoine & Histoire', icon: '🏛️' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Sub-bar: Count & Distance Filter Toggle */}
          <div className="flex items-center justify-between text-xs pt-1 px-1 border-t border-slate-100/80 dark:border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {results.length} {results.length > 1 ? 'lieux disponibles' : 'lieu disponible'}
            </span>
            <button
              type="button"
              onClick={() => setSortByDistance(!sortByDistance)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                sortByDistance
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-700'
              }`}
              title={
                liveGpsCoords
                  ? 'Trié par distance croissante depuis votre position GPS actuelle'
                  : 'Trié par distance croissante'
              }
            >
              <Navigation
                className={`w-3 h-3 transition-transform ${
                  sortByDistance ? 'text-emerald-600 rotate-45' : 'text-slate-400'
                }`}
              />
              <span>Distance croissante</span>
              {sortByDistance && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="p-2 sm:p-3 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {results.length > 0 ? (
            results.map((place, idx) => {
              const isCurrent =
                currentLocation &&
                currentLocation.toLowerCase().trim() === place.name.toLowerCase().trim();
              const isHighlighted = idx === highlightedIndex;
              const badge = getCategoryBadge(place.category);
              const distKm = haversineDistanceKm(effectiveUserCoords, place.coords);

              return (
                <div
                  key={place.key}
                  data-highlighted={isHighlighted ? 'true' : 'false'}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    onSelectCity(place);
                    onClose();
                  }}
                  className={`w-full flex items-start justify-between p-3 rounded-2xl text-left transition-all cursor-pointer group ${
                    isHighlighted
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl shrink-0 select-none pt-0.5">
                      {getCountryFlag(place.country)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                          {place.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{place.categoryLabel || badge.label}</span>
                        </span>
                        {/* Badge de distance à la position actuelle */}
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold font-mono-kpi px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 shrink-0">
                          <Navigation className="w-2.5 h-2.5 text-emerald-600 rotate-45" />
                          <span>{distKm} km</span>
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            <Check className="w-2.5 h-2.5" />
                            Actuelle
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {place.region} · {getCountryLabel(place.country)}
                      </p>

                      {place.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {place.description}
                        </p>
                      )}

                      {/* Official Web Link for POI / Attraction */}
                      {place.url && !isGenericHomepageUrl(place.url) && (
                        <div className="mt-2">
                          <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-2xs"
                            title={`Ouvrir le guide officiel : ${place.urlLabel || place.name}`}
                          >
                            <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[240px]">
                              {place.urlLabel || 'Fiche & Guide officiel'}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-70 shrink-0 ml-0.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Centrer
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isHighlighted
                          ? 'translate-x-0.5 text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Aucun lieu trouvé pour « {query} »
              </p>
              <p className="mt-1">
                Essayez un autre mot-clé (ex: château, cascade, lac, commune) ou sélectionnez «
                Tous » les pays et types.
              </p>
            </div>
          )}

          {/* Popular Shortcuts section if query is empty */}
          {!query && (
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-2 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Sites incontournables & Départs populaires</span>
              </span>
              <div className="flex flex-wrap gap-1.5 px-2">
                {popularCities.map((c) => {
                  const pDist = haversineDistanceKm(effectiveUserCoords, c.coords);
                  return (
                    <button
                      key={c.key}
                      onClick={() => {
                        onSelectCity(c);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-all border border-slate-200/60 dark:border-slate-700 cursor-pointer shadow-2xs"
                    >
                      <span>{getCountryFlag(c.country)}</span>
                      <span>{c.name}</span>
                      <span className="text-[10px] font-mono-kpi font-extrabold text-emerald-600 dark:text-emerald-400 opacity-90">
                        {pDist} km
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Reset button & Keyboard Tip */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          {onResetToAll ? (
            <button
              onClick={() => {
                onResetToAll();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Voir toute la région (200 km)</span>
            </button>
          ) : (
            <span />
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded font-mono text-[10px]">
              <CornerDownLeft className="w-2.5 h-2.5" /> Entrée
            </span>
            <span>pour centrer la carte</span>
          </div>
        </div>
      </div>
    </div>
  );
}
