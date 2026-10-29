import { describe, it, expect } from 'vitest';
import {
  buildDirectLeg,
  buildAntiOverlapNogos,
  assembleLegsIntoRouteResult,
  type RoutedLegResult,
} from './segmentRouter';

describe('segmentRouter (Routage par segment & modes d assistance multi-niveaux)', () => {
  it('buildDirectLeg génère une liaison directe hors-sentier propre entre deux points', () => {
    const from: [number, number] = [6.10, 49.60];
    const to: [number, number] = [6.12, 49.61];

    const leg = buildDirectLeg(from, to, 250, 320);

    expect(leg.mode).toBe('direct');
    expect(leg.engine).toBe('direct');
    expect(leg.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(leg.coordinates[0][0]).toBeCloseTo(6.10, 5);
    expect(leg.coordinates[0][1]).toBeCloseTo(49.60, 5);
    expect(leg.coordinates[leg.coordinates.length - 1][0]).toBeCloseTo(6.12, 5);
    expect(leg.coordinates[leg.coordinates.length - 1][1]).toBeCloseTo(49.61, 5);
    expect(leg.distanceMeters).toBeGreaterThan(500);
  });

  it('buildAntiOverlapNogos génère des zones de blocage pour éviter les doublons en mode boucle', () => {
    const forbidden: [number, number, number?][] = [
      [6.10, 49.60],
      [6.105, 49.605],
      [6.11, 49.61],
      [6.115, 49.615],
    ];
    const from: [number, number] = [6.13, 49.63];
    const to: [number, number] = [6.14, 49.64];

    const nogos = buildAntiOverlapNogos(forbidden, from, to, 100, 30);
    expect(nogos.length).toBeGreaterThan(0);
    expect(nogos).toContain('30'); // rayon nogo
  });

  it('assembleLegsIntoRouteResult assemble harmonieusement des segments hétérogènes (trail, free, direct)', () => {
    const leg1: RoutedLegResult = {
      coordinates: [
        [6.10, 49.60, 200],
        [6.11, 49.60, 220],
      ],
      distanceMeters: 800,
      elevationGain: 20,
      elevationLoss: 0,
      mode: 'trail',
      engine: 'brouter',
    };

    // Segment 2 en mode 'free' (aller-retour permis sur le même sentier)
    const leg2: RoutedLegResult = {
      coordinates: [
        [6.11, 49.60, 220],
        [6.10, 49.60, 200],
      ],
      distanceMeters: 800,
      elevationGain: 0,
      elevationLoss: 20,
      mode: 'free',
      engine: 'brouter',
    };

    // Segment 3 en mode 'direct' (ligne droite hors-sentier)
    const leg3 = buildDirectLeg([6.10, 49.60], [6.12, 49.62], 200, 350);

    const waypoints: [number, number][] = [
      [6.10, 49.60],
      [6.11, 49.60],
      [6.10, 49.60],
      [6.12, 49.62],
    ];

    const result = assembleLegsIntoRouteResult([leg1, leg2, leg3], waypoints, 'hike', {
      preserveOutAndBack: true,
    });

    expect(result).not.toBeNull();
    expect(result!.coordinates.length).toBeGreaterThanOrEqual(4);
    expect(result!.distanceKm).toBeGreaterThan(1.5);
    // Vérifie que les 3 segments sont bien référencés
    expect(result!.legs?.length).toBe(3);
    expect(result!.legs?.[0].mode).toBe('trail');
    expect(result!.legs?.[1].mode).toBe('free');
    expect(result!.legs?.[2].mode).toBe('direct');
  });
});
