import type { Map as LeafletMap } from 'leaflet';

/**
 * Coordonnées géographiques et cadrage caméra pour le Grand-Duché de Luxembourg.
 * Centre calculé à Mersch / Pettingen avec compensation optique pour la barre de filtres supérieure.
 */
export const LUXEMBOURG_CENTER: [number, number] = [49.78, 6.13];

export const LUXEMBOURG_BOUNDS: [[number, number], [number, number]] = [
  [49.445, 5.735], // Sud-Ouest (Rumelange / Rodange)
  [50.185, 6.53],  // Nord-Est (Troisvierges / Rosport)
];

export const DEFAULT_MAP_ZOOM = 9.75;
export const DEFAULT_ZOOM_SNAP = 0.25;

export const LUXEMBOURG_VIEWPORT_PADDING = {
  paddingTopLeft: [20, 85] as [number, number],
  paddingBottomRight: [20, 25] as [number, number],
  maxZoom: 10.5,
};

/**
 * Ajuste la caméra Leaflet pour cadrer l'intégralité du territoire luxembourgeois
 * tout en réservant l'espace nécessaire pour la barre d'outils flottante supérieure.
 */
export function fitMapToLuxembourg(map: LeafletMap, animate: boolean = false): void {
  map.fitBounds(LUXEMBOURG_BOUNDS, {
    ...LUXEMBOURG_VIEWPORT_PADDING,
    animate,
  });
}
