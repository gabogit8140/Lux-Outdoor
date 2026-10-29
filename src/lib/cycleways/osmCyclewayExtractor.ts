import type { RouteSuggestions, RouteTrace } from '../../types';
import {
  calculatePathDistance,
  calculateRouteDifficulty,
  computeElevationProfile,
  computeRoadBreakdown,
  fetchElevationProfileOnline,
  generateTrackSegments,
  generateTurnInstructions,
  haversineDistance,
} from '../geoUtils';
import { findNearestLocationOffline } from '../localRouting';
import { CATALOG_ROUTES } from '../routeCatalog';
import {
  CYCLEWAY_CATEGORIES,
  classifyBikeRoute,
  classifyOsmCyclewayTags,
  enrichRouteWithCyclewayMeta,
} from './cyclewayClassifier';
import { resolveCyclewayWebReference } from './cyclewayWebReferences';
import {
  type Coord3D,
  chainMultiSegmentsToContinuousLine,
  normalizeCyclewayTrace,
  projectPointToTraceKm,
} from './cyclewayGeometry';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

interface OverpassGeomPt {
  lat: number;
  lon: number;
}

interface OverpassElement {
  type: 'way' | 'relation' | 'node';
  id: number;
  tags?: Record<string, string>;
  geometry?: OverpassGeomPt[];
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export interface ExtractedCyclewayResult {
  route: RouteSuggestions;
  trace: RouteTrace;
  clickedProjectedKm: number;
  source: 'catalog' | 'osm_relation' | 'osm_way';
}

const extractionCache = new Map<string, ExtractedCyclewayResult>();

async function queryOverpass(query: string, timeoutMs: number = 5500): Promise<OverpassResponse | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!response.ok) continue;
      const json = (await response.json()) as OverpassResponse;
      if (json && Array.isArray(json.elements)) {
        return json;
      }
    } catch {
      // Essayer le miroir suivant
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function scoreRelationPriority(tags: Record<string, string> = {}): number {
  const network = (tags.network || '').toLowerCase();
  const name = tags.name || tags['name:fr'] || '';
  const ref = tags.ref || '';
  let score = 0;
  // Privilégier les pistes cyclables nationales (PC), voies vertes/RAVeL et véloroutes nommées
  if (network === 'ncn' || /\bPC\s*\d+/i.test(`${ref} ${name}`)) score += 100;
  else if (network === 'rcn') score += 90;
  else if (network === 'icn') score += 85;
  else if (network === 'lcn') score += 75;
  if (name.length > 0) score += 20;
  if (ref.length > 0) score += 15;
  return score;
}

function resolveSurfaceLabel(tags: Record<string, string> = {}): string {
  const surf = (tags.surface || '').toLowerCase();
  const highway = (tags.highway || '').toLowerCase();
  if (surf.includes('asphalt') || surf.includes('paved')) {
    return 'Asphalte lisse (piste cyclable aménagée)';
  }
  if (surf.includes('compacted') || surf.includes('fine_gravel') || surf.includes('gravel')) {
    return 'Stabilisé compacté & revêtement doux';
  }
  if (highway === 'cycleway') {
    return 'Piste cyclable en site propre (asphalte / voie verte)';
  }
  return 'Voie cyclable aménagée & sections apaisées';
}

/**
 * Cherche d'abord si une piste cyclable du catalogue local passe sous le clic (<= maxDistMeters).
 */
export function findCatalogCyclewayAtPoint(
  lat: number,
  lng: number,
  maxDistMeters: number = 70
): ExtractedCyclewayResult | null {
  let bestMatch: {
    route: RouteSuggestions;
    trace: RouteTrace;
    distM: number;
    projKm: number;
  } | null = null;

  const catalogIds = new Set(CATALOG_ROUTES.map((c) => c.route.id));

  for (const item of CATALOG_ROUTES) {
    if (item.route.activity !== 'bike') continue;
    if (item.route.id.includes('-troncon-')) {
      const parentId = item.route.id.replace(/-troncon-\d+$/i, '');
      if (catalogIds.has(parentId)) continue;
    }
    const classification = classifyBikeRoute(item.route, item.trace);
    if (classification.routeKind !== 'cycleway') continue;

    // Pré-filtrage rapide par boîte englobante approximative
    const proj = projectPointToTraceKm(item.trace, lat, lng);
    if (proj.distanceMeters <= maxDistMeters) {
      if (!bestMatch || proj.distanceMeters < bestMatch.distM) {
        const normalizedTrace = normalizeCyclewayTrace(item.trace, item.route, [lng, lat]);
        const refinedProj = projectPointToTraceKm(normalizedTrace, lat, lng);
        if (refinedProj.distanceMeters <= maxDistMeters + 25) {
          bestMatch = {
            route: enrichRouteWithCyclewayMeta(item.route, normalizedTrace),
            trace: normalizedTrace,
            distM: refinedProj.distanceMeters,
            projKm: refinedProj.projectedKm,
          };
        }
      }
    }
  }

  if (!bestMatch) return null;

  return {
    route: bestMatch.route,
    trace: bestMatch.trace,
    clickedProjectedKm: bestMatch.projKm,
    source: 'catalog',
  };
}

/**
 * Extrait et reconstruit une piste cyclable sélectionnable à partir d'un clic `(lat, lng)` sur la carte vélo
 * (`CyclOSM` / `Waymarked Trails`), pour pouvoir l'inspecter et en extraire immédiatement des sous-traces.
 */
export async function fetchSelectableCyclewayAtPoint(
  lat: number,
  lng: number
): Promise<ExtractedCyclewayResult | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = extractionCache.get(cacheKey);
  if (cached) return cached;

  // 1. Interroger Overpass API autour du clic (rayon 80m) pour capter toute piste cyclable visible sur CyclOSM
  const discoveryQuery = `[out:json][timeout:6];
(
  rel(around:85,${lat},${lng})["type"="route"]["route"="bicycle"];
  way(around:85,${lat},${lng})["highway"="cycleway"];
  way(around:85,${lat},${lng})["bicycle"="designated"];
  way(around:85,${lat},${lng})["cycleway"~"^(track|lane|shared_lane|opposite_track|opposite_lane)$"];
  way(around:85,${lat},${lng})["cycleway:both"~"^(track|lane|shared_lane)$"];
  way(around:85,${lat},${lng})["cycleway:right"~"^(track|lane)$"];
  way(around:85,${lat},${lng})["cycleway:left"~"^(track|lane)$"];
);
out tags;`;

  const discovery = await queryOverpass(discoveryQuery, 5500);

  if (!discovery || !discovery.elements || discovery.elements.length === 0) {
    // Fallback hors-ligne sur les pistes cyclables du catalogue
    const fallback = findCatalogCyclewayAtPoint(lat, lng, 120);
    if (fallback) extractionCache.set(cacheKey, fallback);
    return fallback;
  }

  const relations = discovery.elements.filter((el) => el.type === 'relation');
  const ways = discovery.elements.filter((el) => el.type === 'way');

  let rawSegments: Coord3D[][] = [];
  let chosenTags: Record<string, string> = {};
  let isRelation = false;
  let osmId = 0;
  let maxGapMeters = 800;

  if (relations.length > 0) {
    // Trier les relations cyclables pour choisir la plus pertinente (PC nationale, RAVeL, EuroVelo/V50...)
    relations.sort((a, b) => scoreRelationPriority(b.tags) - scoreRelationPriority(a.tags));
    const bestRel = relations[0];
    chosenTags = bestRel.tags || {};
    isRelation = true;
    osmId = bestRel.id;
    maxGapMeters = 1600;

    // Extraire les ways de cette relation dans un corridor généreux (~40 km autour du clic)
    const south = (lat - 0.18).toFixed(4);
    const north = (lat + 0.18).toFixed(4);
    const west = (lng - 0.26).toFixed(4);
    const east = (lng + 0.26).toFixed(4);

    const relGeomQuery = `[out:json][timeout:6];
rel(${bestRel.id});
way(r)(${south},${west},${north},${east});
out geom;`;

    const relGeom = await queryOverpass(relGeomQuery, 6000);
    if (relGeom?.elements) {
      rawSegments = relGeom.elements
        .filter((el) => el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 2)
        .map((el) => el.geometry!.map((pt) => [pt.lon, pt.lat] as Coord3D));
    }
  }

  // Si pas de relation (ou géométrie relation vide), assembler la piste cyclable locale continue autour du clic
  if (rawSegments.length === 0 && ways.length > 0) {
    const seedWay = ways[0];
    chosenTags = seedWay.tags || {};
    isRelation = false;
    osmId = seedWay.id;
    maxGapMeters = 140; // Connexion stricte pour une piste cyclable locale sans fusionner toute une ville

    const south = (lat - 0.055).toFixed(4);
    const north = (lat + 0.055).toFixed(4);
    const west = (lng - 0.08).toFixed(4);
    const east = (lng + 0.08).toFixed(4);

    const localWaysQuery = `[out:json][timeout:6];
(
  way(${south},${west},${north},${east})["highway"="cycleway"];
  way(${south},${west},${north},${east})["bicycle"="designated"];
  way(${south},${west},${north},${east})["cycleway"~"^(track|lane|opposite_track)$"];
  way(${south},${west},${north},${east})["cycleway:both"~"^(track|lane)$"];
  way(${south},${west},${north},${east})["cycleway:right"~"^(track|lane)$"];
  way(${south},${west},${north},${east})["cycleway:left"~"^(track|lane)$"];
);
out tags geom;`;

    const localGeom = await queryOverpass(localWaysQuery, 6000);
    if (localGeom?.elements) {
      rawSegments = localGeom.elements
        .filter((el) => el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 2)
        .map((el) => el.geometry!.map((pt) => [pt.lon, pt.lat] as Coord3D));
    }
  }

  if (rawSegments.length === 0) {
    return findCatalogCyclewayAtPoint(lat, lng, 120);
  }

  const chained = chainMultiSegmentsToContinuousLine(rawSegments, [lng, lat], maxGapMeters);
  if (chained.length < 2) {
    return findCatalogCyclewayAtPoint(lat, lng, 120);
  }

  const coords2D: [number, number][] = chained.map(([lon, latPt]) => [
    Number(lon.toFixed(6)),
    Number(latPt.toFixed(6)),
  ]);

  const distMeters = Math.round(calculatePathDistance(coords2D));
  if (distMeters < 150) {
    return findCatalogCyclewayAtPoint(lat, lng, 120);
  }

  const distKm = Number((distMeters / 1000).toFixed(1));
  const nearestLoc = findNearestLocationOffline([lng, lat]);
  const startLoc = findNearestLocationOffline(coords2D[0]);
  const endLoc = findNearestLocationOffline(coords2D[coords2D.length - 1]);

  const { category, ref, carFreePct } = classifyOsmCyclewayTags(chosenTags, isRelation);
  const catMeta = CYCLEWAY_CATEGORIES[category];

  // Profil altimétrique réel en ligne (avec fallback instantané)
  let elevRes = await fetchElevationProfileOnline(coords2D).catch(() => null);
  if (!elevRes || elevRes.profile.length < 2) {
    elevRes = computeElevationProfile(coords2D, Math.max(12, Math.round(distKm * 4.5)));
  }

  const profile = elevRes.profile;
  const gain = Math.round(elevRes.gain);
  const minElevation = profile.length > 0 ? Math.min(...profile.map((p) => p.elevation)) : 180;
  const maxElevation = profile.length > 0 ? Math.max(...profile.map((p) => p.elevation)) : 260;

  const rawName =
    chosenTags['name:fr'] ||
    chosenTags.name ||
    chosenTags.official_name ||
    (ref ? `Piste Cyclable ${ref}` : '');

  const corridorLabel =
    startLoc.name !== endLoc.name
      ? `${startLoc.name} ↔ ${endLoc.name}`
      : `Secteur ${nearestLoc.name}`;

  const title = rawName
    ? ref && !rawName.toUpperCase().includes(ref)
      ? `${ref} • ${rawName}`
      : rawName
    : `${catMeta.shortLabel} — ${corridorLabel}`;

  const surfaceType = resolveSurfaceLabel(chosenTags);
  const surfaceDistribution = [
    { type: 'Voie verte & piste cyclable réservée', percentage: carFreePct },
    ...(100 - carFreePct > 0
      ? [{ type: 'Liaison cyclable apaisée', percentage: 100 - carFreePct }]
      : []),
  ];

  const roadBreakdown = computeRoadBreakdown(distKm, surfaceDistribution, 'bike');
  const difficulty = calculateRouteDifficulty(distKm, gain, 'bike');
  const segments = generateTrackSegments(coords2D, roadBreakdown.carFreePercentage);
  const instructions = generateTurnInstructions(coords2D, 'bike');

  const routeId = `osm-cycleway-${isRelation ? 'rel' : 'way'}-${osmId}`;
  const osmWebsite =
    chosenTags.website || chosenTags['contact:website'] || chosenTags.url;
  const webRef = resolveCyclewayWebReference({
    id: routeId,
    title,
    cyclewayRef: ref,
    cyclewayCategory: category,
    country: nearestLoc.country,
    coords: coords2D,
    osmWebsite,
    osmRelationId: isRelation ? osmId : undefined,
  });

  const route: RouteSuggestions = {
    id: routeId,
    type: 'public',
    routeKind: 'cycleway',
    cyclewayCategory: category,
    cyclewayRef: ref,
    title,
    description: `${catMeta.label} sélectionnée depuis la couche vélo (${corridorLabel}, ${distKm} km). Idéale pour découper une sous-trace de promenade aller-retour ou en boucle sur mesure.`,
    highlights: [
      `${catMeta.icon} ${catMeta.label}`,
      `Portion continue de ${distKm} km (${corridorLabel})`,
      `${roadBreakdown.carFreePercentage}% sur piste cyclable / voie sécurisée`,
      'Découpage en sous-trace (Aller-Retour ou Boucle) en 1 clic',
    ],
    surfaceType,
    difficulty,
    elevationGain: gain,
    elevationLoss: gain,
    minElevation,
    maxElevation,
    activity: 'bike',
    bikeType: 'road',
    country: nearestLoc.country,
    regionName: `${catMeta.shortLabel} · ${nearestLoc.region}`,
    surfaceDistribution,
    roadBreakdown,
    waypoints: [
      coords2D[0],
      coords2D[Math.floor(coords2D.length / 2)],
      coords2D[coords2D.length - 1],
    ],
    instructions,
    tags: ['bike', 'road', 'paved', 'low_traffic', 'cycleway', category],
    sourceUrl: webRef.sourceUrl,
    sourceLabel: webRef.sourceLabel,
    geoportailUrl:
      webRef.geoportailUrl ||
      (isRelation
        ? `https://cycling.waymarkedtrails.org/#route?id=${osmId}`
        : `https://www.openstreetmap.org/way/${osmId}`),
  };

  const trace: RouteTrace = {
    distance: distMeters,
    duration: Math.round((distKm / 20) * 3600),
    coordinates: coords2D,
    elevationProfile: profile,
    segments,
  };

  const proj = projectPointToTraceKm(trace, lat, lng);

  const extracted: ExtractedCyclewayResult = {
    route,
    trace,
    clickedProjectedKm: proj.projectedKm,
    source: isRelation ? 'osm_relation' : 'osm_way',
  };

  extractionCache.set(cacheKey, extracted);
  return extracted;
}
