import { CATALOG_ROUTES } from '../src/lib/routeCatalog';

const WATER_REGEX = /\b(lac|lacs|lake|lakes|see|rivière|riviere|rivières|rivieres|fleuve|fluvial|fluviale|rives|berges|cascade|cascades|source|sources|méandre|meandre|méandres|meandres|canal|canaux|our|sûre|sure|alzette|moselle|musel|syre|wiltz|clerve|eisch|gander|blees|mamer|attert|semois|meuse|rur|saar|sarre|kyll|weiher|weier|wasser)\b/i;

const FOREST_REGEX = /\b(forêt|foret|forêts|forets|forest|wald|wälder|bois|wood|woods|sous-bois|canopée|canopee|arbre|arbres|fiels|mullerthal|mëllerdall|eislek|haard|aarnescht|gréngewald|grengewald|bambësch|bambesch|chêne|chênes|hêtre|hêtres|futaie|clairière|clairieres)\b/i;

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
      return FOREST_REGEX.test(fullText) || (item.tags || []).includes('forest');

    case 'paved':
      if (isBike) {
        return (
          item.route.id.includes('pc') ||
          item.route.id.includes('course') ||
          item.route.surfaceType.toLowerCase().includes('enrobé') ||
          item.route.surfaceType.toLowerCase().includes('asphalte') ||
          item.route.surfaceType.toLowerCase().includes('piste cyclable') ||
          (item.tags || []).includes('paved')
        ) && !item.route.id.includes('vtt');
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
        ? gain >= 400 || slopeRatio >= 0.014
        : gain >= 250 || slopeRatio >= 0.026;

    case 'low_traffic': {
      const carFree = item.route.roadBreakdown?.carFreePercentage ?? 80;
      return carFree >= (isBike ? 65 : 85);
    }

    default:
      return true;
  }
}

// Test on hike routes
const hikes = CATALOG_ROUTES.filter(r => r.route.activity === 'hike');
console.log('Total hike routes:', hikes.length);
console.log(' - water:', hikes.filter(r => routeMatchesFilter(r, 'water')).length);
console.log(' - forest:', hikes.filter(r => routeMatchesFilter(r, 'forest')).length);
console.log(' - flat:', hikes.filter(r => routeMatchesFilter(r, 'flat')).length);
console.log(' - hilly:', hikes.filter(r => routeMatchesFilter(r, 'hilly')).length);
console.log(' - paved:', hikes.filter(r => routeMatchesFilter(r, 'paved')).length);
console.log(' - gravel:', hikes.filter(r => routeMatchesFilter(r, 'gravel')).length);

// Test on bike routes
const bikes = CATALOG_ROUTES.filter(r => r.route.activity === 'bike');
console.log('\nTotal bike routes:', bikes.length);
console.log(' - water:', bikes.filter(r => routeMatchesFilter(r, 'water')).length);
console.log(' - forest:', bikes.filter(r => routeMatchesFilter(r, 'forest')).length);
console.log(' - flat:', bikes.filter(r => routeMatchesFilter(r, 'flat')).length);
console.log(' - hilly:', bikes.filter(r => routeMatchesFilter(r, 'hilly')).length);
console.log(' - paved:', bikes.filter(r => routeMatchesFilter(r, 'paved')).length);
console.log(' - gravel:', bikes.filter(r => routeMatchesFilter(r, 'gravel')).length);
