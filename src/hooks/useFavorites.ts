import { useState, useEffect, useCallback, useRef } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';
import { APP_STORAGE_KEYS } from '../lib/config/appConfig';
import {
  type FavoriteCategory,
  resolveFavoriteCategory,
} from '../lib/favorites/favoriteCategories';
import { mergeItemsById } from '../lib/sync/syncMerge';
import {
  getStoredPairingCode,
  setStoredPairingCode,
  generatePairingCode,
  normalizePairingCode,
  pushFavoritesToVault,
  fetchFavoritesFromVault,
  fetchVaultData,
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
  const [favorites, setFavorites] = useState<SavedFavorite[]>(() => {
    try {
      const saved =
        localStorage.getItem(APP_STORAGE_KEYS.favorites) ||
        localStorage.getItem(APP_STORAGE_KEYS.legacyFavorites);
      if (saved) {
        const parsed: SavedFavorite[] = JSON.parse(saved);
        return parsed.map((fav) => {
          const cat =
            fav.category ||
            resolveFavoriteCategory(undefined, fav.userRating, fav.hasMushrooms) ||
            undefined;
          return {
            ...fav,
            category: cat,
          };
        });
      }
    } catch (e) {
      console.error('Failed to parse favorites from storage', e);
    }
    return [];
  });
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(() => getStoredPairingCode());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const isRemoteUpdatingRef = useRef(false);
  const favoritesRef = useRef<SavedFavorite[]>(favorites);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // Synchronisation dynamique du code de jumelage en cas d'événement externe
  useEffect(() => {
    const handlePairingChange = () => {
      setPairingCode(getStoredPairingCode());
    };
    window.addEventListener('lux_pairing_change', handlePairingChange);
    window.addEventListener('storage', handlePairingChange);
    return () => {
      window.removeEventListener('lux_pairing_change', handlePairingChange);
      window.removeEventListener('storage', handlePairingChange);
    };
  }, []);

  // Persistance localStorage locale
  useEffect(() => {
    try {
      localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Could not persist favorites to localStorage', e);
    }
  }, [favorites]);

  // Synchronisation Cloud bidirectionnelle automatique des favoris
  useEffect(() => {
    if (!pairingCode) return;

    let isSubscribed = true;

    // 1. Récupération et fusion initiale avec le coffre distant
    fetchVaultData(pairingCode).then((vaultData) => {
      if (!isSubscribed) return;
      const remoteFavs = vaultData?.favorites || [];
      const localFavs = favoritesRef.current;

      const merged = mergeItemsById(localFavs, remoteFavs);

      isRemoteUpdatingRef.current = true;
      setFavorites(merged);
      try {
        localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(merged));
      } catch (e) {
        console.warn('Could not persist favorites to localStorage', e);
      }
      setTimeout(() => {
        isRemoteUpdatingRef.current = false;
      }, 300);

      // Si l'appareil local contient des favoris qui n'étaient pas encore dans le coffre distant
      // (ex: enregistrés avant le jumelage sur iPhone), on pousse immédiatement la fusion
      if (merged.length > remoteFavs.length || (localFavs.length > 0 && remoteFavs.length === 0)) {
        pushFavoritesToVault(pairingCode, merged).catch((err) =>
          console.warn('Erreur envoi initial favoris Firestore:', err)
        );
      }
      setSyncStatusMessage('Synchronisé');
    });

    // 2. Écoute temps réel des ajouts/modifications distantes
    const unsubscribe = subscribeToVault(pairingCode, (remoteData) => {
      if (!isSubscribed) return;
      if (remoteData.favorites !== undefined) {
        const remoteFavs = remoteData.favorites;
        const localFavs = favoritesRef.current;

        const merged = mergeItemsById(localFavs, remoteFavs);

        isRemoteUpdatingRef.current = true;
        setFavorites(merged);
        try {
          localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(merged));
        } catch (e) {
          console.warn('Could not persist favorites to localStorage', e);
        }
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 500);

        // Si l'appareil local possède des favoris que le distant n'a pas encore reçus
        if (merged.length > remoteFavs.length) {
          pushFavoritesToVault(pairingCode, merged).catch(console.warn);
        }

        setSyncStatusMessage('Synchronisé');
      }
    });

    return () => {
      isSubscribed = false;
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
      try {
        localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(nextFavorites));
      } catch (e) {
        console.warn('Could not persist favorites to localStorage', e);
      }
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

        try {
          localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(nextFavorites));
        } catch (e) {
          console.warn('Could not persist favorites to localStorage', e);
        }
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
        try {
          localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(next));
        } catch (e) {
          console.warn('Could not persist favorites to localStorage', e);
        }
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

      const localFavs = favoritesRef.current;
      const remoteFavs = (await fetchFavoritesFromVault(targetCode)) || [];

      // Fusion bilatérale : on combine local + distant
      const merged = mergeItemsById(localFavs, remoteFavs);

      setFavorites(merged);
      try {
        localStorage.setItem(APP_STORAGE_KEYS.favorites, JSON.stringify(merged));
      } catch (e) {
        console.warn('Could not persist to storage', e);
      }

      // Si la fusion contient au moins un favori, on met à jour le coffre Firestore
      if (merged.length > 0) {
        await pushFavoritesToVault(targetCode, merged);
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
    [pairingCode]
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
