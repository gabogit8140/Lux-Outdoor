import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

console.log('Sample items from CATALOG_ROUTES:');
for (let i = 0; i < 5; i++) {
  const item = CATALOG_ROUTES[i];
  console.log(`[${i}] ${item.route.id}:`);
  console.log({
    title: item.route.title,
    activity: item.route.activity,
    tags: item.tags,
    routeTags: item.route.tags,
    surfaceType: item.route.surfaceType,
    elevationGain: item.route.elevationGain,
    distKm: Number((item.trace.distance / 1000).toFixed(1)),
    roadBreakdown: item.route.roadBreakdown?.carFreePercentage
  });
}
