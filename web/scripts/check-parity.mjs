#!/usr/bin/env node
// URL and SEO parity against the production baseline (plan Phase 4, step 5).
//
//   node scripts/check-parity.mjs <baseUrl> [--robots=production|preview]
//
// a. Every path in migration/url-inventory.txt returns 200, or a 301/308 to a same-site URL
//    that returns 200.
// b. Every HTML route matches migration/seo-baseline.json for title, description, canonical,
//    robots, og:*, twitter:*, citation_*, dc.*, keywords, author, theme-color and JSON-LD
//    (deep-equal, key order ignored). Generated share images (og:image*, twitter:image*) are
//    an intentional difference and are reported separately.
// Set VERCEL_AUTOMATION_BYPASS_SECRET to test a protected Vercel preview.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { extractSeo, sortKeys } from '../../migration/scripts/capture-seo.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const migration = path.resolve(here, '..', '..', 'migration');
const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000').replace(/\/$/, '');
const robotsMode = args.find((a) => a.startsWith('--robots='))?.split('=')[1] ?? 'production';
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = {
  'user-agent': 'arcslab-parity/1.0',
  ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
};

/** Paths deliberately not carried over, with the reason (also logged in PROGRESS.md). */
const INTENTIONAL_MISSING = {
  '/assets/downtownPic.jpg': 'unused 15 MB hero photo, never referenced (Phase 2)',
  '/CNAME': 'GitHub Pages custom-domain file; Vercel sets the domain in project settings',
};
const PREVIEW_ROBOTS = 'noindex, nofollow';
const IMAGE_KEY = /^(og:image|twitter:image)/;

const inventory = await readFile(path.join(migration, 'url-inventory.txt'), 'utf8');
const sections = {};
let current = '';
for (const line of inventory.split('\n')) {
  if (line.startsWith('## ')) current = line.slice(3).split(' ')[0];
  else if (line.startsWith('/')) (sections[current] ??= []).push(line.trim());
}
const baseline = JSON.parse(await readFile(path.join(migration, 'seo-baseline.json'), 'utf8'));

const problems = [];
const notes = [];

async function fetchManual(url) {
  return fetch(url, { redirect: 'manual', headers });
}

// ── a. URL inventory ──────────────────────────────────────────────────────
const allPaths = Object.values(sections).flat();
let urlOk = 0;
for (const p of allPaths) {
  const res = await fetchManual(base + p);
  if (res.status === 200) {
    urlOk++;
    continue;
  }
  if ([301, 302, 307, 308].includes(res.status)) {
    const loc = res.headers.get('location') ?? '';
    const target = new URL(loc, base + p);
    const final = await fetch(target.href.replace(/^https:\/\/arcslab\.io/, base), { headers });
    if (res.status === 308 || res.status === 301) {
      if (final.status === 200) {
        urlOk++;
        notes.push(`redirect ${p} → ${target.pathname} (${res.status} → 200)`);
        continue;
      }
    }
    problems.push(`URL ${p}: ${res.status} → ${target.pathname} → ${final.status}`);
    continue;
  }
  if (INTENTIONAL_MISSING[p] && res.status === 404) {
    notes.push(`intentional 404 ${p}: ${INTENTIONAL_MISSING[p]}`);
    urlOk++;
    continue;
  }
  problems.push(`URL ${p}: HTTP ${res.status}`);
}

// ── b. SEO parity ─────────────────────────────────────────────────────────
const imageDiffs = new Set();
function compareMap(route, label, want = {}, got = {}) {
  const keys = new Set([...Object.keys(want), ...Object.keys(got)]);
  for (const k of keys) {
    if (IMAGE_KEY.test(k)) {
      if (!isDeepStrictEqual(want[k], got[k])) imageDiffs.add(k);
      continue;
    }
    if (!isDeepStrictEqual(want[k], got[k])) {
      problems.push(
        `${route} ${label} ${k}: expected ${JSON.stringify(want[k])}, got ${JSON.stringify(got[k])}`,
      );
    }
  }
}
const canon = (nodes) => nodes.map((n) => JSON.stringify(sortKeys(n))).sort();

let seoOk = 0;
for (const route of sections['html-routes'] ?? []) {
  const want = baseline.pages[route];
  const res = await fetch(base + route, { headers });
  const got = { status: res.status, ...extractSeo(await res.text()) };
  const before = problems.length;
  if (got.status !== 200) problems.push(`${route}: HTTP ${got.status}`);
  for (const field of ['title', 'description', 'canonical', 'keywords', 'author', 'themeColor']) {
    if (want[field] !== got[field])
      problems.push(
        `${route} ${field}: expected ${JSON.stringify(want[field])}, got ${JSON.stringify(got[field])}`,
      );
  }
  const wantRobots = robotsMode === 'production' ? want.robots : PREVIEW_ROBOTS;
  if (got.robots !== wantRobots)
    problems.push(
      `${route} robots: expected ${JSON.stringify(wantRobots)}, got ${JSON.stringify(got.robots)}`,
    );
  compareMap(route, 'og', want.og, got.og);
  compareMap(route, 'twitter', want.twitter, got.twitter);
  compareMap(route, 'citation', want.citation, got.citation);
  compareMap(route, 'dc', want.dc, got.dc);
  const wj = canon(want.jsonld);
  const gj = canon(got.jsonld);
  if (!isDeepStrictEqual(wj, gj)) {
    const missing = wj
      .filter((x) => !gj.includes(x))
      .map((x) => JSON.parse(x)['@type'] ?? '@graph');
    const extra = gj.filter((x) => !wj.includes(x)).map((x) => JSON.parse(x)['@type'] ?? '@graph');
    problems.push(
      `${route} JSON-LD differs (missing: ${missing.join(', ') || '—'}; unexpected: ${extra.join(', ') || '—'})`,
    );
  }
  if (problems.length === before) seoOk++;
}

// ── report ────────────────────────────────────────────────────────────────
const html = sections['html-routes']?.length ?? 0;
console.log(`Parity vs ${base} (robots: ${robotsMode}${bypass ? ', with preview bypass' : ''})`);
console.log(`  URLs:  ${urlOk}/${allPaths.length} resolve`);
console.log(`  SEO:   ${seoOk}/${html} routes identical (excluding generated share images)`);
if (imageDiffs.size)
  console.log(`  Intentional: generated share images change ${[...imageDiffs].sort().join(', ')}`);
for (const n of notes) console.log(`  note  ${n}`);
if (problems.length) {
  console.log(`\n${problems.length} unexpected difference(s):`);
  for (const p of problems.slice(0, 200)) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\nOK: no unexpected differences.');
