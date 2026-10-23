import type { ElevationPoint } from '../types';
import { APP_CONFIG } from './config/appConfig';

export function generateGPXString(
  title: string,
  coordinates: [number, number][] | [number, number][][],
  elevationProfile?: ElevationPoint[]
): string {
  // coordinates are [longitude, latitude]
  let trkpts = '';

  const getEle = (idx: number, total: number) => {
    if (!elevationProfile || elevationProfile.length === 0) return '';
    const pIdx = Math.min(
      elevationProfile.length - 1,
      Math.floor((idx / Math.max(1, total - 1)) * elevationProfile.length)
    );
    const ele = elevationProfile[pIdx]?.elevation;
    return ele !== undefined ? `\n        <ele>${ele}</ele>` : '';
  };

  if (coordinates.length > 0 && Array.isArray(coordinates[0][0])) {
    const segments = coordinates as [number, number][][];
    let globalIdx = 0;
    const totalPts = segments.reduce((sum, s) => sum + s.length, 0);

    trkpts = segments
      .map((segment) => {
        const pts = segment
          .map((coord) => {
            const eleXml = getEle(globalIdx++, totalPts);
            return `      <trkpt lat="${coord[1]}" lon="${coord[0]}">${eleXml}\n      </trkpt>`;
          })
          .join('\n');
        return `    <trkseg>\n${pts}\n    </trkseg>`;
      })
      .join('\n');
  } else {
    const segment = coordinates as [number, number][];
    const pts = segment
      .map((coord, idx) => {
        const eleXml = getEle(idx, segment.length);
        return `      <trkpt lat="${coord[1]}" lon="${coord[0]}">${eleXml}\n      </trkpt>`;
      })
      .join('\n');
    trkpts = `    <trkseg>\n${pts}\n    </trkseg>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${APP_CONFIG.creatorTag}" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(title)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(title)}</name>
${trkpts}
  </trk>
</gpx>`;
}

export function downloadGPX(
  title: string,
  coordinates: [number, number][] | [number, number][][],
  elevationProfile?: ElevationPoint[]
) {
  const gpxString = generateGPXString(title, coordinates, elevationProfile);
  const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
