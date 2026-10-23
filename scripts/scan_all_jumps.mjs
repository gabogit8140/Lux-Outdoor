import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const trkpts = [...content.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)].map(m => [Number(m[2]), Number(m[1])]);
  if (trkpts.length < 2) return null;
  let jumps = 0;
  let maxJump = 0;
  for (let i = 1; i < trkpts.length; i++) {
    const dx = (trkpts[i][0] - trkpts[i - 1][0]) * 71;
    const dy = (trkpts[i][1] - trkpts[i - 1][1]) * 111;
    const d = Math.hypot(dx, dy);
    if (d > 1.5) {
      jumps++;
      if (d > maxJump) maxJump = d;
    }
  }
  return { file: filePath, pts: trkpts.length, jumps, maxJump };
}

function scan(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) results = results.concat(scan(p));
    else if (f.name.endsWith('.gpx')) {
      const res = checkFile(p);
      if (res && res.jumps > 0) results.push(res);
    }
  }
  return results;
}

const badFiles = scan('public/gpx');
console.log(`Found ${badFiles.length} GPX files with large point jumps (> 1.5km):`);
for (const b of badFiles) {
  console.log(`- ${path.basename(b.file)}: ${b.jumps} jumps, max jump: ${b.maxJump.toFixed(1)} km (total pts: ${b.pts})`);
}
