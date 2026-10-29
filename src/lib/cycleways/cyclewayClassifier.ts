import type {
  CyclewayCategory,
  RouteKind,
  RouteSuggestions,
  RouteTrace,
} from '../../types';
import { applyCyclewayWebReferences } from './cyclewayWebReferences';

export interface CyclewayCategoryMeta {
  id: CyclewayCategory;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  mapColor: string;
  shieldBg: string;
  shieldText: string;
  badgeClass: string;
  defaultCarFreePct: number;
}

export const CYCLEWAY_CATEGORIES: Record<CyclewayCategory, CyclewayCategoryMeta> = {
  veloroute_internationale: {
    id: 'veloroute_internationale',
    label: 'EuroVelo & Véloroute Internationale',
    shortLabel: 'EuroVelo / Inter.',
    description:
      'Grands axes cyclables transfrontaliers balisés (EuroVelo, La Voie Bleue V50, Vennbahn, Mosel-Radweg).',
    icon: '🌍',
    mapColor: '#6d28d9', // Violet profond (style bouclier V50 / EuroVelo)
    shieldBg: '#6d28d9',
    shieldText: '#ffffff',
    badgeClass:
      'bg-purple-100 dark:bg-purple-950/75 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    defaultCarFreePct: 86,
  },
  piste_nationale: {
    id: 'piste_nationale',
    label: 'Piste Cyclable Nationale (PC)',
    shortLabel: 'PC Nationale',
    description:
      'Réseau national officiel des pistes cyclables (PC1 à PC38 au Luxembourg & axes nationaux asphaltés).',
    icon: '🛡️',
    mapColor: '#0284c7', // Bleu CyclOSM piste nationale
    shieldBg: '#0369a1',
    shieldText: '#ffffff',
    badgeClass:
      'bg-sky-100 dark:bg-sky-950/75 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700',
    defaultCarFreePct: 88,
  },
  voie_verte_ravel: {
    id: 'voie_verte_ravel',
    label: 'Voie Verte & RAVeL (Site propre)',
    shortLabel: 'Voie Verte / RAVeL',
    description:
      'Anciennes lignes ferroviaires et chemins de halage 100% réservés aux mobilités douces (0 voiture).',
    icon: '🌿',
    mapColor: '#0d9488', // Teal intense voie verte
    shieldBg: '#0f766e',
    shieldText: '#ffffff',
    badgeClass:
      'bg-teal-100 dark:bg-teal-950/75 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    defaultCarFreePct: 96,
  },
  veloroute_regionale: {
    id: 'veloroute_regionale',
    label: 'Véloroute Régionale',
    shortLabel: 'Véloroute Régionale',
    description:
      'Itinéraire cyclable thématique ou de vallée balisé à l’échelle régionale (Radwege Eifel/Sarre/Moselle).',
    icon: '🧭',
    mapColor: '#2563eb', // Bleu royal
    shieldBg: '#1d4ed8',
    shieldText: '#ffffff',
    badgeClass:
      'bg-blue-100 dark:bg-blue-950/75 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    defaultCarFreePct: 80,
  },
  piste_locale: {
    id: 'piste_locale',
    label: 'Piste ou Bande Cyclable Locale',
    shortLabel: 'Piste Locale',
    description:
      'Piste cyclable communale, liaison urbaine ou aménagement cyclable de proximité.',
    icon: '🚲',
    mapColor: '#0891b2', // Cyan
    shieldBg: '#0e7490',
    shieldText: '#ffffff',
    badgeClass:
      'bg-cyan-100 dark:bg-cyan-950/75 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    defaultCarFreePct: 78,
  },
};

export const CYCLEWAY_CATEGORY_LIST: CyclewayCategoryMeta[] = [
  CYCLEWAY_CATEGORIES.veloroute_internationale,
  CYCLEWAY_CATEGORIES.piste_nationale,
  CYCLEWAY_CATEGORIES.voie_verte_ravel,
  CYCLEWAY_CATEGORIES.veloroute_regionale,
  CYCLEWAY_CATEGORIES.piste_locale,
];

export interface BikeClassificationResult {
  routeKind: RouteKind;
  cyclewayCategory?: CyclewayCategory;
  cyclewayRef?: string;
}

/**
 * Extrait un code court de bouclier cyclable (ex: "PC1", "PC12", "V50", "EV5", "L163", "Vennbahn").
 */
export function extractCyclewayRef(text: string, osmRef?: string): string | undefined {
  if (osmRef && osmRef.trim().length > 0) {
    const cleanRef = osmRef.split(';')[0].trim();
    if (cleanRef.length <= 12) return cleanRef.toUpperCase();
  }

  const pcMatch = text.match(/\b(PC\s*\d{1,2}[a-z]?)\b/i);
  if (pcMatch) {
    return pcMatch[1].replace(/\s+/g, '').toUpperCase();
  }

  const evMatch = text.match(/\b(?:EuroVelo\s*|EV\s*)(\d{1,2})\b/i);
  if (evMatch) {
    return `EV${evMatch[1]}`;
  }

  const vMatch = text.match(/\b(V\s*50|V\s*52)\b/i);
  if (vMatch) {
    return vMatch[1].replace(/\s+/g, '').toUpperCase();
  }

  const ravelLineMatch = text.match(/\b(?:RAVeL\s*(?:Ligne\s*)?|Ligne\s*)(L?\d{2,3}[A-Z]?)\b/i);
  if (ravelLineMatch) {
    const raw = ravelLineMatch[1].toUpperCase();
    return raw.startsWith('L') ? raw : `L${raw}`;
  }

  if (/\bvennbahn\b/i.test(text)) {
    return 'VENN';
  }

  if (/\brlp\b/i.test(text) || /\brheinland[-\s]*pfalz[-\s]*radroute\b/i.test(text)) {
    return 'RLP';
  }

  if (/\bhunsr[üu]ck/i.test(text)) {
    return 'H';
  }

  // LF-routes néerlandaises (LF13, LF1, LF-K, LF Kustroute...)
  const lfMatch = text.match(/\b(LF\s*\d{1,2}[a-z]?|LF-K)\b/i);
  if (lfMatch) {
    return lfMatch[1].replace(/\s+/g, '').toUpperCase();
  }
  if (/\bkustroute\b/i.test(text)) {
    return 'LF-K';
  }

  // Fietssnelwegen belges / flamandes (F102, F6, F40, F1...)
  const fietssnelwegMatch = text.match(/\b(F\d{1,3})\b/i);
  if (fietssnelwegMatch) {
    return fietssnelwegMatch[1].toUpperCase();
  }

  // Euroroute R1
  if (/\b(?:euroroute\s*)?R1\b/i.test(text)) {
    return 'R1';
  }

  return undefined;
}

/**
 * Classifie un itinéraire vélo en distinguant clairement :
 * - `trace` : Boucle / circuit vélo / parcours randonnée VTT ou cyclosportif
 * - `cycleway` : Piste cyclable / véloroute / voie verte / RAVeL linéaire ou infrastructure cyclable,
 *   avec sa catégorie exacte (`CyclewayCategory`) et son code officiel (`cyclewayRef`).
 */
export function classifyBikeRoute(
  route: Pick<
    RouteSuggestions,
    | 'id'
    | 'title'
    | 'description'
    | 'activity'
    | 'routeKind'
    | 'cyclewayCategory'
    | 'cyclewayRef'
    | 'tags'
    | 'isUserImported'
  >,
  _trace?: RouteTrace | null
): BikeClassificationResult {
  if (route.activity !== 'bike') {
    return { routeKind: 'trace' };
  }

  // Si déjà explicitement qualifié (ex: extraction OSM en direct sur la couche vélo)
  if (route.routeKind === 'cycleway' && route.cyclewayCategory) {
    return {
      routeKind: 'cycleway',
      cyclewayCategory: route.cyclewayCategory,
      cyclewayRef:
        route.cyclewayRef || extractCyclewayRef(`${route.title} ${route.description}`),
    };
  }
  if (route.routeKind === 'trace') {
    return { routeKind: 'trace' };
  }

  // Les traces importées personnellement par l'utilisateur restent des "traces" (sauf mention explicite piste OSM)
  const id = (route.id || '').toLowerCase();
  if (route.isUserImported && !id.startsWith('osm-cycleway-')) {
    return { routeKind: 'trace' };
  }

  const title = route.title || '';
  const desc = route.description || '';
  const combined = `${id} ${title} ${desc}`;

  // Les circuits explicitement conçus comme des boucles touristiques, tours ou circuits VTT/cyclosportifs sont des "Traces"
  const isExplicitCircuitLoop =
    /\b(boucle|grand tour|tour des|circuit|gran fondo|marathon|doyenne|classique|chouffe|course|rondwee)\b/i.test(
      title
    ) ||
    id.includes('-loop') ||
    id.includes('-sport') ||
    id.includes('-boucle') ||
    id.includes('lu-course-') ||
    id.includes('lu-vtt-');

  // 1. Pistes Cyclables Nationales du Luxembourg (lu-pc-*)
  if (id.startsWith('lu-pc-') || /\bpiste cyclable\b/i.test(title)) {
    const ref = extractCyclewayRef(combined);
    if (id.includes('pc0') || /\bliaison urbaine\b/i.test(title)) {
      return {
        routeKind: 'cycleway',
        cyclewayCategory: 'piste_locale',
        cyclewayRef: ref || 'PC0',
      };
    }
    return {
      routeKind: 'cycleway',
      cyclewayCategory: 'piste_nationale',
      cyclewayRef: ref || 'PC',
    };
  }

  // 2. Axes Internationaux / EuroVelo / Voie Bleue V50 / Vennbahn / Euroroute R1 (hors boucles annexes)
  if (
    !isExplicitCircuitLoop &&
    (id.startsWith('fr-voie-bleue-') ||
      id === 'be-ravel-vennbahn' ||
      id.includes('ev12') ||
      id.includes('euroroute-r1') ||
      /\b(eurovelo|voie bleue|v50|vennbahn|meuse à vélo|euroroute|kustroute)\b/i.test(title))
  ) {
    return {
      routeKind: 'cycleway',
      cyclewayCategory: 'veloroute_internationale',
      cyclewayRef: extractCyclewayRef(combined) || 'EV',
    };
  }

  // 3. Voies Vertes & Lignes RAVeL (hors boucles cyclosportives)
  if (
    !isExplicitCircuitLoop &&
    (id.includes('ravel') ||
      id.includes('voie-verte') ||
      id === 'fr-cyclo-vallee-canner' ||
      /\b(ravel|voie verte|fil bleu)\b/i.test(title))
  ) {
    return {
      routeKind: 'cycleway',
      cyclewayCategory: 'voie_verte_ravel',
      cyclewayRef: extractCyclewayRef(combined) || 'RAVeL',
    };
  }

  // 4. Réseaux Nationaux & Régionaux (LF-routes néerlandaises, Fietssnelwegen belges, Radwege, RLP)
  if (
    !isExplicitCircuitLoop &&
    (id.includes('fietssnelweg') ||
      id.includes('lf13') ||
      id.includes('-radweg') ||
      id.includes('-radroute') ||
      id.includes('rlp') ||
      /\b(fietssnelweg|schelde-rheinroute|radweg|véloroute|veloroute|felsenroute|radroute|rlp|hunsr[üu]ck)\b/i.test(
        title
      ))
  ) {
    // Les LF-routes (Landelijke Fietsroutes) sont le réseau national néerlandais
    if (id.includes('lf') || /\b(lf\s*\d+|schelde-rheinroute)\b/i.test(combined)) {
      return {
        routeKind: 'cycleway',
        cyclewayCategory: 'piste_nationale',
        cyclewayRef: extractCyclewayRef(combined) || 'LF',
      };
    }

    const isInternationalAxis = /\b(mosel-radweg|saar-radweg)\b/i.test(title);
    return {
      routeKind: 'cycleway',
      cyclewayCategory: isInternationalAxis
        ? 'veloroute_internationale'
        : 'veloroute_regionale',
      cyclewayRef: extractCyclewayRef(combined) || (id.includes('rlp') ? 'RLP' : undefined),
    };
  }

  // 5. Pistes cyclables communales / locales
  if (
    !isExplicitCircuitLoop &&
    /\b(la commune à vélo|liaison cyclable|bande cyclable|piste locale)\b/i.test(title)
  ) {
    return {
      routeKind: 'cycleway',
      cyclewayCategory: 'piste_locale',
      cyclewayRef: extractCyclewayRef(combined),
    };
  }

  return { routeKind: 'trace' };
}

/**
 * Classifie un élément OpenStreetMap (relation `route=bicycle` ou way `highway=cycleway` / `cycleway=*`)
 * en catégorie de piste cyclable.
 */
export function classifyOsmCyclewayTags(
  tags: Record<string, string | undefined>,
  isRelation: boolean
): { category: CyclewayCategory; ref?: string; carFreePct: number } {
  const network = (tags.network || '').toLowerCase();
  const name = tags.name || tags['name:fr'] || tags['official_name'] || '';
  const refTag = tags.ref || '';
  const combined = `${refTag} ${name}`;
  const highway = (tags.highway || '').toLowerCase();
  const cycleway = (
    tags.cycleway ||
    tags['cycleway:both'] ||
    tags['cycleway:right'] ||
    tags['cycleway:left'] ||
    ''
  ).toLowerCase();

  const ref = extractCyclewayRef(combined, refTag);

  // 1. EuroVelo & Véloroutes Internationales
  if (
    network === 'icn' ||
    /\b(eurovelo|voie bleue|v50|vennbahn|mosel-radweg|saar-radweg)\b/i.test(combined)
  ) {
    return {
      category: 'veloroute_internationale',
      ref: ref || 'EV',
      carFreePct: 86,
    };
  }

  // 2. Pistes Cyclables Nationales (PC Luxembourg, NCN)
  if (network === 'ncn' || /\bPC\s*\d+\b/i.test(combined)) {
    if (/\bPC\s*0\b/i.test(combined)) {
      return { category: 'piste_locale', ref: 'PC0', carFreePct: 82 };
    }
    return {
      category: 'piste_nationale',
      ref: ref || 'PC',
      carFreePct: 88,
    };
  }

  // 3. Voie Verte / RAVeL / Site propre intégral sans voiture
  if (
    /\b(ravel|voie verte|bahntrassenradweg|halage)\b/i.test(combined) ||
    (!isRelation &&
      highway === 'cycleway' &&
      tags.foot !== 'no' &&
      !cycleway.includes('lane'))
  ) {
    // Distinguer une vraie voie verte / site propre d'une simple bande cyclable urbaine
    const isUrbanSidepath =
      tags.cycleway === 'sidepath' || tags.is_sidepath === 'yes';
    if (!isUrbanSidepath) {
      return {
        category: 'voie_verte_ravel',
        ref,
        carFreePct: 96,
      };
    }
  }

  // 4. Véloroutes Régionales (RCN)
  if (network === 'rcn' || (isRelation && network !== 'lcn')) {
    return {
      category: 'veloroute_regionale',
      ref,
      carFreePct: 80,
    };
  }

  // 5. Piste ou Bande Cyclable Locale (LCN, highway=cycleway urbaine, cycleway=track/lane)
  const isSeparatedTrack = highway === 'cycleway' || cycleway.includes('track');
  return {
    category: 'piste_locale',
    ref,
    carFreePct: isSeparatedTrack ? 85 : 55,
  };
}

/**
 * Enrichit un objet `RouteSuggestions` avec `routeKind`, `cyclewayCategory` et `cyclewayRef`.
 */
export function enrichRouteWithCyclewayMeta(
  route: RouteSuggestions,
  trace?: RouteTrace | null
): RouteSuggestions {
  if (route.activity !== 'bike') return route;
  const info = classifyBikeRoute(route, trace);
  const flatCoords = trace?.coordinates
    ? Array.isArray(trace.coordinates[0]?.[0])
      ? (trace.coordinates as [number, number][][])[0]
      : (trace.coordinates as [number, number][])
    : route.waypoints;

  const base: RouteSuggestions = {
    ...route,
    routeKind: info.routeKind,
    cyclewayCategory: info.cyclewayCategory,
    cyclewayRef: info.cyclewayRef,
  };

  if (info.routeKind === 'cycleway') {
    return applyCyclewayWebReferences(base, flatCoords);
  }
  return base;
}

export function isCyclewayRoute(route?: Partial<RouteSuggestions> | null): boolean {
  if (!route || route.activity !== 'bike') return false;
  if (route.routeKind) return route.routeKind === 'cycleway';
  return (
    classifyBikeRoute(route as RouteSuggestions).routeKind === 'cycleway'
  );
}
