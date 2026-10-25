/**
 * Gestionnaire unifié de mise à l'échelle des icônes cartographiques selon le niveau de zoom.
 * Évite l'effet « pastille géante » à l'échelle du Luxembourg entier (zoom <= 10)
 * tout en offrant une lisibilité maximale à l'échelle des sentiers et forêts (zoom >= 14).
 */

export type MarkerSizeTier = 'country' | 'regional' | 'local' | 'detail';

export interface MarkerDimensions {
  size: number;
  fontSize: number;
  borderWidth: number;
  tier: MarkerSizeTier;
}

/**
 * Calcule les dimensions adaptatives d'un pin ou marqueur Leaflet selon le zoom actuel.
 *
 * - Country (< 10.5)      : taille discrète (~18px), ne surcharge pas la carte nationale
 * - Regional (10.5 - 12.5) : taille intermédiaire (~24px) pour la vue cantons/régions
 * - Local (12.5 - 14.5)    : taille standard (~30px) pour l'exploration
 * - Detail (>= 14.5)       : taille détaillée (~36px) pour le repérage précis sur sentier
 */
export function getAdaptiveMarkerDimensions(
  zoom: number,
  isSelected: boolean = false
): MarkerDimensions {
  if (zoom < 10.5) {
    const size = isSelected ? 22 : 18;
    return {
      size,
      fontSize: Math.round(size * 0.52),
      borderWidth: 1.5,
      tier: 'country',
    };
  }

  if (zoom < 12.5) {
    const size = isSelected ? 28 : 24;
    return {
      size,
      fontSize: Math.round(size * 0.52),
      borderWidth: 2,
      tier: 'regional',
    };
  }

  if (zoom < 14.5) {
    const size = isSelected ? 36 : 30;
    return {
      size,
      fontSize: Math.round(size * 0.52),
      borderWidth: 2.5,
      tier: 'local',
    };
  }

  // Zoom rapproché (sentiers, sous-bois)
  const size = isSelected ? 42 : 36;
  return {
    size,
    fontSize: Math.round(size * 0.54),
    borderWidth: 2.5,
    tier: 'detail',
  };
}
