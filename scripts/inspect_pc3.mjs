import fs from 'fs';

const content = fs.readFileSync('public/gpx/bike/lu-pc-pc3-piste-cyclable-des-trois-cantons-schengen-mondorf-petange.gpx', 'utf8');
console.log('File preview:\n', content.slice(0, 500));

const trkpts = [...content.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)].map(m => [Number(m[2]), Number(m[1])]);
console.log('Total trkpts in GPX:', trkpts.length);

for (let i = 1; i < trkpts.length; i++) {
  const dx = (trkpts[i][0] - trkpts[i - 1][0]) * 71;
  const dy = (trkpts[i][1] - trkpts[i - 1][1]) * 111;
  const d = Math.hypot(dx, dy);
  if (d > 2) {
    console.log(`Jump in GPX between ${i - 1} and ${i}: ${d.toFixed(1)} km`, trkpts[i - 1], '->', trkpts[i]);
  }
}

// Also check <trkseg> tags!
const segCount = (content.match(/<trkseg>/g) || []).length;
console.log('Number of <trkseg>:', segCount);
