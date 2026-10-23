import { filterAndSearchOffline } from '../src/lib/localRouting';

console.log('=== HIKE FILTERS (distance [5, 18] km) ===');
const baseHike = filterAndSearchOffline({ distanceKm: [5, 18], filters: [], activity: 'hike', country: 'LU' });
console.log('No filters:', baseHike.routes.length);

for (const f of ['water', 'forest', 'paved', 'gravel', 'flat', 'hilly', 'low_traffic']) {
  const res = filterAndSearchOffline({ distanceKm: [5, 18], filters: [f], activity: 'hike', country: 'LU' });
  console.log(` - Filter [${f}]: ${res.routes.length} traces (${baseHike.routes.length - res.routes.length} traces retirées)`);
}

console.log('\n=== BIKE FILTERS (distance [25, 60] km) ===');
const baseBike = filterAndSearchOffline({ distanceKm: [25, 60], filters: [], activity: 'bike', country: 'LU' });
console.log('No filters:', baseBike.routes.length);

for (const f of ['water', 'forest', 'paved', 'gravel', 'flat', 'hilly', 'low_traffic']) {
  const res = filterAndSearchOffline({ distanceKm: [25, 60], filters: [f], activity: 'bike', country: 'LU' });
  console.log(` - Filter [${f}]: ${res.routes.length} traces (${baseBike.routes.length - res.routes.length} traces retirées)`);
}

console.log('\n=== LOCATION FILTERS (HIKE [5, 18] km) ===');
for (const loc of ['Clervaux', 'Echternach', 'Luxembourg', 'Bastogne']) {
  const res = filterAndSearchOffline({ location: loc, distanceKm: [5, 18], filters: [], activity: 'hike' });
  console.log(` - Location [${loc}]: ${res.routes.length} traces trouvées`);
}

console.log('\n=== LOCATION FILTERS (BIKE [25, 60] km) ===');
for (const loc of ['Clervaux', 'Echternach', 'Luxembourg', 'Bastogne']) {
  const res = filterAndSearchOffline({ location: loc, distanceKm: [25, 60], filters: [], activity: 'bike' });
  console.log(` - Location [${loc}]: ${res.routes.length} traces trouvées`);
}

