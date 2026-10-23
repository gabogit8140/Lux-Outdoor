import type {
  ElevationPoint,
  RoadTypeBreakdown,
  RouteDifficulty,
  TrackSegment,
  RouteSuggestions,
  RouteTrace,
} from '../types';
import { APP_CONFIG } from './config/appConfig';

export interface StoredGpxTrack {
  id: string;
  fileName: string;
  title: string;
  description: string;
  tripName?: string;
  activity: 'bike' | 'hike';
  dateAdded: string;
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation?: number;
  maxElevation?: number;
  coordinates: [number, number][];
  elevationProfile: ElevationPoint[];
  segments?: TrackSegment[];
  difficulty?: RouteDifficulty;
  surfaceDistribution?: { type: string; percentage: number }[];
  roadBreakdown?: RoadTypeBreakdown;
  tags: string[];
  userNotes?: string;
  userRating?: number;
  rawGpxContent?: string;
  syncedToGitHub?: boolean;
  githubSha?: string;
}

const DB_NAME = 'trace_outdoor_db';
const DB_VERSION = 1;
const STORE_NAME = 'user_gpx_tracks';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB n\'est pas disponible dans cet environnement'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('activity', 'activity', { unique: false });
        store.createIndex('tripName', 'tripName', { unique: false });
        store.createIndex('dateAdded', 'dateAdded', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Charge l'ensemble des traces GPX importées par l'utilisateur depuis IndexedDB
 */
export async function getAllStoredGpxTracks(): Promise<StoredGpxTrack[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des traces IndexedDB:', err);
    return [];
  }
}

/**
 * Sauvegarde une trace GPX dans IndexedDB
 */
export async function saveStoredGpxTrack(track: StoredGpxTrack): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarde par lot plusieurs traces GPX dans IndexedDB
 */
export async function saveMultipleStoredGpxTracks(tracks: StoredGpxTrack[]): Promise<number> {
  if (tracks.length === 0) return 0;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let count = 0;

    tracks.forEach((track) => {
      store.put(track);
      count++;
    });

    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Supprime une trace GPX d'IndexedDB par son identifiant
 */
export async function deleteStoredGpxTrack(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Met à jour les notes ou la note personnelle d'une trace
 */
export async function updateStoredGpxNotes(
  id: string,
  userNotes?: string,
  userRating?: number,
  tripName?: string
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const track: StoredGpxTrack = getRequest.result;
      if (!track) {
        reject(new Error(`Trace ${id} introuvable`));
        return;
      }
      if (userNotes !== undefined) track.userNotes = userNotes;
      if (userRating !== undefined) track.userRating = userRating;
      if (tripName !== undefined) track.tripName = tripName;

      const putRequest = store.put(track);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Marque une trace comme synchronisée avec GitHub
 */
export async function markTrackAsSynced(id: string, githubSha?: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const track: StoredGpxTrack = getRequest.result;
      if (!track) {
        resolve();
        return;
      }
      track.syncedToGitHub = true;
      if (githubSha) track.githubSha = githubSha;

      const putRequest = store.put(track);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Récupère la liste de tous les carnets / voyages distincts enregistrés
 */
export async function getAllStoredTripNames(): Promise<string[]> {
  const tracks = await getAllStoredGpxTracks();
  const trips = new Set<string>();
  tracks.forEach((t) => {
    if (t.tripName && t.tripName.trim().length > 0) {
      trips.add(t.tripName.trim());
    }
  });
  return Array.from(trips).sort();
}

/**
 * Exporte l'ensemble des traces utilisateur au format JSON pour sauvegarde / transfert
 */
export async function exportUserGpxLibraryJson(): Promise<string> {
  const tracks = await getAllStoredGpxTracks();
  const exportPayload = {
    app: APP_CONFIG.name,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalTracks: tracks.length,
    tracks,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Convertit une trace stockée en paire RouteSuggestions + RouteTrace
 */
export function storedTrackToRouteAndTrace(track: StoredGpxTrack): { route: RouteSuggestions; trace: RouteTrace } {
  const speedKmH = track.activity === 'bike' ? 20 : 4.5;
  const durationSec = Math.round(
    (track.distanceKm / speedKmH) * 3600 + (track.elevationGain / 400) * 1800
  );

  const route: RouteSuggestions = {
    id: track.id,
    type: 'imported',
    title: track.title,
    description: track.description,
    tripName: track.tripName,
    isUserImported: true,
    dateAdded: track.dateAdded,
    highlights: [
      track.tripName ? `Voyage : ${track.tripName}` : 'Trace personnelle importée',
      `${track.distanceKm} km • D+ ${track.elevationGain}m`,
      track.roadBreakdown?.carFreePercentage
        ? `${track.roadBreakdown.carFreePercentage}% sans voiture`
        : 'Tracé GPS direct',
    ],
    surfaceType: track.activity === 'bike' ? 'Itinéraire vélo importé' : 'Sentier de randonnée importé',
    difficulty: track.difficulty || {
      level: track.distanceKm > 40 ? 'hard' : track.distanceKm > 20 ? 'moderate' : 'easy',
      label: track.distanceKm > 40 ? 'Sportif' : track.distanceKm > 20 ? 'Modéré' : 'Facile',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      dPlusPerKm: Math.round(track.elevationGain / Math.max(1, track.distanceKm)),
      effortScore: Math.round(track.distanceKm + track.elevationGain / 100),
    },
    userRating: track.userRating,
    userNotes: track.userNotes,
    elevationGain: track.elevationGain,
    elevationLoss: track.elevationLoss,
    minElevation: track.minElevation,
    maxElevation: track.maxElevation,
    activity: track.activity,
    surfaceDistribution: track.surfaceDistribution || [
      { type: 'Voie verte / Sentier naturel', percentage: 80 },
      { type: 'Liaison petite route partagée', percentage: 20 },
    ],
    roadBreakdown: track.roadBreakdown,
    waypoints: [
      track.coordinates[0],
      track.coordinates[Math.floor(track.coordinates.length / 2)],
      track.coordinates[track.coordinates.length - 1],
    ],
    tags: track.tags || ['imported'],
    sourceLabel: track.tripName ? `Carnet "${track.tripName}"` : 'Fichier GPX importé',
  };

  const trace: RouteTrace = {
    distance: Math.round(track.distanceKm * 1000),
    duration: durationSec,
    coordinates: track.coordinates,
    elevationProfile: track.elevationProfile,
    segments: track.segments,
  };

  return { route, trace };
}

/**
 * Importe un export JSON de bibliothèque
 */
export async function importUserGpxLibraryFromJson(jsonString: string): Promise<number> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error('Fichier JSON d\'export invalide (attribut "tracks" manquant)');
    }
    const validTracks: StoredGpxTrack[] = data.tracks.filter(
      (t: any) => t && t.id && Array.isArray(t.coordinates) && t.coordinates.length > 0
    );
    return await saveMultipleStoredGpxTracks(validTracks);
  } catch (err: any) {
    throw new Error(`Échec de l'importation de la sauvegarde: ${err.message}`);
  }
}
