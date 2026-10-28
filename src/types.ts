export type BikeSubtype = 'road' | 'vtt';

export interface RoutePrompt {
  location: string;
  distanceKm: [number, number];
  filters: string[];
  activity: 'bike' | 'hike';
  bikeType?: 'road' | 'vtt';
  mapTracesOnly?: boolean;
  elevationGainRange?: [number, number];
  sourceFilter?: 'all' | 'imported' | 'official';
  tripFilter?: string;
}

export interface ElevationPoint {
  distance: number; // km
  elevation: number; // m
  slope?: number; // %
}

export interface RouteInstruction {
  distanceKm: number;
  text: string;
  type: 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn' | 'summit' | 'water' | 'depart' | 'continuer' | 'arrivee';
  roadType?: 'car_free' | 'shared_road';
}

export interface RouteDifficulty {
  level: 'easy' | 'moderate' | 'hard' | 'expert';
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  dPlusPerKm: number;
  effortScore: number;
}

export interface RoadTypeBreakdown {
  carFreePercentage: number;     // e.g. 80 (%)
  sharedRoadPercentage: number;  // e.g. 20 (%)
  carFreeKm: number;             // e.g. 27.2 (km)
  sharedRoadKm: number;          // e.g. 6.8 (km)
  carFreeLabel: string;          // e.g. 'Voie verte, piste cyclable & sentiers sans voiture'
  sharedRoadLabel: string;       // e.g. 'Petites routes ouvertes à la circulation motorisée'
  safetyRating: 'maximal' | 'high' | 'moderate' | 'caution';
}

export interface TrackSegment {
  coordinates: [number, number][]; // [lon, lat]
  roadType: 'car_free' | 'shared_road';
  label: string;
}

export interface RouteSuggestions {
  id: string;
  type: 'custom' | 'public' | 'imported' | 'official';
  title: string;
  description: string;
  highlights: string[];
  surfaceType: string;
  difficulty: RouteDifficulty;
  userRating?: number; // 1-5 personal stars given by user
  userNotes?: string;  // personal field notes written by user
  userCategory?: any;
  hasMushrooms?: boolean;
  elevationGain: number;
  elevationLoss?: number;
  maxElevation?: number;
  minElevation?: number;
  activity: 'bike' | 'hike';
  bikeType?: 'road' | 'vtt';
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  regionName?: string;
  tripName?: string;          // e.g. 'Voyage Bretagne 2026', 'Trans-Ardennaise'
  isUserImported?: boolean;   // true if imported locally into IndexedDB
  dateAdded?: string;         // ISO date when added by user
  surfaceDistribution: { type: string; percentage: number }[];
  roadBreakdown?: RoadTypeBreakdown;
  waypoints: [number, number][]; // [longitude, latitude]
  instructions?: RouteInstruction[];
  tags?: string[];
  sourceUrl?: string;   // Link to the source website / official tourism board / GPX origin
  sourceLabel?: string; // Friendly label for the source (e.g. 'Mullerthal.lu', 'VisitWallonia.be')
  geoportailUrl?: string; // Direct topographic cadastral map link on map.geoportail.lu
}

export interface RouteTrace {
  distance: number; // meters
  duration: number; // seconds
  coordinates: [number, number][] | [number, number][][]; // [longitude, latitude]
  elevationProfile: ElevationPoint[];
  segments?: TrackSegment[];
}
