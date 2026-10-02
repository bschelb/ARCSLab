#!/usr/bin/env tsx
// Content validation (plan section 5): schema, integrity, emoji guard.
// Errors exit 1 (and fail `npm run build`, which runs this first); warnings print.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fundingJson from '../data/funding.json';
import joinJson from '../data/join.json';
import newsJson from '../data/news.json';
import publicationsJson from '../data/publications.json';
import researchJson from '../data/research.json';
import talksJson from '../data/talks.json';
import teamJson from '../data/team.json';
import { validateContent } from '../lib/validate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { errors, warnings } = validateContent(
  {
    'publications.json': publicationsJson,
    'research.json': researchJson,
    'team.json': teamJson,
    'funding.json': fundingJson,
    'talks.json': talksJson,
    'news.json': newsJson,
    'join.json': joinJson,
  },
  path.join(root, 'public'),
);

for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(`validate:data: ${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length) process.exit(1);
