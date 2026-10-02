#!/usr/bin/env node
// Full-page screenshots of every HTML route at 390 px and 1440 px.
//
//   node migration/scripts/capture-screens.mjs [baseUrl] [outDir]
//   defaults: https://arcslab.io  migration/baseline/screens
//
// Runs with prefers-reduced-motion: reduce so scroll reveals, count-ups and the hero canvas
// settle to their final state, which makes shots comparable between the Astro and Next sites.
// The page is scrolled to the bottom first so lazy content (PDF reader pages) renders.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRoutes } from './capture-seo.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] ?? 'https://arcslab.io').replace(/\/$/, '');
const outDir = path.resolve(process.argv[3] ?? path.join(here, '..', 'baseline', 'screens'));
const WIDTHS = [390, 1440];

const routeName = (r) => (r === '/' ? 'home' : r.slice(1).replace(/\//g, '__'));

await mkdir(outDir, { recursive: true });
const routes = await readRoutes();
const browser = await chromium.launch();
const failures = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  for (const route of routes) {
    const file = path.join(outDir, `${routeName(route)}__${width}.png`);
    try {
      await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: file, fullPage: true });
      process.stderr.write(`ok   ${width} ${route}\n`);
    } catch (err) {
      failures.push(`${width} ${route}: ${err.message.split('\n')[0]}`);
      process.stderr.write(`FAIL ${width} ${route}\n`);
    }
  }
  await context.close();
}
await browser.close();
console.log(`Captured ${routes.length * WIDTHS.length - failures.length}/${routes.length * WIDTHS.length} screenshots in ${outDir}`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
