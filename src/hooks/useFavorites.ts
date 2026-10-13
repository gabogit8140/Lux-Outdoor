import { useState, useEffect, useCallback } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';

export interface SavedFavorite {
  id: string;
  title: string;
  description: string;
  dateSaved: string;
  distanceKm: number;
  elevationGain: number;
  activity: 'bike' | 'hike';
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  regionName?: string;
  userRating?: number; // 1-5 personal stars given by user
  userNotes?: string;  // personal field notes written by user
  route: RouteSuggestions;
  trace: RouteTrace;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedFavorite[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('traceoutdoor-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites from storage', e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('traceoutdoor-favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not persist favorites to localStorage (quota or disabled)', e);
    }
  }, [favorites]);

  const saveFavorite = useCallback(
    (
      route: RouteSuggestions,
      trace: RouteTrace,
      userRating?: number,
      userNotes?: string
    ) => {
      if (favorites.some((f) => f.route.id === route.id || f.title === route.title)) {
        return false; // already saved
      }

      const newFav: SavedFavorite = {
        id: 'fav_' + Date.now(),
        title: route.title,
        description: route.description,
        dateSaved: new Date().toISOString(),
        distanceKm: Number((trace.distance / 1000).toFixed(1)),
        elevationGain: route.elevationGain,
        activity: route.activity,
        country: route.country,
        regionName: route.regionName,
        userRating: userRating || route.userRating,
        userNotes: userNotes || route.userNotes,
        route,
        trace,
      };

      setFavorites((prev) => [newFav, ...prev]);
      return true;
    },
    [favorites]
  );

  const updateFavorite = useCallback(
    (id: string, userRating?: number, userNotes?: string) => {
      setFavorites((prev) =>
        prev.map((fav) =>
          fav.id === id
            ? {
                ...fav,
                userRating: userRating !== undefined ? userRating : fav.userRating,
                userNotes: userNotes !== undefined ? userNotes : fav.userNotes,
                route: {
                  ...fav.route,
                  userRating: userRating !== undefined ? userRating : fav.route.userRating,
                  userNotes: userNotes !== undefined ? userNotes : fav.route.userNotes,
                },
              }
            : fav
        )
      );
    },
    []
  );

  const deleteFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return {
    favorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    saveFavorite,
    updateFavorite,
    deleteFavorite,
  };
}
