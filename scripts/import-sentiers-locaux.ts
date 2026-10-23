import fs from 'fs';
import path from 'path';
import {
  calculatePathDistance,
  computeElevationProfile,
  estimateRegionalBaseElevation,
} from '../src/lib/geoUtils';
import { indexAllGpxFiles } from './index-gpx';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function importSentiersLocaux() {
  const catDir = path.resolve(process.cwd(), 'data/downloads/sentiers_locaux');
  const targetHikeDir = path.resolve(process.cwd(), 'public/gpx/hike');

  if (!fs.existsSync(catDir)) {
    console.error('[Sentiers Locaux] Directory not found:', catDir);
    return;
  }

  const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.gpx'));
  console.log(`[Sentiers Locaux] Found ${files.length} GPX files to import...`);

  let importedCount = 0;
  const usedSlugs = new Set<string>();

  for (const filename of files) {
    const filePath = path.join(catDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract coords supporting standard or self-closing trkpt
    const trkptRegex = /<trkpt\b([^>]*?)>(?:([\s\S]*?)<\/trkpt>)?|<trkpt\b([^>]*?)\/>/gi;
    const coords: [number, number][] = [];
    const elevations: number[] = [];
    let foundEleInFile = false;

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
            foundEleInFile = true;
            elevations.push(parseFloat(eleMatch[1]));
          } else {
            elevations.push(NaN);
          }
        }
      }
    }

    if (coords.length < 4) {
      continue; // skip trivial / empty traces
    }

    const totalDistMeters = calculatePathDistance(coords);
    const totalDistKm = totalDistMeters / 1000;

    // Extract title
    const nameMatch = content.match(/<name>([\s\S]*?)<\/name>/i);
    let rawTitle = nameMatch ? nameMatch[1].trim() : path.basename(filename, '.gpx');
    rawTitle = rawTitle.replace(/_+/g, ' ').replace(/\s*<\s*>\s*/g, '').trim();

    let cleanName = rawTitle;
    if (!cleanName.toLowerCase().startsWith('circuit local') && !cleanName.toLowerCase().startsWith('sentier local')) {
      cleanName = `Circuit Local ${cleanName}`;
    }

    // Build enriched trackpoints XML with elevation
    let enrichedTrkptsXml = '';
    if (!foundEleInFile) {
      const baseElevation = estimateRegionalBaseElevation(coords[0]);
      const targetGain = Math.round(totalDistKm * 28 + 50);
      const elevResult = computeElevationProfile(coords, targetGain, baseElevation);

      enrichedTrkptsXml = coords
        .map((c, i) => {
          const sampleProgress = i / (coords.length - 1);
          const profIdx = Math.min(
            elevResult.profile.length - 1,
            Math.floor(sampleProgress * elevResult.profile.length)
          );
          const ele = elevResult.profile[profIdx]?.elevation ?? baseElevation;
          return `      <trkpt lat="${c[1].toFixed(7)}" lon="${c[0].toFixed(7)}"><ele>${ele.toFixed(1)}</ele></trkpt>`;
        })
        .join('\n');
    } else {
      enrichedTrkptsXml = coords
        .map((c, i) => {
          const ele = !isNaN(elevations[i]) ? elevations[i] : estimateRegionalBaseElevation(c);
          return `      <trkpt lat="${c[1].toFixed(7)}" lon="${c[0].toFixed(7)}"><ele>${ele.toFixed(1)}</ele></trkpt>`;
        })
        .join('\n');
    }

    // Generate unique slug
    let baseSlug = slugify(cleanName) || slugify(path.basename(filename, '.gpx'));
    let gpxSlug = `lu-local-${baseSlug}`;
    let counter = 2;
    while (usedSlugs.has(gpxSlug)) {
      gpxSlug = `lu-local-${baseSlug}-${counter++}`;
    }
    usedSlugs.add(gpxSlug);

    const outPath = path.join(targetHikeDir, `${gpxSlug}.gpx`);
    const newXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Geoportail.lu &amp; Trace Outdoor"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${cleanName}</name>
    <desc>Sentier Pédestre Local Communal du Luxembourg (Geoportail &amp; Syndicats d'Initiative) - Parcours de ${totalDistKm.toFixed(1)} km.</desc>
    <link href="https://map.geoportail.lu/theme/tourisme?lang=fr">
      <text>Sentiers Pédestres Locaux &amp; Circuits Communaux du Luxembourg</text>
    </link>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${cleanName}</name>
    <type>Hiking</type>
    <trkseg>
${enrichedTrkptsXml}
    </trkseg>
  </trk>
</gpx>
`;

    fs.writeFileSync(outPath, newXml, 'utf-8');
    importedCount++;
  }

  console.log(`[Sentiers Locaux] Successfully converted and wrote ${importedCount} GPX files to public/gpx/hike/!`);
  console.log('[Sentiers Locaux] Running indexAllGpxFiles()...');
  indexAllGpxFiles();
  console.log('[Sentiers Locaux] Catalog re-indexing complete!');
}

importSentiersLocaux();
