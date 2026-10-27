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
import {
  getDeviceId,
  getDeviceProfile,
  type ConnectedDevice,
} from '../sync/deviceIdentity';

export const PAIRING_STORAGE_KEY = 'luxoutdoor_pairing_code';
export const LAST_SYNC_STORAGE_KEY = 'luxoutdoor_last_sync_time';

/**
 * Assainit les chaînes provenant du réseau ou du stockage local pour éviter toute injection ou débordement
 */
export function sanitizeString(val: unknown, maxLen = 250): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen);
}

/**
 * Format attendu pour le code de jumelage :
 * Préfixe strict LUX- suivi d'au moins 3 caractères alphanumériques sans ambiguïté
 */
export const LUX_PAIRING_REGEX = /^LUX-[A-Z0-9]{3,}$/i;

/**
 * Vérifie si un code de synchronisation respecte strictement la règle LUX-
 */
export function isValidPairingCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return LUX_PAIRING_REGEX.test(normalizePairingCode(code));
}

/**
 * Normalise et force le préfixe strict LUX- pour tout code de jumelage
 * Exemples :
 * - "9482" -> "LUX-9482"
 * - "lux9482" -> "LUX-9482"
 * - "lux-9482" -> "LUX-9482"
 * - "LUX-ABCD" -> "LUX-ABCD"
 */
export function normalizePairingCode(code: string): string {
  if (!code || typeof code !== 'string') return '';
  // Filtre de sécurité : conserve uniquement lettres, chiffres et tirets, max 16 caractères
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
  if (!clean) return '';

  if (clean.startsWith('LUX-')) {
    return clean;
  }
  if (clean.startsWith('LUX')) {
    return `LUX-${clean.slice(3).replace(/^-+/, '')}`;
  }
  // Si l'utilisateur a tapé directement les chiffres/lettres sans LUX-
  return `LUX-${clean.replace(/^-+/, '')}`;
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
    const raw = localStorage.getItem(PAIRING_STORAGE_KEY);
    if (!raw) return null;
    const clean = normalizePairingCode(raw);
    return isValidPairingCode(clean) ? clean : null;
  } catch {
    return null;
  }
}

export function setStoredPairingCode(code: string | null): void {
  try {
    if (code) {
      const clean = normalizePairingCode(code);
      localStorage.setItem(PAIRING_STORAGE_KEY, clean);
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
  routeJson?: string;
  traceJson?: string;
}

export function packFavoriteForSync(fav: SavedFavorite): SyncedFavoriteRecord {
  return {
    id: sanitizeString(fav.id, 64),
    title: sanitizeString(fav.title, 150) || 'Circuit sans titre',
    description: sanitizeString(fav.description, 1000),
    dateSaved: fav.dateSaved || new Date().toISOString(),
    distanceKm: typeof fav.distanceKm === 'number' && Number.isFinite(fav.distanceKm) ? fav.distanceKm : 0,
    elevationGain: typeof fav.elevationGain === 'number' && Number.isFinite(fav.elevationGain) ? fav.elevationGain : 0,
    activity: fav.activity === 'bike' ? 'bike' : 'hike',
    country: (fav.country || 'LU') as any,
    regionName: sanitizeString(fav.regionName, 100),
    category: ['top', 'bien', 'ne_pas_refaire', 'champignons'].includes(fav.category as string) ? fav.category : null,
    hasMushrooms: Boolean(fav.hasMushrooms),
    userRating: typeof fav.userRating === 'number' ? fav.userRating : null,
    userNotes: sanitizeString(fav.userNotes, 2000),
    routeId: sanitizeString(fav.route?.id || fav.id, 64),
    routeJson: JSON.stringify(fav.route || {}),
    traceJson: JSON.stringify(fav.trace || {}),
  };
}

export function unpackFavoriteFromSync(raw: any): SavedFavorite {
  let route = raw.route || {};
  let trace = raw.trace || {};

  if (raw.routeJson && typeof raw.routeJson === 'string') {
    try {
      route = JSON.parse(raw.routeJson);
    } catch {
      // Garde l'existant
    }
  }

  if (raw.traceJson && typeof raw.traceJson === 'string') {
    try {
      trace = JSON.parse(raw.traceJson);
    } catch {
      // Garde l'existant
    }
  }

  return {
    id: sanitizeString(raw.id, 64) || `fav_${Date.now()}`,
    title: sanitizeString(raw.title || route.title, 150) || 'Circuit sans titre',
    description: sanitizeString(raw.description || route.description, 1000),
    dateSaved: raw.dateSaved || new Date().toISOString(),
    distanceKm:
      typeof raw.distanceKm === 'number' && Number.isFinite(raw.distanceKm)
        ? raw.distanceKm
        : Number(((trace.distance || 0) / 1000).toFixed(1)),
    elevationGain:
      typeof raw.elevationGain === 'number' && Number.isFinite(raw.elevationGain)
        ? raw.elevationGain
        : (route.elevationGain || 0),
    activity: raw.activity === 'bike' || route.activity === 'bike' ? 'bike' : 'hike',
    country: raw.country || route.country || 'LU',
    regionName: sanitizeString(raw.regionName || route.regionName, 100),
    category: ['top', 'bien', 'ne_pas_refaire', 'champignons'].includes(raw.category) ? raw.category : undefined,
    hasMushrooms: Boolean(raw.hasMushrooms),
    userRating: typeof raw.userRating === 'number' ? raw.userRating : undefined,
    userNotes: sanitizeString(raw.userNotes, 2000),
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
  devices?: ConnectedDevice[];
  status?: 'active' | 'revoked';
}

/**
 * Pousse les favoris et les spots de champignons vers le coffre Firestore partagé
 */
export async function pushVaultData(
  pairingCode: string,
  data: {
    favorites?: SavedFavorite[];
    mushroomSpots?: MushroomSpot[];
    devices?: ConnectedDevice[];
    status?: 'active' | 'revoked';
  }
): Promise<boolean> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode || !isValidPairingCode(cleanCode)) {
    console.warn('Tentative de synchronisation avec un code invalide (doit débuter par LUX-):', pairingCode);
    return false;
  }

  try {
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);

    const payload: Partial<VaultDocData> = {
      pairingCode: cleanCode,
      updatedAt: new Date().toISOString(),
    };

    if (data.favorites !== undefined) {
      // Bounding de sécurité : plafonné à 250 éléments max pour garantir l'intégrité Firestore
      const safeFavorites = data.favorites.slice(0, 250);
      payload.favorites = safeFavorites.map(packFavoriteForSync);
      payload.count = safeFavorites.length;
    }
    if (data.mushroomSpots !== undefined) {
      payload.mushroomSpots = data.mushroomSpots.slice(0, 250);
    }
    if (data.devices !== undefined) {
      payload.devices = data.devices;
    }
    if (data.status !== undefined) {
      payload.status = data.status;
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
): Promise<{
  favorites: SavedFavorite[];
  mushroomSpots: MushroomSpot[];
  devices: ConnectedDevice[];
  status: 'active' | 'revoked';
} | null> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode || !isValidPairingCode(cleanCode)) return null;

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
        devices: Array.isArray(data.devices) ? data.devices : [],
        status: data.status || 'active',
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
 * Enregistre ou met à jour la présence de cet appareil dans le coffre
 */
export async function registerDeviceInVault(pairingCode: string): Promise<boolean> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode || !isValidPairingCode(cleanCode)) return false;

  try {
    const profile = getDeviceProfile();
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);
    const snap = await getDoc(vaultRef);

    const now = new Date().toISOString();
    const currentDeviceEntry: ConnectedDevice = {
      id: profile.id,
      name: profile.name,
      deviceType: profile.deviceType,
      userAgent: profile.userAgent,
      connectedAt: now,
      lastSeen: now,
      status: 'allowed',
    };

    let devices: ConnectedDevice[] = [];
    if (snap.exists()) {
      const existing = snap.data().devices;
      if (Array.isArray(existing)) {
        devices = [...existing];
      }
    }

    const idx = devices.findIndex((d) => d.id === profile.id);
    if (idx >= 0) {
      // Si cet appareil a été expressément bloqué par l'admin, on ne le réautorise pas tout seul
      if (devices[idx].status === 'blocked') {
        return false;
      }
      devices[idx] = {
        ...devices[idx],
        name: profile.name,
        deviceType: profile.deviceType,
        lastSeen: now,
      };
    } else {
      devices.push(currentDeviceEntry);
    }

    await setDoc(vaultRef, { devices, updatedAt: now }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Erreur enregistrement appareil dans le coffre:', err);
    return false;
  }
}

/**
 * Bloque / refuse un appareil spécifique dans le coffre Cloud
 */
export async function refuseDeviceInVault(
  pairingCode: string,
  deviceIdToRefuse: string
): Promise<boolean> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode) return false;

  try {
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);
    const snap = await getDoc(vaultRef);

    if (!snap.exists()) return false;
    const existing = snap.data().devices;
    let devices: ConnectedDevice[] = Array.isArray(existing) ? [...existing] : [];

    devices = devices.map((d) => {
      if (d.id === deviceIdToRefuse) {
        return { ...d, status: 'blocked', lastSeen: new Date().toISOString() };
      }
      return d;
    });

    await setDoc(vaultRef, { devices, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Erreur refus appareil dans le coffre:', err);
    return false;
  }
}

/**
 * Révoque entièrement un coffre LUX- (toutes les connexions sont refusées)
 */
export async function revokeVault(pairingCode: string): Promise<boolean> {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode) return false;

  try {
    const db = getFirebaseDb();
    const vaultRef = doc(db, 'sync_vaults', cleanCode);
    await setDoc(
      vaultRef,
      { status: 'revoked', updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Erreur révocation coffre:', err);
    return false;
  }
}

export type VaultUpdatePayload = {
  favorites?: SavedFavorite[];
  mushroomSpots?: MushroomSpot[];
  devices?: ConnectedDevice[];
  isRevoked?: boolean;
};

type VaultSubscriberCallback = (data: VaultUpdatePayload) => void;

/**
 * GESTIONNAIRE CENTRALISÉ DES ÉCOUTES FIRESTORE (Pilier 1 : Cycle de vie, Mutualisation & Pause d'inactivité)
 * - Partage une seule et unique connexion Firestore par code LUX- pour tous les composants
 * - Pause automatiquement l'écoute quand le document est masqué (écran éteint / onglet masqué)
 * - Pause automatiquement après 3 minutes d'inactivité (économise batterie et bande passante)
 * - Réactive immédiatement l'écoute dès que l'utilisateur revient ou interagit
 * - Surveille si l'appareil a été refusé / bloqué par l'administrateur
 */
class VaultSyncManager {
  private activeCode: string | null = null;
  private subscribers = new Set<VaultSubscriberCallback>();
  private firestoreUnsubscribe: Unsubscribe | null = null;
  private idleTimeoutId: any = null;
  private isPaused: boolean = false;
  private lastHeartbeatTime: number = 0;
  private initializedLifecycle: boolean = false;

  private readonly IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

  constructor() {
    this.setupLifecycleListeners();
  }

  private setupLifecycleListeners() {
    if (typeof window === 'undefined' || this.initializedLifecycle) return;
    this.initializedLifecycle = true;

    // 1. Visibilité du document (mise en veille / arrière-plan)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseListener('background');
      } else {
        this.resumeListener('foreground');
      }
    });

    // 2. Détection d'inactivité utilisateur (toucher, souris, clavier)
    const resetIdle = () => {
      this.handleUserActivity();
    };

    window.addEventListener('pointerdown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });

    this.startIdleTimer();
  }

  private startIdleTimer() {
    if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId);
    this.idleTimeoutId = setTimeout(() => {
      this.pauseListener('idle');
    }, this.IDLE_THRESHOLD_MS);
  }

  private lastActivityRecordedTime: number = 0;

  private handleUserActivity() {
    const now = Date.now();
    if (this.isPaused && !document.hidden) {
      this.lastActivityRecordedTime = now;
      this.startIdleTimer();
      this.resumeListener('user_activity');
      return;
    }
    // Optimisation mobile/batterie : limite le recalcul du timer à une fois toutes les 10 secondes
    if (now - this.lastActivityRecordedTime > 10_000) {
      this.lastActivityRecordedTime = now;
      this.startIdleTimer();
    }
  }

  private pauseListener(reason: 'background' | 'idle') {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
      this.isPaused = true;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SyncVault] Pause éco-énergie activée (${reason})`);
      }
    }
  }

  private resumeListener(trigger: string) {
    if (this.isPaused && this.activeCode && this.subscribers.size > 0) {
      this.isPaused = false;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SyncVault] Reprise de la synchronisation (${trigger})`);
      }
      this.connectFirestore(this.activeCode);
    }
  }

  private triggerHeartbeat(code: string) {
    const now = Date.now();
    // Maximum un heartbeat toutes les 4 minutes
    if (now - this.lastHeartbeatTime > 4 * 60 * 1000) {
      this.lastHeartbeatTime = now;
      registerDeviceInVault(code).catch(() => {});
    }
  }

  private connectFirestore(code: string) {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }

    try {
      const db = getFirebaseDb();
      const vaultRef = doc(db, 'sync_vaults', code);
      const myDeviceId = getDeviceId();

      this.triggerHeartbeat(code);

      this.firestoreUnsubscribe = onSnapshot(
        vaultRef,
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();

          // 1. Vérification de révocation ou de refus d'accès
          const devices: ConnectedDevice[] = Array.isArray(data.devices) ? data.devices : [];
          const currentDevice = devices.find((d) => d.id === myDeviceId);

          const isBlocked = currentDevice?.status === 'blocked';
          const isRevoked = data.status === 'revoked';

          if (isBlocked || isRevoked) {
            console.warn('[SyncVault] Connexion LUX- refusée ou révoquée par l’administrateur.');
            this.disconnect();
            setStoredPairingCode(null);

            // Alerte tous les souscripteurs
            this.subscribers.forEach((cb) => {
              try {
                cb({ isRevoked: true });
              } catch (e) {
                console.error(e);
              }
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('lux_device_blocked', {
                  detail: { reason: isBlocked ? 'device_refused' : 'vault_revoked' },
                })
              );
            }
            return;
          }

          // 2. Traitement des données
          const rawFavs = Array.isArray(data.favorites) ? data.favorites : undefined;
          const payload: VaultUpdatePayload = {
            favorites: rawFavs ? rawFavs.map(unpackFavoriteFromSync) : undefined,
            mushroomSpots: Array.isArray(data.mushroomSpots) ? data.mushroomSpots : undefined,
            devices,
          };

          this.subscribers.forEach((cb) => {
            try {
              cb(payload);
            } catch (err) {
              console.error('[SyncVault] Erreur callback subscriber:', err);
            }
          });
        },
        (error) => {
          console.warn('Avertissement écoute mutualisée coffre Cloud:', error.message);
        }
      );
    } catch (err) {
      console.warn('Impossible d’ouvrir l’écoute Firestore:', err);
    }
  }

  public subscribe(code: string, callback: VaultSubscriberCallback): () => void {
    const cleanCode = normalizePairingCode(code);
    if (!isValidPairingCode(cleanCode)) {
      return () => {};
    }

    this.subscribers.add(callback);

    if (this.activeCode !== cleanCode) {
      this.activeCode = cleanCode;
      this.isPaused = false;
      this.connectFirestore(cleanCode);
    } else if (this.isPaused) {
      this.resumeListener('new_subscriber');
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  public disconnect() {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }
    this.activeCode = null;
    this.isPaused = false;
  }
}

export const vaultSyncManager = new VaultSyncManager();

/**
 * Abonnement mutualisé à un coffre LUX- (géré avec pause d'inactivité & cycle de vie)
 */
export function subscribeToVault(
  pairingCode: string,
  onRemoteUpdate: (data: VaultUpdatePayload) => void
): Unsubscribe | null {
  const cleanCode = normalizePairingCode(pairingCode);
  if (!cleanCode || !isValidPairingCode(cleanCode)) return null;

  return vaultSyncManager.subscribe(cleanCode, onRemoteUpdate);
}
