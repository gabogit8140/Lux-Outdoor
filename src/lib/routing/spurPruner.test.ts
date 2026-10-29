import { describe, it, expect } from 'vitest';
import {
  snapPointToTrack,
  computeCumulativeArcLengths,
  countSharedPassagePoints,
  pruneLoopSpursAndOrphans,
} from './spurPruner';

describe('spurPruner (Élagage des boucles & élimination des passages redondants)', () => {
  const straightTrack: [number, number, number?][] = [
    [6.10, 49.60],
    [6.11, 49.60],
    [6.12, 49.60],
    [6.13, 49.60],
  ];

  it('snapPointToTrack projette correctement un point proche sur la trace', () => {
    // Point proche du premier point : [6.101, 49.601]
    const point: [number, number] = [6.101, 49.601];
    const snap = snapPointToTrack(point, straightTrack);

    expect(snap.snappedCoord[0]).toBeCloseTo(6.101, 3);
    expect(snap.snappedCoord[1]).toBeCloseTo(49.60, 3);
    expect(snap.closestIndex).toBe(0);
    expect(snap.distanceMeters).toBeGreaterThan(0);
    expect(snap.distanceMeters).toBeLessThan(200);
  });

  it('computeCumulativeArcLengths calcule des distances croissantes monotones', () => {
    const arcs = computeCumulativeArcLengths(straightTrack);
    expect(arcs.length).toBe(straightTrack.length);
    expect(arcs[0]).toBe(0);
    expect(arcs[1]).toBeGreaterThan(0);
    expect(arcs[2]).toBeGreaterThan(arcs[1]);
    expect(arcs[3]).toBeGreaterThan(arcs[2]);
  });

  it('countSharedPassagePoints détecte les chevauchements entre deux branches', () => {
    // Branche A : part de la jonction [6.10, 49.60] vers le Nord puis l Est
    const branchA: [number, number, number?][] = [
      [6.10, 49.60],
      [6.10, 49.61],
      [6.11, 49.61],
    ];
    // Branche B : emprunte le même segment Nord
    const branchB: [number, number, number?][] = [
      [6.10, 49.60],
      [6.10, 49.61],
      [6.09, 49.61],
    ];
    const junction: [number, number] = [6.10, 49.60];

    const shared = countSharedPassagePoints(branchA, branchB, junction, 10, 25);
    expect(shared).toBeGreaterThan(0);
  });

  it('pruneLoopSpursAndOrphans préserve un circuit propre sans éperons parasites', () => {
    // Une boucle pure fermée (carré)
    const cleanLoop: [number, number, number?][] = [
      [6.10, 49.60],
      [6.12, 49.60],
      [6.12, 49.62],
      [6.10, 49.62],
      [6.10, 49.60],
    ];
    const waypoints: [number, number][] = [
      [6.10, 49.60],
      [6.12, 49.60],
      [6.12, 49.62],
      [6.10, 49.62],
    ];

    const result = pruneLoopSpursAndOrphans(cleanLoop, waypoints, 42);
    expect(result.cleanedCoords.length).toBeGreaterThanOrEqual(4);
    expect(result.hasPrunedSpurs).toBe(false);
  });

  it('pruneLoopSpursAndOrphans préserve l antenne d acces de depart d un circuit en sucette (lollipop)', () => {
    // Tracé de type sucette : départ à [6.3268, 49.4504], descente sur [6.3190, 49.4425],
    // boucle [6.3100, 49.4350] -> [6.3190, 49.4425], et remontée au départ [6.3268, 49.4504]
    const lollipopCoords: [number, number, number?][] = [
      [6.3268, 49.4504],
      [6.3245, 49.4485],
      [6.3210, 49.4450],
      [6.3190, 49.4425],
      [6.3150, 49.4380],
      [6.3100, 49.4350],
      [6.3120, 49.4390],
      [6.3190, 49.4425],
      [6.3210, 49.4450],
      [6.3245, 49.4485],
      [6.3268, 49.4504],
    ];

    const waypoints: [number, number][] = [
      [6.3268, 49.4504], // Point de départ explicite posé par l'utilisateur
      [6.3100, 49.4350], // Fond de boucle
    ];

    const result = pruneLoopSpursAndOrphans(lollipopCoords, waypoints, 42);

    // Le tracé nettoyé DOIT conserver le point de départ exact posé par l'utilisateur
    expect(result.cleanedCoords[0][0]).toBeCloseTo(6.3268, 3);
    expect(result.cleanedCoords[0][1]).toBeCloseTo(49.4504, 3);
    expect(result.cleanedWaypoints[0][0]).toBeCloseTo(6.3268, 3);
    expect(result.cleanedWaypoints[0][1]).toBeCloseTo(49.4504, 3);
  });

  it('pruneLoopSpursAndOrphans préserve un détour en cul-de-sac vers un belvédère si un waypoint y est posé', () => {
    const coordsWithDetour: [number, number, number?][] = [
      [6.10, 49.60],
      [6.12, 49.60],
      // Détour aller-retour vers un point de vue à [6.12, 49.61]
      [6.12, 49.605],
      [6.12, 49.61],
      [6.12, 49.605],
      [6.12, 49.60],
      [6.14, 49.60],
      [6.14, 49.62],
      [6.10, 49.62],
      [6.10, 49.60],
    ];

    const waypointsWithDetour: [number, number][] = [
      [6.10, 49.60],
      [6.12, 49.61], // Waypoint explicite au sommet / belvédère
      [6.14, 49.62],
    ];

    const result = pruneLoopSpursAndOrphans(coordsWithDetour, waypointsWithDetour, 42);
    // Le détour contenant le waypoint utilisateur ne doit pas être supprimé
    const hasViewpoint = result.cleanedCoords.some(
      ([lon, lat]) => Math.abs(lon - 6.12) < 0.001 && Math.abs(lat - 49.61) < 0.001
    );
    expect(hasViewpoint).toBe(true);
  });
});
