#!/usr/bin/env node
// Resize source photos and derive the logo/icon set (plan 3.6). Uses sharp.
//
//   node scripts/optimize-images.mjs                 # migration batch from ../astro-site/public/assets
//   node scripts/optimize-images.mjs <photo> <slug>  # add one person: public/images/people/<slug>.jpg
//
// Photos: long edge ≤ 1600 px, JPEG quality 82 (mozjpeg), EXIF orientation applied, metadata
// stripped. next/image then serves sized AVIF/WebP variants from these.

import sharp from 'sharp';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (...p) => path.join(root, 'public', ...p);
const LONG_EDGE = 1600;
const QUALITY = 82;

const kb = async (f) => Math.round((await stat(f)).size / 1024);
const rows = [];

async function photo(src, dest) {
  await mkdir(path.dirname(dest), { recursive: true });
  const info = await sharp(src)
    .rotate()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(dest);
  rows.push([
    path.relative(root, dest),
    await kb(src),
    await kb(dest),
    `${info.width}×${info.height}`,
  ]);
}

async function png(src, dest, size) {
  await mkdir(path.dirname(dest), { recursive: true });
  const info = await sharp(src)
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: true })
    .toFile(dest);
  rows.push([
    path.relative(root, dest),
    await kb(src),
    await kb(dest),
    `${info.width}×${info.height}`,
  ]);
}

async function copy(src, dest) {
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
  rows.push([path.relative(root, dest), await kb(src), await kb(dest), 'copied']);
}

const [argPhoto, argSlug] = process.argv.slice(2);
if (argPhoto) {
  if (!argSlug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(argSlug)) {
    console.error(
      'Usage: node scripts/optimize-images.mjs <photo> <slug>   (slug like "jane-doe")',
    );
    process.exit(1);
  }
  await photo(path.resolve(argPhoto), pub('images', 'people', `${argSlug}.jpg`));
} else {
  const assets = path.resolve(root, '..', 'astro-site', 'public', 'assets');
  if (!existsSync(assets)) {
    console.error(
      `Migration sources not found at ${assets}. Pass <photo> <slug> to add one photo.`,
    );
    process.exit(1);
  }
  const a = (f) => path.join(assets, f);

  // Team portraits, renamed to person slugs (data/team.json `photo`).
  await photo(a('DSCF0563-Beaus-Workstation.jpg'), pub('images', 'people', 'beau-schelble.jpg'));
  await photo(a('sarahHeadshot.jpg'), pub('images', 'people', 'sarah-mendoza.jpg'));
  await photo(a('yayunHeadshot.jpg'), pub('images', 'people', 'yayun-tian.jpg'));
  await photo(a('naveenaHeadshot.jpg'), pub('images', 'people', 'naveena-nagaraju.jpg'));

  // Logo: app icons (Next file conventions) and a 2× nav mark (rendered 46 px tall).
  await png(a('Frame 3.png'), path.join(root, 'app', 'icon.png'), 512);
  await png(a('Frame 3.png'), path.join(root, 'app', 'apple-icon.png'), 180);
  await png(a('Frame 3.png'), pub('images', 'logo-nav.png'), 92);

  // URLs that production JSON-LD, <link> tags or the manifest reference keep working:
  // the PI image (Person.image) and the logo (Organization.logo, rel=icon) at their old paths,
  // resized; the PWA icons unchanged. The headshots move to /images/people/ (308s in Phase 4).
  await photo(a('DSCF0563-Beaus-Workstation.jpg'), pub('assets', 'DSCF0563-Beaus-Workstation.jpg'));
  await png(a('Frame 3.png'), pub('assets', 'Frame 3.png'), 512);
  for (const f of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'])
    await copy(a(f), pub('assets', f));

  // Default social image, kept at its URL so cached previews keep working.
  await copy(path.resolve(assets, '..', 'og', 'arcs-lab-og.png'), pub('og', 'arcs-lab-og.png'));
  // downtownPic.jpg (15 MB, 6624×3860) is unreferenced and deliberately not carried over.
}

console.log('| File | Before | After | Size |');
console.log('|---|---|---|---|');
for (const [f, before, after, dims] of rows)
  console.log(`| \`${f}\` | ${before} KB | ${after} KB | ${dims} |`);
