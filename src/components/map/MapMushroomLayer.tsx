import React from 'react';
import { Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { MushroomSpot } from '../../types/mushroom';
import { openWazeNavigation } from '../../lib/navigation/wazeNavigation';
import { Calendar, Navigation, Trash2, MapPin } from 'lucide-react';

interface MapMushroomLayerProps {
  spots: MushroomSpot[];
  onDeleteSpot: (id: string) => void;
  isSpottingMode: boolean;
  onMapClickSpotCoord: (coord: [number, number]) => void;
}

function createMushroomPinIcon(variety: string): L.DivIcon {
  const size = 32;
  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; cursor: pointer; transition: transform 0.15s ease;">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: #ffffff;
        border: 2.5px solid #ea580c;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        line-height: 1;
      ">
        <span>🍄</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'mushroom-spot-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function MapMushroomLayer({
  spots,
  onDeleteSpot,
  isSpottingMode,
  onMapClickSpotCoord,
}: MapMushroomLayerProps) {
  // Capture les clics pour poser un nouveau spot quand le mode est actif
  useMapEvents({
    click: (e) => {
      if (isSpottingMode) {
        onMapClickSpotCoord([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return (
    <>
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={spot.coordinates}
          icon={createMushroomPinIcon(spot.variety)}
          zIndexOffset={850}
        >
          {/* Tooltip au survol */}
          <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
            <div className="font-sans text-center">
              <div className="font-bold text-xs text-orange-900 dark:text-orange-300 flex items-center justify-center gap-1">
                <span>🍄</span>
                <span>{spot.name}</span>
              </div>
              <div className="text-[10px] text-stone-500">{spot.variety}</div>
            </div>
          </Tooltip>

          {/* Popup détaillée au clic */}
          <Popup className="custom-popup" offset={[0, -12]}>
            <div className="p-1 min-w-[210px] max-w-[250px] font-sans">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200">
                  <span>🍄</span>
                  <span>{spot.variety}</span>
                </span>
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(spot.dateAdded).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 mt-2">
                {spot.name}
              </h4>

              {spot.notes && (
                <p className="text-[11px] italic text-stone-600 dark:text-slate-400 bg-stone-50 dark:bg-slate-800/60 p-2 rounded-lg border border-stone-100 dark:border-slate-700/60 my-2">
                  "{spot.notes}"
                </p>
              )}

              <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openWazeNavigation(spot.coordinates[0], spot.coordinates[1])}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Y aller avec Waze / GPS"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Y aller</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteSpot(spot.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Supprimer ce coin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
