/**
 * Pure helpers for publication records, ported from `astro-site/src/lib/papers.ts`.
 *
 * Output is byte-identical to the Astro versions (proved by tests/unit/parity.test.ts), with
 * one deliberate change: author marking returns structured segments instead of an HTML
 * string, so components render the mark without `dangerouslySetInnerHTML`.
 */
import type { PaperType, Person, Publication } from './schemas';

export type { PaperType, Publication };
/** Alias kept for readability where the Astro code said `Paper`. */
export type Paper = Publication;

/** Slugify a string the same way the personal site does (stable URLs). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** The structured author list, falling back to a parse of the display string. */
export function authorList(p: Pick<Paper, 'authors' | 'authorsList'>): string[] {
  if (p.authorsList?.length) return p.authorsList;
  return p.authors
    .replace(/&/g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function bibtexAuthor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  return `${last}, ${parts.slice(0, -1).join(' ')}`;
}

/** Generate a BibTeX entry for a paper (entry type chosen from `type`). */
export function toBibtex(p: Paper): string {
  const authors = authorList(p);
  const first = authors[0]?.split(/\s+/).pop()?.toLowerCase() ?? 'schelble';
  const key = `${first}${p.year}${slugify(p.title).split('-')[0]}`;
  const bibAuthors = authors.map(bibtexAuthor).join(' and ');
  const fields: [string, string][] = [
    ['title', p.title],
    ['author', bibAuthors],
    ['year', String(p.year)],
  ];
  let entryType = 'article';
  if (p.type === 'journal') {
    fields.push(['journal', p.venue]);
  } else if (p.type === 'conference' || p.type === 'workshop') {
    entryType = 'inproceedings';
    fields.push(['booktitle', p.venue]);
  } else {
    entryType = 'incollection';
    fields.push(['booktitle', p.venue]);
  }
  if (p.doi) fields.push(['doi', p.doi]);
  else if (p.url) fields.push(['url', p.url]);
  const body = fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n');
  return `@${entryType}{${key},\n${body}\n}`;
}

/** Related papers sharing the most tags, then most recent first. */
export function getRelated(paper: Paper, all: Paper[], limit = 4): Paper[] {
  const tags = paper.tags ?? [];
  if (!tags.length) return [];
  return all
    .filter((p) => p.id !== paper.id)
    .map((p) => ({ p, score: (p.tags ?? []).filter((t) => tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.p.year) - Number(a.p.year))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Human-readable label for a paper type (used in chips/headers). */
export function typeLabel(type: PaperType): string {
  switch (type) {
    case 'journal':
      return 'Journal Article';
    case 'conference':
      return 'Conference Paper';
    case 'workshop':
      return 'Workshop Paper';
    case 'book chapter':
      return 'Book Chapter';
    default:
      return type;
  }
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Everyone whose name earns a lab mark: the PI plus current members and alumni, in
 * roster order. Collaborators are never included.
 */
export function labRoster(people: Pick<Person, 'name'>[]): string[] {
  return people.map((m) => m.name.replace(/^Dr\.\s+/, ''));
}

/** One run of an author string; `isLabMember` runs get the lab mark after them. */
export interface AuthorSegment {
  text: string;
  isLabMember: boolean;
}

/**
 * Split a display author string into segments, flagging every ARCS Lab member.
 *
 * This is the lab's site, so the mark goes on the whole group (PI included) rather than
 * singling anyone out. Pass `labRoster(team.people)`. Handles both the full house format
 * ("Mendoza, S., Schelble, B.G., …"), matched on surname + first initial with optional
 * middle initials, and the short surname-only lists in research.json ("Schelble, Mallick,
 * & McNeese"). A same-surname author with a different first initial is not marked.
 */
export function markLabMembers(authors: string, memberNames: string[]): AuthorSegment[] {
  const patterns: string[] = [];
  for (const full of memberNames) {
    const parts = full.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    const initial = parts[0]?.[0];
    if (!last || !initial || parts.length < 2) continue;
    const l = escapeRegExp(last);
    patterns.push(`\\b${l}\\b(?!, (?!${initial}\\.)[A-Z]\\.)(?:, ${initial}\\.(?:\\s?[A-Z]\\.)*)?`);
  }
  if (!patterns.length) return [{ text: authors, isLabMember: false }];

  const segments: AuthorSegment[] = [];
  const re = new RegExp(patterns.join('|'), 'g');
  let last = 0;
  for (const m of authors.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: authors.slice(last, start), isLabMember: false });
    segments.push({ text: m[0], isLabMember: true });
    last = start + m[0].length;
  }
  if (last < authors.length) segments.push({ text: authors.slice(last), isLabMember: false });
  return segments;
}

/**
 * APA 7–style reference. The curated `authors` string is already in APA author format
 * ("Schelble, B.G., Flathmann, C., & McNeese, N.J."), so it is used as-is.
 */
export function toApa(p: Paper): string {
  const end = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);
  const link = p.doi ? ` https://doi.org/${p.doi}` : p.url ? ` ${p.url}` : '';
  return `${p.authors} (${p.year}). ${end(p.title)} ${end(p.venue)}${link}`;
}

/** SEO description for a paper page, identical to the Astro paper page. */
export function paperDescription(p: Paper): string {
  const fallback = `${typeLabel(p.type)} by ${p.authors} (${p.year}). Published in ${p.venue}.`;
  return (p.abstract ? p.abstract.slice(0, 300) : fallback).replace(/\s+/g, ' ').trim();
}
