import fs from 'fs';
import path from 'path';

const files = [];
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.gpx')) {
      const c = fs.readFileSync(p, 'utf8');
      const m = c.match(/creator="([^"]+)"/);
      const pts = (c.match(/<trkpt/g) || []).length;
      files.push({ file: f.name, rel: path.relative('public/gpx', p), pts, creator: m ? m[1] : 'unknown' });
    }
  }
}
walk('public/gpx');

const cyclorando = files.filter(f => f.creator.includes('CycloRando'));
const visitLux = files.filter(f => f.creator.includes('VisitLuxembourg'));

console.log('CycloRando files:', cyclorando.length);
console.log('VisitLuxembourg files:', visitLux.length);

// Check names
for (const cr of cyclorando) {
  const base = cr.file.replace(/^lu-ap-/, '').replace(/^be-cyclo-/, '').replace(/^fr-/, '').replace(/^de-/, '').replace(/\.gpx$/, '');
  const match = visitLux.find(vl => vl.file.includes(base));
  if (match) {
    console.log(`Overlap: ${cr.file} (${cr.pts} pts) <---> ${match.file} (${match.pts} pts)`);
  }
}
