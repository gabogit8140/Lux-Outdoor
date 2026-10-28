const fs = require('fs');
const content = fs.readFileSync('src/lib/routing/gazetteer.ts', 'utf8');

function isGenericHomepage(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const isRoot = pathname === '' || pathname === '/fr' || pathname === '/de' || pathname === '/en' || pathname === '/nl';
    const aggregatorHosts = [
      'visitluxembourg.com', 'visitwallonia.be', 'coeurdelardenne.be', 'visitgaume.be',
      'visitarlon.be', 'ostbelgien.eu', 'visitzuidlimburg.nl', 'eifel.info', 'visitmosel.de',
      'urlaub.saarland', 'tourisme-lorraine.fr', 'tourisme-meuse.com', 'tourisme-metz.com',
      'thionvilletourisme.fr', 'destination-nancy.com', 'longwy-tourisme.com',
      'foretdesainthubert-tourisme.be', 'visitspa-hautesfagnes.be', 'paysdebastogne.be',
      'ravel.wallonie.be', 'durbuytourisme.be', 'haute-ardenne.be', 'gesundland-vulkaneifel.de',
      'naturwanderpark.eu', 'lavoiebleue.com', 'eifelsteig.de'
    ];
    if (aggregatorHosts.includes(host) && (isRoot || pathname.split('/').filter(Boolean).length <= 1)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const urls = [...content.matchAll(/"url":\s*"([^"]+)"/g)].map(m => m[1]);
const genericUrls = urls.filter(isGenericHomepage);
console.log('Total URLs in gazetteer:', urls.length);
console.log('Generic portal homepages in gazetteer:', genericUrls.length);
if (genericUrls.length > 0) {
  console.log('Found generic URLs:', genericUrls);
} else {
  console.log('SUCCESS: Exactly 0 generic aggregator homepages in gazetteer!');
}
