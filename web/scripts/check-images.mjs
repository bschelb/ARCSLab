#!/usr/bin/env node
// Largest delivered image (plan 4.5 budget: 300 kB). Crawls every sitemap URL, collects each
// <img> src and the largest srcset candidate (what a 2x phone or desktop would fetch),
// requests it the way a modern browser does (Accept: AVIF/WebP), and reports the heaviest.
//
//   node scripts/check-images.mjs [baseUrl]
// Set VERCEL_AUTOMATION_BYPASS_SECRET to check a protected Vercel preview.

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = {
  accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
  ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
};
const BUDGET = 300 * 1024;
const decode = (s) => s.replace(/&amp;/g, '&');

const sitemap = await (await fetch(`${base}/sitemap.xml`, { headers })).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace('https://arcslab.io', base),
);

const images = new Map();
for (const page of pages) {
  const html = await (await fetch(page, { headers })).text();
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    const srcset = /srcset="([^"]+)"/i.exec(tag)?.[1];
    const src = /\ssrc="([^"]+)"/i.exec(tag)?.[1];
    let pick = src;
    if (srcset) {
      const cands = decode(srcset)
        .split(',')
        .map((c) => c.trim().split(/\s+/))
        .map(([u, d]) => [u, parseFloat(d ?? '1')]);
      cands.sort((a, b) => b[1] - a[1]);
      pick = cands[0]?.[0] ?? src;
    }
    if (!pick || pick.startsWith('data:')) continue;
    const url = new URL(decode(pick), page).href;
    if (!images.has(url)) images.set(url, page.replace(base, '') || '/');
  }
}
// The terrain heightmap is fetched by script, not an <img>: include it too.
images.set(`${base}/terrain/east-tn.webp`, '(terrain canvas)');

const sizes = [];
for (const [url, from] of images) {
  const res = await fetch(url, { headers });
  const bytes = (await res.arrayBuffer()).byteLength;
  sizes.push({ url: url.replace(base, ''), from, bytes, type: res.headers.get('content-type') });
}
sizes.sort((a, b) => b.bytes - a.bytes);
console.log(`Images vs ${base}: ${sizes.length} unique`);
for (const s of sizes.slice(0, 8))
  console.log(
    `  ${s.bytes > BUDGET ? 'OVER' : 'ok  '} ${(s.bytes / 1024).toFixed(1).padStart(6)} kB  ${s.type}  ${s.url}  (${s.from})`,
  );
if (sizes.some((s) => s.bytes > BUDGET)) process.exit(1);
console.log(`\nOK: largest image ${(sizes[0].bytes / 1024).toFixed(1)} kB (budget 300 kB).`);
