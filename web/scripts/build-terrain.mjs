#!/usr/bin/env node
// Build the hero heightmap: real East Tennessee terrain from the Great Smoky Mountains,
// across the Valley & Ridge (Knoxville, Hardin Valley, Oak Ridge), up Walden Ridge onto the
// Cumberland Plateau and the Crab Orchard Mountains.
//
//   node scripts/build-terrain.mjs
//
// Source: Mapzen Terrain Tiles on AWS Open Data (terrarium encoding), which in the US come
// from USGS 3DEP / NED (public domain). Tiles are cached in .terrain-cache/ (gitignored).
// Output: public/terrain/east-tn.webp (8-bit grayscale lossless WebP heightmap, Web Mercator) and
// lib/terrain.json (bbox, size, elevation range) — read by components/hero/TerrainContours.

import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.terrain-cache');

// West of Crab Orchard to east of Mount Cammerer; Fontana Lake to north of the Crab Orchard Mountains.
const BBOX = { west: -85.0, east: -83.1, south: 35.45, north: 36.25 };
const Z = 11;
const OUT_W = 480;

const lonToX = (lon) => ((lon + 180) / 360) * 256 * 2 ** Z;
const latToY = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 256 * 2 ** Z;
};

const px0 = lonToX(BBOX.west);
const px1 = lonToX(BBOX.east);
const py0 = latToY(BBOX.north);
const py1 = latToY(BBOX.south);
const tx0 = Math.floor(px0 / 256);
const tx1 = Math.floor(px1 / 256);
const ty0 = Math.floor(py0 / 256);
const ty1 = Math.floor(py1 / 256);

async function tile(x, y) {
  const file = path.join(cacheDir, `${Z}-${x}-${y}.png`);
  if (!existsSync(file)) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(file);
}

await mkdir(cacheDir, { recursive: true });
const cols = tx1 - tx0 + 1;
const rows = ty1 - ty0 + 1;
const W = cols * 256;
const H = rows * 256;
const elev = new Float32Array(W * H);

console.log(`Fetching ${cols * rows} tiles at z${Z}…`);
for (let ty = ty0; ty <= ty1; ty++) {
  for (let tx = tx0; tx <= tx1; tx++) {
    const { data } = await sharp(await tile(tx, ty)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const ox = (tx - tx0) * 256;
    const oy = (ty - ty0) * 256;
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 3;
        // terrarium: (R * 256 + G + B / 256) - 32768 metres
        elev[(oy + y) * W + ox + x] = data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
      }
    }
  }
}

// Crop to the exact bbox and box-average down to OUT_W columns (aspect kept in Mercator).
const cx0 = px0 - tx0 * 256;
const cy0 = py0 - ty0 * 256;
const cw = px1 - px0;
const ch = py1 - py0;
const OUT_H = Math.round((OUT_W * ch) / cw);
const out = new Float32Array(OUT_W * OUT_H);
const sx = cw / OUT_W;
const sy = ch / OUT_H;
for (let y = 0; y < OUT_H; y++) {
  for (let x = 0; x < OUT_W; x++) {
    let sum = 0;
    let n = 0;
    for (let yy = Math.floor(cy0 + y * sy); yy < cy0 + (y + 1) * sy; yy++) {
      for (let xx = Math.floor(cx0 + x * sx); xx < cx0 + (x + 1) * sx; xx++) {
        sum += elev[yy * W + xx];
        n++;
      }
    }
    out[y * OUT_W + x] = sum / n;
  }
}

// Light 3×3 smoothing so contours read as drawn lines, not pixel stairs.
const smooth = new Float32Array(out.length);
for (let y = 0; y < OUT_H; y++) {
  for (let x = 0; x < OUT_W; x++) {
    let s = 0;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy;
        const xx = x + dx;
        if (yy < 0 || xx < 0 || yy >= OUT_H || xx >= OUT_W) continue;
        const w = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
        s += out[yy * OUT_W + xx] * w;
        n += w;
      }
    }
    smooth[y * OUT_W + x] = s / n;
  }
}

let min = Infinity;
let max = -Infinity;
for (const v of smooth) {
  if (v < min) min = v;
  if (v > max) max = v;
}
min = Math.floor(min);
max = Math.ceil(max);
const gray = Buffer.alloc(smooth.length);
for (let i = 0; i < smooth.length; i++) gray[i] = Math.round(((smooth[i] - min) / (max - min)) * 255);

await mkdir(path.join(root, 'public', 'terrain'), { recursive: true });
const png = path.join(root, 'public', 'terrain', 'east-tn.webp');
// Lossless WebP is ~40% smaller than PNG here (36 KB vs 58 KB).
await sharp(gray, { raw: { width: OUT_W, height: OUT_H, channels: 1 } }).webp({ lossless: true, effort: 6 }).toFile(png);

const meta = {
  source: 'Mapzen Terrain Tiles (AWS Open Data); US elevation from USGS 3DEP/NED, public domain',
  projection: 'Web Mercator',
  bbox: BBOX,
  width: OUT_W,
  height: OUT_H,
  minElevationM: min,
  maxElevationM: max,
  metresPerStep: Number(((max - min) / 255).toFixed(2)),
};
await writeFile(path.join(root, 'lib', 'terrain.json'), JSON.stringify(meta, null, 2) + '\n');
const { size } = await import('node:fs').then((fs) => fs.promises.stat(png));
console.log(`Wrote public/terrain/east-tn.webp (${OUT_W}×${OUT_H}, ${Math.round(size / 1024)} KB), elevation ${min}–${max} m`);
