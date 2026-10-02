/** Talks and news: one timeline, sorted by ISO date (newest first, data order on ties). */
import type { NewsItem, NewsKind } from './schemas';

export function sortByDateDesc<T extends Pick<NewsItem, 'date'>>(items: T[]): T[] {
  // Array.prototype.sort is stable, so same-month items keep their curated order.
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Invited talks, keynotes and news merged into one dated timeline. */
export function timeline(talks: NewsItem[], news: NewsItem[]): NewsItem[] {
  return sortByDateDesc([...talks, ...news]);
}

export function latest(items: NewsItem[], n = 3): NewsItem[] {
  return sortByDateDesc(items).slice(0, n);
}

/**
 * The /talks timeline: every invited talk and keynote plus all news. News items of kind
 * "talk" are left out because each one restates a talk already in talks.json, which has the
 * fuller record (venue, location, link); keeping both would list those talks twice.
 */
export function newsAndTalks(talks: NewsItem[], news: NewsItem[]): NewsItem[] {
  return sortByDateDesc([...talks, ...news.filter((n) => n.kind !== 'talk')]);
}

/** Filter chips on /talks (plan 4.3: Talk, Keynote, Press, Award, plus the remaining lab news). */
export const TIMELINE_FILTERS = [
  { key: 'talk', label: 'Talks', kinds: ['invited-talk', 'talk'] },
  { key: 'keynote', label: 'Keynotes', kinds: ['keynote'] },
  { key: 'press', label: 'Press', kinds: ['press'] },
  { key: 'award', label: 'Awards', kinds: ['award'] },
  { key: 'lab', label: 'Lab News', kinds: ['publication', 'funding', 'lab'] },
] as const satisfies readonly { key: string; label: string; kinds: readonly NewsKind[] }[];

export type TimelineFilter = (typeof TIMELINE_FILTERS)[number]['key'];

export function filterFor(kind: NewsKind): TimelineFilter {
  const f = TIMELINE_FILTERS.find((x) => (x.kinds as readonly NewsKind[]).includes(kind));
  return f?.key ?? 'lab';
}

export const KIND_LABEL: Record<NewsKind, string> = {
  'invited-talk': 'Invited Talk',
  keynote: 'Keynote',
  press: 'Press',
  talk: 'Talk',
  publication: 'Publication',
  award: 'Award',
  funding: 'Funding',
  lab: 'Lab',
};

/** Parse ?kind= (unknown values mean "all"). */
export function parseKind(search: string): TimelineFilter | null {
  const k = new URLSearchParams(search).get('kind');
  return TIMELINE_FILTERS.some((f) => f.key === k) ? (k as TimelineFilter) : null;
}
