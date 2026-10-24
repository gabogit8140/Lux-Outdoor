import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { RouteSuggestions, RouteTrace } from '../types';
import {
  distanceMeters,
  calculateBearing,
  projectOnTrack,
  findNextManeuver,
  formatNavDistance,
  type ProjectedPoint,
  type NavigationManeuver,
} from '../lib/navigation/navigationMath';
import { deviceSensors } from '../lib/navigation/deviceSensors';

export interface OutdoorNavigationState {
  isNavigating: boolean;
  route: RouteSuggestions | null;
  trace: RouteTrace | null;
  // Position actuelle du marcheur
  userPosition: [number, number] | null; // [lon, lat]
  heading: number; // Cap en degrés (0..360)
  speedKmh: number; // Vitesse en km/h
  accuracyMeters: number | null;
  // Position projetée sur la trace
  projected: ProjectedPoint | null;
  distanceToTrackMeters: number; // Écart latéral au sentier (Cross-Track Error)
  isOffTrack: boolean; // True si écart > seuil (ex: > 35m)
  // Progression
  remainingDistanceMeters: number;
  remainingElevationGain: number;
  progressPercent: number; // 0..100
  estimatedRemainingMinutes: number;
  // Manœuvre suivante
  nextManeuver: NavigationManeuver | null;
  // Options & Alertes
  isAudioAlertsEnabled: boolean;
  isCompassOriented: boolean; // Orientation automatique carte avec boussole
  isSimulated: boolean; // Mode simulation de test
}

export interface UseOutdoorNavigationReturn extends OutdoorNavigationState {
  startNavigation: (route: RouteSuggestions, trace: RouteTrace) => void;
  stopNavigation: () => void;
  toggleAudioAlerts: () => void;
  toggleCompassOrientation: () => void;
  startSimulation: (speedMultiplier?: number) => void;
  stopSimulation: () => void;
}

const OFF_TRACK_THRESHOLD_METERS = 35; // Alerte au-delà de 35 mètres d'écart au sentier

export function useOutdoorNavigation(): UseOutdoorNavigationReturn {
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeRoute, setActiveRoute] = useState<RouteSuggestions | null>(null);
  const [activeTrace, setActiveTrace] = useState<RouteTrace | null>(null);

  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);

  const [isAudioAlertsEnabled, setIsAudioAlertsEnabled] = useState(true);
  const [isCompassOriented, setIsCompassOriented] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ coord: [number, number]; time: number } | null>(null);
  const lastOffTrackAlertTimeRef = useRef<number>(0);
  const lastManeuverIndexRef = useRef<number>(-1);

  // Aplatit les coordonnées de la trace en une liste continue ordonnée [lon, lat]
  const trackCoords: [number, number][] = useMemo(() => {
    if (!activeTrace) return [];
    const raw = activeTrace.coordinates;
    if (raw.length === 0) return [];
    if (typeof raw[0][0] === 'number') {
      return raw as [number, number][];
    }
    // Cas où c'est un tableau de segments [ [ [lon, lat], ... ], ... ]
    return (raw as [number, number][][]).flat();
  }, [activeTrace]);

  // Calcule la projection et la progression à chaque actualisation de la position GPS
  const projected = useMemo(() => {
    if (!userPosition || trackCoords.length < 2) return null;
    return projectOnTrack(userPosition, trackCoords);
  }, [userPosition, trackCoords]);

  const distanceToTrackMeters = projected ? Math.round(projected.distanceToTrackMeters) : 0;
  const isOffTrack = distanceToTrackMeters > OFF_TRACK_THRESHOLD_METERS;

  // Calcul du restant
  const totalTrackDistanceMeters = activeTrace ? activeTrace.distance : 0;
  const remainingDistanceMeters = projected
    ? Math.max(0, Math.round(totalTrackDistanceMeters - projected.progressDistanceMeters))
    : totalTrackDistanceMeters;

  const progressPercent = projected
    ? Math.min(100, Math.round(projected.progressRatio * 100))
    : 0;

  // Estimation du dénivelé restant en proportion du parcours
  const remainingElevationGain = activeRoute
    ? Math.max(0, Math.round(activeRoute.elevationGain * (1 - (projected?.progressRatio || 0))))
    : 0;

  // Heure d'arrivée estimée (sur base de vitesse courante ou vitesse par défaut de rando/vélo)
  const effectiveSpeedKmh = speedKmh > 1.5 ? speedKmh : activeRoute?.activity === 'bike' ? 18 : 4.5;
  const estimatedRemainingMinutes = Math.round((remainingDistanceMeters / 1000 / effectiveSpeedKmh) * 60);

  // Prochaine manœuvre (virage, embranchement)
  const nextManeuver = useMemo(() => {
    if (!projected || !userPosition || trackCoords.length < 3) return null;
    return findNextManeuver(projected.segmentIndex, userPosition, trackCoords);
  }, [projected, userPosition, trackCoords]);

  // Gestion des alertes haptiques et sonores hors-sentier
  useEffect(() => {
    if (!isNavigating) return;

    const now = Date.now();
    if (isOffTrack && now - lastOffTrackAlertTimeRef.current > 12000) {
      lastOffTrackAlertTimeRef.current = now;
      deviceSensors.vibrate([150, 100, 250]); // Double vibration d'écart
      if (isAudioAlertsEnabled) {
        deviceSensors.playAlertBeep('warning');
      }
    }
  }, [isNavigating, isOffTrack, isAudioAlertsEnabled]);

  // Alerte à l'approche immédiate d'une manœuvre (< 40m)
  useEffect(() => {
    if (!isNavigating || !nextManeuver) return;

    if (
      nextManeuver.distanceFromUserMeters <= 35 &&
      lastManeuverIndexRef.current !== nextManeuver.index
    ) {
      lastManeuverIndexRef.current = nextManeuver.index;
      deviceSensors.vibrate(100);
      if (isAudioAlertsEnabled) {
        deviceSensors.playAlertBeep(nextManeuver.instructionType === 'arrivee' ? 'success' : 'turn');
      }
    }
  }, [isNavigating, nextManeuver, isAudioAlertsEnabled]);

  // Orientation matériel de l'appareil (Boussole / Gyroscope local)
  useEffect(() => {
    if (!isNavigating) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // e.alpha ou webkitCompassHeading (iOS Safari)
      let compass = 0;
      if ((e as any).webkitCompassHeading) {
        compass = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        compass = 360 - e.alpha;
      }
      if (!isNaN(compass)) {
        setHeading(Math.round(compass));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isNavigating]);

  // Suivi continu par le capteur GPS du smartphone (navigator.geolocation.watchPosition)
  useEffect(() => {
    if (!isNavigating || isSimulated) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn('[Navigation] Géolocalisation non supportée.');
      return;
    }

    deviceSensors.requestWakeLock();

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lon = pos.coords.longitude;
        const lat = pos.coords.latitude;
        const currentCoord: [number, number] = [lon, lat];
        const now = Date.now();

        setUserPosition(currentCoord);
        setAccuracyMeters(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null);

        // Vitesse fournie par l'OS ou calculée entre deux réceptions
        if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
          setSpeedKmh(Math.max(0, Math.round(pos.coords.speed * 3.6 * 10) / 10));
        } else if (lastPositionRef.current) {
          const dtHours = (now - lastPositionRef.current.time) / 3600000;
          if (dtHours > 0) {
            const dKm = distanceMeters(lastPositionRef.current.coord, currentCoord) / 1000;
            const calcSpeed = Math.min(60, dKm / dtHours);
            setSpeedKmh(Math.round(calcSpeed * 10) / 10);
          }
        }

        // Cap calculé si non fourni par la boussole
        if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
          setHeading(Math.round(pos.coords.heading));
        } else if (lastPositionRef.current) {
          const distMoved = distanceMeters(lastPositionRef.current.coord, currentCoord);
          if (distMoved >= 3) {
            const calcHeading = calculateBearing(lastPositionRef.current.coord, currentCoord);
            setHeading(Math.round(calcHeading));
          }
        }

        lastPositionRef.current = { coord: currentCoord, time: now };
      },
      (err) => {
        console.warn('[Navigation] Signal GPS temporairement indisponible:', err.message);
      },
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      deviceSensors.releaseWakeLock();
    };
  }, [isNavigating, isSimulated]);

  // Démarrage du guidage
  const startNavigation = useCallback((route: RouteSuggestions, trace: RouteTrace) => {
    setActiveRoute(route);
    setActiveTrace(trace);
    setIsNavigating(true);
    setIsSimulated(false);
    deviceSensors.requestWakeLock();
    deviceSensors.playAlertBeep('turn');

    // Demande de permission boussole/gyroscope iOS pour le cône directionnel
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any)?.requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            console.debug('[Navigation] Boussole matérielle autorisée');
          }
        })
        .catch((err: any) => {
          console.debug('[Navigation] Permission boussole ignorée ou refusée:', err);
        });
    }
  }, []);

  // Arrêt du guidage
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsSimulated(false);
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    deviceSensors.releaseWakeLock();
    lastPositionRef.current = null;
  }, []);

  // Bascule audio
  const toggleAudioAlerts = useCallback(() => {
    setIsAudioAlertsEnabled((prev) => !prev);
  }, []);

  // Bascule orientation boussole
  const toggleCompassOrientation = useCallback(() => {
    setIsCompassOriented((prev) => !prev);
  }, []);

  // Simulateur de marche terrain (très utile pour tester depuis chez soi ou au bureau)
  const startSimulation = useCallback(
    (speedMultiplier = 1) => {
      if (trackCoords.length < 2) return;

      setIsSimulated(true);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      let simIndex = 0;
      setUserPosition(trackCoords[0]);
      setSpeedKmh(4.5 * speedMultiplier);

      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

      simulationTimerRef.current = setInterval(() => {
        simIndex = (simIndex + 1) % trackCoords.length;
        const currentPt = trackCoords[simIndex];
        const nextPt = trackCoords[(simIndex + 1) % trackCoords.length];

        setUserPosition(currentPt);
        const bear = calculateBearing(currentPt, nextPt);
        setHeading(Math.round(bear));
      }, 1200 / speedMultiplier);
    },
    [trackCoords]
  );

  const stopSimulation = useCallback(() => {
    setIsSimulated(false);
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  }, []);

  return {
    isNavigating,
    route: activeRoute,
    trace: activeTrace,
    userPosition,
    heading,
    speedKmh,
    accuracyMeters,
    projected,
    distanceToTrackMeters,
    isOffTrack,
    remainingDistanceMeters,
    remainingElevationGain,
    progressPercent,
    estimatedRemainingMinutes,
    nextManeuver,
    isAudioAlertsEnabled,
    isCompassOriented,
    isSimulated,
    startNavigation,
    stopNavigation,
    toggleAudioAlerts,
    toggleCompassOrientation,
    startSimulation,
    stopSimulation,
  };
}
