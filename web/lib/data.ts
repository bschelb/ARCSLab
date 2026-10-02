/**
 * Typed, validated content. Every `data/*.json` file is parsed through its Zod schema when
 * this module loads, so a bad edit fails `next build` (and `npm run validate:data`) with a
 * readable message instead of rendering wrong. Pages import content from here, never from
 * the JSON directly.
 */
import type { z } from 'zod';
import fundingJson from '@/data/funding.json';
import joinJson from '@/data/join.json';
import newsJson from '@/data/news.json';
import publicationsJson from '@/data/publications.json';
import researchJson from '@/data/research.json';
import talksJson from '@/data/talks.json';
import teamJson from '@/data/team.json';
import {
  fundingSchema,
  joinSchema,
  newsSchema,
  publicationsSchema,
  researchAreasSchema,
  talksSchema,
  teamSchema,
} from './schemas';

export class DataValidationError extends Error {}

export function parseData<T extends z.ZodType>(file: string, schema: T, raw: unknown): z.infer<T> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  const issues = result.error.issues
    .map((i) => `  • data/${file} → ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new DataValidationError(`Invalid content in data/${file}:\n${issues}`);
}

export const publications = parseData('publications.json', publicationsSchema, publicationsJson);
export const researchAreas = parseData('research.json', researchAreasSchema, researchJson);
export const team = parseData('team.json', teamSchema, teamJson);
export const grants = parseData('funding.json', fundingSchema, fundingJson).grants;
export const talks = parseData('talks.json', talksSchema, talksJson);
export const news = parseData('news.json', newsSchema, newsJson);
export const join = parseData('join.json', joinSchema, joinJson);
