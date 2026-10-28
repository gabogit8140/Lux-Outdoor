/**
 * gpxTransformer.ts
 * Parser, elevation enricher, and XML generator for standardizing GPX tracks.
 */

import {
  calculatePathDistance,
  computeElevationProfile,
  estimateRegionalBaseElevation,
} from '../../src/lib/geoUtils';
import type { DatasetCategory, ParsedTrackData } from './types';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parses raw GPX content into ordered coordinates and elevation points,
 * supporting both standard <trkpt>...</trkpt> and self-closing <trkpt /> syntax.
 */
export function parseGpxData(content: string, fallbackTitle: string): ParsedTrackData {
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

  const nameMatch = content.match(/<name>([\s\S]*?)<\/name>/i);
  const rawTitle = nameMatch ? nameMatch[1].trim() : fallbackTitle;

  return {
    coords,
    elevations,
    foundEleInFile,
    rawTitle,
  };
}

/**
 * Builds a standardized GPX v1.1 XML string with enriched elevation.
 */
export function buildEnrichedGpxXml({
  cleanName,
  category,
  coords,
  elevations,
  foundEleInFile,
  totalDistKm,
}: {
  cleanName: string;
  category: DatasetCategory;
  coords: [number, number][];
  elevations: number[];
  foundEleInFile: boolean;
  totalDistKm: number;
}): string {
  let enrichedTrkptsXml = '';

  if (!foundEleInFile) {
    const baseElevation = estimateRegionalBaseElevation(coords[0]);
    const targetGain =
      category.activity === 'bike'
        ? Math.round(totalDistKm * 15 + 40)
        : Math.round(totalDistKm * 28 + 60);

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

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VisitLuxembourg &amp; Lux Outdoor"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${cleanName}</name>
    <desc>${category.sourceLabel} - Parcours officiel de ${totalDistKm.toFixed(1)} km.</desc>
    <link href="${category.sourceUrl}">
      <text>${category.sourceLabel}</text>
    </link>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${cleanName}</name>
    <type>${category.activity === 'bike' ? 'Cycling' : 'Hiking'}</type>
    <trkseg>
${enrichedTrkptsXml}
    </trkseg>
  </trk>
</gpx>
`;
}
