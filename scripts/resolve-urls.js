import fs from 'fs';
import https from 'https';

function fetchSearch(category, q) {
  return new Promise((resolve) => {
    const url = `https://www.visitluxembourg.com/fr/explorer-le-luxembourg/nature-outdoor/${category}?query=${encodeURIComponent(q)}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        const matches = [...data.matchAll(/href="(https:\/\/www\.visitluxembourg\.com\/fr\/tour\/[^"]+)"/g)].map(m => m[1]);
        const unique = Array.from(new Set(matches));
        resolve(unique);
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  console.log('Resolving bike & hike links...');

  // 1. PC Routes
  const pcMap = {};
  for (let n = 1; n <= 23; n++) {
    const urls = await fetchSearch('velo', `PC${n}`);
    const found = urls.find(u => u.includes(`pc-${n}`) || u.includes(`pc${n}`));
    if (found) {
      console.log(`PC${n} => ${found}`);
      pcMap[`pc${n}`] = found;
    }
  }

  // 2. VTT Routes
  const vttFiles = fs.readdirSync('public/gpx/bike').filter(f => f.startsWith('lu-vtt-'));
  const vttMap = {};
  for (const f of vttFiles) {
    const raw = f.replace('lu-vtt-', '').replace('.gpx', '');
    const clean = raw.replace(/^circuit-vtt-\d+-?/, '').replace(/^circuit-vtt-/, '');
    const urls = await fetchSearch('velo', clean);
    const found = urls.find(u => u.includes(clean) || u.includes('mountainbike') || u.includes('vtt'));
    if (found) {
      console.log(`VTT ${raw} => ${found}`);
      vttMap[f] = found;
    }
  }

  // 3. Road Racing / Course
  const courseFiles = fs.readdirSync('public/gpx/bike').filter(f => f.startsWith('lu-course-'));
  const courseMap = {};
  for (const f of courseFiles) {
    const clean = f.replace('lu-course-', '').replace('.gpx', '').replace(/-/g, ' ');
    const urls = await fetchSearch('velo', clean);
    const found = urls[0];
    if (found) {
      console.log(`Course ${f} => ${found}`);
      courseMap[f] = found;
    }
  }

  fs.writeFileSync('scripts/catalog-url-map.json', JSON.stringify({
    pcMap,
    vttMap,
    courseMap,
  }, null, 2));

  console.log('Done mapping.');
}

run();
