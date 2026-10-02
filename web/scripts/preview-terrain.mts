#!/usr/bin/env tsx
// Render the hero contours to a PNG for review (same geometry code as the live canvas).
//   npx tsx scripts/preview-terrain.mts <out.png> [count] [power] [scale]
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contourLevels, marchContours, smoothHeights } from '../lib/contours';
import meta from '../lib/terrain.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [out = 'terrain-preview.png', count = '40', power = '2', scale = '3', passes = '1'] =
  process.argv.slice(2);
const { data, info } = await sharp(path.join(root, 'public/terrain/east-tn.webp'))
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const raw = Float32Array.from(
  data,
  (v) => meta.minElevationM + (v / 255) * (meta.maxElevationM - meta.minElevationM),
);
const heights = smoothHeights(raw, w, h, 1, Number(passes));
const levels = contourLevels(meta.minElevationM, meta.maxElevationM, {
  count: Number(count),
  power: Number(power),
  phase: 0,
  indexEvery: 5,
});
const s = Number(scale);
const paths: string[][] = levels.map(() => []);
marchContours(heights, w, h, levels, (li, x1, y1, x2, y2) => {
  paths[li]!.push(
    `M${(x1 * s).toFixed(1)} ${(y1 * s).toFixed(1)}L${(x2 * s).toFixed(1)} ${(y2 * s).toFixed(1)}`,
  );
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * s}" height="${h * s}"><rect width="100%" height="100%" fill="#14100b"/>${paths
  .map(
    (p, i) =>
      `<path d="${p.join('')}" fill="none" stroke="${levels[i]!.index ? 'rgba(255,130,0,0.75)' : 'rgba(255,255,255,0.22)'}" stroke-width="${levels[i]!.index ? 1.4 : 1}"/>`,
  )
  .join('')}</svg>`;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`wrote ${out}`);
