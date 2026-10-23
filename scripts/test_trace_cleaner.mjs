import fs from 'fs';

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

function splitAndRechainSegments(rawPoints, maxGapMeters = 300, maxConnectMeters = 80) {
  // 1. Initial split at large gaps
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

  // 2. Greedy chaining: try to connect segment ends to segment starts
  const remaining = [...segs];
  const chained = [];

  while (remaining.length > 0) {
    let currentSeg = remaining.shift();
    let extended = true;

    while (extended) {
      extended = false;
      const endPt = currentSeg[currentSeg.length - 1];
      const startPt = currentSeg[0];

      // Look for a segment that connects to endPt or startPt
      let bestIdx = -1;
      let bestMode = ''; // 'append', 'append_rev', 'prepend', 'prepend_rev'
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

  // Sort by segment length descending (longest main routes first)
  chained.sort((a, b) => b.length - a.length);
  return chained;
}

// Test on PC3
const pc3Content = fs.readFileSync('public/gpx/bike/lu-pc-pc3-piste-cyclable-des-trois-cantons-schengen-mondorf-petange.gpx', 'utf8');
const rawPts = [...pc3Content.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)].map(m => [Number(m[2]), Number(m[1])]);

const chained = splitAndRechainSegments(rawPts, 300, 80);
console.log(`Original points: ${rawPts.length}. Segments before chaining: 54. Segments after chaining: ${chained.length}`);
for (let i = 0; i < Math.min(5, chained.length); i++) {
  console.log(`- Segment ${i + 1}: ${chained[i].length} points, approx ${(chained[i].length * 0.02).toFixed(1)} km`);
}
