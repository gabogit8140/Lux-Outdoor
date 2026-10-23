import fs from 'fs';
import path from 'path';
import { indexAllGpxFiles } from './index-gpx.js';

console.log('=== Cleaning up mathematical GPX traces ===\n');

let removedMocks = 0;
let removedDuplicates = 0;

// 1. Remove all 106 synthetic files (creator="CycloRando GPX Engine")
for (const sub of ['bike', 'hike']) {
  const p = path.join('public', 'gpx', sub);
  if (!fs.existsSync(p)) continue;
  for (const f of fs.readdirSync(p)) {
    if (!f.endsWith('.gpx')) continue;
    const fullPath = path.join(p, f);
    const txt = fs.readFileSync(fullPath, 'utf8');
    if (txt.includes('CycloRando GPX Engine')) {
      fs.unlinkSync(fullPath);
      removedMocks++;
    }
  }
}

// 2. Remove 57 duplicate lu-ap-auto-pedestre-*.gpx files (since lu-ap-*.gpx already exists)
const hikeDir = path.join('public', 'gpx', 'hike');
for (const f of fs.readdirSync(hikeDir)) {
  if (f.startsWith('lu-ap-auto-pedestre-') && f.endsWith('.gpx')) {
    const fullPath = path.join(hikeDir, f);
    fs.unlinkSync(fullPath);
    removedDuplicates++;
  }
}

console.log(`Removed ${removedMocks} mathematical/synthetic mock GPX files.`);
console.log(`Removed ${removedDuplicates} duplicate Auto-Pedestre files.`);

// 3. Count remaining files
let remainingBike = 0;
let remainingHike = 0;
for (const f of fs.readdirSync(path.join('public', 'gpx', 'bike'))) {
  if (f.endsWith('.gpx')) remainingBike++;
}
for (const f of fs.readdirSync(path.join('public', 'gpx', 'hike'))) {
  if (f.endsWith('.gpx')) remainingHike++;
}

console.log(`\nRemaining authentic files in public/gpx: ${remainingBike + remainingHike} (${remainingBike} bike, ${remainingHike} hike).`);

// 4. Re-index catalog
console.log('\nRe-indexing catalog now...');
indexAllGpxFiles();
console.log('\n=== Cleanup and re-indexing complete! ===');
