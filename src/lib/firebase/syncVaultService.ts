import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebaseClient';
import type { SavedFavorite } from '../../hooks/useFavorites';
import type { MushroomSpot } from '../../types/mushroom';

export const PAIRING_STORAGE_KEY = 'luxoutdoor_pairing_code';
export const LAST_SYNC_STORAGE_KEY = 'luxoutdoor_last_sync_time';

export function normalizePairingCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function generatePairingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LUX-${rand}`;
}

export function getStoredPairingCode(): string | null {
  try {
    return localStorage.getItem(PAIRING_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredPairingCode(code: string | null): void {
  try {
    if (code) {
      localStorage.setItem(PAIRING_STORAGE_KEY, normalizePairingCode(code));
    } else {
      localStorage.removeItem(PAIRING_STORAGE_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lux_pairing_change', { detail: code }));
    }
  } catch {
    // Ignore storage quota error
  }
}

export interface VaultDocData {
  pairingCode: string;
  updatedAt: string;
  count: number;
  favorites: SavedFavorite[];
  mushroomSpots?: MushroomSpot[];
}

/**
 * Pousse les favoris et les spots de champignons vers le coffre Firestore partagé
 */
export async function pushVaultData(
  pairingCode: string,
  data: { favorites?: SavedFavorite[]; mushroomSpots?: MushroomSpot[] }
): Promise<boolean> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode) return false;

  try {
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);

    const payload: Partial<VaultDocData> = {
      pairingCode: cleanCode,
      updatedAt: new Date().toISOString(),
    };

    if (data.favorites !== undefined) {
      payload.favorites = data.favorites;
      payload.count = data.favorites.length;
    }
    if (data.mushroomSpots !== undefined) {
      payload.mushroomSpots = data.mushroomSpots;
    }

    await setDoc(vaultRef, payload, { merge: true });
    try {
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, new Date().toISOString());
    } catch {
      // Ignore
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation vers le coffre Cloud:', error);
    return false;
  }
}

export async function pushFavoritesToVault(
  pairingCode: string,
  favorites: SavedFavorite[]
): Promise<boolean> {
  return pushVaultData(pairingCode, { favorites });
}

export async function pushMushroomSpotsToVault(
  pairingCode: string,
  mushroomSpots: MushroomSpot[]
): Promise<boolean> {
  return pushVaultData(pairingCode, { mushroomSpots });
}

/**
 * Récupère une fois le contenu distant d'un coffre Cloud
 */
export async function fetchVaultData(
  pairingCode: string
): Promise<{ favorites: SavedFavorite[]; mushroomSpots: MushroomSpot[] } | null> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode) return null;

  try {
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);
    const snap = await getDoc(vaultRef);

    if (snap.exists()) {
      const data = snap.data() as VaultDocData;
      return {
        favorites: data.favorites || [],
        mushroomSpots: data.mushroomSpots || [],
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du coffre Cloud:', error);
    return null;
  }
}

export async function fetchFavoritesFromVault(
  pairingCode: string
): Promise<SavedFavorite[] | null> {
  const res = await fetchVaultData(pairingCode);
  return res ? res.favorites : null;
}

/**
 * Écoute en temps réel les mises à jour distantes du coffre Cloud
 */
export function subscribeToVault(
  pairingCode: string,
  onRemoteUpdate: (data: { favorites?: SavedFavorite[]; mushroomSpots?: MushroomSpot[] }) => void
): Unsubscribe | null {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode) return null;

  try {
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);

    return onSnapshot(
      vaultRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as VaultDocData;
          onRemoteUpdate({
            favorites: Array.isArray(data.favorites) ? data.favorites : undefined,
            mushroomSpots: Array.isArray(data.mushroomSpots) ? data.mushroomSpots : undefined,
          });
        }
      },
      (error) => {
        console.warn('Avertissement écoute temps réel coffre Cloud:', error.message);
      }
    );
  } catch (error) {
    console.warn('Impossible d initialiser l écoute temps réel:', error);
    return null;
  }
}
