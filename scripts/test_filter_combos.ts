import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

const WATER_REGEX = /\b(lac|lacs|lake|lakes|see|rivière|riviere|rivières|rivieres|fleuve|fluvial|fluviale|rives|berges|cascade|cascades|source|sources|méandre|meandre|méandres|meandres|canal|canaux|our|sûre|sure|alzette|moselle|musel|syre|wiltz|clerve|eisch|gander|blees|mamer|attert|semois|meuse|rur|saar|sarre|kyll|weiher|weier|wasser|trois-rivieres|trois-vallees)\b/i;

const FOREST_REGEX = /\b(forêt|foret|forêts|forets|forest|wald|wälder|bois|wood|woods|sous-bois|canopée|canopee|arbre|arbres|fiels|mullerthal|mëllerdall|eislek|haard|aarnescht|gréngewald|grengewald|bambësch|bambesch|chêne|chênes|hêtre|hêtres|futaie|clairière|clairieres|naturelle|réserve naturelle|naturpark|parc naturel|nature|sauvage|vtt)\b/i;

export function routeMatchesFilter(item: any, filterId: string): boolean {
  const fullText = `${item.route.title} ${item.route.description} ${item.route.surfaceType} ${(item.route.highlights || []).join(' ')} ${item.route.id}`;
  const isBike = item.route.activity === 'bike';
  const distM = item.trace.distance || 1;
  const gain = item.route.elevationGain;
  const slopeRatio = gain / distM;

  switch (filterId) {
    case 'water':
      return WATER_REGEX.test(fullText) || (item.tags || []).includes('water');

    case 'forest':
      return (
        FOREST_REGEX.test(fullText) ||
        (item.tags || []).includes('forest')
      );

    case 'paved':
      if (isBike) {
        return (
          item.route.id.includes('pc') ||
          item.route.id.includes('course') ||
          item.route.surfaceType.toLowerCase().includes('enrobé') ||
          item.route.surfaceType.toLowerCase().includes('asphalte') ||
          item.route.surfaceType.toLowerCase().includes('piste cyclable') ||
          (item.tags || []).includes('paved')
        ) && !item.route.id.includes('vtt') && !item.route.title.toLowerCase().includes('vtt');
      } else {
        return (
          item.route.id.includes('confort') ||
          item.route.surfaceType.toLowerCase().includes('enrobé') ||
          item.route.surfaceType.toLowerCase().includes('asphalte') ||
          (item.tags || []).includes('paved')
        );
      }

    case 'gravel':
      if (isBike) {
        return (
          item.route.id.includes('vtt') ||
          item.route.title.toLowerCase().includes('vtt') ||
          item.route.surfaceType.toLowerCase().includes('gravel') ||
          item.route.surfaceType.toLowerCase().includes('chemin') ||
          item.route.surfaceType.toLowerCase().includes('naturel') ||
          item.route.surfaceType.toLowerCase().includes('terre') ||
          (item.tags || []).includes('gravel')
        );
      } else {
        return (
          !item.route.id.includes('confort') &&
          !item.route.surfaceType.toLowerCase().includes('100% asphalte')
        );
      }

    case 'flat':
      return isBike
        ? gain < 250 || slopeRatio < 0.010
        : gain < 180 || slopeRatio < 0.020;

    case 'hilly':
      return isBike
        ? gain >= 350 || slopeRatio >= 0.013
        : gain >= 250 || slopeRatio >= 0.025;

    case 'low_traffic': {
      const carFree = item.route.roadBreakdown?.carFreePercentage ?? 80;
      return carFree >= (isBike ? 65 : 85);
    }

    default:
      return true;
  }
}

// Test filterCombinations
function testFilterCombos(activity: 'hike' | 'bike', filters: string[]) {
  const routes = CATALOG_ROUTES.filter(r => r.route.activity === activity);
  const filtered = routes.filter(item => filters.every(f => routeMatchesFilter(item, f)));
  console.log(`[${activity.toUpperCase()}] Filters: [${filters.join(', ')}] -> ${filtered.length} / ${routes.length} traces`);
}

console.log('=== TEST FILTER COMBOS ===');
testFilterCombos('hike', []);
testFilterCombos('hike', ['water']);
testFilterCombos('hike', ['forest']);
testFilterCombos('hike', ['paved']);
testFilterCombos('hike', ['flat']);
testFilterCombos('hike', ['hilly']);
testFilterCombos('hike', ['water', 'hilly']);

console.log('');
testFilterCombos('bike', []);
testFilterCombos('bike', ['water']);
testFilterCombos('bike', ['forest']);
testFilterCombos('bike', ['paved']);
testFilterCombos('bike', ['gravel']);
testFilterCombos('bike', ['flat']);
testFilterCombos('bike', ['hilly']);
testFilterCombos('bike', ['water', 'paved']);
testFilterCombos('bike', ['paved', 'flat']);
