import { useState, useEffect, useCallback, useRef } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';
import { APP_STORAGE_KEYS } from '../lib/config/appConfig';
import {
  type FavoriteCategory,
  resolveFavoriteCategory,
} from '../lib/favorites/favoriteCategories';
import {
  getStoredPairingCode,
  setStoredPairingCode,
  generatePairingCode,
  normalizePairingCode,
  pushFavoritesToVault,
  fetchFavoritesFromVault,
  subscribeToVault,
} from '../lib/firebase/syncVaultService';

export type { FavoriteCategory };

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
  userRating?: number; // 1-5 legacy
  category?: FavoriteCategory; // 'top' | 'bien' | 'ne_pas_refaire' | 'champignons'
  hasMushrooms?: boolean; // indicateur coin champignons
  userNotes?: string; // notes de terrain
  route: RouteSuggestions;
  trace: RouteTrace;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedFavorite[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(() => getStoredPairingCode());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const isRemoteUpdatingRef = useRef(false);

  // Chargement et migration transparente des favoris locaux
  useEffect(() => {
    const saved =
      localStorage.getItem(APP_STORAGE_KEYS.favorites) ||
      localStorage.getItem(APP_STORAGE_KEYS.legacyFavorites);
    if (saved) {
      try {
        const parsed: SavedFavorite[] = JSON.parse(saved);
        const migrated = parsed.map((fav) => {
          const cat = fav.category || resolveFavoriteCategory(undefined, fav.userRating, fav.hasMushrooms) || undefined;
          return {
            ...fav,
            category: cat,
          };
        });
        setFavorites(migrated);
      } catch (e) {
        console.error('Failed to parse favorites from storage', e);
      }
    }
  }, []);

  // Persistance localStorage locale
  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not persist favorites to localStorage', e);
    }
  }, [favorites]);

  // Écoute temps réel Firestore lorsque le jumelage est actif
  useEffect(() => {
    if (!pairingCode) return;

    const unsubscribe = subscribeToVault(pairingCode, (remoteData) => {
      if (remoteData.favorites) {
        isRemoteUpdatingRef.current = true;
        setFavorites((localPrev) => {
          // Fusionne intelligemment les favoris distants avec les locaux par ID ou Titre
          const mergedMap = new Map<string, SavedFavorite>();
          localPrev.forEach((f) => mergedMap.set(f.id, f));
          remoteData.favorites!.forEach((rf) => mergedMap.set(rf.id, rf));
          return Array.from(mergedMap.values());
        });
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 500);
        setSyncStatusMessage('Synchronisé');
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [pairingCode]);

  // Déclenche l'envoi vers le Cloud après modification locale
  const syncToCloud = useCallback(
    async (nextFavorites: SavedFavorite[]) => {
      if (!pairingCode || isRemoteUpdatingRef.current) return;
      setIsSyncing(true);
      await pushFavoritesToVault(pairingCode, nextFavorites);
      setIsSyncing(false);
    },
    [pairingCode]
  );

  const saveFavorite = useCallback(
    (
      route: RouteSuggestions,
      trace: RouteTrace,
      category?: FavoriteCategory,
      userNotes?: string,
      hasMushrooms?: boolean,
      userRating?: number
    ) => {
      const existingIndex = favorites.findIndex(
        (f) => f.route.id === route.id || f.title === route.title
      );

      const effectiveCategory = category || resolveFavoriteCategory(undefined, userRating, hasMushrooms) || undefined;

      let nextFavorites: SavedFavorite[];

      if (existingIndex >= 0) {
        const next = [...favorites];
        const curr = next[existingIndex];
        next[existingIndex] = {
          ...curr,
          category: effectiveCategory !== undefined ? effectiveCategory : curr.category,
          hasMushrooms: hasMushrooms !== undefined ? hasMushrooms : curr.hasMushrooms,
          userNotes: userNotes !== undefined ? userNotes : curr.userNotes,
          userRating: userRating !== undefined ? userRating : curr.userRating,
          trace,
          route: {
            ...route,
            userNotes: userNotes !== undefined ? userNotes : curr.userNotes,
            userRating: userRating !== undefined ? userRating : curr.userRating,
          },
        };
        nextFavorites = next;
      } else {
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
          category: effectiveCategory,
          hasMushrooms: Boolean(hasMushrooms),
          userRating: userRating || route.userRating,
          userNotes: userNotes || route.userNotes,
          route,
          trace,
        };
        nextFavorites = [newFav, ...favorites];
      }

      setFavorites(nextFavorites);
      syncToCloud(nextFavorites);
      return true;
    },
    [favorites, syncToCloud]
  );

  const updateFavorite = useCallback(
    (
      id: string,
      category?: FavoriteCategory | null,
      userNotes?: string,
      hasMushrooms?: boolean,
      userRating?: number
    ) => {
      setFavorites((prev) => {
        const nextFavorites = prev.map((fav) => {
          if (fav.id !== id) return fav;
          const updatedCategory =
            category === null
              ? undefined
              : category !== undefined
              ? category
              : fav.category;

          return {
            ...fav,
            category: updatedCategory,
            hasMushrooms: hasMushrooms !== undefined ? hasMushrooms : fav.hasMushrooms,
            userNotes: userNotes !== undefined ? userNotes : fav.userNotes,
            userRating: userRating !== undefined ? userRating : fav.userRating,
            route: {
              ...fav.route,
              userNotes: userNotes !== undefined ? userNotes : fav.route.userNotes,
              userRating: userRating !== undefined ? userRating : fav.route.userRating,
            },
          };
        });

        syncToCloud(nextFavorites);
        return nextFavorites;
      });
    },
    [syncToCloud]
  );

  const deleteFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.filter((f) => f.id !== id);
        syncToCloud(next);
        return next;
      });
    },
    [syncToCloud]
  );

  /**
   * Active ou rejoint un jumelage Cloud par code PIN
   */
  const connectPairingCode = useCallback(
    async (codeToJoin?: string): Promise<{ success: boolean; message: string }> => {
      const targetCode = normalizePairingCode(codeToJoin || pairingCode || generatePairingCode());
      setIsSyncing(true);

      // Si l'utilisateur rejoint un code existant, tente de récupérer les favoris distants
      const remoteFavs = await fetchFavoritesFromVault(targetCode);

      if (remoteFavs && remoteFavs.length > 0) {
        // Fusionne les données distantes avec les données locales existantes
        setFavorites((localPrev) => {
          const map = new Map<string, SavedFavorite>();
          localPrev.forEach((f) => map.set(f.id, f));
          remoteFavs.forEach((rf) => map.set(rf.id, rf));
          const merged = Array.from(map.values());
          // Ré-envoie la fusion dans le coffre
          pushFavoritesToVault(targetCode, merged);
          return merged;
        });
      } else {
        // Premier appareil à initialiser ce code : pousse ses favoris locaux actuels
        await pushFavoritesToVault(targetCode, favorites);
      }

      setStoredPairingCode(targetCode);
      setPairingCode(targetCode);
      setIsSyncing(false);
      setSyncStatusMessage('Appareil jumelé avec succès');

      return {
        success: true,
        message: `Appareil connecté au coffre ${targetCode}`,
      };
    },
    [favorites, pairingCode]
  );

  /**
   * Dissocie l'appareil du Cloud (sans supprimer les traces locales)
   */
  const disconnectPairing = useCallback(() => {
    setStoredPairingCode(null);
    setPairingCode(null);
    setSyncStatusMessage(null);
  }, []);

  return {
    favorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    saveFavorite,
    updateFavorite,
    deleteFavorite,
    pairingCode,
    isSyncing,
    syncStatusMessage,
    connectPairingCode,
    disconnectPairing,
  };
}
