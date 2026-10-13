import React from 'react';
import { TileLayer, Circle } from 'react-leaflet';

export type MapLayerType = 'cyclosm' | 'osmfr' | 'topo' | 'osm';
export const LUXEMBOURG_CENTER: [number, number] = [49.6116, 6.1319]; // Luxembourg-Ville

interface MapTileLayersProps {
  activity: 'bike' | 'hike';
  mapLayer: MapLayerType;
  showNetwork: boolean;
  show200kmRadius: boolean;
}

/**
 * Renders base map tile layers and specialized overlays.
 * Crucial guarantee: In hiking mode ('hike'), CyclOSM is NEVER rendered so cycleways
 * and bicycle paths are strictly prevented from cluttering the hiking map.
 * Instead, OSM France ('osmfr') or OpenTopoMap ('topo') is used.
 */
export function MapTileLayers({
  activity,
  mapLayer,
  showNetwork,
  show200kmRadius,
}: MapTileLayersProps) {
  // Enforce hiking safety: if in hike mode and CyclOSM is selected, seamlessly fall back to OSM France
  const effectiveLayer: MapLayerType =
    activity === 'hike' && mapLayer === 'cyclosm' ? 'osmfr' : mapLayer;

  return (
    <>
      {/* Base Tile Layer (100% Free OpenStreetMap derivatives, No API Key Required) */}
      {effectiveLayer === 'cyclosm' && activity === 'bike' && (
        <TileLayer
          attribution='&copy; <a href="https://www.cyclosm.org">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={18}
        />
      )}
      {effectiveLayer === 'osmfr' && (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.fr">OSM France</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />
      )}
      {effectiveLayer === 'topo' && (
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={17}
        />
      )}
      {effectiveLayer === 'osm' && (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />
      )}

      {/* 200 km Boundary Circle around Luxembourg */}
      {show200kmRadius && (
        <Circle
          center={LUXEMBOURG_CENTER}
          radius={200000} // 200 km in meters
          pathOptions={{
            color: '#059669',
            weight: 2,
            dashArray: '6, 8',
            fillColor: '#059669',
            fillOpacity: 0.02,
            interactive: false,
          }}
        />
      )}

      {/* Waymarked Trails Overlays (Specific to activity: cycling trails for bike, hiking trails/GR for hike) */}
      {showNetwork && activity === 'bike' && (
        <TileLayer
          attribution='&copy; <a href="https://waymarkedtrails.org">Waymarked Trails Cycling</a>'
          url="https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png"
          maxNativeZoom={18}
          maxZoom={19}
        />
      )}
      {showNetwork && activity === 'hike' && (
        <TileLayer
          attribution='&copy; <a href="https://waymarkedtrails.org">Waymarked Trails Hiking</a>'
          url="https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"
          maxNativeZoom={18}
          maxZoom={19}
        />
      )}
    </>
  );
}
