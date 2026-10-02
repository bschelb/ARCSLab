import type { ReactNode } from 'react';
import TerrainContours from '@/components/hero/TerrainContours';
import styles from './PageHeader.module.css';

export interface PageStat {
  value: ReactNode;
  label: string;
}

interface PageHeaderProps {
  index: string;
  crumb: string;
  title: string;
  /** Rendered after `title` on the orange block (the hero's emphasis treatment). */
  titleEm?: string;
  lead: string;
  stats?: PageStat[];
  /** Which part of the East Tennessee terrain shows behind this page's header. */
  focus?: { x: number; y: number };
}

/** Dark subpage header over a still crop of the terrain contours. */
export default function PageHeader({ index, crumb, title, titleEm, lead, stats, focus }: PageHeaderProps) {
  return (
    <header className={`${styles.head} on-dark`}>
      <TerrainContours focus={focus ?? { x: 0.5, y: 0.5 }} intensity={0.8} />
      <div className={styles.inner}>
        <p className={styles.crumb}>
          <span className={styles.index}>{index}</span>
          <span className={styles.sep} aria-hidden="true" />
          <span>ARCS Lab — {crumb}</span>
        </p>
        <h1 className={styles.title}>
          {title}
          {titleEm && (
            <>
              {' '}
              <em className="mark-block">{titleEm}</em>
            </>
          )}
        </h1>
        <p className={styles.lead}>{lead}</p>
        {stats && stats.length > 0 && (
          <dl className={styles.stats}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <dt className="label">{s.label}</dt>
                <dd className={`stat-num ${styles.value}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
