import L from 'leaflet';

export type FavoriteCategory = 'top' | 'bien' | 'ne_pas_refaire' | 'champignons';

export interface CategoryMeta {
  key: FavoriteCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  ringColor: string;
  shortDescription: string;
}

export const FAVORITE_CATEGORIES: Record<FavoriteCategory, CategoryMeta> = {
  top: {
    key: 'top',
    label: 'Top',
    icon: '🏆',
    color: '#d97706', // amber-600
    bgColor: 'bg-amber-500/10 dark:bg-amber-400/15',
    borderColor: 'border-amber-400 dark:border-amber-500',
    textColor: 'text-amber-800 dark:text-amber-300',
    ringColor: '#f59e0b',
    shortDescription: 'Circuit coup de cœur incontournable',
  },
  bien: {
    key: 'bien',
    label: 'Bien',
    icon: '👍',
    color: '#059669', // emerald-600
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/15',
    borderColor: 'border-emerald-400 dark:border-emerald-500',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    ringColor: '#10b981',
    shortDescription: 'Bonne sortie, à refaire',
  },
  ne_pas_refaire: {
    key: 'ne_pas_refaire',
    label: 'Ne pas refaire',
    icon: '⛔',
    color: '#e11d48', // rose-600
    bgColor: 'bg-rose-500/10 dark:bg-rose-400/15',
    borderColor: 'border-rose-400 dark:border-rose-500',
    textColor: 'text-rose-800 dark:text-rose-300',
    ringColor: '#f43f5e',
    shortDescription: 'Décevant, goudron ou sans intérêt',
  },
  champignons: {
    key: 'champignons',
    label: 'Champignons',
    icon: '🍄',
    color: '#ea580c', // orange-600
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/15',
    borderColor: 'border-orange-400 dark:border-orange-500',
    textColor: 'text-orange-800 dark:text-orange-300',
    ringColor: '#f97316',
    shortDescription: 'Spot propice à la cueillette de champignons',
  },
};

/**
 * Détermine la catégorie d'un favori en prenant en compte la rétrocompatibilité
 * avec les anciennes notes sur 5 étoiles.
 */
export function resolveFavoriteCategory(
  category?: FavoriteCategory,
  userRating?: number,
  hasMushrooms?: boolean
): FavoriteCategory | null {
  if (category) return category;
  if (hasMushrooms) return 'champignons';
  if (userRating && userRating >= 4) return 'top';
  if (userRating && userRating === 3) return 'bien';
  if (userRating && userRating > 0 && userRating <= 2) return 'ne_pas_refaire';
  return null;
}

/**
 * Crée une icône HTML Leaflet percutante et visible pour la carte
 */
export function createFavoriteMarkerIcon(
  category: FavoriteCategory,
  hasMushrooms = false,
  isSelected = false
): L.DivIcon {
  const meta = FAVORITE_CATEGORIES[category] || FAVORITE_CATEGORIES.top;
  const size = isSelected ? 38 : 32;
  const ring = meta.ringColor;

  const mushroomBadge = hasMushrooms && category !== 'champignons'
    ? `<div style="position: absolute; top: -5px; right: -5px; width: 16px; height: 16px; background: #fff; border: 1.5px solid #ea580c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">🍄</div>`
    : '';

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; cursor: pointer; transition: transform 0.15s ease;">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: #ffffff;
        border: 2.5px solid ${ring};
        box-shadow: 0 3px 10px rgba(0,0,0,0.25), 0 0 0 ${isSelected ? '3px' : '0px'} ${ring}55;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.52}px;
        line-height: 1;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
      ">
        <span>${meta.icon}</span>
      </div>
      ${mushroomBadge}
    </div>
  `;

  return L.divIcon({
    className: 'favorite-route-map-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
