import fs from 'fs';
import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

console.log('Total catalog routes:', CATALOG_ROUTES.length);
for (const item of CATALOG_ROUTES) {
  const coords = item.trace.coordinates;
  const id = item.route.id;
  const title = item.route.title;
  // check max jump between consecutive points in km
  let maxJumpKm = 0;
  for (let i = 1; i < coords.length; i++) {
    const p1 = coords[i - 1];
    const p2 = coords[i];
    // approximate distance
    const dx = (p2[0] - p1[0]) * 71; // km per lon deg approx at lat 50
    const dy = (p2[1] - p1[1]) * 111; // km per lat deg
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > maxJumpKm) maxJumpKm = d;
  }
  if (maxJumpKm > 0.5) {
    console.log(`[ALERT] Route ${id} ("${title}") has a point-to-point jump of ${maxJumpKm.toFixed(2)} km! Points count: ${coords.length}`);
  }
}
