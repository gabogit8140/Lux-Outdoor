import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

const hikes = CATALOG_ROUTES.filter(r => r.route.activity === 'hike');

const SPECIFIC_FOREST_REGEX = /\b(forêt|foret|forêts|forets|forest|wald|wälder|fiels|mullerthal|mëllerdall|eislek|haard|aarnescht|gréngewald|grengewald|bambësch|bambesch|kallék|futaie|hollenfels|septfontaines|consdorf|beaufort|berdorf|larochette|kautenbach|clervaux|fischbach|schoenfels|tuntange|manternach|differdange|lasauvage|kopstal|bissen|eschweiler|lellingen|boulaide|baschleiden|asselborn|heinerscheid|hoscheid|tadler|kalborn|bavigne|felsenweg|fautelfiels|mamerleeen)\b/i;

const forestHikes = hikes.filter(r => {
  const text = `${r.route.title} ${r.route.id}`;
  return SPECIFIC_FOREST_REGEX.test(text);
});

console.log('Forest hike routes count:', forestHikes.length, 'out of', hikes.length);
