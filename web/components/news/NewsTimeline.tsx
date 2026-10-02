'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { TIMELINE_FILTERS, parseKind, type TimelineFilter } from '@/lib/news';
import { replaceSearch, useUrlSearch } from '@/lib/url-search';
import styles from './NewsTimeline.module.css';

/** One timeline entry, prepared on the server (serializable). */
export interface TimelineEntry {
  id: string;
  year: number;
  dateText: string;
  filter: TimelineFilter;
  kindLabel: string;
  /** Rendered by the server (keeps the icon table out of the client bundle). */
  icon: ReactNode;
  title: string;
  venue?: string;
  location?: string;
  description?: string;
  link?: string;
  external: boolean;
}

/**
 * News & Talks as one dated timeline, grouped by year, with kind chips. ?kind= holds the
 * filter; the static HTML (and no-JS view) shows every entry.
 */
export default function NewsTimeline({
  entries,
  pinIcon,
}: {
  entries: TimelineEntry[];
  pinIcon: ReactNode;
}) {
  const search = useUrlSearch();
  const active = parseKind(search);
  const shown = useMemo(
    () => (active ? entries.filter((e) => e.filter === active) : entries),
    [entries, active],
  );
  const years = useMemo(() => [...new Set(shown.map((e) => e.year))], [shown]);
  const setKind = (k: TimelineFilter | null) => replaceSearch(k ? `?kind=${k}` : '');

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.chips} role="group" aria-label="Show">
          <button
            type="button"
            className={styles.chip}
            aria-pressed={active === null}
            onClick={() => setKind(null)}
          >
            All
          </button>
          {TIMELINE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={styles.chip}
              aria-pressed={active === f.key}
              onClick={() => setKind(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className={styles.count} aria-live="polite" aria-atomic="true">
          {shown.length === entries.length
            ? `${entries.length} items`
            : `${shown.length} of ${entries.length} items`}
        </p>
      </div>

      <div className={styles.years}>
        {years.map((year) => (
          <section key={year} className={styles.year} aria-labelledby={`news-${year}`}>
            <h2 id={`news-${year}`} className={styles.yearLabel}>
              {year}
            </h2>
            <ol className={styles.items}>
              {shown
                .filter((e) => e.year === year)
                .map((e) => (
                  <li key={e.id} className={styles.item} data-kind={e.filter}>
                    <span className={styles.date}>{e.dateText}</span>
                    <span className={styles.icon} aria-hidden="true">
                      {e.icon}
                    </span>
                    <div className={styles.body}>
                      <p className={styles.kind}>{e.kindLabel}</p>
                      <h3 className={styles.title}>{e.title}</h3>
                      {e.venue && <p className={styles.venue}>{e.venue}</p>}
                      {e.location && (
                        <p className={styles.loc}>
                          {pinIcon} {e.location}
                        </p>
                      )}
                      {e.description && <p className={styles.desc}>{e.description}</p>}
                      {e.link &&
                        (e.external ? (
                          <a href={e.link} target="_blank" rel="noopener" className={styles.more}>
                            {e.filter === 'talk' || e.filter === 'keynote'
                              ? 'View event'
                              : 'Read more'}
                            <span className="sr-only">: {e.title} (opens in a new tab)</span>{' '}
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <Link href={e.link} className={styles.more}>
                            Read more<span className="sr-only">: {e.title}</span>{' '}
                            <span aria-hidden="true">→</span>
                          </Link>
                        ))}
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
