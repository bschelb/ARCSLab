#!/usr/bin/env node
// Markdown table of the median Lighthouse run per URL, from `lhci upload --target=filesystem`.
// Written to the GitHub job summary instead of uploading reports: the reports embed the
// preview-bypass request header, and this repository is public.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? '.lighthouseci';
const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const pct = (v) => Math.round((v ?? 0) * 100);
const lines = [
  '| URL | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |',
  '|---|---|---|---|---|---|---|---|',
];
for (const run of manifest.filter((r) => r.isRepresentativeRun)) {
  const lhr = JSON.parse(readFileSync(run.jsonPath, 'utf8'));
  const a = lhr.audits;
  const s = run.summary;
  lines.push(
    `| \`${new URL(run.url).pathname}\` | ${pct(s.performance)} | ${pct(s.accessibility)} | ${pct(s['best-practices'])} | ${pct(s.seo)} | ${(a['largest-contentful-paint'].numericValue / 1000).toFixed(2)} s | ${a['cumulative-layout-shift'].numericValue.toFixed(3)} | ${Math.round(a['total-blocking-time'].numericValue)} ms |`,
  );
}
console.log(lines.join('\n'));
