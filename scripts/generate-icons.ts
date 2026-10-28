import fs from 'fs';
import path from 'path';

/**
 * scripts/generate-icons.ts
 * Garantit et regenere les favicons et icones PWA a partir du Roude Leiw (Lion luxembourgeois) officiel.
 */

const publicDir = path.resolve(process.cwd(), 'public');
const pwa192Path = path.join(publicDir, 'pwa-192x192.png');
const pwa512Path = path.join(publicDir, 'pwa-512x512.png');
const icoPath = path.join(publicDir, 'favicon.ico');

if (!fs.existsSync(pwa192Path)) {
  console.error('[Icon Generator] ERREUR : pwa-192x192.png introuvable !');
  process.exit(1);
}

const pwa192 = fs.readFileSync(pwa192Path);

// Creation de favicon.ico enveloppant le PNG du Lion
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = icon
icoHeader.writeUInt16LE(1, 4); // 1 image
icoHeader.writeUInt8(0, 6);    // width (0 = 256/custom)
icoHeader.writeUInt8(0, 7);    // height
icoHeader.writeUInt8(0, 8);    // color palette
icoHeader.writeUInt8(0, 9);    // reserved
icoHeader.writeUInt16LE(1, 10); // planes
icoHeader.writeUInt16LE(32, 12); // bpp
icoHeader.writeUInt32LE(pwa192.length, 14); // data size
icoHeader.writeUInt32LE(22, 18); // offset

const ico = Buffer.concat([icoHeader, pwa192]);
fs.writeFileSync(icoPath, ico);

console.log(`[Icon Generator] favicon.ico regenere avec succes (${ico.length} bytes) avec le Roude Leiw (Lion Lux).`);
