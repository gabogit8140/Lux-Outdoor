import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

const hikes = CATALOG_ROUTES.filter(r => r.route.activity === 'hike');
console.log('Total hike routes:', hikes.length);

for (const word of ['forêt', 'wald', 'bois', 'sous-bois', 'canopée', 'mullerthal', 'eislek', 'haard', 'aarnescht', 'gréngewald', 'bambësch', 'chêne', 'hêtre']) {
  const reg = new RegExp('\\b' + word + '\\b', 'i');
  const count = hikes.filter(r => reg.test(r.route.title + ' ' + r.route.description)).length;
  console.log(word, '->', count);
}
