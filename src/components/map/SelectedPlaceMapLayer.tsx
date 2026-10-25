import React from 'react';
import { Marker, Popup, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink } from 'lucide-react';
import { type PlaceEntry, getCountryFlag } from '../../lib/routing/gazetteer';

interface SelectedPlaceMapLayerProps {
  selectedPlace: PlaceEntry | null;
  onClear?: () => void;
}

function getPlaceVisual(category?: string) {
  switch (category) {
    case 'castle':
      return { icon: '🏰', color: '#7e22ce', label: 'Château fort' };
    case 'nature':
      return { icon: '🌲', color: '#059669', label: 'Site naturel' };
    case 'lake':
      return { icon: '🌊', color: '#0284c7', label: 'Lac & Cascade' };
    case 'viewpoint':
      return { icon: '🌄', color: '#d97706', label: 'Belvédère' };
    case 'heritage':
      return { icon: '🏛️', color: '#4f46e5', label: 'Patrimoine & Histoire' };
    case 'city':
    default:
      return { icon: '📍', color: '#059669', label: 'Commune / Ville' };
  }
}

function createPlaceIcon(place: PlaceEntry) {
  const visual = getPlaceVisual(place.category);
  return L.divIcon({
    className: 'selected-place-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <!-- Pulsing beacon wave -->
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${visual.color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <!-- Shadow base -->
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #ffffff; border: 3px solid ${visual.color}; box-shadow: 0 4px 18px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 2;">
          ${visual.icon}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export function SelectedPlaceMapLayer({ selectedPlace, onClear }: SelectedPlaceMapLayerProps) {
  if (!selectedPlace) return null;

  const lat = selectedPlace.coords[1];
  const lon = selectedPlace.coords[0];
  const visual = getPlaceVisual(selectedPlace.category);
  const icon = createPlaceIcon(selectedPlace);

  return (
    <>
      {/* Halo circulaire repérable à haute altitude */}
      <Circle
        center={[lat, lon]}
        radius={1200}
        pathOptions={{
          color: visual.color,
          fillColor: visual.color,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6, 8',
          interactive: false,
        }}
      />

      {/* Marqueur interactif au centre du POI */}
      <Marker position={[lat, lon]} icon={icon}>
        {/* Tooltip flottant permanent au-dessus de l'icône */}
        <Tooltip direction="top" offset={[0, -22]} permanent className="font-bold text-xs shadow-md">
          <span className="flex items-center gap-1 font-bold">
            <span>{visual.icon}</span>
            <span>{selectedPlace.name}</span>
          </span>
        </Tooltip>

        {/* Popup d'informations détaillées avec lien web */}
        <Popup autoPan={false}>
          <div className="p-1 space-y-2 max-w-xs text-slate-800">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 leading-tight">
                  <span className="text-base">{getCountryFlag(selectedPlace.country)}</span>
                  <span>{selectedPlace.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {selectedPlace.region}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                {visual.label}
              </span>
            </div>

            {selectedPlace.description && (
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {selectedPlace.description}
              </p>
            )}

            <div className="pt-1 flex items-center justify-between gap-2">
              {selectedPlace.url ? (
                <a
                  href={selectedPlace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <span>{selectedPlace.urlLabel || 'Ouvrir la fiche touristique'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span />
              )}

              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Enlever ce repère
                </button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
