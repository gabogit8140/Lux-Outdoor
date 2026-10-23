import fs from 'fs';
import path from 'path';

function haversineMeters([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function perpendicularDistance(p, p1, p2) {
  const x = p[0], y = p[1];
  const x1 = p1[0], y1 = p1[1];
  const x2 = p2[0], y2 = p2[1];
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return haversineMeters(p, p1);
  }
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const proj = [x1 + clampedT * dx, y1 + clampedT * dy];
  return haversineMeters(p, proj);
}

function rdpSimplify(points, epsilonMeters = 15) {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilonMeters) {
    const rec1 = rdpSimplify(points.slice(0, index + 1), epsilonMeters);
    const rec2 = rdpSimplify(points.slice(index), epsilonMeters);
    return rec1.slice(0, -1).concat(rec2);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function splitAndRechainSegments(rawPoints, maxGapMeters = 350, maxConnectMeters = 90) {
  if (rawPoints.length < 2) return [rawPoints];
  const segs = [];
  let current = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    const d = haversineMeters(rawPoints[i - 1], rawPoints[i]);
    if (d > maxGapMeters) {
      if (current.length >= 2) segs.push(current);
      current = [rawPoints[i]];
    } else {
      current.push(rawPoints[i]);
    }
  }
  if (current.length >= 2) segs.push(current);

  if (segs.length <= 1) return segs;

  const remaining = [...segs];
  const chained = [];

  while (remaining.length > 0) {
    let currentSeg = remaining.shift();
    let extended = true;

    while (extended) {
      extended = false;
      const endPt = currentSeg[currentSeg.length - 1];
      const startPt = currentSeg[0];

      let bestIdx = -1;
      let bestMode = '';
      let minD = maxConnectMeters;

      for (let i = 0; i < remaining.length; i++) {
        const other = remaining[i];
        const otherStart = other[0];
        const otherEnd = other[other.length - 1];

        const dEndToStart = haversineMeters(endPt, otherStart);
        if (dEndToStart < minD) {
          minD = dEndToStart;
          bestIdx = i;
          bestMode = 'append';
        }

        const dEndToEnd = haversineMeters(endPt, otherEnd);
        if (dEndToEnd < minD) {
          minD = dEndToEnd;
          bestIdx = i;
          bestMode = 'append_rev';
        }

        const dStartToEnd = haversineMeters(startPt, otherEnd);
        if (dStartToEnd < minD) {
          minD = dStartToEnd;
          bestIdx = i;
          bestMode = 'prepend';
        }

        const dStartToStart = haversineMeters(startPt, otherStart);
        if (dStartToStart < minD) {
          minD = dStartToStart;
          bestIdx = i;
          bestMode = 'prepend_rev';
        }
      }

      if (bestIdx >= 0) {
        const [matched] = remaining.splice(bestIdx, 1);
        if (bestMode === 'append') {
          currentSeg = currentSeg.concat(matched.slice(1));
        } else if (bestMode === 'append_rev') {
          currentSeg = currentSeg.concat([...matched].reverse().slice(1));
        } else if (bestMode === 'prepend') {
          currentSeg = matched.slice(0, -1).concat(currentSeg);
        } else if (bestMode === 'prepend_rev') {
          currentSeg = [...matched].reverse().slice(0, -1).concat(currentSeg);
        }
        extended = true;
      }
    }

    chained.push(currentSeg);
  }

  chained.sort((a, b) => b.length - a.length);
  return chained;
}

// Check how many points across all files
let totalFiles = 0;
let totalRawPts = 0;
let totalFinalPts = 0;

function scan(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) scan(p);
    else if (f.name.endsWith('.gpx')) {
      const c = fs.readFileSync(p, 'utf8');
      const raw = [...c.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)].map(m => [
        Number(Number(m[2]).toFixed(5)),
        Number(Number(m[1]).toFixed(5)),
      ]);
      if (raw.length >= 2) {
        totalFiles++;
        totalRawPts += raw.length;
        const chained = splitAndRechainSegments(raw, 350, 90);
        const simplified = chained.map(s => rdpSimplify(s, 15));
        const count = simplified.reduce((sum, s) => sum + s.length, 0);
        totalFinalPts += count;
      }
    }
  }
}

scan('public/gpx');
console.log(`Processed ${totalFiles} GPX tracks.`);
console.log(`Total raw points: ${totalRawPts}`);
console.log(`Total simplified points (RDP 15m): ${totalFinalPts} (average ${Math.round(totalFinalPts / totalFiles)} points/track)`);
