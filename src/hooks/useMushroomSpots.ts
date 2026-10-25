import { mergeItemsById } from '../lib/sync/syncMerge';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { MushroomSpot } from '../types/mushroom';
import {
  getStoredPairingCode,
  pushMushroomSpotsToVault,
  fetchVaultData,
  subscribeToVault,
} from '../lib/firebase/syncVaultService';

const MUSHROOM_STORAGE_KEY = 'luxoutdoor_mushroom_spots';

export function useMushroomSpots(activePairingCode?: string | null) {
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

  // Code de jumelage actif et réactif
  const [pairingCode, setPairingCode] = useState<string | null>(
    () => activePairingCode ?? getStoredPairingCode()
  );

  useEffect(() => {
    if (activePairingCode !== undefined) {
      setPairingCode(activePairingCode);
    }
  }, [activePairingCode]);

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

  const isRemoteUpdatingRef = useRef(false);
  const spotsRef = useRef<MushroomSpot[]>(spots);

  useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  // Persistance locale
  useEffect(() => {
    try {
      localStorage.setItem(MUSHROOM_STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      console.warn('Erreur stockage spots champignons:', e);
    }
  }, [spots]);

  // Synchronisation Cloud bidirectionnelle automatique
  useEffect(() => {
    if (!pairingCode) return;

    let isSubscribed = true;

    // 1. Récupération et fusion initiale avec le coffre distant
    fetchVaultData(pairingCode).then((vaultData) => {
      if (!isSubscribed) return;
      const remoteSpots = vaultData?.mushroomSpots || [];
      const localSpots = spotsRef.current;

      const merged = mergeItemsById(localSpots, remoteSpots);

      isRemoteUpdatingRef.current = true;
      setSpots(merged);
      setTimeout(() => {
        isRemoteUpdatingRef.current = false;
      }, 300);

      // Si l'appareil local contenait des spots qui n'étaient pas encore dans le coffre Firestore
      // (ex: saisis sur iPhone avant ou pendant le jumelage), on téléverse immédiatement la fusion
      if (merged.length > remoteSpots.length || (localSpots.length > 0 && remoteSpots.length === 0)) {
        pushMushroomSpotsToVault(pairingCode, merged).catch((err) =>
          console.warn('Erreur envoi initial spots champignons Firestore:', err)
        );
      }
    });

    // 2. Écoute temps réel des ajouts/suppressions distants
    const unsubscribe = subscribeToVault(pairingCode, (remoteData) => {
      if (!isSubscribed) return;
      if (remoteData.mushroomSpots !== undefined) {
        isRemoteUpdatingRef.current = true;
        setSpots((local) => mergeItemsById(local, remoteData.mushroomSpots || []));
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 300);
      }
    });

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [pairingCode]);

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

      const nextSpots = [newSpot, ...spotsRef.current];
      setSpots(nextSpots);

      // Envoi immédiat vers Firestore hors du reducer
      if (pairingCode && !isRemoteUpdatingRef.current) {
        pushMushroomSpotsToVault(pairingCode, nextSpots).catch((err) =>
          console.warn('Erreur envoi spot Firestore:', err)
        );
      }

      setIsSpottingMode(false);
      setPendingSpotCoord(null);
    },
    [pairingCode]
  );

  const deleteSpot = useCallback(
    (id: string) => {
      const nextSpots = spotsRef.current.filter((s) => s.id !== id);
      setSpots(nextSpots);

      if (pairingCode && !isRemoteUpdatingRef.current) {
        pushMushroomSpotsToVault(pairingCode, nextSpots).catch((err) =>
          console.warn('Erreur suppression spot Firestore:', err)
        );
      }
    },
    [pairingCode]
  );

  const updateSpot = useCallback(
    (id: string, updates: Partial<MushroomSpot>) => {
      const nextSpots = spotsRef.current.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setSpots(nextSpots);

      if (pairingCode && !isRemoteUpdatingRef.current) {
        pushMushroomSpotsToVault(pairingCode, nextSpots).catch((err) =>
          console.warn('Erreur mise à jour spot Firestore:', err)
        );
      }
    },
    [pairingCode]
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
