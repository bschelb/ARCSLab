'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import styles from './PublicationFilters.module.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'journal', label: 'Journals' },
  { key: 'conference', label: 'Conference' },
  { key: 'book chapter', label: 'Book Chapters' },
  { key: 'workshop', label: 'Workshops' },
  { key: 'award', label: 'Award-Winning', icon: true },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

/**
 * Type/award filter over the server-rendered list (the faithful port of the Astro filter).
 * Rows carry data-type and data-award; year groups hide when empty. The result count is
 * announced politely. Without JavaScript every publication stays visible.
 */
export default function PublicationFilters({ listId, total }: { listId: string; total: number }) {
  const [active, setActive] = useState<FilterKey>('all');
  const [count, setCount] = useState(total);

  const apply = (key: FilterKey) => {
    setActive(key);
    const list = document.getElementById(listId);
    if (!list) return;
    let shown = 0;
    list.querySelectorAll<HTMLElement>('[data-type]').forEach((row) => {
      const match =
        key === 'all'
          ? true
          : key === 'award'
            ? row.dataset.award === 'yes'
            : row.dataset.type === key;
      row.hidden = !match;
      if (match) shown++;
    });
    list.querySelectorAll<HTMLElement>('[data-year-group]').forEach((group) => {
      group.hidden = !group.querySelector('[data-type]:not([hidden])');
    });
    setCount(shown);
  };

  return (
    <div className={styles.bar} role="group" aria-label="Filter publications">
      <span className={styles.lead} aria-hidden="true">
        Filter //
      </span>
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={styles.btn}
          aria-pressed={active === f.key}
          onClick={() => apply(f.key)}
        >
          {'icon' in f && <Icon name="trophy" size={12} className="badge-ico" />}
          {f.label}
        </button>
      ))}
      <p className={styles.count} aria-live="polite">
        {count === total ? `${total} publications` : `${count} of ${total} publications`}
      </p>
    </div>
  );
}
