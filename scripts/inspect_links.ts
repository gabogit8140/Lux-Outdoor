import fs from 'fs';
import path from 'path';

function scan(dir: string): any[] {
  let res: any[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      res.push(...scan(p));
    } else if (e.name.endsWith('.gpx')) {
      const c = fs.readFileSync(p, 'utf8');
      const m = c.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
      const url = c.match(/https?:\/\/[^\s<"']+/i);
      if (m || url) {
        res.push({ file: e.name, linkTag: m ? m[1] : null, url: url ? url[0] : null });
      }
    }
  }
  return res;
}

const found = scan('public/gpx');
const map = new Map<string, number>();
const samplePerLink = new Map<string, string>();
for (const item of found) {
  const l = item.linkTag || 'NONE';
  map.set(l, (map.get(l) || 0) + 1);
  if (!samplePerLink.has(l)) {
    samplePerLink.set(l, item.file);
  }
}

console.log('Distinct link counts:');
for (const [k, v] of map.entries()) {
  console.log(` - [${v} files]: ${k} (sample: ${samplePerLink.get(k)})`);
}

