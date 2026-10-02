import { describe, expect, it } from 'vitest';
import { news, talks } from '@/lib/data';
import { TIMELINE_FILTERS, filterFor, newsAndTalks, parseKind } from '@/lib/news';

describe('News & Talks timeline', () => {
  const items = newsAndTalks(talks, news);

  it('merges talks and news, newest first by ISO date', () => {
    const dates = items.map((i) => i.date);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const t of talks) expect(items).toContain(t);
  });

  it('drops the news restatements of talks (no talk listed twice)', () => {
    expect(items.some((i) => i.kind === 'talk')).toBe(false);
    expect(items).toHaveLength(talks.length + news.filter((n) => n.kind !== 'talk').length);
  });

  it('every item falls under exactly one chip', () => {
    for (const i of items) {
      const matches = TIMELINE_FILTERS.filter((f) =>
        (f.kinds as readonly string[]).includes(i.kind),
      );
      expect(matches.map((m) => m.key)).toEqual([filterFor(i.kind)]);
    }
  });

  it('parses ?kind= and ignores unknown values', () => {
    expect(parseKind('?kind=press')).toBe('press');
    expect(parseKind('?kind=nonsense')).toBeNull();
    expect(parseKind('')).toBeNull();
  });
});
