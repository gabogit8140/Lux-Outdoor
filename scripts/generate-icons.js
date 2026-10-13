import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer + 1 filter byte per scanline
  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(calculateCRC(body), 0);

    return Buffer.concat([len, body, crc]);
  }

  function calculateCRC(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

// Icon design: Emerald green rounded background with white mountain & path emblem
function drawAppIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;
    const distSq = nx * nx + ny * ny;

    // Corner radius for non-maskable icons
    const radiusRatio = isMaskable ? 1.5 : 0.82;
    const absX = Math.abs(nx);
    const absY = Math.abs(ny);
    
    // Superellipse rounded box
    const inBox = Math.pow(absX, 4) + Math.pow(absY, 4) <= Math.pow(radiusRatio, 4);

    if (!isMaskable && !inBox) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }

    // Emerald gradient background #059669 to #047857
    const gradFactor = 0.5 + 0.5 * ny;
    const rBg = Math.round(5 * (1 - gradFactor) + 4 * gradFactor);
    const gBg = Math.round(150 * (1 - gradFactor) + 120 * gradFactor);
    const bBg = Math.round(105 * (1 - gradFactor) + 87 * gradFactor);

    // Draw Mountain Peak 1 (Back mountain)
    const scale = isMaskable ? 0.65 : 0.78;
    const sx = nx / scale;
    const sy = (ny + 0.08) / scale;

    // Left Peak: apex at (-0.28, -0.35)
    const isPeakLeft = sy >= Math.abs(sx + 0.28) * 1.5 - 0.35 && sy <= 0.45 && sx >= -0.7 && sx <= 0.2;
    // Right Peak: apex at (0.22, -0.55)
    const isPeakRight = sy >= Math.abs(sx - 0.22) * 1.6 - 0.55 && sy <= 0.45 && sx >= -0.35 && sx <= 0.75;

    // Sinuous trail path cutting through foreground
    const pathCenterY = 0.4 + 0.22 * Math.sin(sx * 3.2);
    const isTrail = Math.abs(sy - pathCenterY) < 0.07 && sx >= -0.65 && sx <= 0.65;

    if (isTrail) {
      // Warm amber/gold trail ribbon
      return [251, 191, 36, 255]; // #fbbf24
    }

    if (isPeakRight) {
      // Foreground crisp white mountain
      return [255, 255, 255, 255];
    }

    if (isPeakLeft) {
      // Secondary mountain (semi-transparent white / light emerald tint)
      return [209, 250, 229, 235]; // #d1fae5
    }

    // Pin marker dot at the summit of right peak
    const distSummit = Math.hypot(sx - 0.22, sy - (-0.68));
    if (distSummit < 0.075) {
      return [239, 68, 68, 255]; // #ef4444 red beacon
    }

    return [rBg, gBg, bBg, 255];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. apple-touch-icon.png (180x180, required by iOS Safari for home screen)
const appleIcon = createPNG(180, 180, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

// 2. pwa-192x192.png (192x192, Android & PWA standard)
const pwa192 = createPNG(192, 192, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 3. pwa-512x512.png (512x512, High-res PWA splash & launcher)
const pwa512 = createPNG(512, 512, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// 4. pwa-maskable-512x512.png (512x512, Full bleed maskable for Android adaptive icons)
const pwaMaskable = createPNG(512, 512, drawAppIcon(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// 5. SVG icon for desktop browser tabs
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#059669"/>
  <path d="M120 380 L230 220 L310 330 L380 230 L450 380 Z" fill="#ffffff" opacity="0.95"/>
  <path d="M70 380 C 180 340, 240 430, 440 370" stroke="#fbbf24" stroke-width="26" stroke-linecap="round" fill="none"/>
  <circle cx="380" cy="180" r="28" fill="#ef4444"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('Successfully generated all PWA PNG and SVG icons in public/ directory!');
