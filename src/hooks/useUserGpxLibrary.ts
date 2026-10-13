import { useState, useEffect, useCallback } from 'react';
import {
  type StoredGpxTrack,
  getAllStoredGpxTracks,
  saveMultipleStoredGpxTracks,
  deleteStoredGpxTrack,
  updateStoredGpxNotes,
  markTrackAsSynced,
  exportUserGpxLibraryJson,
  importUserGpxLibraryFromJson,
  storedTrackToRouteAndTrace,
} from '../lib/gpxStorageService';
import {
  parseGPXString,
  calculateRouteDifficulty,
  computeRoadBreakdown,
  generateTrackSegments,
} from '../lib/geoUtils';
import type { RouteSuggestions, RouteTrace } from '../types';

export function useUserGpxLibrary() {
  const [userTracks, setUserTracks] = useState<StoredGpxTrack[]>([]);
  const [tripsList, setTripsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recharge la liste des voyages uniques
  const refreshTrips = (tracks: StoredGpxTrack[]) => {
    const trips = new Set<string>();
    tracks.forEach((t) => {
      if (t.tripName && t.tripName.trim().length > 0) {
        trips.add(t.tripName.trim());
      }
    });
    setTripsList(Array.from(trips).sort());
  };

  // Chargement initial depuis IndexedDB
  useEffect(() => {
    let mounted = true;
    getAllStoredGpxTracks()
      .then((tracks) => {
        if (!mounted) return;
        setUserTracks(tracks);
        refreshTrips(tracks);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Erreur chargement IndexedDB:', err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Importation et persistance immédiate de fichiers GPX
  const importAndPersistGpxFiles = useCallback(
    async (
      files: { name: string; content: string }[],
      activity: 'bike' | 'hike',
      tripName?: string
    ): Promise<{ importedTracks: StoredGpxTrack[]; routes: RouteSuggestions[]; traces: Record<string, RouteTrace> }> => {
      const newStoredTracks: StoredGpxTrack[] = [];
      const newRoutes: RouteSuggestions[] = [];
      const newTraces: Record<string, RouteTrace> = {};

      const cleanTrip = tripName?.trim() || undefined;

      for (let i = 0; i < files.length; i++) {
        const { name, content } = files[i];
        try {
          const parsed = parseGPXString(content);
          const id = 'user_gpx_' + Date.now() + '_' + i;
          const speedKmH = activity === 'bike' ? 20 : 4.5;
          const durationSec = Math.round(
            (parsed.distanceKm / speedKmH) * 3600 + (parsed.elevationGain / 400) * 1800
          );
          const difficulty = calculateRouteDifficulty(
            parsed.distanceKm,
            parsed.elevationGain,
            activity
          );
          const surfaceDist = [
            { type: 'Voie verte / Sentier naturel', percentage: 80 },
            { type: 'Liaison petite route partagée', percentage: 20 },
          ];
          const roadBreakdown = computeRoadBreakdown(parsed.distanceKm, surfaceDist, activity);
          const segments = generateTrackSegments(parsed.coordinates, roadBreakdown.carFreePercentage);

          const stored: StoredGpxTrack = {
            id,
            fileName: name,
            title: parsed.title || name.replace(/\.gpx$/i, ''),
            description: parsed.description || `Tracé GPX importé comprenant ${parsed.coordinates.length} points GPS et ${parsed.elevationGain}m de D+.`,
            tripName: cleanTrip,
            activity,
            dateAdded: new Date().toISOString(),
            distanceKm: parsed.distanceKm,
            elevationGain: parsed.elevationGain,
            elevationLoss: parsed.elevationGain,
            coordinates: parsed.coordinates,
            elevationProfile: parsed.elevationProfile,
            segments,
            difficulty,
            surfaceDistribution: surfaceDist,
            roadBreakdown,
            tags: ['imported', activity, cleanTrip].filter(Boolean) as string[],
            rawGpxContent: content,
          };

          newStoredTracks.push(stored);
          const { route, trace } = storedTrackToRouteAndTrace(stored);
          newRoutes.push(route);
          newTraces[id] = trace;
        } catch (err) {
          console.warn('Échec de lecture du fichier GPX:', name, err);
        }
      }

      if (newStoredTracks.length > 0) {
        await saveMultipleStoredGpxTracks(newStoredTracks);
        setUserTracks((prev) => {
          const updated = [...newStoredTracks, ...prev];
          refreshTrips(updated);
          return updated;
        });
      }

      return { importedTracks: newStoredTracks, routes: newRoutes, traces: newTraces };
    },
    []
  );

  // Suppression d'une trace
  const deleteTrack = useCallback(async (id: string) => {
    await deleteStoredGpxTrack(id);
    setUserTracks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      refreshTrips(updated);
      return updated;
    });
  }, []);

  // Mise à jour des notes personnelles
  const updateTrackNotes = useCallback(
    async (id: string, userNotes?: string, userRating?: number, tripName?: string) => {
      await updateStoredGpxNotes(id, userNotes, userRating, tripName);
      setUserTracks((prev) => {
        const updated = prev.map((t) =>
          t.id === id
            ? {
                ...t,
                userNotes: userNotes !== undefined ? userNotes : t.userNotes,
                userRating: userRating !== undefined ? userRating : t.userRating,
                tripName: tripName !== undefined ? tripName : t.tripName,
              }
            : t
        );
        refreshTrips(updated);
        return updated;
      });
    },
    []
  );

  // Marquage d'une trace synchronisée avec GitHub
  const markTrackSynced = useCallback(async (id: string, githubSha?: string) => {
    await markTrackAsSynced(id, githubSha);
    setUserTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, syncedToGitHub: true, githubSha } : t))
    );
  }, []);

  // Export JSON de sauvegarde
  const exportLibrary = useCallback(async () => {
    const jsonStr = await exportUserGpxLibraryJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-outdoor-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Import JSON de sauvegarde
  const importLibraryBackup = useCallback(async (jsonString: string): Promise<number> => {
    const count = await importUserGpxLibraryFromJson(jsonString);
    const refreshed = await getAllStoredGpxTracks();
    setUserTracks(refreshed);
    refreshTrips(refreshed);
    return count;
  }, []);

  return {
    userTracks,
    tripsList,
    isLoading,
    importAndPersistGpxFiles,
    deleteTrack,
    updateTrackNotes,
    markTrackSynced,
    exportLibrary,
    importLibraryBackup,
  };
}
