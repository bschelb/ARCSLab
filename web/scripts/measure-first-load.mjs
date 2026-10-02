#!/usr/bin/env node
// First-load JavaScript per route (plan 4.5 budget: 150 kB gzipped per content route).
// Sums the gzipped size of every <script src> a prerendered page loads, skipping noModule
// polyfills (modern browsers never fetch them). PDF.js is excluded by the plan: it is not a
// <script src>, it loads lazily from /pdfjs on paper pages only.
//
//   node scripts/measure-first-load.mjs [--json]   (after `next build`)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appDir = path.join(root, '.next/server/app');
const BUDGET = 150 * 1024;
const pages = [
  ['/', 'index.html'],
  ...['research', 'publications', 'team', 'pi', 'funding', 'talks', 'contact', 'join'].map((p) => [
    `/${p}`,
    `${p}.html`,
  ]),
  ['/research/human-ai-teaming', 'research/human-ai-teaming.html'],
  ['/team/sarah-mendoza', 'team/sarah-mendoza.html'],
  ['/papers/schelble-2022-lets-think-together', 'papers/schelble-2022-lets-think-together.html'],
];
const gz = new Map();
const size = (src) => {
  if (!gz.has(src)) {
    const file = path.join(root, '.next', src.replace(/^\/_next\//, ''));
    gz.set(src, existsSync(file) ? gzipSync(readFileSync(file)).length : 0);
  }
  return gz.get(src);
};
const rows = pages.map(([route, file]) => {
  const html = readFileSync(path.join(appDir, file), 'utf8');
  const srcs = [...html.matchAll(/<script([^>]*)src="([^"]+)"([^>]*)>/g)]
    .filter((m) => !/noModule/i.test(m[1] + m[3]))
    .map((m) => m[2])
    .filter((s) => s.startsWith('/_next/'));
  const bytes = [...new Set(srcs)].reduce((n, s) => n + size(s), 0);
  return { route, kB: +(bytes / 1024).toFixed(1), ok: bytes <= BUDGET };
});
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else
  for (const r of rows)
    console.log(`${r.ok ? 'ok  ' : 'OVER'} ${String(r.kB).padStart(6)} kB  ${r.route}`);
if (rows.some((r) => !r.ok)) process.exit(1);
void readdirSync;
