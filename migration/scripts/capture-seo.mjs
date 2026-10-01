#!/usr/bin/env node
// Capture the SEO surface of every HTML route into a deterministic JSON baseline.
//
//   node migration/scripts/capture-seo.mjs [baseUrl] [outFile]
//   defaults: https://arcslab.io  migration/seo-baseline.json
//
// Routes come from the "## html-routes" section of migration/url-inventory.txt.
// For each route it records: HTTP status, <title>, meta description/robots/keywords/author/
// theme-color, canonical and other <link rel> targets, every og:* / twitter:* / citation_* /
// dc.* meta (repeated names become arrays, in document order), and parsed JSON-LD blocks.
// Object keys are sorted recursively so the file diffs cleanly between runs.
// Zero dependencies (Node 18+ global fetch). The Phase 4 parity check reuses extractSeo().

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.resolve(here, '..');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', copy: '©' };
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  // skip the tag name itself
  const body = tag.replace(/^<\s*[a-zA-Z]+/, '').replace(/\/?>$/, '');
  let m;
  while ((m = re.exec(body))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

export function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, sortKeys(v[k])]),
    );
  }
  return v;
}

function push(map, key, value) {
  if (!(key in map)) map[key] = value;
  else if (Array.isArray(map[key])) map[key].push(value);
  else map[key] = [map[key], value];
}

/** Extract the SEO-relevant parts of an HTML document. */
export function extractSeo(html) {
  const headEnd = html.search(/<\/head\s*>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;

  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const out = {
    title: titleMatch ? decodeEntities(titleMatch[1].trim()) : null,
    description: null,
    robots: null,
    keywords: null,
    author: null,
    themeColor: null,
    canonical: null,
    links: {},
    og: {},
    twitter: {},
    citation: {},
    dc: {},
    jsonld: [],
  };

  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = parseAttrs(tag);
    const key = a.property ?? a.name;
    if (!key || a.content === undefined) continue;
    const k = key.toLowerCase();
    if (k === 'description') out.description = a.content;
    else if (k === 'robots') out.robots = a.content;
    else if (k === 'keywords') out.keywords = a.content;
    else if (k === 'author') out.author = a.content;
    else if (k === 'theme-color') out.themeColor = a.content;
    else if (k.startsWith('og:') || k.startsWith('article:')) push(out.og, key, a.content);
    else if (k.startsWith('twitter:')) push(out.twitter, key, a.content);
    else if (k.startsWith('citation_')) push(out.citation, key, a.content);
    else if (k.startsWith('dc.') || k.startsWith('dcterms.')) push(out.dc, key, a.content);
  }

  for (const [tag] of head.matchAll(/<link\b[^>]*>/gi)) {
    const a = parseAttrs(tag);
    if (!a.rel || !a.href) continue;
    const rel = a.rel.toLowerCase();
    if (rel === 'stylesheet' || rel === 'preload' || rel === 'preconnect' || rel === 'modulepreload') continue;
    if (rel === 'canonical') out.canonical = a.href;
    else push(out.links, a.sizes ? `${rel} ${a.sizes}` : rel, a.href);
  }

  // JSON-LD may sit in <head> (site graph, breadcrumbs) or <body>; scan the whole document.
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const a = parseAttrs(`<script ${m[1]}>`);
    if ((a.type ?? '').toLowerCase() !== 'application/ld+json') continue;
    try {
      out.jsonld.push(JSON.parse(m[2]));
    } catch (err) {
      out.jsonld.push({ __parseError: String(err), raw: m[2] });
    }
  }
  return out;
}

export async function readRoutes(inventoryFile = path.join(migrationDir, 'url-inventory.txt')) {
  const text = await readFile(inventoryFile, 'utf8');
  const routes = [];
  let inHtml = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      inHtml = line.startsWith('## html-routes');
      continue;
    }
    if (inHtml && line.startsWith('/')) routes.push(line.trim());
  }
  return routes;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    }),
  );
  return results;
}

async function main() {
  const base = (process.argv[2] ?? 'https://arcslab.io').replace(/\/$/, '');
  const outFile = path.resolve(process.argv[3] ?? path.join(migrationDir, 'seo-baseline.json'));
  const routes = await readRoutes();

  const pages = {};
  await mapLimit(routes, 6, async (route) => {
    const res = await fetch(base + route, { redirect: 'follow', headers: { 'user-agent': 'arcslab-seo-baseline/1.0' } });
    const html = await res.text();
    pages[route] = { status: res.status, ...extractSeo(html) };
    process.stderr.write(`${res.status} ${route}\n`);
  });

  const failures = Object.entries(pages).filter(([, p]) => p.status !== 200);
  const baseline = sortKeys({ base, routeCount: routes.length, pages });
  await writeFile(outFile, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`Wrote ${routes.length} routes to ${path.relative(process.cwd(), outFile)}`);
  if (failures.length) {
    console.error(`Non-200 routes: ${failures.map(([r, p]) => `${r} (${p.status})`).join(', ')}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
