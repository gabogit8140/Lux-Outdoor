import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

const hikes = CATALOG_ROUTES.filter(r => r.route.activity === 'hike');
const r0 = hikes[0];
const fullText = `${r0.route.title} ${r0.route.description} ${r0.route.surfaceType} ${(r0.route.highlights || []).join(' ')} ${r0.route.id}`;
console.log('Sample fullText for hike:', fullText);

const words = ['forêt', 'foret', 'forêts', 'forets', 'forest', 'wald', 'wälder', 'bois', 'wood', 'woods', 'canopée', 'canopee', 'arbre', 'arbres', 'fiels', 'mullerthal', 'mëllerdall', 'eislek', 'haard', 'aarnescht', 'gréngewald', 'grengewald', 'bambësch', 'bambesch', 'chêne', 'chênes', 'hêtre', 'hêtres', 'futaie', 'clairière', 'clairieres', 'naturelle', 'réserve naturelle', 'naturpark', 'parc naturel', 'nature', 'sauvage', 'vtt'];

for (const w of words) {
  const reg = new RegExp('\\b' + w + '\\b', 'i');
  if (reg.test(fullText)) {
    console.log('Matched word:', w);
  }
}
