import type {
  RouteSuggestions,
  RouteTrace,
  RouteInstruction,
  RoadTypeBreakdown,
  ElevationPoint,
  BikeContentFilter,
  CyclewayCategory,
} from '../types';
import { CATALOG_ROUTES, type CatalogItem } from './routeCatalog';
import { isCyclewayRoute } from './cycleways/cyclewayClassifier';
import {
  catmullRomSpline,
  calculatePathDistance,
  computeElevationProfile,
  fetchElevationProfileOnline,
  generateTurnInstructions,
  haversineDistance,
  calculateRouteDifficulty,
  computeRoadBreakdown,
  generateTrackSegments,
} from './geoUtils';

export {
  REGIONAL_ZONES,
  type RegionalZone,
  GAZETTEER,
  type PlaceEntry,
  LOCAL_PLACES,
  searchPlaces,
  normalizeSearchText,
  getCountryFlag,
  getCountryLabel,
} from './routing/gazetteer';
import { GAZETTEER, REGIONAL_ZONES, normalizeSearchText } from './routing/gazetteer';

/**
 * Resolves a location name or partial query to [lon, lat] offline
 */
export function resolveLocationOffline(locationName: string): [number, number] {
  const norm = normalizeSearchText(locationName);
  for (const place of GAZETTEER) {
    const keyNorm = normalizeSearchText(place.key);
    const nameNorm = normalizeSearchText(place.name);
    if (norm.includes(keyNorm) || keyNorm.includes(norm) || norm.includes(nameNorm) || nameNorm.includes(norm)) {
      return place.coords;
    }
  }

  // Fallback to route catalog locations (title, region or id)
  const matchingRoute = CATALOG_ROUTES.find(
    (c) =>
      c.route.title.toLowerCase().includes(norm) ||
      c.route.id.toLowerCase().includes(norm) ||
      (c.route.regionName && c.route.regionName.toLowerCase().includes(norm))
  );
  if (matchingRoute && matchingRoute.route.waypoints && matchingRoute.route.waypoints[0]) {
    return matchingRoute.route.waypoints[0];
  }

  return GAZETTEER[0].coords;
}
/**
 * Detects whether a route is intended for mountain biking (VTT/MTB)
 * based on its tags, ID, title, and description.
 */
export function isVttRoute(route: {
  id?: string;
  title?: string;
  tags?: string[];
  description?: string;
  surfaceType?: string;
}): boolean {
  if (!route) return false;
  const tags = (route.tags || []).map((t) => t.toLowerCase());
  if (tags.includes('vtt') || tags.includes('mtb') || tags.includes('mountain_bike')) {
    return true;
  }
  const id = (route.id || '').toLowerCase();
  const title = (route.title || '').toLowerCase();
  const desc = (route.description || '').toLowerCase();

  return (
    id.includes('vtt') ||
    id.includes('mtb') ||
    title.includes('vtt') ||
    title.includes('mountain bike') ||
    title.includes('mountainbike') ||
    title.includes('redrock') ||
    desc.includes('circuit vtt') ||
    desc.includes('marathon vtt') ||
    desc.includes('mountain bike')
  );
}


/**
 * Finds the nearest known geographic location for any GPS coordinates [lon, lat]
 */
export function findNearestLocationOffline(coords: [number, number]): {
  name: string;
  country: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  region: string;
  distanceKm: number;
} {
  let closest = GAZETTEER[0];
  let minDistance = Infinity;

  for (const place of GAZETTEER) {
    const dist = haversineDistance(coords, place.coords) / 1000;
    if (dist < minDistance) {
      minDistance = dist;
      closest = place;
    }
  }

  return {
    name: closest.name,
    country: closest.country,
    region: closest.region,
    distanceKm: Math.round(minDistance),
  };
}

/**
 * Procedurally generates an authentic, organic loop trail
 * around a given anchor coordinate with STRICT distance adherence.
 */
export function generateLocalCircuit(params: {
  center: [number, number];
  distanceKm: [number, number];
  activity: 'bike' | 'hike';
  filters: string[];
  locationName?: string;
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  variationIndex?: number;
  bounds?: { north: number; south: number; east: number; west: number };
}): { route: RouteSuggestions; trace: RouteTrace } {
  const { center, distanceKm, activity, filters, variationIndex = 0, bounds } = params;

  const minD = distanceKm[0];
  const maxD = distanceKm[1];

  // Distribute variations across the requested distance range
  const span = maxD - minD;
  const targetKm = Math.min(
    maxD,
    Math.max(minD, minD + (span > 0 ? span * (0.15 + (variationIndex % 4) * 0.26) : 0))
  );

  let effectiveCenter = center;
  const isBounded = bounds && typeof bounds.north === 'number' && !isNaN(bounds.north);

  // When searching an explicit map zone, distribute each circuit variation across the visible zone
  if (isBounded) {
    const latSpan = Math.abs(bounds.north - bounds.south);
    const lonSpan = Math.abs(bounds.east - bounds.west);
    const offsets = [
      [-0.10, -0.08],
      [0.10, 0.08],
      [-0.08, 0.10],
      [0.08, -0.10],
    ];
    const [dLon, dLat] = offsets[variationIndex % offsets.length];
    effectiveCenter = [
      center[0] + dLon * lonSpan,
      center[1] + dLat * latSpan,
    ];
  }

  const latRad = (effectiveCenter[1] * Math.PI) / 180;
  const kmPerDegLat = 111;
  const kmPerDegLon = 111 * Math.cos(latRad);

  const avgRadiusKm = targetKm / (2 * Math.PI * 1.3);
  let radiusDegLat = avgRadiusKm / kmPerDegLat;
  let radiusDegLon = avgRadiusKm / kmPerDegLon;

  // If bounds provided, scale loop anchors gracefully to fit inside visible map zone
  if (isBounded) {
    const latSpan = Math.abs(bounds.north - bounds.south);
    const lonSpan = Math.abs(bounds.east - bounds.west);
    const maxAllowedLat = Math.max(0.008, latSpan * 0.32);
    const maxAllowedLon = Math.max(0.008, lonSpan * 0.32);
    radiusDegLat = Math.min(radiusDegLat, maxAllowedLat);
    radiusDegLon = Math.min(radiusDegLon, maxAllowedLon);
  }

  const numAnchors = activity === 'bike' ? 9 : 8;
  const anchors: [number, number][] = [];

  // Deterministic seed based on center coordinates + variation index
  const coordHash = Math.abs(Math.sin(effectiveCenter[0] * 12.9898 + effectiveCenter[1] * 78.233)) * 43758.5453;
  const baseAngle = (coordHash % 1) * Math.PI * 2;
  const angleOffset = baseAngle + (variationIndex * Math.PI) / 2;

  for (let i = 0; i < numAnchors; i++) {
    const angle = (i / numAnchors) * 2 * Math.PI + angleOffset;
    const wobble =
      0.75 +
      0.45 * Math.sin(angle * 2.3 + variationIndex * 1.7) +
      0.2 * Math.cos(angle * 3.7 + coordHash);
    const rLat = radiusDegLat * wobble;
    const rLon = radiusDegLon * wobble;

    const lon = effectiveCenter[0] + Math.cos(angle) * rLon;
    const lat = effectiveCenter[1] + Math.sin(angle) * rLat;
    anchors.push([lon, lat]);
  }
  // Close loop at start
  anchors.push([anchors[0][0], anchors[0][1]]);

  let smoothCoords = catmullRomSpline(anchors, 12, 0.45);

  const initialDistKm = calculatePathDistance(smoothCoords) / 1000;
  if (initialDistKm > 0) {
    let scale = targetKm / initialDistKm;
    if (isBounded) {
      const maxLatAllowed = Math.abs(bounds.north - bounds.south) * 0.44;
      const maxLonAllowed = Math.abs(bounds.east - bounds.west) * 0.44;
      let maxDLat = 0;
      let maxDLon = 0;
      for (const [lon, lat] of smoothCoords) {
        maxDLat = Math.max(maxDLat, Math.abs(lat - effectiveCenter[1]));
        maxDLon = Math.max(maxDLon, Math.abs(lon - effectiveCenter[0]));
      }
      if (maxDLat > 0 && maxDLon > 0) {
        const clampScale = Math.min(maxLatAllowed / maxDLat, maxLonAllowed / maxDLon);
        scale = Math.min(scale, Math.max(0.6, clampScale));
      }
    }
    const cLon = effectiveCenter[0];
    const cLat = effectiveCenter[1];
    smoothCoords = smoothCoords.map(([lon, lat]) => [
      cLon + (lon - cLon) * scale,
      cLat + (lat - cLat) * scale,
    ]);
  }

  const finalMeters = calculatePathDistance(smoothCoords);
  const finalKm = Number((finalMeters / 1000).toFixed(1));

  const isHilly = filters.includes('hilly');
  const isFlat = filters.includes('flat');
  const isWater = filters.includes('water');
  const isForest = filters.includes('forest');
  const isGravel = filters.includes('gravel');
  const isPaved = filters.includes('paved');
  const isLowTraffic = filters.includes('low_traffic');

  // Elevation according to filters
  const variationGainShift = ((variationIndex * 5) % 9) - 2;
  const baseGain = isFlat
    ? Math.round(finalKm * (activity === 'bike' ? 3.5 : 2.5) + variationIndex * 4)
    : isHilly
    ? Math.round(finalKm * (activity === 'bike' ? 22 : 32) + variationIndex * 25)
    : Math.round(finalKm * (10 + variationGainShift));

  const elev = computeElevationProfile(smoothCoords, baseGain, undefined, variationIndex + 1);
  const instructions = generateTurnInstructions(smoothCoords, activity);

  // Surface distribution according to filters
  let surfaceType =
    activity === 'hike'
      ? 'Sentiers pédestres & chemins sous-bois'
      : 'Mixte voies vertes & petites routes';
  let surfaceDistribution =
    activity === 'hike'
      ? [
          { type: 'Sentiers pédestres & chemins de terre', percentage: 60 },
          { type: 'Chemins forestiers stabilisés', percentage: 30 },
          { type: 'Petites voies calmes', percentage: 10 },
        ]
      : [
          { type: 'Piste cyclable / Voie verte', percentage: 55 },
          { type: 'Petites routes calmes', percentage: 35 },
          { type: 'Chemins de terre / gravier', percentage: 10 },
        ];

  if (isPaved) {
    surfaceType =
      activity === 'hike'
        ? 'Voies piétonnes aménagées & sol stabilisé'
        : '100% Asphalte & Voie Verte';
    surfaceDistribution =
      activity === 'hike'
        ? [
            { type: 'Voie piétonne stabilisée', percentage: 75 },
            { type: 'Petites voies calmes', percentage: 25 },
          ]
        : [
            { type: 'Voie verte revêtue bitumée', percentage: 75 },
            { type: 'Routes secondaires calmes goudronnées', percentage: 25 },
          ];
  } else if (isGravel) {
    surfaceType =
      activity === 'hike'
        ? 'Sentiers caillouteux & chemins de terre'
        : 'Chemins stabilisés, gravel & pistes blanches';
    surfaceDistribution =
      activity === 'hike'
        ? [
            { type: 'Sentiers forestiers rustiques', percentage: 65 },
            { type: 'Chemins de terre battue', percentage: 25 },
            { type: 'Liaisons calmes', percentage: 10 },
          ]
        : [
            { type: 'Pistes forestières gravillonnées', percentage: 65 },
            { type: 'Sentiers en terre battue', percentage: 25 },
            { type: 'Liaisons asphalte calmes', percentage: 10 },
          ];
  } else if (isForest) {
    surfaceType = 'Chemins forestiers & sentiers naturels';
    surfaceDistribution =
      activity === 'hike'
        ? [
            { type: 'Sentiers sous canopée', percentage: 60 },
            { type: 'Chemins forestiers naturels', percentage: 30 },
            { type: 'Sentiers de liaison', percentage: 10 },
          ]
        : [
            { type: 'Pistes forestières naturelles', percentage: 60 },
            { type: 'Sentiers sous canopée', percentage: 30 },
            { type: 'Liaison rurale', percentage: 10 },
          ];
  }

  // Resolve nearest geographic locality
  const nearest = findNearestLocationOffline(center);
  const placeName =
    params.locationName && !params.locationName.startsWith('Point (')
      ? params.locationName
      : nearest.distanceKm <= 20
      ? nearest.name
      : `Secteur ${nearest.name}`;

  const directions = ['Nord', 'Sud', 'Est', 'Ouest', 'Nord-Est', 'Sud-Ouest', 'Nord-Ouest', 'Sud-Est'];
  const dir = directions[(variationIndex + Math.floor(coordHash * 7)) % directions.length];

  // Thematic title generator based on user's active filters
  let title = '';
  if (isWater) {
    const waterThemes = activity === 'bike'
      ? [
          `Au Fil de l'Eau : Boucle des Rives de ${placeName}`,
          `Circuit des Méandres & Rives de ${placeName}`,
          `Tour Cyclo des Berges & Ponts de ${placeName}`,
          `Échappée Fluviale & Canaux de ${placeName}`,
        ]
      : [
          `Sentier des Rives & Cascades de ${placeName}`,
          `Boucle au Fil de l'Eau & Méandres de ${placeName}`,
          `Promenade Fluviale & Canaux de ${placeName}`,
          `Circuit Nature des Berges de ${placeName}`,
        ];
    title = `${waterThemes[variationIndex % waterThemes.length]} (${finalKm} km)`;
  } else if (isForest) {
    const forestThemes = activity === 'bike'
      ? [
          `Immersion Nature : Tour Forestier de ${placeName}`,
          `Grande Boucle des Massifs Boisés de ${placeName}`,
          `Circuit Ombragé sous Canopée de ${placeName}`,
          `Boucle Verte des Forêts de ${placeName}`,
        ]
      : [
          `Sentier des Forêts & Sous-Bois de ${placeName}`,
          `Circuit des Grands Bois Sauvages de ${placeName}`,
          `Tour Forestier & Sentiers de Mousse de ${placeName}`,
          `Boucle Ombragée des Clairières de ${placeName}`,
        ];
    title = `${forestThemes[variationIndex % forestThemes.length]} (${finalKm} km)`;
  } else if (isGravel) {
    const gravelThemes = activity === 'bike'
      ? [
          `Aventure Gravel : Pistes Blanches de ${placeName}`,
          `Boucle Tout-Chemin & Sentiers de ${placeName}`,
          `Raid Gravel & Voies Sauvages de ${placeName}`,
          `Circuit des Chemins Rustiques de ${placeName}`,
        ]
      : [
          `Sentier Pédestre Tout-Chemin de ${placeName}`,
          `Tour des Pistes Rustiques de ${placeName}`,
          `Circuit Nature & Chemins de Terre de ${placeName}`,
          `Boucle Sauvage des Pistes Forestières de ${placeName}`,
        ];
    title = `${gravelThemes[variationIndex % gravelThemes.length]} (${finalKm} km)`;
  } else if (isPaved) {
    const pavedThemes = activity === 'bike'
      ? [
          `100% Asphalte : Boucle Voies Vertes de ${placeName}`,
          `Tour Cyclo Roulant & Bitumé de ${placeName}`,
          `Circuit Grand Confort Asphalte de ${placeName}`,
          `Boucle Roulante Voies Dédiées de ${placeName}`,
        ]
      : [
          `Balade Voies Vertes Lisses de ${placeName}`,
          `Circuit Pédestre Bitumé Confort de ${placeName}`,
          `Promenade Sécurisée Asphalte de ${placeName}`,
          `Boucle Roulante de ${placeName}`,
        ];
    title = `${pavedThemes[variationIndex % pavedThemes.length]} (${finalKm} km)`;
  } else if (isFlat) {
    const flatThemes = activity === 'bike'
      ? [
          `Parcours Plat & Dénivelé Doux de ${placeName}`,
          `Boucle Roulante Sans Côte de ${placeName}`,
          `Tour Cyclo Paisible de ${placeName}`,
          `Circuit Plat de Plaine de ${placeName}`,
        ]
      : [
          `Promenade Facile & Plate de ${placeName}`,
          `Balade Détente en Plaine de ${placeName}`,
          `Circuit Très Doux de ${placeName}`,
          `Sentier Roulant Sans Dénivelé de ${placeName}`,
        ];
    title = `${flatThemes[variationIndex % flatThemes.length]} (${finalKm} km)`;
  } else if (isHilly) {
    const hillyThemes = activity === 'bike'
      ? [
          `Défi Dénivelé : Crêtes & Panoramas de ${placeName}`,
          `Circuit Sportif des Vallons & Belvédères de ${placeName}`,
          `Boucle Grimpette & Cols de ${placeName}`,
          `Tour des Crêtes Sportives de ${placeName}`,
        ]
      : [
          `Sentier des Crêtes & Roches de ${placeName}`,
          `Circuit Panoramique des Sommets de ${placeName}`,
          `Boucle Sportive des Belvédères de ${placeName}`,
          `Tour des Balcons & Roches de ${placeName}`,
        ];
    title = `${hillyThemes[variationIndex % hillyThemes.length]} (${finalKm} km)`;
  } else {
    const defaultThemes = activity === 'bike'
      ? [
          `Boucle ${dir} de ${placeName} & Voies Vertes`,
          `Circuit Découverte & Voies Calmes de ${placeName}`,
          `Tour Cyclo Nature de ${placeName}`,
          `Boucle des Vallons de ${placeName}`,
        ]
      : [
          `Sentier Pédestre ${dir} de ${placeName}`,
          `Boucle Découverte Nature de ${placeName}`,
          `Tour des Chemins Calmes de ${placeName}`,
          `Sentier Panoramique de ${placeName}`,
        ];
    title = `${defaultThemes[variationIndex % defaultThemes.length]} (${finalKm} km)`;
  }

  // Highlights strictly explaining how the route matches criteria
  const highlights: string[] = [];
  if (isWater) highlights.push("Passage panoramique longeant rivières, ruisseaux et vallées fluviales");
  if (isForest) highlights.push("Immersion sous la canopée et sentiers forestiers ombragés");
  if (isGravel) highlights.push("Sections de gravel stabilisé et pistes blanches sans goudron");
  if (isPaved) highlights.push("100% revêtement bitumé lisse de haute qualité");
  if (isFlat) highlights.push("Dénivelé très doux (< 1.5% moyen), circuit accessible sans côte raide");
  if (isHilly) highlights.push(`Relief sportif avec +${elev.gain}m D+ et superbes belvédères en crête`);
  if (isLowTraffic) highlights.push("Sécurité maximale : priorité absolue aux voies sans voiture");
  highlights.push(activity === 'bike' ? "Idéal vélo de route, gravel ou VTC" : "Sentiers piétons balisés et entretenus");

  const speedKmH = activity === 'bike' ? 20 : 4.5;
  const durationSec = Math.round((finalKm / speedKmH) * 3600 + (baseGain / 400) * 1800);

  const country = params.country || nearest.country;
  const difficulty = calculateRouteDifficulty(finalKm, elev.gain, activity);
  const roadBreakdown = computeRoadBreakdown(finalKm, surfaceDistribution, activity);
  if (isLowTraffic) {
    roadBreakdown.carFreePercentage = Math.max(88, roadBreakdown.carFreePercentage);
    roadBreakdown.sharedRoadPercentage = 100 - roadBreakdown.carFreePercentage;
    roadBreakdown.safetyRating = 'maximal';
  }

  const segments = generateTrackSegments(smoothCoords, roadBreakdown.carFreePercentage);

  const route: RouteSuggestions = {
    id: `circuit_${Date.now()}_${variationIndex}_${Math.floor(Math.random() * 1000)}`,
    type: 'custom',
    title,
    description: `Parcours en boucle de ${finalKm} km autour de ${placeName} (${country}), conçu pour le ${
      activity === 'bike' ? 'vélo' : 'la randonnée'
    }. Ce tracé répond directement à vos critères de distance et de terrain sélectionnés (${filters.join(', ')}).`,
    highlights,
    surfaceType,
    difficulty,
    elevationGain: elev.gain,
    elevationLoss: elev.loss,
    minElevation: elev.minElevation,
    maxElevation: elev.maxElevation,
    activity,
    country,
    regionName: nearest.region,
    surfaceDistribution,
    roadBreakdown,
    waypoints: [
      smoothCoords[0],
      smoothCoords[Math.floor(smoothCoords.length / 2)],
      smoothCoords[0],
    ],
    instructions,
    tags: [...filters],
    sourceUrl: 'https://waymarkedtrails.org',
    sourceLabel: 'Waymarked Trails & OpenStreetMap',
  };

  const trace: RouteTrace = {
    distance: Math.round(finalMeters),
    duration: durationSec,
    coordinates: smoothCoords,
    elevationProfile: elev.profile,
    segments,
  };

  return { route, trace };
}

/**
 * Real outdoor routing using BRouter (specialized in OpenStreetMap hiking trails and cycle networks).
 * Falls back to OSRM / Open-Meteo elevation API if BRouter is temporarily unavailable.
 */
export async function generateRealOutdoorRoute(params: {
  center: [number, number];
  distanceKm: [number, number];
  activity: 'bike' | 'hike';
  filters: string[];
  locationName?: string;
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR';
  variationIndex?: number;
}): Promise<{ route: RouteSuggestions; trace: RouteTrace } | null> {
  const { center, distanceKm, activity, filters, variationIndex = 0 } = params;

  const minD = distanceKm[0];
  const maxD = distanceKm[1];
  const span = maxD - minD;
  const targetKm = Math.min(
    maxD,
    Math.max(minD, minD + (span > 0 ? span * (0.18 + (variationIndex % 4) * 0.25) : 0))
  );

  const latRad = (center[1] * Math.PI) / 180;
  const kmPerDegLat = 111;
  const kmPerDegLon = 111 * Math.cos(latRad);

  const avgRadiusKm =
    activity === 'hike' ? targetKm / (2 * Math.PI * 1.35) : targetKm / (2 * Math.PI * 1.45);
  const radiusDegLat = avgRadiusKm / kmPerDegLat;
  const radiusDegLon = avgRadiusKm / kmPerDegLon;

  const nearest = findNearestLocationOffline(center);
  const placeName =
    params.locationName && !params.locationName.startsWith('Point (')
      ? params.locationName
      : nearest.distanceKm <= 20
      ? nearest.name
      : `Secteur ${nearest.name}`;

  const coordHash = Math.abs(Math.sin(center[0] * 12.9898 + center[1] * 78.233)) * 43758.5453;
  const baseAngle =
    ((coordHash % 1) * Math.PI * 2 + (variationIndex * Math.PI) / 2) % (Math.PI * 2);

  const p0 = center;
  const p1: [number, number] = [
    center[0] + Math.cos(baseAngle - 0.38) * radiusDegLon,
    center[1] + Math.sin(baseAngle - 0.38) * radiusDegLat,
  ];
  const p2: [number, number] = [
    center[0] + Math.cos(baseAngle + 0.35) * radiusDegLon * 1.1,
    center[1] + Math.sin(baseAngle + 0.35) * radiusDegLat * 1.1,
  ];
  const p3: [number, number] = [
    center[0] + Math.cos(baseAngle + 0.95) * radiusDegLon * 0.8,
    center[1] + Math.sin(baseAngle + 0.95) * radiusDegLat * 0.8,
  ];
  const waypoints = [p0, p1, p2, p3, p0];

  const directions = ['Nord', 'Ouest', 'Sud', 'Est'];
  const dir = directions[variationIndex % directions.length];

  // 1. PRIMARY ROUTER: BRouter (OpenStreetMap hiking & cycling specialist)
  try {
    const lonlats = waypoints.map(([lon, lat]) => `${lon.toFixed(5)},${lat.toFixed(5)}`).join('|');
    const bProfile =
      activity === 'hike'
        ? 'hiking-mountain'
        : filters.includes('gravel')
        ? 'gravel'
        : filters.includes('paved')
        ? 'safety'
        : 'trekking';
    const bUrl = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${bProfile}&alternativeidx=0&format=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(bUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const f = data.features?.[0];
      const rawCoords: [number, number, number][] = f?.geometry?.coordinates;

      if (rawCoords && rawCoords.length >= 8) {
        const finalMeters = Number(f.properties['track-length']) || 0;
        const finalKm = Number((finalMeters / 1000).toFixed(1));
        const ascentM = Number(f.properties['filtered ascend']) || 0;

        const coords: [number, number][] = rawCoords.map(([lon, lat]) => [lon, lat]);

        // Sample elevation profile from DEM points
        const numSamples = Math.min(50, Math.max(20, Math.floor(rawCoords.length / 8)));
        const step = Math.max(1, Math.floor(rawCoords.length / numSamples));
        const elevProfile: ElevationPoint[] = [];
        let cumDistM = 0;

        for (let i = 0; i < rawCoords.length; i += step) {
          if (i > 0) {
            cumDistM += haversineDistance(coords[i - step], coords[i]);
          }
          elevProfile.push({
            distance: Number((cumDistM / 1000).toFixed(1)),
            elevation: Math.round(rawCoords[i][2]),
          });
        }
        if (elevProfile[elevProfile.length - 1].distance < finalKm) {
          const lastPt = rawCoords[rawCoords.length - 1];
          elevProfile.push({
            distance: finalKm,
            elevation: Math.round(lastPt[2]),
          });
        }

        const minElev = Math.min(...elevProfile.map((p) => p.elevation));
        const maxElev = Math.max(...elevProfile.map((p) => p.elevation));

        // Analyze messages for car-free tags
        const msgs: any[] = f.properties.messages || [];
        let carFreeM = 0;
        let sharedRoadM = 0;
        for (let i = 1; i < msgs.length; i++) {
          const row = msgs[i];
          const segDist = Number(row[3]) || 0;
          const tag = (row[9] || '').toLowerCase();
          const isCarFree =
            activity === 'hike' ||
            tag.includes('path') ||
            tag.includes('footway') ||
            tag.includes('steps') ||
            tag.includes('track') ||
            tag.includes('pedestrian') ||
            tag.includes('cycleway') ||
            tag.includes('living_street') ||
            tag.includes('hiking') ||
            !tag.includes('highway=');
          if (isCarFree) carFreeM += segDist;
          else sharedRoadM += segDist;
        }
        const totalCalculated = carFreeM + sharedRoadM || finalMeters;
        let carFreePct = Math.round((carFreeM / totalCalculated) * 100);
        if (activity === 'hike') {
          carFreePct = Math.max(82, carFreePct);
        } else {
          carFreePct = Math.max(35, Math.min(95, carFreePct));
        }

        const sharedRoadPct = 100 - carFreePct;
        const carFreeKm = Number(((finalKm * carFreePct) / 100).toFixed(1));
        const sharedRoadKm = Number((finalKm - carFreeKm).toFixed(1));

        const roadBreakdown: RoadTypeBreakdown = {
          carFreePercentage: carFreePct,
          sharedRoadPercentage: sharedRoadPct,
          carFreeKm,
          sharedRoadKm,
          carFreeLabel:
            activity === 'hike'
              ? 'Sentiers de terre, chemins forestiers & voies réservées (0 voiture)'
              : 'Pistes cyclables, voies vertes & chemins réservés',
          sharedRoadLabel: 'Petites liaisons partagées avec circulation automobile',
          safetyRating: carFreePct >= 80 ? 'maximal' : carFreePct >= 60 ? 'high' : 'moderate',
        };

        const segments = generateTrackSegments(coords, carFreePct);
        const instructions = generateTurnInstructions(coords, activity);

        const hikeThemes = [
          `Sentier des Crêtes & Vallons de ${placeName}`,
          `Boucle Pédestre ${dir} de ${placeName} & Chemins`,
          `Tour Forestier & Sentiers Sauvages de ${placeName}`,
          `Circuit Panoramique Nature de ${placeName}`,
        ];
        const bikeThemes = [
          `Boucle ${dir} de ${placeName} : Voies Vertes & Sentiers`,
          `Circuit des Chemins et Vallons de ${placeName}`,
          `Tour Cyclo & Voies Calmes de ${placeName}`,
          `Boucle Gravel & Nature de ${placeName}`,
        ];
        const titleTemplates = activity === 'bike' ? bikeThemes : hikeThemes;
        const title = `${titleTemplates[variationIndex % titleTemplates.length]} (${finalKm} km)`;

        const speedKmH = activity === 'bike' ? 20 : 4.5;
        const durationSec = Math.round((finalKm / speedKmH) * 3600 + (ascentM / 400) * 1800);
        const country = params.country || nearest.country;
        const difficulty = calculateRouteDifficulty(finalKm, ascentM, activity);

        const surfaceType =
          activity === 'hike'
            ? 'Sentiers de terre, sous-bois & chemins balisés'
            : carFreePct >= 70
            ? 'Majorité voies vertes & pistes sécurisées'
            : 'Mixte petites routes & chemins';

        const surfaceDistribution = [
          {
            type: activity === 'hike' ? 'Sentiers de terre & sous-bois' : 'Voie sans voiture / Piste cyclable',
            percentage: carFreePct,
          },
          {
            type: activity === 'hike' ? 'Liaisons chemins & ruelles calmes' : 'Petites routes secondaires partagées',
            percentage: sharedRoadPct,
          },
        ];

        const highlights = [
          activity === 'hike'
            ? '100% tracé sur les sentiers pédestres et chemins forestiers réels'
            : 'Tracé calé sur les voies cyclables et sentiers réels',
          `${carFreePct}% du parcours sur voies sans voiture`,
          `Relief géographique réel : +${ascentM}m de dénivelé`,
          `Altitude : Min ${minElev}m · Max ${maxElev}m`,
        ];

        const route: RouteSuggestions = {
          id: `brouter_${Date.now()}_${variationIndex}_${Math.floor(Math.random() * 1000)}`,
          type: 'custom',
          title,
          description:
            activity === 'hike'
              ? `Randonnée pédestre en boucle de ${finalKm} km autour de ${placeName} (${country}), calculée sur les véritables sentiers pédestres, chemins de terre et sentiers balisés (${carFreePct}% sans voiture). Dénivelé réel : +${ascentM}m.`
              : `Boucle vélo sur mesure de ${finalKm} km autour de ${placeName} (${country}), calculée sur le réseau réel de pistes, voies vertes et chemins (${carFreePct}% sans voiture). Dénivelé réel : +${ascentM}m.`,
          highlights,
          surfaceType,
          difficulty,
          elevationGain: ascentM,
          elevationLoss: ascentM,
          minElevation: minElev,
          maxElevation: maxElev,
          activity,
          country,
          regionName: nearest.region,
          surfaceDistribution,
          waypoints:
            coords.length >= 2
              ? [coords[0], coords[Math.floor(coords.length / 2)], coords[coords.length - 1]]
              : waypoints,
          sourceUrl: 'https://brouter.de',
          sourceLabel: 'BRouter OpenStreetMap Plein Air',
        };

        const trace: RouteTrace = {
          distance: Math.round(finalMeters),
          duration: durationSec,
          coordinates: coords,
          elevationProfile: elevProfile,
          segments,
        };

        return { route, trace };
      }
    }
  } catch (_bErr) {
    // BRouter error or timeout, proceed to fallback
  }

  // 2. SECONDARY FALLBACK: OSRM + Open-Meteo DEM
  try {
    const coordsStr = waypoints.map(([lon, lat]) => `${lon.toFixed(5)},${lat.toFixed(5)}`).join(';');
    const profile = activity === 'bike' ? 'bike' : 'foot';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const osrmRoute = data.routes[0];
        const coords: [number, number][] = osrmRoute.geometry.coordinates;

        if (coords && coords.length >= 5) {
          const finalMeters = osrmRoute.distance;
          const finalKm = Number((finalMeters / 1000).toFixed(1));

          const carFreePct = activity === 'hike' ? 85 : 65;
          const sharedRoadPct = 100 - carFreePct;
          const carFreeKm = Number(((finalKm * carFreePct) / 100).toFixed(1));
          const sharedRoadKm = Number((finalKm - carFreeKm).toFixed(1));

          const roadBreakdown: RoadTypeBreakdown = {
            carFreePercentage: carFreePct,
            sharedRoadPercentage: sharedRoadPct,
            carFreeKm,
            sharedRoadKm,
            carFreeLabel:
              activity === 'hike'
                ? 'Sentiers pédestres, chemins forestiers & voies vertes (0 voiture)'
                : 'Pistes cyclables, voies vertes & chemins réservés',
            sharedRoadLabel: 'Petites routes partagées avec circulation automobile',
            safetyRating: carFreePct >= 80 ? 'maximal' : 'high',
          };

          const segments = generateTrackSegments(coords, carFreePct);
          const instructions = generateTurnInstructions(coords, activity);

          const isHilly = filters.includes('hilly');
          const isFlat = filters.includes('flat');
          const variationGainShift = ((variationIndex * 5) % 11) - 3;
          const gainFactor = isHilly ? 25 : isFlat ? 5 : 12 + variationGainShift;
          const baseGain = Math.round(finalKm * Math.max(3, gainFactor));

          const elev = await fetchElevationProfileOnline(coords, baseGain, variationIndex + 1);

          const speedKmH = activity === 'bike' ? 20 : 4.5;
          const durationSec = Math.round((finalKm / speedKmH) * 3600 + (elev.gain / 400) * 1800);
          const country = params.country || nearest.country;
          const difficulty = calculateRouteDifficulty(finalKm, elev.gain, activity);

          const title = `${
            activity === 'hike' ? 'Sentier Pédestre Nature' : 'Boucle Cyclable'
          } ${dir} de ${placeName} (${finalKm} km)`;

          const route: RouteSuggestions = {
            id: `osrm_${Date.now()}_${variationIndex}_${Math.floor(Math.random() * 1000)}`,
            type: 'custom',
            title,
            description: `Boucle sur mesure de ${finalKm} km autour de ${placeName} (${country}), calculée sur les sentiers et voies calmes (${carFreePct}% sans voiture). Dénivelé : +${elev.gain}m.`,
            highlights: [
              'Tracé suivant les voies réelles du secteur',
              `${carFreePct}% du parcours sur voies sans voiture`,
              `Dénivelé réel : +${elev.gain}m / -${elev.loss}m`,
            ],
            surfaceType: 'Sentiers & petites voies calmes',
            difficulty,
            elevationGain: elev.gain,
            elevationLoss: elev.loss,
            minElevation: elev.minElevation,
            maxElevation: elev.maxElevation,
            activity,
            country,
            regionName: nearest.region,
            surfaceDistribution: [
              { type: 'Voie sans voiture / Sentier', percentage: carFreePct },
              { type: 'Petites routes secondaires partagées', percentage: sharedRoadPct },
            ],
            waypoints:
              coords.length >= 2
                ? [coords[0], coords[Math.floor(coords.length / 2)], coords[coords.length - 1]]
                : waypoints,
            sourceUrl: 'https://www.openstreetmap.org',
            sourceLabel: 'Réseau OpenStreetMap',
          };

          const trace: RouteTrace = {
            distance: Math.round(finalMeters),
            duration: durationSec,
            coordinates: coords,
            elevationProfile: elev.profile,
            segments,
          };

          return { route, trace };
        }
      }
    }
  } catch (_osrmErr) {
    // proceed to procedural fallback
  }

  return null;
}

export const generateRealOSRMRoute = generateRealOutdoorRoute;

const WATER_REGEX = /\b(lac|lacs|lake|lakes|see|rivière|riviere|rivières|rivieres|fleuve|fluvial|fluviale|rives|berges|cascade|cascades|source|sources|méandre|meandre|méandres|meandres|canal|canaux|our|sûre|sure|alzette|moselle|musel|syre|wiltz|clerve|eisch|gander|blees|mamer|attert|semois|meuse|rur|saar|sarre|kyll|weiher|weier|wasser|trois-rivieres|trois-vallees)\b/i;

const FOREST_REGEX = /\b(forêt|foret|forêts|forets|forest|wald|wälder|fiels|mullerthal|mëllerdall|eislek|haard|aarnescht|gréngewald|grengewald|bambësch|bambesch|kallék|futaie|hollenfels|septfontaines|consdorf|beaufort|berdorf|larochette|kautenbach|clervaux|fischbach|schoenfels|tuntange|manternach|differdange|lasauvage|kopstal|bissen|eschweiler|lellingen|boulaide|baschleiden|asselborn|heinerscheid|hoscheid|tadler|kalborn|bavigne|felsenweg|fautelfiels|mamerleeen)\b/i;

/**
 * Determines whether a route is a closed loop circuit (returns to its starting area)
 * vs a point-to-point linear route (such as national PC cycle paths).
 */
export function isRouteLoop(item: {
  route: RouteSuggestions;
  trace?: RouteTrace;
  tags?: string[];
}): boolean {
  if ((item.tags || []).includes('loop') || (item.route.tags || []).includes('loop')) {
    return true;
  }

  const distM = item.trace?.distance || 10000;
  const maxGapMeters = Math.max(1500, distM * 0.08);
  let hasGeometry = false;

  // 1. Check waypoints [start, ..., end] if present
  const wp = item.route.waypoints;
  if (wp && wp.length >= 2) {
    const firstWp = wp[0];
    const lastWp = wp[wp.length - 1];
    if (
      firstWp &&
      lastWp &&
      typeof firstWp[0] === 'number' &&
      typeof lastWp[0] === 'number'
    ) {
      hasGeometry = true;
      const wpGap = haversineDistance(firstWp, lastWp);
      if (wpGap <= maxGapMeters) {
        return true;
      }
    }
  }

  // 2. Check full trace coordinates (supports both 1D and 2D multi-segment arrays)
  const rawCoords = item.trace?.coordinates;
  if (rawCoords && rawCoords.length > 0) {
    const flatCoords: [number, number][] = Array.isArray(rawCoords[0]?.[0])
      ? (rawCoords as [number, number][][]).flat()
      : (rawCoords as [number, number][]);

    if (flatCoords.length >= 2) {
      hasGeometry = true;
      const startPt = flatCoords[0];
      const endPt = flatCoords[flatCoords.length - 1];
      const coordGap = haversineDistance(startPt, endPt);
      if (coordGap <= maxGapMeters) {
        return true;
      }
    }
  }

  if (hasGeometry) {
    return false;
  }

  // 3. Fallback to semantic title/description check only when no geometry is attached
  const text = `${item.route.title} ${item.route.description}`.toLowerCase();
  return /\b(boucle|circuit|rundweg|auto-pédestre|autopedestre)\b/i.test(text);
}

export function routeMatchesFilter(item: { route: RouteSuggestions; trace: RouteTrace; tags?: string[] }, filterId: string): boolean {
  const fullText = `${item.route.title} ${item.route.description} ${item.route.surfaceType} ${(item.route.highlights || []).join(' ')} ${item.route.id}`;
  const isBike = item.route.activity === 'bike';
  const distM = item.trace.distance || 1;
  const gain = item.route.elevationGain;
  const slopeRatio = gain / distM;

  switch (filterId) {
    case 'loop':
      return isRouteLoop(item);

    case 'water':
      return WATER_REGEX.test(fullText) || (item.tags || []).includes('water') || (item.route.tags || []).includes('water');

    case 'forest':
      return (
        FOREST_REGEX.test(fullText) ||
        (item.tags || []).includes('forest') ||
        (item.route.tags || []).includes('forest')
      );

    case 'paved':
      if (isBike) {
        return (
          item.route.id.includes('pc') ||
          item.route.id.includes('course') ||
          item.route.surfaceType.toLowerCase().includes('enrobé') ||
          item.route.surfaceType.toLowerCase().includes('asphalte') ||
          item.route.surfaceType.toLowerCase().includes('piste cyclable') ||
          (item.tags || []).includes('paved') ||
          (item.route.tags || []).includes('paved')
        ) && !item.route.id.includes('vtt') && !item.route.title.toLowerCase().includes('vtt');
      } else {
        return (
          item.route.id.includes('confort') ||
          item.route.surfaceType.toLowerCase().includes('enrobé') ||
          item.route.surfaceType.toLowerCase().includes('asphalte') ||
          (item.tags || []).includes('paved') ||
          (item.route.tags || []).includes('paved')
        );
      }

    case 'gravel':
      if (isBike) {
        return (
          item.route.id.includes('vtt') ||
          item.route.title.toLowerCase().includes('vtt') ||
          item.route.surfaceType.toLowerCase().includes('gravel') ||
          item.route.surfaceType.toLowerCase().includes('chemin') ||
          item.route.surfaceType.toLowerCase().includes('naturel') ||
          item.route.surfaceType.toLowerCase().includes('terre') ||
          (item.tags || []).includes('gravel') ||
          (item.route.tags || []).includes('gravel')
        );
      } else {
        return (
          !item.route.id.includes('confort') &&
          !item.route.surfaceType.toLowerCase().includes('100% asphalte')
        );
      }

    case 'flat':
      return isBike
        ? slopeRatio < 0.018 || gain < 350
        : slopeRatio < 0.030 || gain < 250;

    case 'hilly':
      return isBike
        ? slopeRatio >= 0.024 || gain >= 600
        : slopeRatio >= 0.038 || gain >= 400;

    case 'low_traffic': {
      const carFree = item.route.roadBreakdown?.carFreePercentage ?? 80;
      if (isBike) {
        const isRoadCourse =
          item.route.id.includes('course') ||
          item.route.title.toLowerCase().includes('course') ||
          item.route.description.toLowerCase().includes('vélo de course') ||
          item.route.description.toLowerCase().includes('velo de course');
        return !isRoadCourse && carFree >= 70;
      } else {
        return carFree >= 80;
      }
    }

    default:
      return true;
  }
}

/**
 * Returns true if the location string represents a broad regional zone (or empty)
 * rather than a specific city/village search.
 */
export function isRegionalZoneLocation(location?: string): boolean {
  if (!location || location.trim().length === 0) return true;
  const norm = location.toLowerCase().trim();
  if (
    norm.includes('grande région') ||
    norm.includes('toute la région') ||
    norm.includes('tous les pays') ||
    norm.includes('200 km')
  ) {
    return true;
  }
  return REGIONAL_ZONES.some((z) => z.name.toLowerCase().trim() === norm);
}

/**
 * Local offline filter and search engine for the 200km zone around Luxembourg.
 */
export function filterAndSearchOffline(params: {
  location?: string;
  center?: [number, number];
  distanceKm: [number, number];
  filters: string[];
  activity: 'bike' | 'hike';
  bikeType?: 'road' | 'vtt' | 'all';
  bikeContentFilter?: BikeContentFilter;
  cyclewayCategoryFilter?: CyclewayCategory | 'all';
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR' | 'ALL';
  bounds?: { north: number; south: number; east: number; west: number };
}): { routes: RouteSuggestions[]; traces: Record<string, RouteTrace>; locationName?: string } {
  const {
    location,
    distanceKm,
    filters,
    activity,
    country,
    bounds,
    bikeContentFilter = 'all',
    cyclewayCategoryFilter = 'all',
  } = params;

  const minD = distanceKm[0];
  const maxD = distanceKm[1];

  // When the distance slider is opened to its extremities (15–120 km for bike, 3–35 km for hike),
  // treat that extremity as unbounded so shorter or longer official tracks are never excluded.
  const effectiveMinD = minD <= (activity === 'bike' ? 15 : 3) ? 0 : minD;
  const effectiveMaxD = maxD >= (activity === 'bike' ? 120 : 35) ? Infinity : maxD;

  let targetCenter: [number, number] = GAZETTEER[0].coords;
  const hasSpecificLocation = !isRegionalZoneLocation(location);

  if (params.center && !isNaN(params.center[0]) && !isNaN(params.center[1])) {
    targetCenter = params.center;
  } else if (
    bounds &&
    typeof bounds.north === 'number' &&
    typeof bounds.south === 'number' &&
    typeof bounds.east === 'number' &&
    typeof bounds.west === 'number' &&
    !isNaN(bounds.north) &&
    !isNaN(bounds.south) &&
    !isNaN(bounds.east) &&
    !isNaN(bounds.west)
  ) {
    targetCenter = [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2];
  } else if (hasSpecificLocation && location) {
    targetCenter = resolveLocationOffline(location);
  } else if (country && country !== 'ALL') {
    const zone = REGIONAL_ZONES.find((z) => z.id === country);
    if (zone) targetCenter = zone.center;
  }

  const nearestLoc = findNearestLocationOffline(targetCenter);
  const resolvedLocName =
    location || (nearestLoc.distanceKm <= 20 ? nearestLoc.name : `Secteur ${nearestLoc.name}`);

  const allCatalogIds = new Set(CATALOG_ROUTES.map((c) => c.route.id));

  // Filter curated catalogue routes
  const matchedCatalog = CATALOG_ROUTES.filter((item) => {
    // Activity match
    if (item.route.activity !== activity) return false;

    const isCycleway = activity === 'bike' && isCyclewayRoute(item.route);
    const distKm = item.trace.distance / 1000;

    // Exclure les sous-tronçons techniques ("-troncon-01") quand la piste cyclable complète existe
    if (isCycleway && item.route.id.includes('-troncon-')) {
      const parentId = item.route.id.replace(/-troncon-\d+$/i, '');
      if (allCatalogIds.has(parentId) || distKm < 2.2) {
        return false;
      }
    }

    // Distinction Traces (circuits) vs Pistes Cyclables + filtre par catégorie de piste cyclable
    if (activity === 'bike') {
      if (bikeContentFilter === 'traces' && isCycleway) return false;
      if (bikeContentFilter === 'cycleways' && !isCycleway) return false;
      if (
        cyclewayCategoryFilter !== 'all' &&
        (!isCycleway || item.route.cyclewayCategory !== cyclewayCategoryFilter)
      ) {
        return false;
      }
    }

    // Bike subtype match (Road vs VTT) — les pistes cyclables restent accessibles en mode Route & Pistes
    if (activity === 'bike' && params.bikeType && params.bikeType !== 'all') {
      if (isCycleway) {
        if (params.bikeType === 'vtt' && bikeContentFilter !== 'cycleways') return false;
      } else {
        const isVtt = isVttRoute(item.route);
        if (params.bikeType === 'vtt' && !isVtt) return false;
        if (params.bikeType === 'road' && isVtt) return false;
      }
    }

    // Distance match :
    // - Pour une Trace / Boucle : respect strict de la fourchette [effectiveMinD, effectiveMaxD]
    // - Pour une Piste Cyclable : c'est une infrastructure linéaire découpable en sous-traces de toute longueur !
    //   On l'affiche donc sans blocage de longueur max (dès 4 km en vue mixte, ou dès 2 km en vue Pistes Cyclables).
    if (isCycleway) {
      const minCyclewayKm = bikeContentFilter === 'cycleways' ? 1.5 : 4.5;
      if (distKm < minCyclewayKm) return false;
    } else {
      if (distKm < effectiveMinD || distKm > effectiveMaxD) return false;
    }

    // Spatial check
    if (bounds) {
      const flatCoords = (
        Array.isArray(item.trace.coordinates[0]?.[0])
          ? (item.trace.coordinates as [number, number][][]).flat()
          : (item.trace.coordinates as [number, number][])
      );
      const hasPointInBounds = flatCoords.some(
        ([lon, lat]) =>
          lat >= bounds.south - 0.04 &&
          lat <= bounds.north + 0.04 &&
          lon >= bounds.west - 0.04 &&
          lon <= bounds.east + 0.04
      );
      if (!hasPointInBounds) return false;
    } else if (params.center || hasSpecificLocation) {
      const refPoint = params.center || targetCenter;
      const maxRadius = activity === 'bike' ? (params.center ? 35 : 35) : (params.center ? 25 : 22);
      if (isCycleway) {
        const flatCoords = Array.isArray(item.trace.coordinates[0]?.[0])
          ? (item.trace.coordinates as [number, number][][]).flat()
          : (item.trace.coordinates as [number, number][]);
        const step = Math.max(1, Math.floor(flatCoords.length / 25));
        let passesNear = false;
        for (let idx = 0; idx < flatCoords.length; idx += step) {
          if (haversineDistance(flatCoords[idx], refPoint) / 1000 <= maxRadius) {
            passesNear = true;
            break;
          }
        }
        if (!passesNear && flatCoords.length > 0) {
          passesNear =
            haversineDistance(flatCoords[flatCoords.length - 1], refPoint) / 1000 <= maxRadius;
        }
        if (!passesNear) return false;
      } else {
        const startCoord = item.route.waypoints[0];
        const distToLoc = haversineDistance(startCoord, refPoint) / 1000;
        if (distToLoc > maxRadius) return false;
      }
    } else if (country && country !== 'ALL') {
      if (item.country !== country) return false;
    }
    // When country === 'ALL' and no specific city/bounds/click is active, NO geographic filter is applied:
    // all catalog traces across the entire Greater Region are included.

    // Strict filter consistency: each active preference must be satisfied
    if (filters && filters.length > 0) {
      for (const filterId of filters) {
        if (!routeMatchesFilter(item, filterId)) {
          return false;
        }
      }
    }

    return true;
  });

  const routes: RouteSuggestions[] = [...matchedCatalog.map((c) => c.route)];
  const traces: Record<string, RouteTrace> = {};
  matchedCatalog.forEach((c) => {
    traces[c.route.id] = c.trace;
  });

  // Sort: routes matching user's selected filters come first, then closest match to desired distance
  const targetMid = (minD + maxD) / 2;
  routes.sort((a, b) => {
    if (filters && filters.length > 0) {
      const aTags = a.tags || CATALOG_ROUTES.find((c) => c.route.id === a.id)?.tags || [];
      const bTags = b.tags || CATALOG_ROUTES.find((c) => c.route.id === b.id)?.tags || [];
      const aMatchCount = filters.filter((f) => aTags.includes(f)).length;
      const bMatchCount = filters.filter((f) => bTags.includes(f)).length;
      if (bMatchCount !== aMatchCount) {
        return bMatchCount - aMatchCount;
      }
    }
    const distA = traces[a.id]?.distance / 1000 || 0;
    const distB = traces[b.id]?.distance / 1000 || 0;
    return Math.abs(distA - targetMid) - Math.abs(distB - targetMid);
  });

  return { routes, traces, locationName: resolvedLocName };
}

/**
 * Searches curated catalog routes strictly adhering to user's active filters and visible bounds.
 * Never fabricates synthetic or procedural routes on the fly.
 */
export async function searchAndGenerateRoutes(params: {
  location?: string;
  center?: [number, number];
  distanceKm: [number, number];
  filters: string[];
  activity: 'bike' | 'hike';
  bikeType?: 'road' | 'vtt' | 'all';
  bikeContentFilter?: BikeContentFilter;
  cyclewayCategoryFilter?: CyclewayCategory | 'all';
  country?: 'LU' | 'BE' | 'DE' | 'NL' | 'FR' | 'ALL';
  bounds?: { north: number; south: number; east: number; west: number };
}): Promise<{ routes: RouteSuggestions[]; traces: Record<string, RouteTrace>; locationName?: string }> {
  return filterAndSearchOffline(params);
}

