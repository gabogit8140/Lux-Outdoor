import React, { useState, useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search } from 'lucide-react';
import type { RouteTrace } from '../../types';
export { LocateControl } from './LocateControl';

/**
 * Desktop-only zoom buttons (+ and -).
 * Mobile view (screens < 768px) strictly hides this button:
 * mobile users zoom natively using 2 fingers (pinch-to-zoom).
 */
export function DesktopZoomControl() {
  const map = useMap();

  return (
    <div className="hidden md:flex flex-col shadow-lg rounded-2xl overflow-hidden border border-white/70 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomIn();
        }}
        className="w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 border-b border-slate-200/70 dark:border-slate-800 text-base font-bold transition-colors cursor-pointer select-none"
        title="Zoom avant"
        aria-label="Zoom avant"
      >
        +
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomOut();
        }}
        className="w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 text-base font-bold transition-colors cursor-pointer select-none"
        title="Zoom arrière"
        aria-label="Zoom arrière"
      >
        &#x2212;
      </button>
    </div>
  );
}

/**
 * Shows "Explorer cette zone" button floating at the top when user moves the map.
 */
export function SearchAreaControl({
  onSearch,
  isGenerating,
}: {
  onSearch: (b: { north: number; south: number; east: number; west: number }) => void;
  isGenerating: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const map = useMapEvents({
    moveend: () => setVisible(true),
  });

  const handleSearch = () => {
    setVisible(false);
    const b = map.getBounds();
    onSearch({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  };

  if (!visible) return null;

  return (
    <div className="absolute top-28 sm:top-24 left-1/2 -translate-x-1/2 z-[400] animate-in fade-in slide-in-from-top-2">
      <button
        onClick={handleSearch}
        disabled={isGenerating}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-full shadow-xl shadow-emerald-600/25 text-xs font-bold flex items-center gap-2 hover:shadow-2xl disabled:opacity-50 transition-all border border-emerald-400/40 ring-2 ring-emerald-500/20 active:scale-95 cursor-pointer"
      >
        {isGenerating ? (
          <span className="animate-spin h-3.5 w-3.5 border-2 border-white rounded-full border-t-transparent" />
        ) : (
          <Search className="w-3.5 h-3.5 text-emerald-100" />
        )}
        <span>Explorer cette zone</span>
      </button>
    </div>
  );
}

/**
 * Handles map container resize automatically without layout glitches.
 */
export function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => map.invalidateSize());
    });
    const container = map.getContainer();
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/**
 * Flies map camera to target center & zoom when explicitly triggered (e.g. from regional zone selection).
 */
export function MapCenterWatcher({
  target,
}: {
  target?: { center: [number, number]; zoom: number; trigger: number };
}) {
  const map = useMap();
  const lastTriggerRef = useRef<number>(0);

  useEffect(() => {
    if (!target || typeof target.trigger !== 'number' || target.trigger <= 0) {
      return;
    }
    if (lastTriggerRef.current === target.trigger) {
      return;
    }
    lastTriggerRef.current = target.trigger;

    const center = target.center;
    if (
      !center ||
      !Array.isArray(center) ||
      typeof center[0] !== 'number' ||
      typeof center[1] !== 'number' ||
      isNaN(center[0]) ||
      isNaN(center[1]) ||
      !isFinite(center[0]) ||
      !isFinite(center[1])
    ) {
      return;
    }

    const zoom = typeof target.zoom === 'number' && !isNaN(target.zoom) ? target.zoom : 9;

    try {
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) {
        map.invalidateSize();
        map.setView(center, zoom);
        return;
      }

      const cur = map.getCenter();
      if (
        Math.abs(cur.lat - center[0]) < 0.0001 &&
        Math.abs(cur.lng - center[1]) < 0.0001 &&
        map.getZoom() === zoom
      ) {
        return;
      }

      map.flyTo(center, zoom, { duration: 1.2 });
    } catch {
      try {
        map.setView(center, zoom);
      } catch {
        // Fallback safe
      }
    }
  }, [target?.trigger, target?.center, target?.zoom, map]);

  return null;
}

/**
 * Fits bounds onto an explicitly selected individual trace when focusTrigger changes.
 * Does NOT zoom when switching activities or filtering.
 */
export function MapController({
  selectedTrace,
  focusTrigger,
}: {
  selectedTrace: RouteTrace | null;
  focusTrigger: number;
}) {
  const map = useMap();
  const lastFocusTriggerRef = useRef<number>(0);

  useEffect(() => {
    if (
      !selectedTrace ||
      !selectedTrace.coordinates ||
      selectedTrace.coordinates.length === 0 ||
      focusTrigger <= 0
    ) {
      return;
    }
    if (lastFocusTriggerRef.current === focusTrigger) {
      return;
    }
    lastFocusTriggerRef.current = focusTrigger;

    let latLngs: [number, number][] = [];
    if (Array.isArray(selectedTrace.coordinates[0][0])) {
      latLngs = (selectedTrace.coordinates as [number, number][][])
        .flat()
        .map((c) => [c[1], c[0]] as [number, number]);
    } else {
      latLngs = (selectedTrace.coordinates as [number, number][]).map(
        (c) => [c[1], c[0]] as [number, number]
      );
    }

    latLngs = latLngs.filter(
      ([lat, lng]) =>
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        isFinite(lat) &&
        isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
    );

    if (latLngs.length > 0) {
      // Wait one animation frame in case the mobile/tablet split sheet just opened and resized the map container
      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            const size = map.getSize();
            const isCompactPane = !size || size.x < 640 || size.y < 420;
            const padTopLeft: [number, number] = isCompactPane ? [28, 56] : [50, 68];
            const padBottomRight: [number, number] = isCompactPane ? [28, 36] : [50, 44];
            if (!size || size.x === 0 || size.y === 0) {
              map.fitBounds(bounds, {
                paddingTopLeft: padTopLeft,
                paddingBottomRight: padBottomRight,
              });
            } else {
              map.flyToBounds(bounds, {
                paddingTopLeft: padTopLeft,
                paddingBottomRight: padBottomRight,
                duration: 0.9,
              });
            }
          }
        } catch {
          try {
            const bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [32, 32] });
            }
          } catch {
            // ignore safe
          }
        }
      }, 60);

      return () => clearTimeout(timer);
    }
  }, [selectedTrace, map, focusTrigger]);

  return null;
}

/**
 * Listens for user clicks on empty map areas to generate/search circuits.
 */
export function MapClicker({
  onMapClick,
  isGenerating,
  lastLayerClickTimeRef,
  isEditorActive = false,
}: {
  onMapClick: (lat: number, lng: number) => void;
  isGenerating: boolean;
  lastLayerClickTimeRef: React.MutableRefObject<number>;
  isEditorActive?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      // Ignore click if user is in route creation / edition mode
      if (isEditorActive) {
        return;
      }
      // Ignore click if a polyline or marker was just clicked
      if (Date.now() - lastLayerClickTimeRef.current < 300) {
        return;
      }
      if (!isGenerating) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}
