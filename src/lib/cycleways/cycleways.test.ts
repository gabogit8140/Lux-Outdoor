import { describe, it, expect } from 'vitest';
import {
  classifyBikeRoute,
  classifyOsmCyclewayTags,
  isCyclewayRoute,
  chainMultiSegmentsToContinuousLine,
  projectPointToTraceKm,
  resolveCyclewayWebReference,
  findCatalogCyclewayAtPoint,
} from './index';
import { isGenericHomepageUrl } from '../routeSourceResolver';
import { CATALOG_ROUTES } from '../routeCatalog';
import { filterAndSearchOffline } from '../localRouting';

describe('Cycleways Module — Distinction Traces vs Pistes Cyclables, Catégories & Sites Web', () => {
  it('distingue correctement les Pistes Cyclables linéaires des Traces / Circuits vélo', () => {
    const pc1 = CATALOG_ROUTES.find(
      (c) =>
        c.route.id ===
        'lu-pc-pc1-piste-cyclable-du-centre-luxembourg-hesperange-kockelscheuer'
    );
    expect(pc1).toBeDefined();
    expect(isCyclewayRoute(pc1!.route)).toBe(true);
    expect(pc1!.route.routeKind).toBe('cycleway');
    expect(pc1!.route.cyclewayCategory).toBe('piste_nationale');
    expect(pc1!.route.cyclewayRef).toBe('PC1');

    // Un circuit VTT ou une boucle cyclosportive doit rester classé 'trace'
    const bikeTraces = CATALOG_ROUTES.filter(
      (c) => c.route.activity === 'bike' && !isCyclewayRoute(c.route)
    );
    expect(bikeTraces.length).toBeGreaterThan(5);
    for (const item of bikeTraces.slice(0, 5)) {
      expect(item.route.routeKind).toBe('trace');
      expect(item.route.cyclewayCategory).toBeUndefined();
    }
  });

  it('attribue la bonne catégorie de piste cyclable (Internationale, PC Nationale, Voie Verte/RAVeL, Régionale, Locale)', () => {
    // La Voie Bleue V50 -> EuroVelo / Véloroute Internationale
    const v50 = classifyBikeRoute({
      id: 'fr-voie-bleue-nord-sierck',
      title: 'La Voie Bleue V50 : Frontière Luxembourgeoise - Thionville',
      activity: 'bike',
      type: 'scenic',
      surfaceType: 'Voie verte & véloroute asphaltée',
      description: 'Tronçon nord de la Voie Bleue le long de la Moselle.',
      highlights: [],
      difficulty: {} as any,
      elevationGain: 45,
      elevationLoss: 45,
      minElevation: 145,
      maxElevation: 160,
      country: 'FR',
      surfaceDistribution: [],
      waypoints: [
        [6.36, 49.46],
        [6.17, 49.35],
      ],
      instructions: [],
      tags: ['voie-bleue'],
    });
    expect(v50.routeKind).toBe('cycleway');
    expect(v50.cyclewayCategory).toBe('veloroute_internationale');
    expect(v50.cyclewayRef).toBe('V50');

    // RAVeL Ligne 163 -> Voie Verte & RAVeL
    const ravel = classifyBikeRoute({
      id: 'be-ravel-l163-bastogne',
      title: 'RAVeL Ligne 163 : Bastogne – Gouvy',
      activity: 'bike',
      type: 'scenic',
      surfaceType: 'Asphalte lisse (ancienne voie ferrée)',
      description: 'Voie verte RAVeL en site propre.',
      highlights: [],
      difficulty: {} as any,
      elevationGain: 120,
      elevationLoss: 110,
      minElevation: 420,
      maxElevation: 510,
      country: 'BE',
      surfaceDistribution: [],
      waypoints: [
        [5.72, 50.0],
        [5.94, 50.18],
      ],
      instructions: [],
      tags: ['ravel'],
    });
    expect(ravel.routeKind).toBe('cycleway');
    expect(ravel.cyclewayCategory).toBe('voie_verte_ravel');
    expect(ravel.cyclewayRef).toBe('L163');

    // Tags OSM directs : piste/bande cyclable locale vs voie verte en site propre vs véloroute régionale
    const osmLocal = classifyOsmCyclewayTags(
      { highway: 'secondary', cycleway: 'track', name: 'Route de Thionville' },
      false
    );
    expect(osmLocal.category).toBe('piste_locale');

    const osmGreenway = classifyOsmCyclewayTags(
      { highway: 'cycleway', railway: 'abandoned', name: 'Voie Verte des Trois Frontières' },
      false
    );
    expect(osmGreenway.category).toBe('voie_verte_ravel');

    const osmRegional = classifyOsmCyclewayTags(
      { type: 'route', route: 'bicycle', network: 'rcn', name: 'Boucle de la Moselle' },
      true
    );
    expect(osmRegional.category).toBe('veloroute_regionale');
  });

  it('associe systématiquement un site web officiel profond (non générique) aux pistes cyclables', () => {
    const cycleways = CATALOG_ROUTES.filter(
      (c) => c.route.activity === 'bike' && isCyclewayRoute(c.route)
    );
    expect(cycleways.length).toBeGreaterThan(15);

    for (const cw of cycleways) {
      expect(cw.route.sourceUrl).toBeTruthy();
      expect(isGenericHomepageUrl(cw.route.sourceUrl)).toBe(false);
      expect(cw.route.sourceLabel).toBeTruthy();
    }

    const refWithOsmWeb = resolveCyclewayWebReference({
      title: 'Véloroute Charles le Téméraire (V50)',
      ref: 'V50',
      country: 'FR',
      category: 'veloroute_internationale',
      osmRelationId: 1255966,
      centerLonLat: [6.318, 49.442],
    });
    expect(refWithOsmWeb.sourceUrl).toContain('lavoiebleue.com/');
    expect(isGenericHomepageUrl(refWithOsmWeb.sourceUrl)).toBe(false);
    expect(refWithOsmWeb.geoportailUrl).toContain('cycling.waymarkedtrails.org/#route?id=1255966');
  });

  it('rechaîne sans saut parasite les segments désordonnés d’une piste cyclable et projette un clic en km', () => {
    const segA: [number, number][] = [
      [6.1, 49.6],
      [6.12, 49.61],
    ];
    const segC: [number, number][] = [
      [6.14, 49.63],
      [6.16, 49.64],
    ];
    // segB inversé et fourni en désordre
    const segBReversed: [number, number][] = [
      [6.14, 49.63],
      [6.12, 49.61],
    ];

    const chained = chainMultiSegmentsToContinuousLine([segA, segC, segBReversed]);
    expect(chained[0]).toEqual([6.1, 49.6]);
    expect(chained[chained.length - 1]).toEqual([6.16, 49.64]);

    const proj = projectPointToTraceKm(
      {
        distance: 6500,
        duration: 1200,
        coordinates: chained,
        elevationProfile: [],
      },
      49.62,
      6.13
    );
    expect(proj.distanceMeters).toBeLessThan(250);
    expect(proj.projectedKm).toBeGreaterThan(1);
    expect(proj.projectedKm).toBeLessThan(6);
  });

  it('permet de filtrer séparément Traces vs Pistes Cyclables et sélectionne une piste complète au clic carte', () => {
    const onlyCycleways = filterAndSearchOffline({
      activity: 'bike',
      bikeType: 'road',
      distanceKm: [45, 60], // même avec un filtre boucle 45-60 km, toutes les pistes cyclables restent accessibles !
      filters: [],
      country: 'ALL',
      bikeContentFilter: 'cycleways',
    });
    expect(onlyCycleways.routes.length).toBeGreaterThan(15);
    expect(onlyCycleways.routes.every((r) => isCyclewayRoute(r))).toBe(true);
    expect(
      onlyCycleways.routes.some(
        (r) =>
          r.id ===
          'lu-pc-pc1-piste-cyclable-du-centre-luxembourg-hesperange-kockelscheuer-troncon-01'
      )
    ).toBe(false);

    const onlyNationalPc = filterAndSearchOffline({
      activity: 'bike',
      bikeType: 'road',
      distanceKm: [45, 60],
      filters: [],
      country: 'LU',
      bikeContentFilter: 'cycleways',
      cyclewayCategoryFilter: 'piste_nationale',
    });
    expect(onlyNationalPc.routes.length).toBeGreaterThan(10);
    expect(onlyNationalPc.routes.every((r) => r.cyclewayCategory === 'piste_nationale')).toBe(true);

    // Clic précis sur un point de la PC1 au Luxembourg -> sélectionne la PC1 complète (et non un sous-tronçon)
    const pc1 = CATALOG_ROUTES.find(
      (c) =>
        c.route.id ===
        'lu-pc-pc1-piste-cyclable-du-centre-luxembourg-hesperange-kockelscheuer'
    )!;
    const coords = pc1.trace.coordinates as [number, number][];
    const midPt = coords[Math.floor(coords.length / 2)];
    const hit = findCatalogCyclewayAtPoint(midPt[1], midPt[0], 65);
    expect(hit).not.toBeNull();
    expect(hit!.route.id).toBe(
      'lu-pc-pc1-piste-cyclable-du-centre-luxembourg-hesperange-kockelscheuer'
    );
  });

  it('valide l alignement authentique de la V50 le long du canal de la Moselle a Koenigsmacker', () => {
    const v50 = CATALOG_ROUTES.find(
      (c) => c.route.id === 'fr-voie-bleue-v50-nord'
    );
    expect(v50).toBeDefined();
    expect(v50!.route.routeKind).toBe('cycleway');
    expect(v50!.route.cyclewayRef).toBe('V50');

    // La trace authentique doit longer le canal de la Moselle à Koenigsmacker (~49.401, 6.264)
    // et NE PAS traverser les rues intérieures du village (D 64A / Rue de l'Église ~49.385, 6.285)
    const coords = v50!.trace.coordinates as [number, number][];
    expect(coords.length).toBeGreaterThan(200);

    // Vérifier la présence d'un point au droit de l'écluse/canal de Koenigsmacker
    const nearCanal = coords.some(([lng, lat]) => Math.abs(lat - 49.401) < 0.005 && Math.abs(lng - 6.264) < 0.005);
    expect(nearCanal).toBe(true);

    // Vérifier l'absence de détour artificiel au centre du village (6.285, 49.385)
    const detourInVillage = coords.some(([lng, lat]) => Math.abs(lat - 49.385) < 0.003 && Math.abs(lng - 6.285) < 0.003);
    expect(detourInVillage).toBe(false);
  });

  it('permet de masquer ou démasquer les Pistes Cyclables indépendamment des traces', () => {
    // 1. En filtre 'traces', aucune piste cyclable n'apparaît
    const onlyTraces = filterAndSearchOffline({
      activity: 'bike',
      bikeType: 'road',
      distanceKm: [0, 200],
      filters: [],
      country: 'ALL',
      bikeContentFilter: 'traces',
      cyclewayCategoryFilter: 'all',
    });
    expect(onlyTraces.routes.every((r) => !isCyclewayRoute(r))).toBe(true);

    // 2. En filtre 'cycleways', seules les pistes cyclables apparaissent
    const onlyCycleways = filterAndSearchOffline({
      activity: 'bike',
      bikeType: 'road',
      distanceKm: [0, 200],
      filters: [],
      country: 'ALL',
      bikeContentFilter: 'cycleways',
      cyclewayCategoryFilter: 'all',
    });
    expect(onlyCycleways.routes.length).toBeGreaterThan(0);
    expect(onlyCycleways.routes.every((r) => isCyclewayRoute(r))).toBe(true);
  });
});
