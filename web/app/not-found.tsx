import type { Metadata } from 'next';
import Link from 'next/link';
import TerrainContours from '@/components/hero/TerrainContours';
import { NAV_CTA, NAV_ITEMS } from '@/lib/nav';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Page not found | ARCS Lab' },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className={`${styles.wrap} on-dark`} aria-labelledby="nf-title">
      <TerrainContours focus={{ x: 0.3, y: 0.4 }} intensity={0.8} />
      <div className={styles.inner}>
        <p className={styles.code}>404 · Off the map</p>
        <h1 id="nf-title" className={styles.title}>
          This page is <em className="mark-block">not here.</em>
        </h1>
        <p className={styles.lead}>
          The address may have changed or never existed. These sections will get you back on course.
        </p>
        <ul className={styles.links}>
          {[{ href: '/', label: 'Home' }, ...NAV_ITEMS, NAV_CTA].map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                {l.label} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
