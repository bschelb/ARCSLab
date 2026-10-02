import { describe, expect, it } from 'vitest';
import { publications, researchAreas } from '@/lib/data';
import {
  EMPTY_FILTERS,
  countLabel,
  filterPapers,
  groupByYear,
  isFiltered,
  parseFilters,
  toSearch,
  type ExplorerPaper,
} from '@/lib/explorer';
import { paperAreas } from '@/lib/research';

const papers: ExplorerPaper[] = [...publications]
  .sort((a, b) => b.year - a.year)
  .map((p) => ({
    id: p.id,
    year: p.year,
    type: p.type,
    title: p.title,
    authors: [{ text: p.authors, isLabMember: false }],
    venue: p.venue,
    ...(p.award ? { award: p.award } : {}),
    inPress: p.status === 'in-press',
    pdf: Boolean(p.pdf),
    areas: paperAreas(p, researchAreas),
    haystack: [p.title, p.authors, ...p.authorsList, p.venue, ...p.tags].join(' ').toLowerCase(),
  }));
const known = {
  years: [...new Set(papers.map((p) => p.year))],
  areas: researchAreas.map((a) => a.slug),
};

describe('explorer query state', () => {
  it('round-trips every filter through the URL', () => {
    const f = {
      q: 'trust',
      type: 'book chapter' as const,
      year: 2024,
      area: 'trustworthy-ai',
      award: true,
      pdf: true,
      sort: 'oldest' as const,
    };
    const s = toSearch(f);
    expect(s).toBe('?q=trust&type=chapter&year=2024&area=trustworthy-ai&award=1&pdf=1&sort=oldest');
    expect(parseFilters(s, known)).toEqual(f);
  });

  it('an empty state is an empty query', () => {
    expect(toSearch(EMPTY_FILTERS)).toBe('');
    expect(parseFilters('', known)).toEqual(EMPTY_FILTERS);
    expect(isFiltered(EMPTY_FILTERS)).toBe(false);
    expect(isFiltered({ ...EMPTY_FILTERS, sort: 'oldest' })).toBe(false);
  });

  it('ignores unknown or malformed values', () => {
    expect(parseFilters('?type=poster&year=1999&area=nope&award=yes&sort=sideways', known)).toEqual(
      EMPTY_FILTERS,
    );
  });
});

describe('filterPapers', () => {
  const run = (search: string) => filterPapers(papers, parseFilters(search, known));

  it('type, award and free PDF match the data counts', () => {
    expect(run('?type=journal')).toHaveLength(26);
    expect(run('?type=conference')).toHaveLength(17);
    expect(run('?type=chapter')).toHaveLength(3);
    expect(run('?type=workshop')).toHaveLength(3);
    expect(run('?award=1')).toHaveLength(publications.filter((p) => p.award).length);
    expect(run('?pdf=1')).toHaveLength(publications.filter((p) => p.pdf).length);
  });

  it('year and area narrow correctly', () => {
    expect(run('?year=2025').every((p) => p.year === 2025)).toBe(true);
    const area = run('?area=training');
    expect(area.length).toBeGreaterThan(0);
    expect(area.every((p) => p.areas.includes('training'))).toBe(true);
  });

  it('search needs every term, case-insensitively, across fields', () => {
    const hits = run('?q=SHARED+mental');
    expect(hits.length).toBeGreaterThan(0);
    for (const p of hits) expect(p.haystack).toMatch(/shared/);
    expect(run('?q=zzzz-no-such-thing')).toHaveLength(0);
  });

  it('oldest-first exactly reverses the default order', () => {
    expect(run('?sort=oldest').map((p) => p.id)).toEqual(
      run('')
        .map((p) => p.id)
        .reverse(),
    );
  });

  it('groups consecutive years and labels counts', () => {
    const groups = groupByYear(run(''));
    expect(groups.map(([y]) => y)).toEqual([...known.years]);
    expect(groups.reduce((n, [, items]) => n + items.length, 0)).toBe(49);
    expect(countLabel(49, 49)).toBe('49 publications');
    expect(countLabel(3, 49)).toBe('3 of 49 publications');
  });
});
