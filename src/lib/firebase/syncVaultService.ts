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

export interface SyncedFavoriteRecord {
  id: string;
  title: string;
  description?: string;
  dateSaved: string;
  distanceKm: number;
  elevationGain: number;
  activity: 'bike' | 'hike';
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  regionName?: string;
  category?: string | null;
  hasMushrooms?: boolean;
  userRating?: number | null;
  userNotes?: string;
  routeId?: string;
  // Les structures complexes contenant des tableaux imbriqués (ex: waypoints, coordonnées GPX)
  // sont sérialisées en JSON afin de respecter l'interdiction stricte de Firestore sur les "nested arrays".
  routeJson?: string;
  traceJson?: string;
}

export function packFavoriteForSync(fav: SavedFavorite): SyncedFavoriteRecord {
  return {
    id: fav.id,
    title: fav.title || '',
    description: fav.description || '',
    dateSaved: fav.dateSaved || new Date().toISOString(),
    distanceKm: fav.distanceKm || 0,
    elevationGain: fav.elevationGain || 0,
    activity: fav.activity || 'hike',
    country: fav.country || 'LU',
    regionName: fav.regionName || '',
    category: fav.category || null,
    hasMushrooms: Boolean(fav.hasMushrooms),
    userRating: fav.userRating || null,
    userNotes: fav.userNotes || '',
    routeId: fav.route?.id || fav.id,
    routeJson: JSON.stringify(fav.route || {}),
    traceJson: JSON.stringify(fav.trace || {}),
  };
}

export function unpackFavoriteFromSync(raw: any): SavedFavorite {
  let route = raw.route || {};
  let trace = raw.trace || {};

  if (raw.routeJson) {
    try {
      route = JSON.parse(raw.routeJson);
    } catch {
      // Garde l'existant
    }
  }

  if (raw.traceJson) {
    try {
      trace = JSON.parse(raw.traceJson);
    } catch {
      // Garde l'existant
    }
  }

  return {
    id: raw.id,
    title: raw.title || route.title || 'Circuit sans titre',
    description: raw.description || route.description || '',
    dateSaved: raw.dateSaved || new Date().toISOString(),
    distanceKm:
      typeof raw.distanceKm === 'number'
        ? raw.distanceKm
        : Number(((trace.distance || 0) / 1000).toFixed(1)),
    elevationGain:
      typeof raw.elevationGain === 'number' ? raw.elevationGain : (route.elevationGain || 0),
    activity: raw.activity || route.activity || 'hike',
    country: raw.country || route.country || 'LU',
    regionName: raw.regionName || route.regionName || '',
    category: raw.category || undefined,
    hasMushrooms: Boolean(raw.hasMushrooms),
    userRating: raw.userRating || undefined,
    userNotes: raw.userNotes || '',
    route: route.id ? route : { id: raw.routeId || raw.id, title: raw.title || '' },
    trace: trace.distance
      ? trace
      : { distance: (raw.distanceKm || 0) * 1000, duration: 3600, coordinates: [] },
  };
}

export interface VaultDocData {
  pairingCode: string;
  updatedAt: string;
  count: number;
  favorites: SyncedFavoriteRecord[];
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
      payload.favorites = data.favorites.map(packFavoriteForSync);
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
      const data = snap.data();
      const rawFavs = Array.isArray(data.favorites) ? data.favorites : [];
      return {
        favorites: rawFavs.map(unpackFavoriteFromSync),
        mushroomSpots: Array.isArray(data.mushroomSpots) ? data.mushroomSpots : [],
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
          const data = snap.data();
          const rawFavs = Array.isArray(data.favorites) ? data.favorites : undefined;
          onRemoteUpdate({
            favorites: rawFavs ? rawFavs.map(unpackFavoriteFromSync) : undefined,
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
