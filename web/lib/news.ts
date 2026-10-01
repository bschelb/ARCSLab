/** Talks and news: one timeline, sorted by ISO date (newest first, data order on ties). */
import type { NewsItem } from './schemas';

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
