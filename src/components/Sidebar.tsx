import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Navigation,
  ListOrdered,
  Smartphone,
  FolderGit2,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { RouteSuggestions, RouteTrace } from '../types';
import { PlanTabContent } from './sidebar/PlanTabContent';
import { RouteDetailView } from './sidebar/RouteDetailView';
import { RouteCatalogList } from './sidebar/RouteCatalogList';
import { BrandLogo } from './ui/BrandLogo';
import type { UseRouteEditorReturn } from '../hooks/useRouteEditor';

export type MobileSheetSize = 'compact' | 'split' | 'tall';

interface SidebarProps {
  onGenerate: (
    location: string,
    distanceKm: [number, number],
    filters: string[],
    activity: 'bike' | 'hike',
    mapTracesOnly: boolean
  ) => void;
  onFilterMap: (
    location: string,
    distanceKm: [number, number],
    filters: string[],
    activity: 'bike' | 'hike',
    country?: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR'
  ) => void;
  onImportGPX: (content: string) => boolean;
  onReverseRoute: () => void;
  routes: RouteSuggestions[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  isGenerating: boolean;
  route: RouteSuggestions | null;
  trace: RouteTrace | null;
  traces?: Record<string, RouteTrace>;
  onSaveFavorite: (userRating?: number, userNotes?: string) => void;
  activity: 'bike' | 'hike';
  onActivityChange: (activity: 'bike' | 'hike') => void;
  distance: [number, number];
  setDistance: (d: [number, number]) => void;
  activeFilters: string[];
  setActiveFilters: (f: string[]) => void;
  selectedZone?: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  onSelectZone?: (zone: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR') => void;
  onOpenInstallModal?: () => void;
  onOpenGpxModal?: () => void;
  isInstalled?: boolean;
  currentLocation?: string;
  onLocationChange?: (loc: string) => void;
  clickedCoord?: { lat: number; lng: number; name: string } | null;
  onClose?: () => void;
  isTraceVisible?: boolean;
  onToggleTraceVisibility?: () => void;
  onDeselectRoute?: () => void;
  hoveredRouteId?: string | null;
  onHoverRoute?: (id: string | null) => void;
  onHoverDistance?: (distanceKm: number | null) => void;
  isHoverPreview?: boolean;
  mapInteractedTrigger?: number;
  mobileSheetSize?: MobileSheetSize;
  onChangeMobileSheetSize?: (size: MobileSheetSize) => void;
  onClearAllFilters?: () => void;
  showHuntingBattues?: boolean;
  onToggleHuntingBattues?: () => void;
  onEditRoute?: (route: RouteSuggestions, trace: RouteTrace) => void;
  onStartCreateRoute?: () => void;
  editor?: UseRouteEditorReturn;
  onStartNavigation?: (route: RouteSuggestions, trace: RouteTrace) => void;
  isNavigating?: boolean;
}

export function Sidebar({
  onGenerate,
  onFilterMap,
  onImportGPX,
  onOpenGpxModal,
  onReverseRoute,
  routes,
  selectedRouteId,
  onSelectRoute,
  isGenerating,
  route,
  trace,
  traces = {},
  onSaveFavorite,
  activity,
  onActivityChange,
  distance,
  setDistance,
  activeFilters,
  setActiveFilters,
  selectedZone,
  onSelectZone,
  onOpenInstallModal,
  isInstalled,
  currentLocation,
  onLocationChange,
  clickedCoord,
  onClose,
  isTraceVisible = true,
  onToggleTraceVisibility,
  onDeselectRoute,
  hoveredRouteId,
  onHoverRoute,
  onHoverDistance,
  isHoverPreview = false,
  mapInteractedTrigger = 0,
  mobileSheetSize = 'split',
  onChangeMobileSheetSize,
  onClearAllFilters,
  showHuntingBattues,
  onToggleHuntingBattues,
  onEditRoute,
  onStartCreateRoute,
  editor,
  onStartNavigation,
  isNavigating,
}: SidebarProps) {
  const [location, setLocation] = useState(currentLocation || 'Luxembourg');
  const [tab, setTab] = useState<'plan' | 'result' | 'catalog'>('catalog');

  // Sync location with parent state
  useEffect(() => {
    if (currentLocation) {
      setLocation(currentLocation);
    }
  }, [currentLocation]);

  // Real user rating & notes
  const [pendingRating, setPendingRating] = useState<number>(0);
  const [pendingNotes, setPendingNotes] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync personal notes and automatically open the right-hand profile when a route is selected or hovered on the map
  useEffect(() => {
    if (route) {
      setPendingRating(route.userRating || 0);
      setPendingNotes(route.userNotes || '');
    } else if (!route && tab === 'result') {
      setTab('catalog');
    }
  }, [route?.id]);

  // Bascule automatiquement sur la vue détaillée quand le mode éditeur de tracé s'active
  useEffect(() => {
    if (editor?.isEditorActive) {
      setTab('result');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [editor?.isEditorActive]);

  // Whenever the user clicks or hovers a trace on the map, or selects a route, display the profile tab on the right
  useEffect(() => {
    if (route && (selectedRouteId || mapInteractedTrigger > 0)) {
      setTab('result');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [selectedRouteId, mapInteractedTrigger]);

  const handleGenerate = (isMapTracesOnly: boolean) => {
    onGenerate(location, distance, activeFilters, activity, isMapTracesOnly);
    setTab('result');
  };

  const handleFilter = () => {
    onFilterMap(location, distance, activeFilters, activity, selectedZone || 'ALL');
    setTab('catalog');
  };

  const handleSelectLocation = (
    locName: string,
    targetCountry?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR'
  ) => {
    setLocation(locName);
    if (onLocationChange) onLocationChange(locName);
    onFilterMap(locName, distance, activeFilters, activity, targetCountry || selectedZone || 'ALL');
  };

  const toggleFilter = (id: string) => {
    const nextFilters = activeFilters.includes(id)
      ? activeFilters.filter((f) => f !== id)
      : [...activeFilters, id];
    setActiveFilters(nextFilters);
    onFilterMap(location, distance, nextFilters, activity, selectedZone || 'ALL');
  };

  const cycleMobileSize = () => {
    if (!onChangeMobileSheetSize) return;
    if (mobileSheetSize === 'compact') onChangeMobileSheetSize('split');
    else if (mobileSheetSize === 'split') onChangeMobileSheetSize('tall');
    else onChangeMobileSheetSize('compact');
  };

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-slate-900 px-3 pt-2 pb-3 sm:p-4 text-slate-800 dark:text-slate-100 transition-colors"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      {/* Mobile Interactive Split-View Bar (Tap to resize sheet while keeping map visible) */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800/80 md:hidden shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <BrandLogo size="sm" />
          <span className="font-extrabold text-xs text-slate-900 dark:white truncate">
            Lux Outdoor
          </span>
        </div>

        {/* Mobile Sheet Height Presets + Close Button */}
        <div className="flex items-center gap-1 shrink-0">
          {onChangeMobileSheetSize && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onChangeMobileSheetSize('compact')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  mobileSheetSize === 'compact'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title="Vue compacte (70% carte visible)"
              >
                Mini
              </button>
              <button
                type="button"
                onClick={() => onChangeMobileSheetSize('split')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  mobileSheetSize === 'split'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title="Vue partagée 50/50 (carte + profil)"
              >
                50/50
              </button>
              <button
                type="button"
                onClick={() => onChangeMobileSheetSize('tall')}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  mobileSheetSize === 'tall'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                title="Vue détaillée (carte toujours visible en haut)"
              >
                Détails
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={cycleMobileSize}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Ajuster la hauteur du panneau"
            aria-label="Ajuster la hauteur du panneau"
          >
            {mobileSheetSize === 'tall' ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Replier le panneau (100% carte)"
              aria-label="Fermer le panneau"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Studio Brand Header (Tablet & Desktop >= 768px) */}
      <div className="hidden md:flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                Lux Outdoor
              </h1>
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Circuits vélo & randonnée
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenGpxModal && (
            <button
              onClick={onOpenGpxModal}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Base GPX & Dépose de traces"
              aria-label="Base GPX"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
          {onOpenInstallModal && !isInstalled && (
            <button
              onClick={onOpenInstallModal}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Installer l'application hors-ligne"
              aria-label="Installer l'application"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Masquer le panneau latéral (plein écran carte)"
              aria-label="Fermer le panneau"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Pill Navigation Control */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl my-1.5 md:my-3 shrink-0 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
        <button
          onClick={() => setTab('plan')}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'plan'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Planifier</span>
        </button>

        <button
          onClick={() => setTab('result')}
          disabled={!route}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
            tab === 'result'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Itinéraire</span>
        </button>

        <button
          onClick={() => setTab('catalog')}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            tab === 'catalog'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Traces</span>
          <span className="text-[10px] font-mono-kpi px-1.5 py-0.2 rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300">
            {routes.length}
          </span>
        </button>
      </div>

      {/* Tab Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4">
        {tab === 'plan' && (
          <PlanTabContent
            activity={activity}
            onActivityChange={onActivityChange}
            location={location}
            setLocation={setLocation}
            onSelectLocation={handleSelectLocation}
            distance={distance}
            setDistance={setDistance}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            onImportGPX={onImportGPX}
            onFilterMap={handleFilter}
            onClearAllFilters={onClearAllFilters}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onStartCreateRoute={onStartCreateRoute}
            onOpenLoopModal={editor?.openLoopModal}
          />
        )}

        {tab === 'result' && route && (
          <RouteDetailView
            route={route}
            trace={trace}
            activity={activity}
            pendingRating={pendingRating}
            setPendingRating={setPendingRating}
            pendingNotes={pendingNotes}
            setPendingNotes={setPendingNotes}
            onSaveFavorite={onSaveFavorite}
            onReverseRoute={onReverseRoute}
            isTraceVisible={isTraceVisible}
            onToggleTraceVisibility={onToggleTraceVisibility}
            onDeselect={onDeselectRoute}
            onHoverDistance={onHoverDistance}
            isHoverPreview={isHoverPreview}
            onLockRoute={(id) => onSelectRoute(id)}
            onBackToCatalog={() => setTab('catalog')}
            showHuntingBattues={showHuntingBattues}
            onToggleHuntingBattues={onToggleHuntingBattues}
            onEditRoute={onEditRoute}
            editor={editor}
            onStartNavigation={onStartNavigation}
            isNavigating={isNavigating}
          />
        )}

        {tab === 'catalog' && (
          <RouteCatalogList
            routes={routes}
            traces={traces}
            selectedRouteId={selectedRouteId}
            hoveredRouteId={hoveredRouteId}
            onSelectRoute={(id) => {
              onSelectRoute(id);
              setTab('result');
            }}
            onHoverRoute={onHoverRoute}
            location={location}
            distance={distance}
            activity={activity}
            clickedCoord={clickedCoord}
            onClearAllFilters={onClearAllFilters}
          />
        )}
      </div>
    </div>
  );
}
