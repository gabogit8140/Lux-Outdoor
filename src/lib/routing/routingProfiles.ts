export type ActivityType = 'bike' | 'hike';

export interface SurfaceItem {
  type: string;
  percentage: number;
}

/**
 * Détermine le profil BRouter le plus adapté en privilégiant les sentiers et voies vertes
 * et en évitant activement les routes à grande circulation (nationales, départementales passantes).
 */
export function resolveBRouterProfile(activity: ActivityType, filters: string[] = []): string {
  if (activity === 'hike') {
    // hiking-mountain : pénalise fortement l'asphalte et les routes motorisées
    return 'hiking-mountain';
  }

  // Activité vélo :
  if (filters.includes('gravel')) {
    return 'gravel';
  }
  if (filters.includes('paved')) {
    return 'safety';
  }
  // Par défaut à vélo, le profil 'safety' privilégie les pistes cyclables et évite le trafic automobile
  return 'safety';
}

/**
 * Détermine le profil OSRM pour le repli de secours.
 */
export function resolveOsrmProfile(activity: ActivityType): 'foot' | 'bicycle' {
  return activity === 'bike' ? 'bicycle' : 'foot';
}

/**
 * Fournit la distribution surfacique typique selon l'activité et le moteur de routage.
 */
export function getProfileSurfaceDistribution(
  activity: ActivityType,
  engine: 'brouter' | 'osrm' = 'brouter'
): SurfaceItem[] {
  if (activity === 'hike') {
    return engine === 'brouter'
      ? [
          { type: 'Sentier / Chemin naturel (0 voiture)', percentage: 90 },
          { type: 'Route secondaire apaisée', percentage: 10 },
        ]
      : [
          { type: 'Sentier / Chemin naturel (0 voiture)', percentage: 85 },
          { type: 'Route secondaire apaisée', percentage: 15 },
        ];
  }

  return engine === 'brouter'
    ? [
        { type: 'Voie verte / Piste cyclable sécurisée', percentage: 82 },
        { type: 'Route secondaire à faible trafic', percentage: 18 },
      ]
    : [
        { type: 'Voie verte / Piste cyclable sécurisée', percentage: 75 },
        { type: 'Route secondaire à faible trafic', percentage: 25 },
      ];
}

/**
 * Estime le temps de parcours en minutes en intégrant la vitesse moyenne et l'impact du dénivelé.
 * Randonnée : ~4.2 km/h + 1h pour 350m D+
 * Vélo : ~19 km/h + 1h pour 600m D+
 */
export function estimateRouteDuration(
  distanceKm: number,
  elevationGain: number,
  activity: ActivityType
): number {
  const speedKmH = activity === 'bike' ? 19 : 4.2;
  const dPlusPerHour = activity === 'bike' ? 600 : 350;

  return Math.round((distanceKm / speedKmH) * 60 + (elevationGain / dPlusPerHour) * 60);
}
