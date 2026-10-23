import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

const hikes = CATALOG_ROUTES.filter(r => r.route.activity === 'hike');
console.log('Total hikes:', hikes.length);

// Old margin: 0.7 to 1.35 on [5, 10]
const oldMargin = hikes.filter(r => {
  const d = r.trace.distance / 1000;
  return d >= 5 * 0.7 && d <= 10 * 1.35; // 3.5 to 13.5
});
console.log('Distance [5, 10] with old wide margin (3.5 - 13.5km):', oldMargin.length);

// New tight margin: 0.9 to 1.1 on [5, 10]
const newMargin = hikes.filter(r => {
  const d = r.trace.distance / 1000;
  return d >= 5 * 0.9 && d <= 10 * 1.1; // 4.5 to 11.0km
});
console.log('Distance [5, 10] with tight margin (4.5 - 11.0km):', newMargin.length);
