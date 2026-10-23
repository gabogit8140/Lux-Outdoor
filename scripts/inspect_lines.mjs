import fs from 'fs';

const content = fs.readFileSync('public/gpx/bike/lu-pc-pc1-piste-cyclable-du-centre-luxembourg-hesperange-kockelscheuer.gpx', 'utf8');
const lines = content.split('\n');
const trkptLines = lines.filter(l => l.includes('<trkpt'));
for (let i = 55; i <= 75; i++) {
  console.log(`${i}: ${trkptLines[i]}`);
}
