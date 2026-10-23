import fs from 'fs';

const content = fs.readFileSync('public/gpx/bike/lu-pc-pc1-piste-cyclable-du-centre-luxembourg-hesperange-kockelscheuer.gpx', 'utf8');

// Check if there are multiple <trk>, <trkseg>, <rte>, or how the XML is structured
const trkCount = (content.match(/<trk>/g) || []).length;
const trksegCount = (content.match(/<trkseg>/g) || []).length;
const rteCount = (content.match(/<rte>/g) || []).length;
console.log({ trkCount, trksegCount, rteCount });

// Look around the first jump
const trkpts = [...content.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)].map(m => [Number(m[2]), Number(m[1])]);
for (let i = 1; i < trkpts.length; i++) {
  const dx = (trkpts[i][0] - trkpts[i - 1][0]) * 71;
  const dy = (trkpts[i][1] - trkpts[i - 1][1]) * 111;
  const d = Math.hypot(dx, dy);
  if (d > 2) {
    console.log(`Jump at index ${i}: distance ${d.toFixed(1)}km. Before:`, trkpts[i-1], 'After:', trkpts[i]);
    // check lines in content around index i
    break;
  }
}
