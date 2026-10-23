import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  calculatePathDistance,
  computeElevationProfile,
  estimateRegionalBaseElevation,
} from '../src/lib/geoUtils';
import { indexAllGpxFiles } from './index-gpx';

interface DatasetCategory {
  dir: string;
  categoryId?: string;
  activity: 'bike' | 'hike';
  prefix: string;
  sourceLabel: string;
  sourceUrl: string;
}

const CATEGORIES: DatasetCategory[] = [
  {
    dir: 'autopedestres',
    categoryId: '11',
    activity: 'hike',
    prefix: 'lu-ap',
    sourceLabel: 'Auto-Pédestres Officiels du Luxembourg (Visit Luxembourg & Geoportail)',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/randonnees/auto-pedestres',
  },
  {
    dir: 'pistes_cyclables_nationales',
    categoryId: '105',
    activity: 'bike',
    prefix: 'lu-pc',
    sourceLabel: 'Réseau National des Pistes Cyclables (PC) du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo/pistes-cyclables',
  },
  {
    dir: 'pistes_vtt',
    categoryId: '8',
    activity: 'bike',
    prefix: 'lu-vtt',
    sourceLabel: 'Circuits VTT & Mountainbike Officiels du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo/vtt',
  },
  {
    dir: 'velo_rando',
    categoryId: '117',
    activity: 'bike',
    prefix: 'lu-velo',
    sourceLabel: 'Randonnées et Boucles Cyclables Touristiques Visit Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo',
  },
  {
    dir: 'velo_course',
    categoryId: '107',
    activity: 'bike',
    prefix: 'lu-course',
    sourceLabel: 'Circuits Vélo de Course sur Route du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/a-velo',
  },
  {
    dir: 'mullerthal',
    categoryId: '12',
    activity: 'hike',
    prefix: 'lu-mullerthal',
    sourceLabel: 'Mullerthal Trail & Sentiers Régionaux de la Petite Suisse',
    sourceUrl: 'https://www.mullerthal-trail.lu',
  },
  {
    dir: 'eislek_pied',
    categoryId: '152',
    activity: 'hike',
    prefix: 'lu-eislek',
    sourceLabel: 'Éislek Pied - Circuits Pédestres de l’Ardenne Luxembourgeoise',
    sourceUrl: 'https://www.visit-eislek.lu',
  },
  {
    dir: 'guttland_trails',
    categoryId: '121',
    activity: 'hike',
    prefix: 'lu-guttland',
    sourceLabel: 'Guttland.Trails - Sentiers Randonnée du Centre & Vallée des Sept Châteaux',
    sourceUrl: 'https://www.visitguttland.lu',
  },
  {
    dir: 'escapardenne',
    categoryId: '13',
    activity: 'hike',
    prefix: 'lu-escapardenne',
    sourceLabel: 'Escapardenne Eislek Trail & Lee Trail (Leading Quality Trails)',
    sourceUrl: 'https://www.escapardenne.eu',
  },
  {
    dir: 'sentiers_nationaux',
    categoryId: '9',
    activity: 'hike',
    prefix: 'lu-national',
    sourceLabel: 'Sentiers Pédestres Nationaux & GR du Luxembourg',
    sourceUrl: 'https://www.visitluxembourg.com/fr/que-faire/nature-excursions/randonnees',
  },
  {
    dir: 'cfl',
    categoryId: '10',
    activity: 'hike',
    prefix: 'lu-cfl',
    sourceLabel: 'Sentiers Pédestres CFL (Randonnées de Gare en Gare)',
    sourceUrl: 'https://www.cfl.lu/fr-fr/leisure/detail/randonnees-en-train',
  },
  {
    dir: 'sentiers_confort',
    categoryId: '191',
    activity: 'hike',
    prefix: 'lu-confort',
    sourceLabel: 'Sentiers Pédestres Confort & Accessibilité Facile',
    sourceUrl: 'https://www.visitluxembourg.com',
  },
  {
    dir: 'sentier_adrien_ries',
    categoryId: '25',
    activity: 'hike',
    prefix: 'lu-adrien-ries',
    sourceLabel: 'Sentier Culturel et Naturel Adrien Ries',
    sourceUrl: 'https://www.nordstad.lu',
  },
  {
    dir: 'circuit_du_lac',
    categoryId: '700',
    activity: 'hike',
    prefix: 'lu-lac',
    sourceLabel: 'Circuit du Lac de la Haute-Sûre',
    sourceUrl: 'https://www.naturpark-sure.lu',
  },
  {
    dir: 'traumschleifen',
    categoryId: '22',
    activity: 'hike',
    prefix: 'lu-traum',
    sourceLabel: 'Traumschleifen - Boucles de Rêve Sarre-Hunsrück / Luxembourg',
    sourceUrl: 'https://www.saar-hunsrueck-steig.de',
  },
  {
    dir: 'sentiers_locaux',
    categoryId: '19',
    activity: 'hike',
    prefix: 'lu-local',
    sourceLabel: 'Sentiers Pédestres Locaux & Circuits Communaux du Luxembourg',
    sourceUrl: 'https://map.geoportail.lu/theme/tourisme',
  },
];

const PC_NAMES: Record<string, string> = {
  pc0: 'PC0 Liaison Urbaine Luxembourg',
  pc1: 'PC1 Piste cyclable du Centre (Luxembourg - Hesperange - Kockelscheuer)',
  pc2: 'PC2 Piste cyclable d’Echternach (Luxembourg - Junglinster - Echternach)',
  pc3: 'PC3 Piste cyclable des Trois Cantons (Schengen - Mondorf - Pétange)',
  pc4: 'PC4 Piste cyclable de la Syre (Ernster - Mertert - Wasserbillig)',
  pc5: 'PC5 Piste cyclable de l’Alzette (Luxembourg - Mersch - Ettelbruck)',
  pc6: 'PC6 Piste cyclable des Trois Vallées (Schengen - Remich - Wasserbillig)',
  pc7: 'PC7 Piste cyclable Jangeli (Remich - Mondorf-les-Bains)',
  pc8: 'PC8 Piste cyclable de la Terre Rouge (Bettembourg - Esch - Sanem)',
  pc9: 'PC9 Piste cyclable du Faubourg Minier (Sanem - Differdange - Pétange)',
  pc10: 'PC10 Piste cyclable François Faber (Leudelange - Schifflange)',
  pc11: 'PC11 Piste cyclable Charly Gaul (Fentange - Huncherange)',
  pc12: 'PC12 Piste cyclable de l’Attert (Pétange - Steinfort - Colmar-Berg)',
  pc13: 'PC13 Piste cyclable Nicolas Frantz (Strassen - Mamer - Kahler)',
  pc14: 'PC14 Piste cyclable de l’Eisch (Mamer - Koerich - Steinfort)',
  pc15: 'PC15 Piste cyclable de l’Our (Vianden - Stolzembourg - Dasburg)',
  pc16: 'PC16 Piste cyclable de la Moyenne Sûre (Reisdorf - Diekirch - Ettelbruck)',
  pc17: 'PC17 Piste cyclable de l’Ouest (Noerdange - Arsdorf - Martelange)',
  pc18: 'PC18 Piste cyclable des Ardoisières (Koetschette - Martelange)',
  pc19: 'PC19 Piste cyclable du Lac de la Haute-Sûre (Lultzhausen - Bavigne)',
  pc20: 'PC20 Piste cyclable de la Wiltz (Wiltz - Kautenbach - Bastogne)',
  pc21: 'PC21 Piste cyclable du Nord (Kautenbach - Clervaux - Troisvierges)',
  pc22: 'PC22 Piste cyclable de l’Ardenne (Troisvierges - Huldange - Gouvy)',
  pc23: 'PC23 Piste cyclable de Beckerich (Beckerich - Hovelange)',
};

function cleanTitle(raw: string, category: DatasetCategory, filename: string): string {
  let title = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Strip generic clutter
  title = title.replace(/\s*<\s*>\s*/g, '');
  title = title.replace(/^Autopedestres\s*:\s*/i, 'Auto-Pédestre ');
  title = title.replace(/^Auto-Pedestre\s+/i, 'Auto-Pédestre ');
  title = title.replace(/^Auto-Pédestre\s*:\s*/i, 'Auto-Pédestre ');
  title = title.replace(/^Pistes_VTT\s*:\s*/i, 'Circuit VTT ');
  title = title.replace(/\s*VTTMTB/gi, '');
  title = title.replace(/\s*VTT\/MTB/gi, '');
  title = title.replace(/^Velo_rando\s*:\s*/i, 'Boucle Cyclable ');
  title = title.replace(/\s*_NEW\b/gi, '');
  title = title.replace(/_+/g, ' ');

  if (category.dir === 'pistes_cyclables_nationales') {
    const base = path.basename(filename, '.gpx').toLowerCase();
    const pcKey = base.split('_')[0];
    if (PC_NAMES[pcKey]) {
      return PC_NAMES[pcKey] + (base.includes('_') ? ` (Tronçon ${base.split('_')[1]})` : '');
    }
    return `Piste Cyclable Nationale ${title}`;
  }

  if (category.dir === 'autopedestres') {
    if (!title.toLowerCase().startsWith('auto-pédestre')) {
      title = `Auto-Pédestre ${title}`;
    }
  }

  if (category.dir === 'pistes_vtt') {
    if (!title.toLowerCase().includes('vtt') && !title.toLowerCase().includes('mtb')) {
      title = `Circuit VTT ${title}`;
    }
  }

  if (category.dir === 'cfl') {
    if (!title.toLowerCase().startsWith('sentier cfl') && !title.toLowerCase().startsWith('cfl')) {
      title = `Sentier CFL ${title}`;
    }
  }

  if (category.dir === 'eislek_pied') {
    if (!title.toLowerCase().startsWith('éislek pied') && !title.toLowerCase().startsWith('eislek pied')) {
      title = `Éislek Pied ${title}`;
    }
  }

  if (category.dir === 'guttland_trails') {
    if (!title.toLowerCase().startsWith('guttland')) {
      title = `Guttland.Trail ${title}`;
    }
  }

  if (category.dir === 'sentiers_locaux') {
    if (!title.toLowerCase().startsWith('circuit local') && !title.toLowerCase().startsWith('sentier local')) {
      title = `Circuit Local ${title}`;
    }
  }

  return title;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function syncVisitLuxembourgGpx() {
  const downloadDir = path.resolve(process.cwd(), 'data/downloads');
  const targetBikeDir = path.resolve(process.cwd(), 'public/gpx/bike');
  const targetHikeDir = path.resolve(process.cwd(), 'public/gpx/hike');

  fs.mkdirSync(downloadDir, { recursive: true });
  fs.mkdirSync(targetBikeDir, { recursive: true });
  fs.mkdirSync(targetHikeDir, { recursive: true });

  console.log('[VisitLuxembourg Sync] Starting sync of official trails...');
  let totalImported = 0;
  const usedSlugs = new Set<string>();

  for (const cat of CATEGORIES) {
    const catDir = path.join(downloadDir, cat.dir);
    if (!fs.existsSync(catDir) && cat.categoryId) {
      console.log(`[VisitLuxembourg Sync] Downloading ${cat.dir} (cat ${cat.categoryId})...`);
      const zipPath = path.join(downloadDir, `${cat.dir}.zip`);
      try {
        execSync(
          `curl -s -L --max-time 35 -o "${zipPath}" "https://data.geoportail.lu/mymaps?category=${cat.categoryId}&format=gpx"`
        );
        execSync(`mkdir -p "${catDir}" && unzip -q -o "${zipPath}" -d "${catDir}"`);
      } catch (e: any) {
        console.warn(`[VisitLuxembourg Sync] Could not download ${cat.dir}: ${e.message}`);
        continue;
      }
    }

    if (!fs.existsSync(catDir)) {
      continue;
    }

    const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.gpx'));
    console.log(`[VisitLuxembourg Sync] Processing ${files.length} GPX files for ${cat.dir}...`);

    let catImported = 0;
    for (const filename of files) {
      const filePath = path.join(catDir, filename);
      let content = fs.readFileSync(filePath, 'utf-8');

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
        continue; // skip trivial traces
      }

      const totalDistMeters = calculatePathDistance(coords);
      const totalDistKm = totalDistMeters / 1000;

      // Extract title
      const nameMatch = content.match(/<name>([\s\S]*?)<\/name>/i);
      const rawTitle = nameMatch ? nameMatch[1].trim() : path.basename(filename, '.gpx');
      const cleanName = cleanTitle(rawTitle, cat, filename);

      // Check elevation
      let enrichedTrkptsXml = '';

      if (!foundEleInFile) {
        const baseElevation = estimateRegionalBaseElevation(coords[0]);
        const targetGain =
          cat.activity === 'bike'
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

      // Generate unique slug
      let baseSlug = slugify(cleanName) || slugify(path.basename(filename, '.gpx'));
      if (cat.dir === 'autopedestres') {
        baseSlug = baseSlug.replace(/^auto-pedestre-/, '');
      }
      let gpxSlug = `${cat.prefix}-${baseSlug}`;
      let counter = 2;
      while (usedSlugs.has(gpxSlug)) {
        gpxSlug = `${cat.prefix}-${baseSlug}-${counter++}`;
      }
      usedSlugs.add(gpxSlug);

      const outDir = cat.activity === 'bike' ? targetBikeDir : targetHikeDir;
      const outPath = path.join(outDir, `${gpxSlug}.gpx`);

      const newXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VisitLuxembourg &amp; Grande-Region Outdoor"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${cleanName}</name>
    <desc>${cat.sourceLabel} - Parcours officiel de ${totalDistKm.toFixed(1)} km.</desc>
    <link href="${cat.sourceUrl}">
      <text>${cat.sourceLabel}</text>
    </link>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${cleanName}</name>
    <type>${cat.activity === 'bike' ? 'Cycling' : 'Hiking'}</type>
    <trkseg>
${enrichedTrkptsXml}
    </trkseg>
  </trk>
</gpx>
`;

      fs.writeFileSync(outPath, newXml, 'utf-8');
      totalImported++;
      catImported++;
    }
    console.log(`[VisitLuxembourg Sync] Finished ${cat.dir}: synced ${catImported} tracks.`);
  }

  console.log(`\n======================================================`);
  console.log(`[VisitLuxembourg Sync] Successfully synced ${totalImported} official GPX trails!`);
  console.log(`[VisitLuxembourg Sync] Re-indexing full GPX catalog now...`);
  console.log(`======================================================\n`);
  indexAllGpxFiles();
  console.log('[VisitLuxembourg Sync] Catalog successfully updated and synchronized!');
}

if (process.argv[1]?.endsWith('sync-visitluxembourg.ts')) {
  syncVisitLuxembourgGpx();
}
