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
});
