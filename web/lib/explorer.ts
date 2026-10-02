/**
 * Publications explorer state (plan 4.3). Pure functions only, so the client component and
 * the unit tests share them. The URL query is the single source of truth:
 *
 *   ?q=trust&type=journal&year=2024&area=trustworthy-ai&award=1&pdf=1&sort=oldest
 *
 * Unknown or malformed values are ignored, so an old or hand-edited link never breaks the page.
 */
import type { AuthorSegment } from './papers';
import type { PaperType } from './schemas';

/** What the explorer needs per paper: serializable, and small enough to ship to the client. */
export interface ExplorerPaper {
  id: string;
  year: number;
  type: PaperType;
  title: string;
  authors: AuthorSegment[];
  venue: string;
  award?: string;
  inPress: boolean;
  pdf: boolean;
  areas: string[];
  /** Lower-cased title, authors, venue and tags, for text search. */
  haystack: string;
}

/** URL values for paper types ("book chapter" has a space, so it gets a short slug). */
export const TYPE_PARAM: Record<PaperType, string> = {
  journal: 'journal',
  conference: 'conference',
  'book chapter': 'chapter',
  workshop: 'workshop',
};

export interface Filters {
  q: string;
  type: PaperType | null;
  year: number | null;
  area: string | null;
  award: boolean;
  pdf: boolean;
  sort: 'newest' | 'oldest';
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  type: null,
  year: null,
  area: null,
  award: false,
  pdf: false,
  sort: 'newest',
};

export function parseFilters(search: string, known: { years: number[]; areas: string[] }): Filters {
  const params = new URLSearchParams(search);
  const typeParam = params.get('type');
  const type =
    (Object.entries(TYPE_PARAM).find(([, v]) => v === typeParam)?.[0] as PaperType | undefined) ??
    null;
  const yearNum = Number(params.get('year'));
  const area = params.get('area');
  return {
    q: (params.get('q') ?? '').slice(0, 200),
    type,
    year: known.years.includes(yearNum) ? yearNum : null,
    area: area && known.areas.includes(area) ? area : null,
    award: params.get('award') === '1',
    pdf: params.get('pdf') === '1',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
  };
}

/** The query string for a filter state ("" when nothing is set), in a stable key order. */
export function toSearch(f: Filters): string {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.type) params.set('type', TYPE_PARAM[f.type]);
  if (f.year) params.set('year', String(f.year));
  if (f.area) params.set('area', f.area);
  if (f.award) params.set('award', '1');
  if (f.pdf) params.set('pdf', '1');
  if (f.sort === 'oldest') params.set('sort', 'oldest');
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function isFiltered(f: Filters): boolean {
  return Boolean(f.q.trim() || f.type || f.year || f.area || f.award || f.pdf);
}

/** Search terms must all appear (in any order); quotes and punctuation are not special. */
function matchesQuery(haystack: string, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((t) => haystack.includes(t));
}

export function filterPapers<T extends ExplorerPaper>(papers: T[], f: Filters): T[] {
  const out = papers.filter(
    (p) =>
      (!f.type || p.type === f.type) &&
      (!f.year || p.year === f.year) &&
      (!f.area || p.areas.includes(f.area)) &&
      (!f.award || Boolean(p.award)) &&
      (!f.pdf || p.pdf) &&
      (!f.q.trim() || matchesQuery(p.haystack, f.q)),
  );
  // Input is newest-first in curated order; oldest-first reverses it exactly.
  return f.sort === 'oldest' ? out.reverse() : out;
}

/** Consecutive runs of papers sharing a year, in list order. */
export function groupByYear<T extends { year: number }>(papers: T[]): [number, T[]][] {
  const groups: [number, T[]][] = [];
  for (const p of papers) {
    const last = groups.at(-1);
    if (last && last[0] === p.year) last[1].push(p);
    else groups.push([p.year, [p]]);
  }
  return groups;
}

export function countLabel(shown: number, total: number): string {
  return shown === total ? `${total} publications` : `${shown} of ${total} publications`;
}
