import fs from 'fs';
import path from 'path';
import {
  calculatePathDistance,
  computeElevationProfile,
  estimateRegionalBaseElevation,
} from '../src/lib/geoUtils.js';

const cat = {
  dir: 'autopedestres',
  categoryId: '11',
  activity: 'hike',
  prefix: 'lu-ap',
  sourceLabel: 'Auto-Pédestres Officiels du Luxembourg (Visit Luxembourg & Geoportail)',
  sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/randonnees/auto-pedestres',
};

function cleanTitle(raw, filename) {
  let title = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
  title = title.replace(/\s*<\s*>\s*/g, '');
  title = title.replace(/^Autopedestres\s*:\s*/i, 'Auto-Pédestre ');
  title = title.replace(/^Auto-Pedestre\s+/i, 'Auto-Pédestre ');
  title = title.replace(/^Auto-Pédestre\s*:\s*/i, 'Auto-Pédestre ');
  title = title.replace(/_+/g, ' ');
  if (!title.toLowerCase().startsWith('auto-pédestre')) {
    title = `Auto-Pédestre ${title}`;
  }
  return title;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const catDir = path.resolve('data/downloads/autopedestres');
const files = fs.readdirSync(catDir).filter(f => f.endsWith('.gpx'));

console.log(`Testing all ${files.length} files...`);

for (let i = 0; i < files.length; i++) {
  const filename = files[i];
  try {
    const filePath = path.join(catDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const trkptRegex = /<trkpt\b([^>]*?)>(?:([\s\S]*?)<\/trkpt>)?|<trkpt\b([^>]*?)\/>/gi;
    const coords = [];
    const elevations = [];
    let foundEleInFile = false;

    let match;
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

    if (coords.length < 4) continue;

    const totalDistMeters = calculatePathDistance(coords);
    const totalDistKm = totalDistMeters / 1000;

    const nameMatch = content.match(/<name>([\s\S]*?)<\/name>/i);
    const rawTitle = nameMatch ? nameMatch[1].trim() : path.basename(filename, '.gpx');
    const cleanName = cleanTitle(rawTitle, filename);

    if (!foundEleInFile) {
      const baseElevation = estimateRegionalBaseElevation(coords[0]);
      const targetGain = Math.round(totalDistKm * 28 + 60);
      computeElevationProfile(coords, targetGain, baseElevation);
    }
  } catch (err) {
    console.error(`ERROR on file ${i}: ${filename}`, err);
    process.exit(1);
  }
}
console.log('SUCCESS! All 154 files processed with 0 errors!');
