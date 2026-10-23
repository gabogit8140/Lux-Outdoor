import fs from 'fs';

const content = fs.readFileSync('src/lib/routeCatalog.ts', 'utf8');
const idMatches = [...content.matchAll(/id:\s*'([a-zA-Z0-9_-]+)'/g)].map(m => m[1]);

const curatedContent = fs.readFileSync('src/lib/curatedTracksData.ts', 'utf8');
const curatedIds = [...curatedContent.matchAll(/"([a-zA-Z0-9_-]+)":\s*\{/g)].map(m => m[1]);

console.log('Total static route IDs:', idMatches.length);
console.log('Total curated track IDs:', curatedIds.length);

const missing = idMatches.filter(id => !curatedIds.includes(id));
console.log('Static routes MISSING from CURATED_TRACKS (using anchors!):', missing);
