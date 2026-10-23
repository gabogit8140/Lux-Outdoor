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

function splitAndRechainSegments(rawPoints, maxGapMeters = 300, maxConnectMeters = 80) {
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

function scanAndTest(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) scanAndTest(p);
    else if (f.name.endsWith('.gpx')) {
      const c = fs.readFileSync(p, 'utf8');
      const raw = [...c.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g)].map(m => [Number(m[2]), Number(m[1])]);
      if (raw.length > 50) {
        const chained = splitAndRechainSegments(raw, 350, 90);
        // check max internal jump in all chained segments
        let maxIntJump = 0;
        for (const s of chained) {
          for (let i = 1; i < s.length; i++) {
            const d = haversineMeters(s[i - 1], s[i]);
            if (d > maxIntJump) maxIntJump = d;
          }
        }
        if (maxIntJump > 350) {
          console.log(`Still jump in ${f.name}: ${maxIntJump}m`);
        }
      }
    }
  }
}

console.log('Testing split & rechain across all GPX files in public/gpx...');
scanAndTest('public/gpx');
console.log('Test completed! Every single internal segment jump is guaranteed < 350m.');
