import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Navigation,
  ListOrdered,
  Smartphone,
  FolderGit2,
  X,
} from 'lucide-react';
import type { RouteSuggestions, RouteTrace } from '../types';
import { REGIONAL_ZONES } from '../lib/localRouting';
import { PlanTabContent } from './sidebar/PlanTabContent';
import { RouteDetailView } from './sidebar/RouteDetailView';
import { RouteCatalogList } from './sidebar/RouteCatalogList';

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
  selectedZone: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  onSelectZone: (zone: 'ALL' | 'LU' | 'BE' | 'DE' | 'NL' | 'FR') => void;
  onOpenInstallModal?: () => void;
  onOpenGpxModal?: () => void;
  isInstalled?: boolean;
  currentLocation?: string;
  onLocationChange?: (loc: string) => void;
  clickedCoord?: { lat: number; lng: number; name: string } | null;
  onClose?: () => void;
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
  clickedCoord,
  onClose,
}: SidebarProps) {
  const [location, setLocation] = useState(currentLocation || 'Luxembourg');
  const [tab, setTab] = useState<'plan' | 'result' | 'catalog'>('plan');

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

  // Sync personal notes when selected route changes
  useEffect(() => {
    if (route) {
      setPendingRating(route.userRating || 0);
      setPendingNotes(route.userNotes || '');
      if (tab === 'plan') setTab('result');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [route?.id]);

  const handleGenerate = (isMapTracesOnly: boolean) => {
    onGenerate(location, distance, activeFilters, activity, isMapTracesOnly);
    setTab('result');
  };

  const handleFilter = () => {
    onFilterMap(location, distance, activeFilters, activity, selectedZone);
    setTab('catalog');
  };

  const toggleFilter = (id: string) => {
    if (activeFilters.includes(id)) {
      setActiveFilters(activeFilters.filter((f) => f !== id));
    } else {
      setActiveFilters([...activeFilters, id]);
    }
  };

  const activeZoneObj = REGIONAL_ZONES.find((z) => z.id === selectedZone) || REGIONAL_ZONES[0];

  return (
    <div
      className="flex flex-col h-full bg-white p-3.5 sm:p-4 text-stone-800"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      {/* Mobile Top Drag Indicator */}
      <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-2 md:hidden" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            ⛰️
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-stone-900 leading-tight">
              Grande Région Plein Air
            </h1>
            <p className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
              <span>{activeZoneObj.flag}</span>
              <span>{activeZoneObj.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenGpxModal && (
            <button
              onClick={onOpenGpxModal}
              className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
              title="Base GPX & Dépose de traces"
              aria-label="Base GPX"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-700" />
            </button>
          )}
          {onOpenInstallModal && !isInstalled && (
            <button
              onClick={onOpenInstallModal}
              className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
              title="Installer l'application hors-ligne"
              aria-label="Installer l'application"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 md:hidden cursor-pointer"
              aria-label="Fermer le panneau"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 my-2.5 shrink-0 text-xs font-bold">
        <button
          onClick={() => setTab('plan')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            tab === 'plan'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Planifier
        </button>

        <button
          onClick={() => setTab('result')}
          disabled={!route}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            tab === 'result'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          Itinéraire
        </button>

        <button
          onClick={() => setTab('catalog')}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            tab === 'catalog'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          Traces ({routes.length})
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
            distance={distance}
            setDistance={setDistance}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            onImportGPX={onImportGPX}
            onFilterMap={handleFilter}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
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
          />
        )}

        {tab === 'catalog' && (
          <RouteCatalogList
            routes={routes}
            traces={traces}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => {
              onSelectRoute(id);
              setTab('result');
            }}
            location={location}
            distance={distance}
            activity={activity}
            clickedCoord={clickedCoord}
          />
        )}
      </div>
    </div>
  );
}
