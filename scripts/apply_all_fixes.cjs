const fs = require('fs');
const path = require('path');

// 1. Clean routeSourceResolver.ts
let resolverCode = fs.readFileSync('src/lib/routeSourceResolver.ts', 'utf8');

// Ensure RouteSourceResolution has sourceUrl?: string
resolverCode = resolverCode.replace(
  /export interface RouteSourceResolution \{\s*sourceUrl: string;/,
  'export interface RouteSourceResolution {\n  sourceUrl?: string;'
);

// Extract isGenericHomepage logic
function isGenericHomepageUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const isRoot = pathname === '' || pathname === '/fr' || pathname === '/de' || pathname === '/en' || pathname === '/nl';
    if (isRoot) return true;
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
    return true;
  }
}

// Filter ROUTE_DEEP_LINKS block
const match = resolverCode.match(/export const ROUTE_DEEP_LINKS: Record<string, \{ url: string; label: string \}> = \{([\s\S]*?)\n\};/);
if (match) {
  const lines = match[1].split(/\r?\n/);
  const keptEntries = [];
  for (const line of lines) {
    const m = line.match(/^\s*'([^']+)':\s*\{\s*url:\s*'([^']+)',\s*label:\s*'([^']+)'\s*\}/);
    if (m) {
      if (!isGenericHomepageUrl(m[2])) {
        keptEntries.push(`  '${m[1]}': { url: '${m[2]}', label: '${m[3]}' },`);
      }
    }
  }
  const newDeepLinksBlock = `export const ROUTE_DEEP_LINKS: Record<string, { url: string; label: string }> = {\n${keptEntries.join('\n')}\n};`;
  resolverCode = resolverCode.replace(match[0], newDeepLinksBlock);
}

// In resolveRouteSource:
// Replace consdorf visitluxembourg with kuelscheier
resolverCode = resolverCode.replace(
  /if \(lowerId\.includes\('consdorf'\)\) \{\s*return \{\s*sourceUrl: 'https:\/\/www\.visitluxembourg\.com\/fr\/explorer-le-luxembourg\/nature-outdoor\/randonnees',/g,
  "if (lowerId.includes('consdorf')) {\n      return {\n        sourceUrl: 'https://www.mullerthal.lu/place/kuelscheier-rock-crevice',"
);

// Save routeSourceResolver.ts
fs.writeFileSync('src/lib/routeSourceResolver.ts', resolverCode, 'utf8');
console.log('Cleaned routeSourceResolver.ts');

// 2. RouteCatalog.ts: assign sourceUrl only if specific
let catalogCode = fs.readFileSync('src/lib/routeCatalog.ts', 'utf8');
if (!catalogCode.includes('resolvedSource.isSpecificPage ? resolvedSource.sourceUrl : undefined')) {
  catalogCode = catalogCode.replace(
    /sourceUrl:\s*params\.sourceUrl \|\|\s*resolveRouteSource\(\{[\s\S]*?\}\)\.sourceUrl,/,
    `sourceUrl: (() => {
      const res = resolveRouteSource({
        id: params.id,
        title: params.title,
        activity: params.activity,
        country: params.country,
        coords: finalCoords,
        customUrl: params.sourceUrl,
        customLabel: params.sourceLabel,
      });
      return res.isSpecificPage ? res.sourceUrl : undefined;
    })(),`
  );
  fs.writeFileSync('src/lib/routeCatalog.ts', catalogCode, 'utf8');
  console.log('Updated routeCatalog.ts');
}

// 3. TraceProfile.tsx
let traceProfile = fs.readFileSync('src/components/TraceProfile.tsx', 'utf8');
if (!traceProfile.includes('isGenericHomepageUrl')) {
  traceProfile = traceProfile.replace(
    "import { resolveRouteSource } from '../lib/routeSourceResolver';",
    "import { resolveRouteSource, isGenericHomepageUrl } from '../lib/routeSourceResolver';"
  );
  if (!traceProfile.includes('isGenericHomepageUrl')) {
    traceProfile = "import { isGenericHomepageUrl } from '../lib/routeSourceResolver';\n" + traceProfile;
  }
}
traceProfile = traceProfile.replace(
  /\{route\.sourceUrl && \(/g,
  '{route.sourceUrl && !isGenericHomepageUrl(route.sourceUrl) && ('
);
fs.writeFileSync('src/components/TraceProfile.tsx', traceProfile, 'utf8');
console.log('Updated TraceProfile.tsx');

// 4. RouteCatalogList.tsx
let catalogList = fs.readFileSync('src/components/sidebar/RouteCatalogList.tsx', 'utf8');
if (!catalogList.includes('isGenericHomepageUrl')) {
  catalogList = "import { isGenericHomepageUrl } from '../../lib/routeSourceResolver';\n" + catalogList;
}
catalogList = catalogList.replace(
  /\{r\.sourceUrl && \(/g,
  '{r.sourceUrl && !isGenericHomepageUrl(r.sourceUrl) && ('
);
fs.writeFileSync('src/components/sidebar/RouteCatalogList.tsx', catalogList, 'utf8');
console.log('Updated RouteCatalogList.tsx');

// 5. RouteDetailView.tsx
let detailView = fs.readFileSync('src/components/sidebar/RouteDetailView.tsx', 'utf8');
if (!detailView.includes('isGenericHomepageUrl')) {
  detailView = "import { isGenericHomepageUrl } from '../../lib/routeSourceResolver';\n" + detailView;
}
detailView = detailView.replace(
  /\{\(route\.sourceUrl \|\| route\.sourceLabel \|\| route\.geoportailUrl\) && \(/g,
  '{((route.sourceUrl && !isGenericHomepageUrl(route.sourceUrl)) || route.geoportailUrl) && ('
);
detailView = detailView.replace(
  /\{route\.sourceUrl && \(/g,
  '{route.sourceUrl && !isGenericHomepageUrl(route.sourceUrl) && ('
);
fs.writeFileSync('src/components/sidebar/RouteDetailView.tsx', detailView, 'utf8');
console.log('Updated RouteDetailView.tsx');

// 6. SelectedPlaceMapLayer.tsx
let mapLayer = fs.readFileSync('src/components/map/SelectedPlaceMapLayer.tsx', 'utf8');
if (!mapLayer.includes('isGenericHomepageUrl')) {
  mapLayer = "import { isGenericHomepageUrl } from '../../lib/routeSourceResolver';\n" + mapLayer;
}
mapLayer = mapLayer.replace(
  /\{selectedPlace\.url \? \(/g,
  '{selectedPlace.url && !isGenericHomepageUrl(selectedPlace.url) ? ('
);
fs.writeFileSync('src/components/map/SelectedPlaceMapLayer.tsx', mapLayer, 'utf8');
console.log('Updated SelectedPlaceMapLayer.tsx');

// 7. CitySearchModal.tsx
let searchModal = fs.readFileSync('src/components/search/CitySearchModal.tsx', 'utf8');
if (!searchModal.includes('isGenericHomepageUrl')) {
  searchModal = "import { isGenericHomepageUrl } from '../../lib/routeSourceResolver';\n" + searchModal;
}
searchModal = searchModal.replace(
  /\{place\.url && \(/g,
  '{place.url && !isGenericHomepageUrl(place.url) && ('
);
fs.writeFileSync('src/components/search/CitySearchModal.tsx', searchModal, 'utf8');
console.log('Updated CitySearchModal.tsx');

console.log('All files updated successfully!');
