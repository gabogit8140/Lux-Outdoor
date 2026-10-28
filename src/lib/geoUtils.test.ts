import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  calculatePathDistance,
  perpendicularDistance,
  computeElevationProfile,
  rdpSimplify,
} from './geoUtils';

describe('geoUtils (Calculs géodésiques fondamentaux)', () => {
  it('haversineDistance calcule précisément la distance entre deux points connus', () => {
    // Coordonnées : Luxembourg-Ville [6.13, 49.61] vers Esch-sur-Alzette [5.98, 49.49] (~17.3 km)
    const luxVille: [number, number] = [6.13, 49.61];
    const esch: [number, number] = [5.98, 49.49];

    const dist = haversineDistance(luxVille, esch);
    expect(dist).toBeGreaterThan(17000);
    expect(dist).toBeLessThan(18000);
  });

  it('haversineDistance retourne 0 pour deux points identiques', () => {
    const pt: [number, number] = [6.1296, 49.6099];
    expect(haversineDistance(pt, pt)).toBe(0);
  });

  it('calculatePathDistance calcule correctement la distance cumulée d un tracé', () => {
    const path: [number, number][] = [
      [6.13, 49.61],
      [6.14, 49.61],
      [6.15, 49.61],
    ];
    const totalDist = calculatePathDistance(path);
    const d1 = haversineDistance(path[0], path[1]);
    const d2 = haversineDistance(path[1], path[2]);

    expect(totalDist).toBeCloseTo(d1 + d2, 1);
  });

  it('calculatePathDistance gère les tracés vides ou à 1 seul point', () => {
    expect(calculatePathDistance([])).toBe(0);
    expect(calculatePathDistance([[6.13, 49.61]])).toBe(0);
  });

  it('perpendicularDistance calcule la distance projetée à un segment en mètres', () => {
    // Ligne droite Est-Ouest au Luxembourg : [6.10, 49.60] vers [6.20, 49.60]
    const p1: [number, number] = [6.10, 49.60];
    const p2: [number, number] = [6.20, 49.60];
    // Point décalé de 0.01 degré vers le Nord (~1110 mètres)
    const p: [number, number] = [6.15, 49.61];

    const d = perpendicularDistance(p, p1, p2);
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1200);
  });

  it('computeElevationProfile calcule correctement la distance cumulée et le dénivelé positif (D+)', () => {
    const coords: [number, number][] = [
      [6.10, 49.60],
      [6.11, 49.60],
      [6.12, 49.60],
      [6.13, 49.60],
    ];

    const result = computeElevationProfile(coords, 150, 300);
    expect(result.profile.length).toBeGreaterThan(0);
    expect(result.gain).toBeGreaterThan(0);
    expect(result.minElevation).toBeLessThanOrEqual(result.maxElevation);
    expect(result.profile[0].distance).toBe(0);
  });

  it('rdpSimplify réduit le nombre de points d une ligne droite avec micro-bruit', () => {
    const line: [number, number][] = [
      [6.10, 49.60],
      [6.105, 49.60001], // micro-écart
      [6.11, 49.60002],
      [6.115, 49.60],
      [6.12, 49.60],
    ];
    const simplified = rdpSimplify(line, 5); // tolérance 5 mètres
    expect(simplified.length).toBeLessThan(line.length);
    expect(simplified[0]).toEqual(line[0]);
    expect(simplified[simplified.length - 1]).toEqual(line[line.length - 1]);
  });
});
