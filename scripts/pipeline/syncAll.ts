/**
 * syncAll.ts
 * Unified multi-category pipeline orchestrator for Geoportail & VisitLuxembourg data.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { calculatePathDistance } from '../../src/lib/geoUtils';
import { indexAllGpxFiles } from '../index-gpx';
import { DATASET_CATEGORIES, cleanTrackTitle } from './categories';
import { slugify, parseGpxData, buildEnrichedGpxXml } from './gpxTransformer';
import type { PipelineSyncOptions } from './types';

export function syncPipeline(options: PipelineSyncOptions = {}) {
  const downloadDir = path.resolve(process.cwd(), 'data/downloads');
  const targetBikeDir = path.resolve(process.cwd(), 'public/gpx/bike');
  const targetHikeDir = path.resolve(process.cwd(), 'public/gpx/hike');

  fs.mkdirSync(downloadDir, { recursive: true });
  fs.mkdirSync(targetBikeDir, { recursive: true });
  fs.mkdirSync(targetHikeDir, { recursive: true });

  const selectedCategories = options.categories
    ? DATASET_CATEGORIES.filter((c) => options.categories?.includes(c.id) || options.categories?.includes(c.dir))
    : DATASET_CATEGORIES;

  console.log(`[Pipeline] Starting sync for ${selectedCategories.length} category(ies)...`);
  let totalImported = 0;
  const usedSlugs = new Set<string>();

  for (const cat of selectedCategories) {
    const catDir = path.join(downloadDir, cat.dir);

    // Download if missing or force redownload requested
    if ((!fs.existsSync(catDir) || options.forceRedownload) && cat.categoryId) {
      console.log(`[Pipeline] Downloading ${cat.dir} (Geoportail category ${cat.categoryId})...`);
      const zipPath = path.join(downloadDir, `${cat.dir}.zip`);
      try {
        execSync(
          `curl.exe -s -L --max-time 60 -o "${zipPath}" "https://data.geoportail.lu/mymaps?category=${cat.categoryId}&format=gpx"`
        );
        fs.mkdirSync(catDir, { recursive: true });
        execSync(`tar -xf "${zipPath}" -C "${catDir}" || unzip -q -o "${zipPath}" -d "${catDir}"`);
      } catch (e: any) {
        console.warn(`[Pipeline] Warning: Could not download ${cat.dir}: ${e.message}`);
        if (!fs.existsSync(catDir)) continue;
      }
    }

    if (!fs.existsSync(catDir)) {
      continue;
    }

    const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.gpx'));
    console.log(`[Pipeline] Processing ${files.length} GPX files for ${cat.dir}...`);

    let catImported = 0;
    for (const filename of files) {
      const filePath = path.join(catDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');

      const fallbackTitle = path.basename(filename, '.gpx');
      const { coords, elevations, foundEleInFile, rawTitle } = parseGpxData(content, fallbackTitle);

      if (coords.length < 4) {
        continue; // skip trivial/corrupt traces
      }

      const totalDistMeters = calculatePathDistance(coords);
      const totalDistKm = totalDistMeters / 1000;

      const cleanName = cleanTrackTitle(rawTitle, cat, filename);

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

      const newXml = buildEnrichedGpxXml({
        cleanName,
        category: cat,
        coords,
        elevations,
        foundEleInFile,
        totalDistKm,
      });

      fs.writeFileSync(outPath, newXml, 'utf-8');
      totalImported++;
      catImported++;
    }

    console.log(`[Pipeline] Finished ${cat.dir}: processed ${catImported} tracks.`);
  }

  console.log(`\n======================================================`);
  console.log(`[Pipeline] Ingested & standardized ${totalImported} GPX trails!`);

  if (!options.skipIndexing) {
    console.log(`[Pipeline] Running full catalog re-indexer...`);
    indexAllGpxFiles();
    console.log(`[Pipeline] Full catalog update complete!`);
  }
  console.log(`======================================================\n`);
}

// CLI entry point
if (process.argv[1]?.endsWith('syncAll.ts')) {
  const args = process.argv.slice(2);
  const categoryIndex = args.indexOf('--category');
  const categoryArg = categoryIndex !== -1 ? args[categoryIndex + 1] : undefined;
  const force = args.includes('--force');
  const noIndex = args.includes('--no-index');

  syncPipeline({
    categories: categoryArg ? [categoryArg] : undefined,
    forceRedownload: force,
    skipIndexing: noIndex,
  });
}
