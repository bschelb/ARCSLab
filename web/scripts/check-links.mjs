#!/usr/bin/env node
// Link check (plan Phase 6, step 5). Crawls every URL in <base>/sitemap.xml, collects every
// <a href>, and requests each unique target once.
//   - Internal links (same origin, or https://arcslab.io/...) must resolve (2xx after
//     redirects): any failure exits 1.
//   - External links are reported, never fatal: remote sites rate-limit, block bots, or are
//     briefly down.
//
//   node scripts/check-links.mjs [baseUrl] [--no-external]
// Set VERCEL_AUTOMATION_BYPASS_SECRET to check a protected Vercel preview.

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000').replace(/\/$/, '');
const external = !args.includes('--no-external');
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = {
  'user-agent': 'arcslab-linkcheck/1.0 (+https://arcslab.io)',
  ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
};
const SITE = 'https://arcslab.io';

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');

const sitemap = await (await fetch(`${base}/sitemap.xml`, { headers })).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, base));

/** target URL → first page that links to it */
const internalLinks = new Map();
const externalLinks = new Map();
for (const page of pages) {
  const html = await (await fetch(page, { headers })).text();
  for (const [, raw] of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    const href = decode(raw);
    if (/^(mailto:|tel:|#|javascript:)/.test(href)) continue;
    const url = new URL(href, page);
    url.hash = '';
    const abs = url.href.replace(SITE, base);
    const from = page.replace(base, '') || '/';
    if (abs.startsWith(base)) {
      if (!internalLinks.has(abs)) internalLinks.set(abs, from);
    } else if (!externalLinks.has(abs)) externalLinks.set(abs, from);
  }
}

async function status(url, extra = {}) {
  const ctl = AbortSignal.timeout(15_000);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctl, ...extra });
    if (res.status === 405 || res.status === 403 || res.status === 404)
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctl, ...extra });
    return res.status;
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code ?? e.message);
  }
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const item = items[i++];
        out.push([item, await fn(item)]);
      }
    }),
  );
  return out;
}

const internalResults = await pool([...internalLinks.keys()], 8, (u) => status(u, { headers }));
const brokenInternal = internalResults.filter(([, s]) => !(typeof s === 'number' && s < 400));

console.log(`Link check vs ${base}${bypass ? ' (with preview bypass)' : ''}`);
console.log(`  pages crawled:   ${pages.length}`);
console.log(`  internal links:  ${internalLinks.size} unique, ${brokenInternal.length} broken`);
for (const [u, s] of brokenInternal)
  console.log(`  ✗ ${s} ${u.replace(base, '')}  (linked from ${internalLinks.get(u)})`);

if (external) {
  const ext = await pool([...externalLinks.keys()], 6, (u) =>
    status(u, { headers: { 'user-agent': headers['user-agent'] } }),
  );
  const bad = ext.filter(([, s]) => !(typeof s === 'number' && s < 400));
  console.log(
    `  external links:  ${externalLinks.size} unique, ${bad.length} not OK (reported only)`,
  );
  for (const [u, s] of bad) console.log(`  ! ${s} ${u}  (linked from ${externalLinks.get(u)})`);
}

if (brokenInternal.length) process.exit(1);
console.log('\nOK: every internal link resolves.');
