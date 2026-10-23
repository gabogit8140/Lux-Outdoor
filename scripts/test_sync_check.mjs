import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('data/downloads/autopedestres').filter(f => f.endsWith('.gpx'));
console.log(`Checking ${files.length} autopedestres files...`);

let ok = 0;
for (const f of files) {
  const content = fs.readFileSync(path.join('data/downloads/autopedestres', f), 'utf-8');
  const trkptRegex = /<trkpt\b([^>]*?)>(?:([\s\S]*?)<\/trkpt>)?|<trkpt\b([^>]*?)\/>/gi;
  const coords = [];
  let match;
  while ((match = trkptRegex.exec(content)) !== null) {
    const attrs = match[1] || match[3] || '';
    const latMatch = attrs.match(/lat=["']([^"']+)["']/i);
    const lonMatch = attrs.match(/lon=["']([^"']+)["']/i);
    if (latMatch && lonMatch) {
      coords.push([parseFloat(lonMatch[1]), parseFloat(latMatch[1])]);
    }
  }
  if (coords.length >= 4) {
    ok++;
  } else {
    console.log(`File ${f} has only ${coords.length} points.`);
  }
}
console.log(`Result: ${ok} / ${files.length} valid files with >= 4 points.`);
