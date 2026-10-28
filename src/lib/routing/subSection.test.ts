import { describe, it, expect } from 'vitest';
import {
  haversineDistanceMeters,
  getFlatCoordinates,
  getInterpolatedElevation,
  extractRouteSubSection,
} from './subSection';
import type { RouteSuggestions, RouteTrace } from '../../types';

describe('subSection (Extraction et découpe chirurgicale de sous-traces)', () => {
  it('getFlatCoordinates aplatit les segments imbriqués ou retourne le tableau plat', () => {
    const flat: [number, number][] = [[6.1, 49.6], [6.2, 49.6]];
    expect(getFlatCoordinates(flat)).toEqual(flat);

    const multiSeg: [number, number][][] = [
      [[6.1, 49.6], [6.2, 49.6]],
      [[6.2, 49.6], [6.3, 49.6]],
    ];
    expect(getFlatCoordinates(multiSeg).length).toBe(4);
  });

  it('getInterpolatedElevation interpole linéairement l altitude à une distance donnée', () => {
    const profile = [
      { distance: 0, elevation: 200 },
      { distance: 10, elevation: 400 },
    ];

    expect(getInterpolatedElevation(profile, 0)).toBe(200);
    expect(getInterpolatedElevation(profile, 5)).toBe(300); // Milieu exact : 300m
    expect(getInterpolatedElevation(profile, 10)).toBe(400);
    expect(getInterpolatedElevation(profile, 15)).toBe(400); // Clamped au max
  });

  it('extractRouteSubSection découpe fidèlement une section avec calcul des métadonnées', () => {
    // Trace de 3 points espacés de ~7 km chacun
    const coords: [number, number][] = [
      [6.10, 49.60],
      [6.20, 49.60],
      [6.30, 49.60],
    ];

    const mockRoute: RouteSuggestions = {
      id: 'test-route',
      type: 'official',
      title: 'Piste Cyclable des Trois Cantons',
      description: 'Superbe parcours cyclable sans voiture',
      highlights: ['Point de vue', 'Château'],
      surfaceType: 'Asphalte',
      surfaceDistribution: [{ type: 'Asphalte', percentage: 100 }],
      activity: 'bike',
      difficulty: {
        level: 'moderate',
        label: 'Moyen',
        dotColor: '#f59e0b',
        badgeBg: '#fef3c7',
        badgeText: '#92400e',
        dPlusPerKm: 12,
        effortScore: 45,
      },
      elevationGain: 120,
      waypoints: coords,
    };

    const mockTrace: RouteTrace = {
      distance: 14000,
      duration: 2700,
      coordinates: coords,
      elevationProfile: [
        { distance: 0, elevation: 200 },
        { distance: 7, elevation: 260 },
        { distance: 14, elevation: 320 },
      ],
    };

    const sub = extractRouteSubSection(mockRoute, mockTrace, 0, 7);
    expect(sub).not.toBeNull();
    if (sub) {
      expect(sub.subPositions.length).toBeGreaterThanOrEqual(2);
      expect(sub.subDistanceKm).toBeGreaterThan(0);
      expect(sub.subDistanceKm).toBeLessThanOrEqual(sub.totalRouteKm);
      expect(sub.subTrace.elevationProfile.length).toBeGreaterThanOrEqual(2);
    }
  });
});
