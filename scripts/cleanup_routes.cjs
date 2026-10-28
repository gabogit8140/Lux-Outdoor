const fs = require('fs');

const filePath = 'src/lib/routeSourceResolver.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find marker
const marker1 = "'lu-ap-consdorf-mullerthal': { url: 'https://www.mullerthal.lu/place/kuelscheier-rock-crevice', label: 'Circuit Consdorf - Kuelscheier' },";
const marker2 = "export function resolveRouteSource";

const idx1 = content.indexOf(marker1);
const idx2 = content.indexOf(marker2);

if (idx1 === -1 || idx2 === -1) {
  console.error('Markers not found! idx1:', idx1, 'idx2:', idx2);
  process.exit(1);
}

// Keep up to marker1, append gouvy and closing `};\n\n`, then resume at marker2
const before = content.slice(0, idx1 + marker1.length);
const after = content.slice(idx2);

const replacement = `\n  'be-bike-gouvy-vielsalm-glain': { url: 'https://www.haute-ardenne.be/fr/a-voir-a-faire/itineraires', label: 'Boucle Vélo Haute-Ardenne Gouvy - Vielsalm' }\n};\n\n`;

const newContent = before + replacement + after;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully cleaned up routeSourceResolver.ts');
