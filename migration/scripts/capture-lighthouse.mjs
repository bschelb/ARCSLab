#!/usr/bin/env node
// Mobile Lighthouse baselines for the plan's key routes (median of 3 runs by performance score).
//
//   node migration/scripts/capture-lighthouse.mjs [baseUrl] [outDir]
//   defaults: https://arcslab.io  migration/baseline/lighthouse
//
// Writes <route>.json (the full median LHR) per route and summary.json, and prints a Markdown
// table for PROGRESS.md. Uses the locally installed Chrome via chrome-launcher.

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] ?? 'https://arcslab.io').replace(/\/$/, '');
const outDir = path.resolve(process.argv[3] ?? path.join(here, '..', 'baseline', 'lighthouse'));
const ROUTES = ['/', '/publications', '/papers/schelble-2022-lets-think-together', '/team', '/contact'];
const RUNS = 3;

const routeName = (r) => (r === '/' ? 'home' : r.slice(1).replace(/\//g, '__'));
const pct = (s) => Math.round((s ?? 0) * 100);

await mkdir(outDir, { recursive: true });
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run'] });
const summary = {};

try {
  for (const route of ROUTES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const { lhr } = await lighthouse(base + route, { port: chrome.port, output: 'json', logLevel: 'error' });
      runs.push(lhr);
      process.stderr.write(`run ${i + 1} ${route}: perf ${pct(lhr.categories.performance.score)}\n`);
    }
    runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
    const lhr = runs[Math.floor(RUNS / 2)];
    await writeFile(path.join(outDir, `${routeName(route)}.json`), JSON.stringify(lhr));
    const a = lhr.audits;
    summary[route] = {
      performance: pct(lhr.categories.performance.score),
      accessibility: pct(lhr.categories.accessibility.score),
      bestPractices: pct(lhr.categories['best-practices'].score),
      seo: pct(lhr.categories.seo.score),
      lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
      cls: Number(a['cumulative-layout-shift'].numericValue.toFixed(3)),
      tbtMs: Math.round(a['total-blocking-time'].numericValue),
      totalKB: Math.round(a['total-byte-weight'].numericValue / 1024),
      lighthouseVersion: lhr.lighthouseVersion,
    };
  }
} finally {
  await chrome.kill();
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log('| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | Page weight |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const [route, s] of Object.entries(summary)) {
  console.log(
    `| \`${route}\` | ${s.performance} | ${s.accessibility} | ${s.bestPractices} | ${s.seo} | ${(s.lcpMs / 1000).toFixed(1)} s | ${s.cls} | ${s.tbtMs} ms | ${s.totalKB} KB |`,
  );
}
