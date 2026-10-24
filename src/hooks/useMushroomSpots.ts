import { useState, useEffect, useCallback, useRef } from 'react';
import type { MushroomSpot } from '../types/mushroom';
import {
  getStoredPairingCode,
  pushMushroomSpotsToVault,
  fetchVaultData,
  subscribeToVault,
} from '../lib/firebase/syncVaultService';

const MUSHROOM_STORAGE_KEY = 'luxoutdoor_mushroom_spots';

export function useMushroomSpots() {
  const [spots, setSpots] = useState<MushroomSpot[]>(() => {
    try {
      const saved = localStorage.getItem(MUSHROOM_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSpottingMode, setIsSpottingMode] = useState<boolean>(false);
  const [pendingSpotCoord, setPendingSpotCoord] = useState<[number, number] | null>(null);
  const pairingCode = getStoredPairingCode();
  const isRemoteUpdatingRef = useRef(false);

  // Persistance locale
  useEffect(() => {
    try {
      localStorage.setItem(MUSHROOM_STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      console.warn('Erreur stockage spots champignons:', e);
    }
  }, [spots]);

  // Synchronisation Cloud temps réel
  useEffect(() => {
    if (!pairingCode) return;

    // Récupération initiale si des spots distants existent
    fetchVaultData(pairingCode).then((vaultData) => {
      if (vaultData && vaultData.mushroomSpots && vaultData.mushroomSpots.length > 0) {
        setSpots((local) => {
          const map = new Map<string, MushroomSpot>();
          local.forEach((s) => map.set(s.id, s));
          vaultData.mushroomSpots.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
    });

    const unsubscribe = subscribeToVault(pairingCode, (remoteData) => {
      if (remoteData.mushroomSpots) {
        isRemoteUpdatingRef.current = true;
        setSpots((local) => {
          const map = new Map<string, MushroomSpot>();
          local.forEach((s) => map.set(s.id, s));
          remoteData.mushroomSpots!.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 500);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [pairingCode]);

  const syncSpotsToCloud = useCallback(
    async (nextSpots: MushroomSpot[]) => {
      if (!pairingCode || isRemoteUpdatingRef.current) return;
      await pushMushroomSpotsToVault(pairingCode, nextSpots);
    },
    [pairingCode]
  );

  const addSpot = useCallback(
    (name: string, variety: string, coordinates: [number, number], notes?: string) => {
      const newSpot: MushroomSpot = {
        id: `spot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: name.trim() || 'Coin à champignons',
        variety: variety || 'Cèpes & Bolets',
        coordinates,
        dateAdded: new Date().toISOString(),
        notes: notes?.trim() || undefined,
      };

      setSpots((prev) => {
        const next = [newSpot, ...prev];
        syncSpotsToCloud(next);
        return next;
      });
      setIsSpottingMode(false);
      setPendingSpotCoord(null);
    },
    [syncSpotsToCloud]
  );

  const deleteSpot = useCallback(
    (id: string) => {
      setSpots((prev) => {
        const next = prev.filter((s) => s.id !== id);
        syncSpotsToCloud(next);
        return next;
      });
    },
    [syncSpotsToCloud]
  );

  const updateSpot = useCallback(
    (id: string, updates: Partial<MushroomSpot>) => {
      setSpots((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        syncSpotsToCloud(next);
        return next;
      });
    },
    [syncSpotsToCloud]
  );

  return {
    spots,
    isSpottingMode,
    setIsSpottingMode,
    pendingSpotCoord,
    setPendingSpotCoord,
    addSpot,
    deleteSpot,
    updateSpot,
  };
}
