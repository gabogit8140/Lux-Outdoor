const fs = require('fs');

// We use the EXACT same logic as in routeSourceResolver.ts:
function isGenericHomepageUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const isRoot = pathname === '' || pathname === '/fr' || pathname === '/de' || pathname === '/en' || pathname === '/nl';

    const aggregatorHosts = [
      'visitluxembourg.com',
      'visitguttland.lu',
      'visit-eislek.lu',
      'visitminett.lu',
      'visitmoselle.lu',
      'mullerthal.lu',
      'mullerthal-trail.lu',
      'luxembourg-city.com',
      'visitwallonia.be',
      'visitwallonia.fr',
      'walloniebelgiquetourisme.be',
      'coeurdelardenne.be',
      'paysdebastogne.be',
      'visitgaume.be',
      'visitbouillon-ardenne.be',
      'eifel.info',
      'urlaub.saarland',
      'visitmosel.de',
      'visitzuidlimburg.nl',
      'tourisme-lorraine.fr',
      'tourisme-meuse.com',
      'destination-nancy.com',
      'tourisme-metz.com',
      'saar-obermosel.de',
      'ostbelgien.eu',
      'ravel.wallonie.be',
      'cfl.lu',
      'lavoiebleue.com',
      'eifelsteig.de',
    ];

    if (host === 'eifel.info' && /^\/a-[a-z0-9-]+/.test(pathname)) {
      return false;
    }

    if (aggregatorHosts.includes(host) && (isRoot || pathname.split('/').filter(Boolean).length <= 1)) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

console.log('--- 1. Testing Gazetteer URLs ---');
const gazContent = fs.readFileSync('src/lib/routing/gazetteer.ts', 'utf8');
const gazUrls = [...gazContent.matchAll(/"url":\s*"([^"]+)"/g)].map(m => m[1]);
const genericGazUrls = gazUrls.filter(u => isGenericHomepageUrl(u));
console.log('Gazetteer total URLs:', gazUrls.length);
console.log('Gazetteer generic aggregator homepages:', genericGazUrls.length);
if (genericGazUrls.length > 0) {
  console.log('Generic gazetteer URLs found:', genericGazUrls);
} else {
  console.log('✅ Gazetteer: Exactly 0 generic homepages!');
}

console.log('\n--- 2. Testing ROUTE_DEEP_LINKS in routeSourceResolver.ts ---');
const resolverSrc = fs.readFileSync('src/lib/routeSourceResolver.ts', 'utf8');
const match = resolverSrc.match(/export const ROUTE_DEEP_LINKS: Record<string, \{ url: string; label: string \}> = \{([\s\S]*?)\n\};/);
if (match) {
  const lines = match[1].split(/\r?\n/);
  const deepUrls = [];
  for (const line of lines) {
    const m = line.match(/^\s*'([^']+)':\s*\{\s*url:\s*'([^']+)',\s*label:\s*'([^']+)'\s*\}/);
    if (m) deepUrls.push({ id: m[1], url: m[2], label: m[3] });
  }
  const genericDeep = deepUrls.filter(d => isGenericHomepageUrl(d.url));
  console.log('ROUTE_DEEP_LINKS total verified fiches:', deepUrls.length);
  console.log('ROUTE_DEEP_LINKS generic URLs:', genericDeep.length);
  if (genericDeep.length > 0) {
    console.log('Generic deep URLs found:', genericDeep);
  } else {
    console.log('✅ ROUTE_DEEP_LINKS: 100% of links are specific pages!');
  }
}

console.log('\n--- 3. Testing Hérou specific link ---');
const herouInGaz = gazContent.includes('randonnee-incontournable-le-herou-l-echine-d-un-rocher');
const herouInResolver = resolverSrc.includes('randonnee-incontournable-le-herou-l-echine-d-un-rocher');
console.log('Hérou in Gazetteer:', herouInGaz ? '✅ Specific VisitWallonia Guide' : '❌ Missing');
console.log('Hérou in Resolver:', herouInResolver ? '✅ Specific VisitWallonia Guide' : '❌ Missing');
