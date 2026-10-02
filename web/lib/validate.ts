/**
 * Content integrity checks (plan section 5). Errors fail `validate:data` and the build;
 * warnings print. Used by scripts/validate-data.ts and the unit tests.
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { z } from 'zod';
import {
  fundingSchema,
  joinSchema,
  newsSchema,
  publicationsSchema,
  researchAreasSchema,
  talksSchema,
  teamSchema,
} from './schemas';

export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

/** The raw JSON of every content file, keyed by file name. */
export interface RawContent {
  'publications.json': unknown;
  'research.json': unknown;
  'team.json': unknown;
  'funding.json': unknown;
  'talks.json': unknown;
  'news.json': unknown;
  'join.json': unknown;
}

const EMOJI = /\p{Extended_Pictographic}/u;

/** Author count in a house-format display string: one per "Surname, I." pair. */
export function displayAuthorCount(authors: string): number {
  return (authors.match(/[A-Z][A-Za-z'’ -]*?, (?:[A-Z]\.(?:\s?-?[A-Z]\.)*)/g) ?? []).length;
}

function walkStrings(value: unknown, at: string, visit: (s: string, at: string) => void): void {
  if (typeof value === 'string') visit(value, at);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${at}[${i}]`, visit));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, at ? `${at}.${k}` : k, visit);
  }
}

function walkDrafts(value: unknown, at: string, visit: (at: string) => void): void {
  if (Array.isArray(value)) value.forEach((v, i) => walkDrafts(v, `${at}[${i}]`, visit));
  else if (value && typeof value === 'object') {
    if ((value as { draft?: unknown }).draft === true) visit(at || '(root)');
    for (const [k, v] of Object.entries(value)) walkDrafts(v, at ? `${at}.${k}` : k, visit);
  }
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) (seen.has(v) ? dup : seen).add(v);
  return [...dup];
}

/**
 * Validate all content. `publicDir` is the app's `public/` folder (PDFs and photos are
 * checked on disk there).
 */
export function validateContent(raw: RawContent, publicDir: string): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  function parse<T extends z.ZodType>(file: keyof RawContent, schema: T): z.infer<T> | undefined {
    const r = schema.safeParse(raw[file]);
    if (r.success) return r.data;
    for (const i of r.error.issues)
      errors.push(`data/${file} → ${i.path.join('.') || '(root)'}: ${i.message}`);
    return undefined;
  }

  // Emoji anywhere in data (icons come from the SVG set).
  for (const [file, data] of Object.entries(raw)) {
    walkStrings(data, '', (s, at) => {
      if (EMOJI.test(s))
        errors.push(
          `data/${file} → ${at}: contains an emoji (${JSON.stringify(s.match(EMOJI)?.[0])})`,
        );
    });
  }

  const pubs = parse('publications.json', publicationsSchema);
  const areas = parse('research.json', researchAreasSchema);
  const team = parse('team.json', teamSchema);
  const funding = parse('funding.json', fundingSchema);
  const talks = parse('talks.json', talksSchema);
  const news = parse('news.json', newsSchema);
  parse('join.json', joinSchema);

  // Drafts are hidden in production; list them so they are not forgotten.
  for (const [file, data] of Object.entries(raw)) {
    walkDrafts(data, '', (at) =>
      warnings.push(`data/${file} → ${at}: draft (hidden in production)`),
    );
  }

  const pubIds = new Set(pubs?.map((p) => p.id) ?? []);

  if (pubs) {
    for (const d of duplicates(pubs.map((p) => p.id)))
      errors.push(`data/publications.json: duplicate id "${d}"`);
    for (const p of pubs) {
      if (p.pdf) {
        if (p.pdf !== `${p.id}.pdf`)
          errors.push(
            `data/publications.json → ${p.id}: pdf must be "${p.id}.pdf" (the id is the PDF basename), got "${p.pdf}"`,
          );
        if (!existsSync(path.join(publicDir, 'papers', p.pdf)))
          errors.push(
            `data/publications.json → ${p.id}: pdf "${p.pdf}" is missing from public/papers/`,
          );
      }
      const shown = displayAuthorCount(p.authors);
      if (shown !== p.authorsList.length)
        errors.push(
          `data/publications.json → ${p.id}: authors shows ${shown} name(s) but authorsList has ${p.authorsList.length}`,
        );
    }
    const papersDir = path.join(publicDir, 'papers');
    if (existsSync(papersDir)) {
      const referenced = new Set(pubs.flatMap((p) => (p.pdf ? [p.pdf] : [])));
      for (const f of readdirSync(papersDir)) {
        if (f.endsWith('.pdf') && !referenced.has(f))
          warnings.push(`public/papers/${f} is not referenced by any publication`);
      }
    }
  }

  if (areas) {
    for (const d of duplicates(areas.map((a) => a.slug)))
      errors.push(`data/research.json: duplicate slug "${d}"`);
    for (const a of areas) {
      for (const pub of a.pubs) {
        if (pub.paperId && !pubIds.has(pub.paperId))
          errors.push(
            `data/research.json → ${a.slug}: paperId "${pub.paperId}" is not a publication id`,
          );
      }
    }
    if (pubs) {
      const tags = new Set(areas.flatMap((a) => a.matchTags));
      for (const p of pubs) {
        if (!p.tags.some((t) => tags.has(t)))
          warnings.push(
            `data/publications.json → ${p.id}: no tag matches a research area (tags: ${p.tags.join(', ') || 'none'})`,
          );
      }
    }
  }

  if (team) {
    for (const d of duplicates(team.people.map((p) => p.slug)))
      errors.push(`data/team.json: duplicate slug "${d}"`);
    if (team.people.filter((p) => p.group === 'pi').length !== 1)
      errors.push('data/team.json: exactly one person must have group "pi"');
    for (const p of team.people) {
      if (p.photo && !existsSync(path.join(publicDir, p.photo)))
        errors.push(`data/team.json → ${p.slug}: photo "${p.photo}" is missing from public/`);
      if (pubs && p.authorAliases) {
        for (const alias of p.authorAliases) {
          if (!pubs.some((x) => x.authorsList.includes(alias)))
            errors.push(
              `data/team.json → ${p.slug}: author alias "${alias}" appears in no authorsList`,
            );
        }
      }
      if (!p.authorAliases?.length)
        warnings.push(
          `data/team.json → ${p.slug}: no author alias, so no publications are matched to this person`,
        );
    }
    const memberNames = new Set(team.people.map((p) => p.name.replace(/^Dr\.\s+/, '')));
    for (const c of team.collaborators) {
      if (memberNames.has(c.name))
        errors.push(
          `data/team.json: "${c.name}" is listed as both a lab member and a collaborator`,
        );
    }
  }

  if (funding) {
    for (const d of duplicates(funding.grants.map((g) => g.id)))
      errors.push(`data/funding.json: duplicate id "${d}"`);
    for (const g of funding.grants) {
      for (const id of g.relatedPublications ?? []) {
        if (!pubIds.has(id))
          errors.push(
            `data/funding.json → ${g.id}: relatedPublications "${id}" is not a publication id`,
          );
      }
    }
  }

  if (talks && news) {
    for (const d of duplicates([...talks, ...news].map((n) => n.id)))
      errors.push(`data/talks.json + news.json: duplicate id "${d}"`);
    for (const n of [...talks, ...news]) {
      const m = n.link && /^\/papers\/([^/]+)$/.exec(n.link);
      if (m?.[1] && !pubIds.has(m[1]))
        errors.push(
          `data/${talks.includes(n) ? 'talks' : 'news'}.json → ${n.id}: links to unknown paper "${m[1]}"`,
        );
    }
  }

  return { errors, warnings };
}
