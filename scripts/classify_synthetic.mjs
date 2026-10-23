import fs from 'fs';
import path from 'path';

const allFiles = [];
for (const sub of ['bike', 'hike']) {
  const p = path.join('public', 'gpx', sub);
  for (const f of fs.readdirSync(p)) {
    if (!f.endsWith('.gpx')) continue;
    const txt = fs.readFileSync(path.join(p, f), 'utf8');
    const isSynth = txt.includes('CycloRando GPX Engine');
    const nameMatch = txt.match(/<name>([\s\S]*?)<\/name>/);
    allFiles.push({
      sub,
      file: f,
      isSynth,
      name: nameMatch ? nameMatch[1].trim() : f,
      points: (txt.match(/<trkpt/g) || []).length
    });
  }
}

const synthFiles = allFiles.filter(f => f.isSynth);
const realFiles = allFiles.filter(f => !f.isSynth);

console.log(`Total files in public/gpx: ${allFiles.length}`);
console.log(`Real files: ${realFiles.length}`);
console.log(`Synthetic (CycloRando) files: ${synthFiles.length}\n`);

// Group by prefix
const byPrefix = {};
for (const sf of synthFiles) {
  const prefix = sf.file.split('-')[0];
  byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
}
console.log('Synthetic files by country/prefix:');
console.table(byPrefix);

// Check which synthetic files have an exact real equivalent in public/gpx
const duplicates = [];
const uniqueMocks = [];

for (const sf of synthFiles) {
  // Check if there is a real file with matching name or purpose
  const base = sf.file
    .replace(/\.gpx$/, '')
    .replace(/^(lu-ap-|lu-pc|lu-pc-|lu-vtt-|lu-velosummer-|be-cyclo-|be-ravel-|be-rando-|de-rando-|de-|fr-cyclo-|fr-voie-|fr-rando-|nl-cyclo-|nl-rando-)/, '');

  const matchingReal = realFiles.filter(rf => {
    const rfBase = rf.file.toLowerCase().replace(/\.gpx$/, '');
    return rfBase.includes(base.toLowerCase()) || (base.length > 4 && rf.name.toLowerCase().includes(base.toLowerCase()));
  });

  if (matchingReal.length > 0) {
    duplicates.push({
      synthFile: `${sf.sub}/${sf.file}`,
      synthName: sf.name,
      realFile: `${matchingReal[0].sub}/${matchingReal[0].file}`,
      realPoints: matchingReal[0].points
    });
  } else {
    uniqueMocks.push({
      synthFile: `${sf.sub}/${sf.file}`,
      synthName: sf.name,
      points: sf.points
    });
  }
}

console.log(`\n1. Synthetic files with an authentic counterpart already in public/gpx: ${duplicates.length}`);
console.log(`2. Synthetic files with NO authentic counterpart (pure fake loops): ${uniqueMocks.length}`);
