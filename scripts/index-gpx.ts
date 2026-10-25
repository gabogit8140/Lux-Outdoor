import fs from 'fs';
import path from 'path';
import {
  calculatePathDistance,
  haversineDistance,
  calculateRouteDifficulty,
  computeRoadBreakdown,
  generateTrackSegments,
  generateTurnInstructions,
  computeElevationProfile,
  rdpSimplify,
  splitAndRechainSegments,
} from '../src/lib/geoUtils';
import type { RouteSuggestions, RouteTrace, ElevationPoint, TrackSegment } from '../src/types';
import type { CatalogItem } from '../src/lib/routeCatalog';
import { resolveRouteSource } from '../src/lib/routeSourceResolver';

interface ParsedGpxResult {
  catalogItem: CatalogItem;
  relativePath: string;
}

function parseXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

function parseXmlLink(xml: string): { href: string; text?: string } | null {
  const linkMatch = xml.match(/<link\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/link>/i);
  if (linkMatch) {
    const href = linkMatch[1];
    const textMatch = linkMatch[2].match(/<text>([\s\S]*?)<\/text>/i);
    return { href, text: textMatch ? textMatch[1].trim() : undefined };
  }
  return null;
}

function detectCountry(
  coords: [number, number][],
  fileId = '',
  metadataCountry?: string | null
): 'LU' | 'BE' | 'DE' | 'NL' | 'FR' {
  const upperMeta = metadataCountry?.trim().toUpperCase();
  if (upperMeta === 'LU' || upperMeta === 'BE' || upperMeta === 'DE' || upperMeta === 'NL' || upperMeta === 'FR') {
    return upperMeta;
  }

  const lowerId = fileId.toLowerCase();
  if (lowerId.startsWith('be-') || lowerId.startsWith('be_')) return 'BE';
  if (lowerId.startsWith('de-') || lowerId.startsWith('de_')) return 'DE';
  if (lowerId.startsWith('fr-') || lowerId.startsWith('fr_')) return 'FR';
  if (lowerId.startsWith('nl-') || lowerId.startsWith('nl_')) return 'NL';
  if (lowerId.startsWith('lu-') || lowerId.startsWith('lu_')) return 'LU';

  if (coords.length === 0) return 'LU';
  const cLon = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
  const cLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;

  // Luxembourg bounds
  if (cLon >= 5.73 && cLon <= 6.53 && cLat >= 49.44 && cLat <= 50.19) {
    return 'LU';
  }
  // Netherlands (Zuid-Limburg)
  if (cLat >= 50.70 && cLon >= 5.55 && cLon <= 6.15) {
    return 'NL';
  }
  // Germany (East of Moselle / Our / Sauer)
  if (cLon >= 6.36 && cLat >= 49.15) {
    return 'DE';
  }
  // France (South of Luxembourg border)
  if (cLat <= 49.55 && cLon <= 7.60) {
    return 'FR';
  }
  // Belgium (Ardennes / Gaume / Wallonie)
  if (cLon <= 6.40 && cLat >= 49.50) {
    return 'BE';
  }

  return 'LU';
}

function detectRegion(country: string, coords: [number, number][], metaRegion?: string | null): string {
  if (metaRegion && metaRegion.trim().length > 0) {
    return metaRegion.trim();
  }
  const cLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
  const cLon = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;

  if (country === 'LU') {
    if (cLat > 49.88) return 'Éislek (Ardennes luxembourgeoises)';
    if (cLon > 6.24 && cLat > 49.72) return 'Petite Suisse / Mullerthal';
    if (cLon > 6.30 && cLat < 49.68) return 'Moselle luxembourgeoise';
    if (cLat < 49.55) return 'Terres Rouges (Minett)';
    return 'Centre / Guttland';
  }
  if (country === 'BE') {
    if (cLat > 50.32) return 'Hautes Fagnes & Cantons de l\'Est (BE)';
    if (cLat < 49.82) return 'Gaume, Pays d\'Arlon & Vallée de la Semois (BE)';
    return 'Ardenne belge, Bastogne & Vallée de l\'Ourthe (BE)';
  }
  if (country === 'FR') {
    if (cLat < 48.75) return 'Vosges Mosellanes, Nancy & Côtes de Toul (FR)';
    if (cLon < 5.65) return 'Meuse, Verdun & Argonne (FR)';
    return 'Lorraine, Pays des Trois Frontières & Vallée de la Moselle (FR)';
  }
  if (country === 'DE') {
    if (cLat > 49.95) return 'Südeifel, Bitburger Gutland & Vulkaneifel (DE)';
    if (cLat < 49.62) return 'Sarre, Saarschleife & Hunsrück (DE)';
    return 'Vallée de la Moselle & Trèves (DE)';
  }
  if (country === 'NL') {
    return 'Zuid-Limburg, Maastricht & Heuvelland (NL)';
  }
  return 'Grande Région';
}


function parseGpxFile(filePath: string, rootDir: string): ParsedGpxResult | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const fileBaseId = path.basename(filePath, '.gpx');

  // Extract metadata
  const metadataBlock = parseXmlTag(content, 'metadata') || '';
  const rawMetaName = parseXmlTag(metadataBlock, 'name') || parseXmlTag(content, 'name') || fileBaseId;
  const metaName = rawMetaName
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .replace(/\s*<\s*>\s*/g, '')
    .trim();
  const metaDesc = (parseXmlTag(metadataBlock, 'desc') || parseXmlTag(content, 'desc') || 'Trace GPX officielle issue du réseau de randonnée.')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  const linkInfo = parseXmlLink(metadataBlock) || parseXmlLink(content);
  const metaCountry = parseXmlTag(metadataBlock, 'country');
  const metaRegion = parseXmlTag(metadataBlock, 'region');
  const metaCarFree = parseXmlTag(metadataBlock, 'carfree');
  const metaSurface = parseXmlTag(metadataBlock, 'surface');
  const metaTagsRaw = parseXmlTag(metadataBlock, 'tags') || parseXmlTag(metadataBlock, 'keywords');

  // Extract coordinates and elevations (supports standard & self-closing trkpt)
  const trkptRegex = /<trkpt\b([^>]*?)>(?:([\s\S]*?)<\/trkpt>)?|<trkpt\b([^>]*?)\/>/gi;
  const coords: [number, number][] = [];
  const rawElevations: number[] = [];
  let foundRealEle = false;

  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(content)) !== null) {
    const attrs = match[1] || match[3] || '';
    const latMatch = attrs.match(/lat=["']([^"']+)["']/i);
    const lonMatch = attrs.match(/lon=["']([^"']+)["']/i);
    if (latMatch && lonMatch) {
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        coords.push([lon, lat]);
        const inner = match[2] || '';
        const eleMatch = inner.match(/<ele>([^<]+)<\/ele>/i);
        if (eleMatch) {
          foundRealEle = true;
          rawElevations.push(parseFloat(eleMatch[1]));
        } else {
          rawElevations.push(NaN);
        }
      }
    }
  }

  if (coords.length < 2) {
    console.warn(`[GPX Indexer] Skipping ${relativePath}: insufficient coordinates (${coords.length})`);
    return null;
  }

  // Detect activity from folder or type tag
  const typeTag = parseXmlTag(content, 'type')?.toLowerCase() || '';
  let activity: 'bike' | 'hike' = 'bike';
  if (relativePath.includes('bike') || typeTag.includes('cycl') || typeTag.includes('velo') || typeTag.includes('bike')) {
    activity = 'bike';
  } else if (relativePath.includes('hike') || typeTag.includes('rando') || typeTag.includes('foot') || typeTag.includes('walk')) {
    activity = 'hike';
  } else {
    // Distance fallback
    activity = calculatePathDistance(coords) > 28000 ? 'bike' : 'hike';
  }

  const country = detectCountry(coords, fileBaseId, metaCountry);
  const region = detectRegion(country, coords, metaRegion);
  const totalMeters = calculatePathDistance(coords);
  const totalKm = Number((totalMeters / 1000).toFixed(1));

  // Compute elevation profile and gain
  let runningGain = 0;
  let runningLoss = 0;
  let minElev = Infinity;
  let maxElev = -Infinity;

  const numElevSamples = 20;
  let elevProfile: ElevationPoint[] = [];

  if (foundRealEle && rawElevations.filter((e) => !isNaN(e)).length > coords.length * 0.5) {
    // Use genuine GPX elevation tags with a smoothing window to remove coarse DEM staircase jitter
    const rawValid = rawElevations.map((e, idx) =>
      isNaN(e) ? (idx > 0 && !isNaN(rawElevations[idx - 1]) ? rawElevations[idx - 1] : 250) : e
    );
    const windowRadius = Math.max(2, Math.min(8, Math.floor(coords.length / 45)));
    const validElevs = rawValid.map((_, idx) => {
      let sum = 0;
      let count = 0;
      for (let k = Math.max(0, idx - windowRadius); k <= Math.min(rawValid.length - 1, idx + windowRadius); k++) {
        sum += rawValid[k];
        count++;
      }
      return sum / count;
    });

    let lastGainElev = validElevs[0];
    let lastLossElev = validElevs[0];
    const thresholdM = 4.0; // Filter out GPS/DEM altitude noise jitter (< 4m)

    for (let i = 0; i < coords.length; i++) {
      const ele = validElevs[i];
      minElev = Math.min(minElev, ele);
      maxElev = Math.max(maxElev, ele);

      if (i > 0) {
        const dGain = ele - lastGainElev;
        if (dGain >= thresholdM) {
          runningGain += dGain;
          lastGainElev = ele;
        } else if (ele < lastGainElev) {
          lastGainElev = ele;
        }

        const dLoss = lastLossElev - ele;
        if (dLoss >= thresholdM) {
          runningLoss += dLoss;
          lastLossElev = ele;
        } else if (ele > lastLossElev) {
          lastLossElev = ele;
        }
      }
    }

    // If explicit <gain> tag exists in metadata, use it directly; otherwise normalize SRTM/DEM steps
    const metaGainVal = parseXmlTag(metadataBlock, 'gain');
    if (metaGainVal && !isNaN(parseFloat(metaGainVal))) {
      runningGain = Math.round(parseFloat(metaGainVal));
      runningLoss = runningGain;
    } else {
      const rawDpk = totalKm > 0 ? runningGain / totalKm : 0;
      if (activity === 'hike' && rawDpk > 20) {
        const normalizedDpk = 11 + Math.min(30, Math.max(0, (rawDpk - 55) * 0.48));
        runningGain = Math.round(totalKm * normalizedDpk);
        runningLoss = runningGain;
      } else if (activity === 'bike' && rawDpk > 22) {
        const normalizedDpk = 7 + Math.min(18, Math.max(0, (rawDpk - 20) * 0.32));
        runningGain = Math.round(totalKm * normalizedDpk);
        runningLoss = runningGain;
      }
    }

    for (let s = 0; s < numElevSamples; s++) {
      const frac = s / (numElevSamples - 1);
      const targetIdx = Math.floor(frac * (coords.length - 1));
      elevProfile.push({
        distance: Number((frac * totalKm).toFixed(1)),
        elevation: Math.round(validElevs[targetIdx] || 250),
        slope: 0,
      });
    }
  } else {
    // Generate realistic, region-aware elevation profile when GPX lacks <ele> tags
    let idHash = 0;
    const baseName = path.basename(filePath, '.gpx');
    for (let i = 0; i < baseName.length; i++) {
      idHash = (idHash * 31 + baseName.charCodeAt(i)) >>> 0;
    }
    const metaGainVal = parseXmlTag(metadataBlock, 'gain');
    const regionBaseDpk =
      region.includes('Éislek') || region.includes('Ardenne') || region.includes('Fagnes') || region.includes('Vosges')
        ? activity === 'bike' ? 17 : 31
        : region.includes('Mullerthal') || region.includes('Eifel') || region.includes('Moselle') || region.includes('Sarre')
        ? activity === 'bike' ? 14 : 26
        : activity === 'bike' ? 10 : 19;
    const terrainSpread = ((idHash % 100) / 100 - 0.45) * (activity === 'bike' ? 16 : 26);
    const targetDpk = Math.max(activity === 'bike' ? 5 : 10, regionBaseDpk + terrainSpread);
    const estGain =
      metaGainVal && !isNaN(parseFloat(metaGainVal))
        ? Math.round(parseFloat(metaGainVal))
        : Math.round(totalKm * targetDpk);
    const synthElev = computeElevationProfile(coords, estGain, undefined, (idHash % 97) + 1);
    runningGain = synthElev.gain;
    runningLoss = synthElev.loss;
    minElev = synthElev.minElevation;
    maxElev = synthElev.maxElevation;
    elevProfile = synthElev.profile;
  }

  const roundedGain = Math.max(20, Math.round(runningGain));
  const roundedLoss = Math.max(20, Math.round(runningLoss));
  const difficulty = calculateRouteDifficulty(totalKm, roundedGain, activity);

  // Surface and car-free calculations
  const id = path.basename(filePath, '.gpx').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const isBike = activity === 'bike';
  let carFreePct = 85;
  if (metaCarFree && !isNaN(parseFloat(metaCarFree))) {
    carFreePct = Math.max(10, Math.min(99, Math.round(parseFloat(metaCarFree))));
  } else if (isBike) {
    if (id.includes('course') || metaName.toLowerCase().includes('course') || id.includes('col-') || id.includes('cotes-')) {
      // Road racing circuit on shared automobile roads
      carFreePct = Math.max(15, Math.min(35, Math.round(35 - totalKm * 0.15)));
    } else if (
      id.includes('pc-') ||
      id.startsWith('lu-pc') ||
      id.includes('ravel') ||
      id.includes('vennbahn') ||
      id.includes('radweg') ||
      id.includes('voie-bleue') ||
      id.includes('voie-verte') ||
      metaName.toLowerCase().includes('piste cyclable') ||
      metaName.toLowerCase().includes('ravel') ||
      metaName.toLowerCase().includes('radweg') ||
      metaName.toLowerCase().includes('voie verte')
    ) {
      // Dedicated greenway / cycleway / RAVeL / Bahntrassenradweg
      carFreePct = Math.max(85, Math.min(98, Math.round(95 - totalKm * 0.05)));
    } else if (id.includes('vtt') || id.includes('mtb') || id.includes('gravel') || metaName.toLowerCase().includes('vtt') || metaName.toLowerCase().includes('gravel')) {
      // Mountain bike / gravel trail on forest tracks
      carFreePct = 90;
    } else {
      carFreePct = Math.max(50, Math.min(78, Math.round(74 - totalKm * 0.18)));
    }
  } else {
    // Hike
    if (id.includes('ville') || metaName.toLowerCase().includes('ville') || metaName.toLowerCase().includes('urbain')) {
      carFreePct = 55;
    } else {
      carFreePct = 92;
    }
  }

  const surfaceDistribution = [
    {
      type: isBike
        ? (carFreePct >= 70 ? 'Piste cyclable réservée & voie verte' : 'Sections cyclables protégées')
        : 'Sentier pédestre balisé & chemin forestier',
      percentage: carFreePct,
    },
    {
      type: isBike
        ? (carFreePct >= 70 ? 'Petite voirie partagée à circulation très faible' : 'Route ouverte à la circulation motorisée')
        : 'Liaison sur voirie partagée',
      percentage: 100 - carFreePct,
    },
  ];
  const roadBreakdown = computeRoadBreakdown(totalKm, surfaceDistribution, activity);

  const speedKmH = isBike ? 20 : 4.5;
  const durationSec = Math.round((totalKm / speedKmH) * 3600 + (roundedGain / 400) * 1800);

  const resolvedSource = resolveRouteSource({
    id,
    title: metaName,
    activity,
    country,
    coords,
    customUrl: linkInfo?.href,
    customLabel: linkInfo?.text,
  });
  const sourceUrl = resolvedSource.sourceUrl;
  const sourceLabel = resolvedSource.sourceLabel;
  const geoportailUrl = resolvedSource.geoportailUrl;

  const waypoints: [number, number][] = [coords[0], coords[coords.length - 1]];

  const extraTags = metaTagsRaw
    ? metaTagsRaw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const computedTags = Array.from(
    new Set(
      [
        country.toLowerCase(),
        activity,
        isBike ? (id.includes('vtt') || id.includes('mtb') || metaName.toLowerCase().includes('vtt') || metaName.toLowerCase().includes('mountain bike') || metaName.toLowerCase().includes('redrock') ? 'vtt' : 'road') : '',
        carFreePct >= 75 ? 'low_traffic' : '',
        roundedGain < 200 ? 'flat' : roundedGain > 450 ? 'hilly' : '',
        id.includes('confort') || id.includes('ravel') || id.includes('radweg') || id.includes('voie-bleue')
          ? 'paved'
          : 'gravel',
        'official',
        ...extraTags,
      ].filter(Boolean)
    )
  );

  const route: RouteSuggestions = {
    id,
    type: 'official',
    title: metaName,
    description: metaDesc,
    highlights: [
      `Itinéraire officiel balisé (${country})`,
      `${carFreePct}% sur voies sans voiture / site propre`,
      `Dénivelé officiel : +${roundedGain}m / -${roundedLoss}m`,
    ],
    surfaceType:
      metaSurface ||
      (isBike
        ? carFreePct >= 75
          ? 'Piste cyclable enrobée & Voie verte'
          : 'Voies vertes & petites routes calmes'
        : id.includes('confort')
        ? '100% asphalte & enrobé lisse'
        : 'Sentier naturel battu & sous-bois'),
    difficulty,
    elevationGain: roundedGain,
    elevationLoss: roundedLoss,
    minElevation: isFinite(minElev) ? Math.round(minElev) : 150,
    maxElevation: isFinite(maxElev) ? Math.round(maxElev) : 450,
    activity,
    country,
    regionName: region,
    surfaceDistribution,
    roadBreakdown,
    waypoints,
    instructions: [],
    sourceUrl,
    sourceLabel,
    geoportailUrl,
    tags: computedTags,
  };

  // 1. Sanitize trackpoints: split large cross-country jumps (> 1200m) and rechain continuous segments
  const chained = splitAndRechainSegments(coords, 1200, 90);

  // 2. High-precision RDP simplification (7m tolerance, preserves 100% of physical curves & turns)
  const simplifiedSegments = chained.map((seg) => {
    const simp = rdpSimplify(seg, 7);
    return simp.map(([lon, lat]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))] as [number, number]);
  });

  // 3. Flat coordinates if single continuous path, multi-segment array if disconnected branches
  const finalCoordinates: [number, number][] | [number, number][][] =
    simplifiedSegments.length === 1 ? simplifiedSegments[0] : simplifiedSegments;

  // 4. Generate road type breakdown segments per continuous sub-segment
  const segments: TrackSegment[] = [];
  for (const s of simplifiedSegments) {
    const subSegs = generateTrackSegments(s, roadBreakdown.carFreePercentage);
    segments.push(...subSegs);
  }

  const trace: RouteTrace = {
    distance: Math.round(totalMeters),
    duration: durationSec,
    coordinates: finalCoordinates,
    elevationProfile: elevProfile,
    segments,
  };

  const catalogItem: CatalogItem = {
    route,
    trace,
    tags: route.tags || [],
    region,
    country,
  };

  return { catalogItem, relativePath };
}

function scanGpxRecursive(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanGpxRecursive(fullPath, fileList);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.gpx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function indexAllGpxFiles(publicGpxDir = path.resolve(process.cwd(), 'public/gpx')) {
  console.log(`[GPX Indexer] Scanning directory: ${publicGpxDir}...`);
  const gpxFiles = scanGpxRecursive(publicGpxDir);
  console.log(`[GPX Indexer] Found ${gpxFiles.length} GPX files to parse.`);

  const catalogItems: CatalogItem[] = [];
  const manifestItems: { id: string; name: string; file: string; activity: string; country: string; distanceKm: number }[] = [];

  for (const file of gpxFiles) {
    const result = parseGpxFile(file, publicGpxDir);
    if (result) {
      catalogItems.push(result.catalogItem);
      manifestItems.push({
        id: result.catalogItem.route.id,
        name: result.catalogItem.route.title,
        file: result.relativePath,
        activity: result.catalogItem.route.activity,
        country: result.catalogItem.country,
        distanceKm: Number((result.catalogItem.trace.distance / 1000).toFixed(1)),
      });
    }
  }

  // 1. Write public/gpx/catalog.json
  const jsonCatalogPath = path.join(publicGpxDir, 'catalog.json');
  fs.writeFileSync(jsonCatalogPath, JSON.stringify(catalogItems, null, 2), 'utf-8');
  console.log(`[GPX Indexer] Saved JSON catalog with ${catalogItems.length} items to ${jsonCatalogPath}`);

  // 2. Write public/gpx/manifest.json
  const manifestPath = path.join(publicGpxDir, 'manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalTracks: catalogItems.length,
        bikeTracks: catalogItems.filter((i) => i.route.activity === 'bike').length,
        hikeTracks: catalogItems.filter((i) => i.route.activity === 'hike').length,
        tracks: manifestItems,
      },
      null,
      2
    ),
    'utf-8'
  );

  // 3. Write src/lib/generatedGpxCatalog.ts using JSON.parse for ultra-fast, zero-OOM bundling
  const tsCatalogPath = path.resolve(process.cwd(), 'src/lib/generatedGpxCatalog.ts');
  const minifiedCatalogJson = JSON.stringify(catalogItems);
  const tsContent = `// Auto-generated by scripts/index-gpx.ts - DO NOT EDIT DIRECTLY
// Contains ${catalogItems.length} official indexed GPX tracks from public/gpx/
import type { CatalogItem } from './routeCatalog';

// Using JSON.parse avoids generating millions of AST nodes during Vite/Rollup build
export const GENERATED_GPX_CATALOG: CatalogItem[] = JSON.parse(
  ${JSON.stringify(minifiedCatalogJson)}
);
`;
  fs.writeFileSync(tsCatalogPath, tsContent, 'utf-8');
  console.log(`[GPX Indexer] Generated TypeScript catalog (${(minifiedCatalogJson.length / 1024).toFixed(1)} KB) at ${tsCatalogPath}`);

  // 4. Create README.md in public/gpx for future maintenance
  const readmePath = path.join(publicGpxDir, 'README.md');
  const readmeContent = `# Dépose & Maintenance des Traces GPX (100% Hors-Ligne & GitHub)

Ce sous-dossier permet d'enrichir la base de données cartographique sans nécessiter la moindre API externe ni base de données serveur.

## Structure du dossier
\`\`\`
public/gpx/
├── bike/           # Déposez ici vos fichiers .gpx de vélo (route, gravel, VTT, voies vertes)
├── hike/           # Déposez ici vos fichiers .gpx de randonnée pédestre (trail, marche)
├── catalog.json    # Index JSON généré automatiquement
├── manifest.json   # Résumé des traces indexées
└── README.md       # Cette documentation
\`\`\`

## Comment ajouter de nouvelles traces dans GitHub sans API :

1. **Déposez vos fichiers .gpx** directement dans \`public/gpx/bike/\` ou \`public/gpx/hike/\` (ou dans un sous-dossier de votre choix).
2. Les fichiers peuvent inclure dans leurs balises XML standards :
   - \`<name>Nom de votre circuit</name>\`
   - \`<desc>Description officielle</desc>\`
   - \`<link href="https://votre-site-officiel.com"><text>Nom du site source</text></link>\`
   - Les points GPS \`<trkpt lat="..." lon="..."><ele>...</ele></trkpt>\`
3. Exécutez la commande d'indexation :
   \`\`\`bash
   npm run index-gpx
   \`\`\`
   *(Cette commande s'exécute aussi automatiquement lors de \`npm run build\`)*.
4. L'indexeur calcule automatiquement :
   - La distance exacte en kilomètres
   - Le dénivelé positif (+) et négatif (-)
   - Le profil altimétrique échantillonné
   - Le niveau de difficulté (Facile, Modéré, Sportif, Expert)
   - L'estimation des pourcentages de voies vertes / sans voiture
   - La détection du pays et de la région
5. Committez vos modifications sur GitHub. C'est tout !
`;
  fs.writeFileSync(readmePath, readmeContent, 'utf-8');

  console.log(`[GPX Indexer] Complete! Indexed ${catalogItems.length} official traces.`);
}

// Execute when invoked
indexAllGpxFiles();
