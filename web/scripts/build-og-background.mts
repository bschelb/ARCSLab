#!/usr/bin/env tsx
// Pre-render the East Tennessee contour field used behind the generated Open Graph images
// (next/og cannot draw canvas). Same geometry as the hero (lib/contours.ts).
//   npx tsx scripts/build-og-background.mts
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contourLevels, marchContours, smoothHeights } from '../lib/contours';
import meta from '../lib/terrain.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200;
const H = 630;
const { data, info } = await sharp(path.join(root, 'public/terrain/east-tn.webp'))
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const gw = info.width;
const gh = info.height;
const span = meta.maxElevationM - meta.minElevationM;
const heights = smoothHeights(
  Float32Array.from(data, (v) => meta.minElevationM + (v / 255) * span),
  gw,
  gh,
  1,
  1,
);
const levels = contourLevels(meta.minElevationM, meta.maxElevationM, {
  count: 40,
  power: 2,
  phase: 0.35,
  indexEvery: 5,
});
const scale = Math.max(W / (gw - 1), H / (gh - 1));
const ox = (W - (gw - 1) * scale) * 0.7;
const oy = (H - (gh - 1) * scale) * 0.5;
const minor: string[] = [];
const index: string[] = [];
marchContours(heights, gw, gh, levels, (li, x1, y1, x2, y2) => {
  (levels[li]?.index ? index : minor).push(
    `M${(ox + x1 * scale).toFixed(1)} ${(oy + y1 * scale).toFixed(1)}L${(ox + x2 * scale).toFixed(1)} ${(oy + y2 * scale).toFixed(1)}`,
  );
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#14100b"/>
  <path d="${minor.join('')}" fill="none" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>
  <path d="${index.join('')}" fill="none" stroke="rgba(255,130,0,0.55)" stroke-width="1.4"/>
  <rect width="100%" height="100%" fill="url(#shade)"/>
  <defs><linearGradient id="shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#14100b" stop-opacity="0.94"/>
    <stop offset="0.55" stop-color="#14100b" stop-opacity="0.62"/>
    <stop offset="1" stop-color="#14100b" stop-opacity="0.1"/>
  </linearGradient></defs>
</svg>`;
const out = path.join(root, 'assets', 'og-contours.png');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
console.log(`wrote ${path.relative(root, out)}`);
