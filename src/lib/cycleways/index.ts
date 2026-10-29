export {
  CYCLEWAY_CATEGORIES,
  CYCLEWAY_CATEGORY_LIST,
  extractCyclewayRef,
  classifyBikeRoute,
  classifyOsmCyclewayTags,
  enrichRouteWithCyclewayMeta,
  isCyclewayRoute,
  type CyclewayCategoryMeta,
} from './cyclewayClassifier';

export {
  chainMultiSegmentsToContinuousLine,
  normalizeCyclewayTrace,
  projectPointToTraceKm,
} from './cyclewayGeometry';

export {
  resolveCyclewayWebReference,
  applyCyclewayWebReferences,
  type CyclewayWebReference,
} from './cyclewayWebReferences';

export {
  findCatalogCyclewayAtPoint,
  fetchSelectableCyclewayAtPoint,
  type ExtractedCyclewayResult,
} from './osmCyclewayExtractor';
