'use client';

import Link from 'next/link';
import { useCallback, useId, useMemo, type ReactNode } from 'react';
import {
  EMPTY_FILTERS,
  countLabel,
  filterPapers,
  groupByYear,
  isFiltered,
  parseFilters,
  toSearch,
  type ExplorerPaper,
  type Filters,
} from '@/lib/explorer';
import type { PaperType } from '@/lib/schemas';
import { replaceSearch, useUrlSearch } from '@/lib/url-search';
import AuthorMarks from './AuthorMarks';
import styles from './PublicationsExplorer.module.css';

// The URL query is the explorer's only state (lib/url-search). The server snapshot is "",
// so the static HTML always holds the complete list for crawlers and no-JS visitors.

const TYPES: { value: PaperType | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'journal', label: 'Journals' },
  { value: 'conference', label: 'Conference' },
  { value: 'book chapter', label: 'Book Chapters' },
  { value: 'workshop', label: 'Workshops' },
];

const TYPE_LABEL: Record<PaperType, string> = {
  journal: 'Journal',
  conference: 'Conference',
  'book chapter': 'Book Ch.',
  workshop: 'Workshop',
};

interface Props {
  papers: ExplorerPaper[];
  areas: { slug: string; title: string }[];
  years: number[];
  /** The lab-member legend, rendered by the server. */
  legend?: ReactNode;
  /** Icons rendered by the server, so the icon table stays out of the client bundle. */
  icons: { search: ReactNode; trophy: ReactNode };
}

export default function PublicationsExplorer({ papers, areas, years, legend, icons }: Props) {
  const search = useUrlSearch();
  const known = useMemo(() => ({ years, areas: areas.map((a) => a.slug) }), [years, areas]);
  const filters = useMemo(() => parseFilters(search, known), [search, known]);
  const shown = useMemo(() => filterPapers(papers, filters), [papers, filters]);
  const groups = useMemo(() => groupByYear(shown), [shown]);
  const set = useCallback(
    (patch: Partial<Filters>) => replaceSearch(toSearch({ ...filters, ...patch })),
    [filters],
  );
  const id = useId();
  const filtered = isFiltered(filters);

  return (
    <>
      <div className={styles.bar} role="search" aria-label="Publications">
        <div className={styles.row}>
          <div className={styles.searchWrap}>
            <label htmlFor={`${id}-q`} className="sr-only">
              Search publications
            </label>
            <span className={styles.searchIcon} aria-hidden="true">
              {icons.search}
            </span>
            <input
              id={`${id}-q`}
              type="search"
              className={styles.search}
              placeholder="Search titles, authors, venues, topics"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className={styles.selects}>
            <label className={styles.select}>
              <span className="label">Year</span>
              <select
                value={filters.year ?? ''}
                onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.select}>
              <span className="label">Research area</span>
              <select
                value={filters.area ?? ''}
                onChange={(e) => set({ area: e.target.value || null })}
              >
                <option value="">All areas</option>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.select}>
              <span className="label">Sort</span>
              <select
                value={filters.sort}
                onChange={(e) => set({ sort: e.target.value === 'oldest' ? 'oldest' : 'newest' })}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.chips} role="group" aria-label="Publication type">
            {TYPES.map((t) => (
              <button
                key={t.label}
                type="button"
                className={styles.chip}
                aria-pressed={filters.type === t.value}
                onClick={() => set({ type: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className={styles.chips} role="group" aria-label="Show only">
            <button
              type="button"
              className={styles.chip}
              aria-pressed={filters.award}
              onClick={() => set({ award: !filters.award })}
            >
              {icons.trophy}
              Award-Winning
            </button>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={filters.pdf}
              onClick={() => set({ pdf: !filters.pdf })}
            >
              <span className={styles.pdfDot} aria-hidden="true" />
              Free PDF
            </button>
          </div>
          <div className={styles.status}>
            <p className={styles.count} aria-live="polite" aria-atomic="true">
              {countLabel(shown.length, papers.length)}
            </p>
            <button
              type="button"
              className={styles.clear}
              onClick={() => replaceSearch(toSearch({ ...EMPTY_FILTERS, sort: filters.sort }))}
              disabled={!filtered}
            >
              Clear filters
            </button>
          </div>
        </div>
        {legend && <div className={styles.legend}>{legend}</div>}
      </div>

      <div id="pub-list" className={styles.list}>
        {groups.length === 0 && (
          <div className={styles.empty}>
            <p>No publications match those filters.</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => replaceSearch(toSearch({ ...EMPTY_FILTERS, sort: filters.sort }))}
            >
              Clear filters
            </button>
          </div>
        )}
        {groups.map(([year, items]) => (
          <section key={year} className={styles.group} aria-labelledby={`y${year}`}>
            <div className={styles.yearHead}>
              <h2 id={`y${year}`} className={styles.year}>
                {year}
              </h2>
              <span className={styles.rule} aria-hidden="true" />
              <span className="label">
                {items.length} {items.length === 1 ? 'work' : 'works'}
              </span>
            </div>
            <ul className={styles.rows}>
              {items.map((pub) => (
                <li key={pub.id} data-paper={pub.id}>
                  <Link href={`/papers/${pub.id}`} className={styles.paper}>
                    <span className={styles.type}>{TYPE_LABEL[pub.type]}</span>
                    <span className={styles.main}>
                      <span className={styles.title}>{pub.title}</span>
                      <span className={styles.authors}>
                        <AuthorMarks segments={pub.authors} />
                      </span>
                      <span className={styles.venue}>{pub.venue}</span>
                    </span>
                    <span className={styles.aside}>
                      {pub.award && (
                        <span className={styles.award}>
                          {icons.trophy}
                          {pub.award}
                        </span>
                      )}
                      {pub.inPress && <span className={styles.press}>In Press</span>}
                      {pub.pdf && (
                        <span className={styles.pdf}>
                          <span className={styles.pdfDot} aria-hidden="true" /> Free PDF
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
