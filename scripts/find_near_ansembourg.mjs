import fs from 'fs';
import path from 'path';

const target = [6.04, 49.70];

function dist(p1, p2) {
  const dx = (p1[0] - p2[0]) * 71;
  const dy = (p1[1] - p2[1]) * 111;
  return Math.sqrt(dx*dx + dy*dy);
}

const near = [];
for (const sub of ['bike', 'hike']) {
  const p = path.join('public', 'gpx', sub);
  for (const f of fs.readdirSync(p)) {
    if (!f.endsWith('.gpx')) continue;
    const txt = fs.readFileSync(path.join(p, f), 'utf8');
    if (txt.includes('CycloRando')) continue; // only real
    const trkptRegex = /<trkpt\b[^>]*?lat=["']([^"']+)["'][^>]*?lon=["']([^"']+)["']/gi;
    let m;
    let minDist = Infinity;
    while ((m = trkptRegex.exec(txt)) !== null) {
      const lat = parseFloat(m[1]);
      const lon = parseFloat(m[2]);
      const d = dist([lon, lat], target);
      if (d < minDist) minDist = d;
    }
    if (minDist < 3.0) { // within 3km
      const name = (txt.match(/<name>([\s\S]*?)<\/name>/) || [])[1] || f;
      near.push({ sub, file: f, name: name.trim(), distKm: minDist.toFixed(2) });
    }
  }
}

console.log('Real trails passing within 1km of Ansembourg:', near);
