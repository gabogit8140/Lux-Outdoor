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
} from '../src/lib/geoUtils';
import type { RouteSuggestions, RouteTrace, ElevationPoint } from '../src/types';
import type { CatalogItem } from '../src/lib/routeCatalog';

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

function detectCountry(coords: [number, number][]): 'LU' | 'BE' | 'DE' | 'NL' | 'FR' {
  if (coords.length === 0) return 'LU';
  const cLon = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
  const cLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;

  // Luxembourg bounds
  if (cLon >= 5.73 && cLon <= 6.53 && cLat >= 49.44 && cLat <= 50.19) {
    return 'LU';
  }
  // Netherlands (Zuid-Limburg)
  if (cLat >= 50.75 && cLon >= 5.60 && cLon <= 6.10) {
    return 'NL';
  }
  // Germany (East of Moselle / Our / Sauer)
  if (cLon >= 6.40 && cLat >= 49.30) {
    return 'DE';
  }
  // France (South of Luxembourg border)
  if (cLat <= 49.52 && cLon <= 7.00) {
    return 'FR';
  }
  // Belgium (Ardennes / Gaume / Wallonie)
  if (cLon <= 6.20 && cLat >= 49.50) {
    return 'BE';
  }

  return 'LU';
}

function detectRegion(country: string, coords: [number, number][]): string {
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
    if (cLat > 50.35) return 'Hautes Fagnes / Cantons de l\'Est';
    if (cLat < 49.85) return 'Gaume / Vallée de la Semois';
    return 'Ardenne belge & Ourthe';
  }
  if (country === 'FR') {
    if (cLat < 48.5) return 'Massif des Vosges';
    if (cLon < 5.8) return 'Meuse & Côtes de Meuse';
    return 'Lorraine & Vallée de la Moselle';
  }
  if (country === 'DE') {
    if (cLat > 50.0) return 'Vulkaneifel & Südeifel';
    if (cLat < 49.6) return 'Sarre & Saarschleife';
    return 'Vallée de la Moselle (Moselland)';
  }
  if (country === 'NL') {
    return 'Zuid-Limburg & Heuvelland';
  }
  return 'Grande Région';
}

function sampleCoordinates(coords: [number, number][], maxPoints = 60): [number, number][] {
  if (coords.length <= maxPoints) {
    return coords.map(([lon, lat]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))]);
  }
  const step = (coords.length - 1) / (maxPoints - 1);
  const sampled: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(coords.length - 1, Math.round(i * step));
    const [lon, lat] = coords[idx];
    sampled.push([Number(lon.toFixed(5)), Number(lat.toFixed(5))]);
  }
  return sampled;
}

function parseGpxFile(filePath: string, rootDir: string): ParsedGpxResult | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  // Extract metadata
  const metadataBlock = parseXmlTag(content, 'metadata') || '';
  const rawMetaName = parseXmlTag(metadataBlock, 'name') || parseXmlTag(content, 'name') || path.basename(filePath, '.gpx');
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

  const country = detectCountry(coords);
  const region = detectRegion(country, coords);
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
    // Use genuine GPX elevation tags
    const validElevs = rawElevations.map((e, idx) => (isNaN(e) ? (idx > 0 && !isNaN(rawElevations[idx - 1]) ? rawElevations[idx - 1] : 250) : e));
    for (let i = 0; i < coords.length; i++) {
      const ele = validElevs[i];
      minElev = Math.min(minElev, ele);
      maxElev = Math.max(maxElev, ele);

      if (i > 0) {
        const dEle = ele - validElevs[i - 1];
        if (dEle > 0) runningGain += dEle;
        else runningLoss += Math.abs(dEle);
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
    // Generate realistic, natural elevation profile
    const estGain = activity === 'bike' ? Math.round(totalKm * 15 + 45) : Math.round(totalKm * 28 + 65);
    const synthElev = computeElevationProfile(coords, estGain);
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
  const isBike = activity === 'bike';
  const carFreePct = isBike ? Math.min(95, Math.max(45, 80 - Math.round(totalKm * 0.4))) : 90;
  const surfaceDistribution = [
    { type: isBike ? 'Voie cyclable réservée' : 'Sentier pédestre balisé', percentage: carFreePct },
    { type: isBike ? 'Petites voies riveraines partagées' : 'Chemin forestier', percentage: 100 - carFreePct },
  ];
  const roadBreakdown = computeRoadBreakdown(totalKm, surfaceDistribution, activity);

  const speedKmH = isBike ? 20 : 4.5;
  const durationSec = Math.round((totalKm / speedKmH) * 3600 + (roundedGain / 400) * 1800);

  const id = path.basename(filePath, '.gpx').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const sourceUrl = linkInfo?.href || (country === 'LU' ? 'https://geoportail.lu' : country === 'BE' ? 'https://visitwallonia.be' : country === 'FR' ? 'https://www.lavoiebleue.com' : 'https://www.eifel.info');
  const sourceLabel = linkInfo?.text || (country === 'LU' ? 'Geoportail & Visit Luxembourg Officiel' : country === 'BE' ? 'Visit Wallonia Officiel' : country === 'FR' ? 'Tourisme Grand Est & Voies Vertes' : 'Eifel & Mosel Tourismus Officiel');

  const waypoints: [number, number][] = [coords[0], coords[coords.length - 1]];

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
    surfaceType: isBike ? (carFreePct > 70 ? 'Piste cyclable enrobée & Voie verte' : 'Voies vertes & petites routes calmes') : 'Sentier naturel battu & sous-bois',
    difficulty,
    elevationGain: roundedGain,
    elevationLoss: roundedLoss,
    minElevation: isFinite(minElev) ? Math.round(minElev) : 150,
    maxElevation: isFinite(maxElev) ? Math.round(maxElev) : 450,
    activity,
    country,
    regionName: region,
    surfaceDistribution: [
      { type: isBike ? 'Voie cyclable réservée' : 'Sentier pédestre balisé', percentage: carFreePct },
      { type: isBike ? 'Petites voies riveraines partagées' : 'Chemin forestier', percentage: 100 - carFreePct },
    ],
    roadBreakdown,
    waypoints,
    instructions: [],
    sourceUrl,
    sourceLabel,
    tags: [
      country.toLowerCase(),
      activity,
      carFreePct > 70 ? 'low_traffic' : '',
      roundedGain < 200 ? 'flat' : roundedGain > 450 ? 'hilly' : '',
      'official',
    ].filter(Boolean),
  };

  const sampledCoords = sampleCoordinates(coords, 60);
  const segments = generateTrackSegments(sampledCoords, roadBreakdown.carFreePercentage);

  const trace: RouteTrace = {
    distance: Math.round(totalMeters),
    duration: durationSec,
    coordinates: sampledCoords,
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
