#!/usr/bin/env node
// Copy the PDF.js runtime from the installed pdfjs-dist into public/pdfjs/ (gitignored).
// Runs before `dev` and `build`, so Dependabot keeps the reader's PDF.js patched instead of a
// hand-vendored copy going stale. The paper reader loads /pdfjs/pdf.min.mjs at runtime.

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
const { version } = JSON.parse(await readFile(path.join(pkgDir, 'package.json'), 'utf8'));
const outDir = path.join(root, 'public', 'pdfjs');
const FILES = ['pdf.min.mjs', 'pdf.worker.min.mjs'];

await mkdir(outDir, { recursive: true });
for (const file of FILES) {
  await copyFile(path.join(pkgDir, 'build', file), path.join(outDir, file));
}
// Kept for URL parity with the Astro site, which served /pdfjs/SOURCE.txt.
await writeFile(
  path.join(outDir, 'SOURCE.txt'),
  `Copied from pdfjs-dist v${version} (npm) by web/scripts/copy-pdfjs.mjs. Files: ${FILES.join(', ')}.\n` +
    'These are static runtime assets loaded by /papers/[slug] via dynamic import.\n' +
    'To update: bump pdfjs-dist in web/package.json; the copy runs before every dev and build.\n',
);
console.log(`copy-pdfjs: pdfjs-dist v${version} -> public/pdfjs/`);
