import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

type RGBA = [number, number, number, number];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(c1: RGBA, c2: RGBA, t: number): RGBA {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(lerp(c1[0], c2[0], k)),
    Math.round(lerp(c1[1], c2[1], k)),
    Math.round(lerp(c1[2], c2[2], k)),
    lerp(c1[3], c2[3], k),
  ];
}

function blend(dst: RGBA, src: RGBA): RGBA {
  const sa = src[3];
  if (sa <= 0) return dst;
  if (sa >= 1) return [src[0], src[1], src[2], 1];
  const da = dst[3];
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return [0, 0, 0, 0];
  return [
    Math.round((src[0] * sa + dst[0] * da * (1 - sa)) / outA),
    Math.round((src[1] * sa + dst[1] * da * (1 - sa)) / outA),
    Math.round((src[2] * sa + dst[2] * da * (1 - sa)) / outA),
    outA,
  ];
}

function sdRoundBox(x: number, y: number, halfW: number, halfH: number, r: number): number {
  const qx = Math.abs(x - 256) - (halfW - r);
  const qy = Math.abs(y - 256) - (halfH - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function pointInTriangle(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): boolean {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

interface TrailSample {
  x: number;
  y: number;
  tGlobal: number;
  arcLen: number;
}

// M136 432 C 175 372, 346 362, 326 304 C 312 266, 234 250, 282 196
const TRAIL_SAMPLES: TrailSample[] = (() => {
  const seg1 = {
    p0: [136, 432],
    p1: [175, 372],
    p2: [346, 362],
    p3: [326, 304],
  };
  const seg2 = {
    p0: [326, 304],
    p1: [312, 266],
    p2: [234, 250],
    p3: [282, 196],
  };

  function evalCubic(
    p0: number[],
    p1: number[],
    p2: number[],
    p3: number[],
    t: number
  ): [number, number] {
    const u = 1 - t;
    const x =
      u * u * u * p0[0] +
      3 * u * u * t * p1[0] +
      3 * u * t * t * p2[0] +
      t * t * t * p3[0];
    const y =
      u * u * u * p0[1] +
      3 * u * u * t * p1[1] +
      3 * u * t * t * p2[1] +
      t * t * t * p3[1];
    return [x, y];
  }

  const samples: TrailSample[] = [];
  let totalLen = 0;
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const tGlobal = i / steps;
    const [x, y] =
      tGlobal < 0.5
        ? evalCubic(seg1.p0, seg1.p1, seg1.p2, seg1.p3, tGlobal * 2)
        : evalCubic(seg2.p0, seg2.p1, seg2.p2, seg2.p3, (tGlobal - 0.5) * 2);
    if (i > 0) {
      const prev = samples[i - 1];
      totalLen += Math.hypot(x - prev.x, y - prev.y);
    }
    samples.push({ x, y, tGlobal, arcLen: totalLen });
  }
  return samples;
})();

function minDistToTrail(x: number, y: number): { dist: number; t: number; arcLen: number } {
  let bestDistSq = Infinity;
  let bestT = 0;
  let bestArc = 0;
  for (let i = 0; i < TRAIL_SAMPLES.length; i++) {
    const s = TRAIL_SAMPLES[i];
    const dx = x - s.x;
    const dy = y - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestT = s.tGlobal;
      bestArc = s.arcLen;
    }
  }
  return { dist: Math.sqrt(bestDistSq), t: bestT, arcLen: bestArc };
}

function sampleIcon(x: number, y: number, fullBleed: boolean): RGBA {
  const boxDist = fullBleed ? -100 : sdRoundBox(x, y, 256, 256, 116);
  if (boxDist > 0) {
    return [0, 0, 0, 0];
  }

  // 1. Deep Alpine Obsidian-Emerald Background Gradient
  const diagT = (x + y) / 1024;
  const bgTop: RGBA = [6, 95, 70, 1];
  const bgMid: RGBA = [6, 78, 59, 1];
  const bgBot: RGBA = [2, 44, 34, 1];
  let color: RGBA =
    diagT < 0.48
      ? lerpColor(bgTop, bgMid, diagT / 0.48)
      : lerpColor(bgMid, bgBot, (diagT - 0.48) / 0.52);

  // 2. Radial Summit Glow around (275, 175)
  const glowDist = Math.hypot(x - 275, y - 175);
  if (glowDist < 245) {
    const glowFactor = Math.pow(1 - glowDist / 245, 1.6) * 0.45;
    color = blend(color, [16, 185, 129, glowFactor]);
  }

  // 3. Topographic Contour Rings around (275, 210)
  const topoR = Math.hypot(x - 275, y - 210);
  if (Math.abs(topoR - 196) < 1.5 || Math.abs(topoR - 152) < 1.4 || Math.abs(topoR - 108) < 1.3) {
    color = blend(color, [52, 211, 153, 0.15]);
  }

  // 4. Golden Alpine Sun & Halo at (372, 126)
  const dSun = Math.hypot(x - 372, y - 126);
  if (dSun <= 34) {
    color = blend(color, [251, 191, 36, 0.18]);
  }
  if (dSun <= 20) {
    color = blend(color, [251, 191, 36, 1]);
  }
  if (dSun <= 9) {
    color = blend(color, [254, 243, 199, 1]);
  }

  // 5. Secondary Left Alpine Peak: (88,344) - (176,196) - (252,344)
  if (pointInTriangle(x, y, 88, 344, 176, 196, 252, 344)) {
    const tPeak = (y - 196) / (344 - 196);
    const secPeakCol = lerpColor([236, 253, 245, 0.95], [110, 231, 183, 0.8], tPeak);
    color = blend(color, secPeakCol);
    if (pointInTriangle(x, y, 176, 196, 212, 344, 252, 344)) {
      color = blend(color, [4, 120, 87, 0.55]);
    }
  }

  // 6. Primary Main Summit Left Sunlit Facet: (158,344) - (282,118) - (298,344)
  if (pointInTriangle(x, y, 158, 344, 282, 118, 298, 344)) {
    const tLit = (y - 118) / (344 - 118);
    color = blend(color, lerpColor([255, 255, 255, 1], [209, 250, 229, 1], tLit));
  }

  // 7. Primary Main Summit Right Shaded Facet: (282,118) - (418,344) - (298,344)
  if (pointInTriangle(x, y, 282, 118, 418, 344, 298, 344)) {
    const tShade = (y - 118) / (344 - 118);
    color = blend(color, lerpColor([110, 231, 183, 1], [5, 150, 105, 1], tShade));
  }

  // 8. Winding GPX Trail Cutout & Luminous Ribbon
  if (x >= 85 && x <= 385 && y >= 165 && y <= 465) {
    const { dist, t, arcLen } = minDistToTrail(x, y);
    if (dist <= 22) {
      color = blend(color, [2, 44, 34, 0.88]);
    }
    if (dist <= 13) {
      const trailCol =
        t < 0.52
          ? lerpColor([251, 191, 36, 1], [245, 158, 11, 1], t / 0.52)
          : lerpColor([245, 158, 11, 1], [52, 211, 153, 1], (t - 0.52) / 0.48);
      color = blend(color, trailCol);

      if (dist <= 2.4 && Math.floor(arcLen / 11) % 2 === 0) {
        color = blend(color, [255, 255, 255, 0.65]);
      }
    }
  }

  // 9. Start Waypoint Node at (136, 432)
  const dStart = Math.hypot(x - 136, y - 432);
  if (dStart <= 20) {
    color = blend(color, [255, 255, 255, 1]);
  }
  if (dStart <= 10) {
    color = blend(color, [5, 150, 105, 1]);
  }

  // 10. Summit Finish Waypoint Node at (282, 196)
  const dSummit = Math.hypot(x - 282, y - 196);
  if (dSummit <= 16) {
    color = blend(color, [255, 255, 255, 1]);
  }
  if (dSummit <= 8) {
    color = blend(color, [245, 158, 11, 1]);
  }

  // 11. Fine Squircle Glass Rim (when not fullBleed)
  if (!fullBleed && boxDist >= -6 && boxDist <= 0) {
    const rimCol = lerpColor([110, 231, 183, 0.45], [251, 191, 36, 0.3], diagT);
    color = blend(color, rimCol);
  }

  return color;
}

function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      rawData,
      y * (stride + 1) + 1
    );
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcInput = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderIconToFile(outPath: string, size: number, fullBleed: boolean) {
  const rgba = new Uint8Array(size * size * 4);
  const offsets = [0.25, 0.75];

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      for (const oy of offsets) {
        for (const ox of offsets) {
          const sx = ((px + ox) / size) * 512;
          const sy = ((py + oy) / size) * 512;
          const [r, g, b, a] = sampleIcon(sx, sy, fullBleed);
          rSum += r * a;
          gSum += g * a;
          bSum += b * a;
          aSum += a;
        }
      }

      const idx = (py * size + px) * 4;
      if (aSum > 0) {
        rgba[idx] = Math.round(rSum / aSum);
        rgba[idx + 1] = Math.round(gSum / aSum);
        rgba[idx + 2] = Math.round(bSum / aSum);
        rgba[idx + 3] = Math.round((aSum / 4) * 255);
      }
    }
  }

  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(outPath, png);
  console.log(`[Icon Generator] Wrote ${path.basename(outPath)} (${size}x${size}, ${png.length} bytes)`);
  return png;
}

function writeFaviconIco(outPath: string, pngBuffer: Buffer, size: number) {
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type 1 = icon
  icoHeader.writeUInt16LE(1, 4); // count = 1
  icoHeader.writeUInt8(size >= 256 ? 0 : size, 6); // width
  icoHeader.writeUInt8(size >= 256 ? 0 : size, 7); // height
  icoHeader.writeUInt8(0, 8); // color count
  icoHeader.writeUInt8(0, 9); // reserved
  icoHeader.writeUInt16LE(1, 10); // color planes
  icoHeader.writeUInt16LE(32, 12); // bits per pixel
  icoHeader.writeUInt32LE(pngBuffer.length, 14); // data size
  icoHeader.writeUInt32LE(22, 18); // offset to image

  const ico = Buffer.concat([icoHeader, pngBuffer]);
  fs.writeFileSync(outPath, ico);
  console.log(`[Icon Generator] Wrote ${path.basename(outPath)} (${size}x${size}, ${ico.length} bytes)`);
}

const publicDir = path.resolve(process.cwd(), 'public');
const favPng = renderIconToFile(path.join(publicDir, 'favicon-48.png'), 48, false);
writeFaviconIco(path.join(publicDir, 'favicon.ico'), favPng, 48);
renderIconToFile(path.join(publicDir, 'apple-touch-icon.png'), 180, true);
renderIconToFile(path.join(publicDir, 'pwa-192x192.png'), 192, false);
renderIconToFile(path.join(publicDir, 'pwa-512x512.png'), 512, false);
renderIconToFile(path.join(publicDir, 'pwa-maskable-512x512.png'), 512, true);
