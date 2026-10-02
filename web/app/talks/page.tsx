import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import Icon from '@/components/ui/Icon';
import { news, talks } from '@/lib/data';
import { displayDate } from '@/lib/format';
import { pageMetadata } from '@/lib/metadata';
import type { NewsKind } from '@/lib/schemas';
import styles from './talks.module.css';

export const metadata = pageMetadata({
  title: 'Talks & News | ARCS Lab | UT Knoxville',
  description:
    'Invited talks and news from the ARCS Lab — National Academies, West Point, Carnegie Mellon, UT Austin, and more.',
  path: '/talks',
});

// Display tags for news kinds (the Astro data stored these labels; kinds are lower-case).
const KIND_TAG: Partial<Record<NewsKind, string>> = {
  press: 'Press',
  talk: 'Talk',
  publication: 'Publication',
  award: 'Award',
  funding: 'Funding',
  lab: 'Lab',
};

export default function TalksPage() {
  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Talks & News', '/talks'],
        ]}
      />
      <PageHeader
        index="06"
        crumb="Visibility"
        title="Talks &"
        titleEm="news."
        lead="Dr. Schelble and the ARCS Lab are active contributors to national conversations on human-AI teaming in defense, academia, and industry — with invited presentations at the National Academies, West Point, Carnegie Mellon, and beyond."
        stats={[
          { value: `${talks.length}`, label: 'Invited Talks' },
          { value: `${news.length}`, label: 'News Items' },
        ]}
        focus={{ x: 0.75, y: 0.6 }}
      />

      <section className="section" aria-labelledby="talks-title">
        <p className="eyebrow" data-reveal>
          Invited Presentations
        </p>
        <h2 id="talks-title" className="sec-title" data-reveal>
          Invited <em>talks</em>
        </h2>
        <ol className={styles.timeline}>
          {talks.map((t, i) => (
            <li key={t.id} data-reveal style={{ ['--rd' as string]: `${Math.min(i, 4) * 50}ms` }}>
              <span className={styles.date}>{displayDate(t)}</span>
              <div>
                <h3 className={styles.title}>{t.title}</h3>
                <p className={styles.venue}>{t.venue}</p>
                <p className={styles.loc}>
                  <Icon name="pin" size={13} /> {t.location}
                </p>
                {t.link && (
                  <a href={t.link} target="_blank" rel="noopener" className={styles.link}>
                    View Event <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-ink on-dark" aria-labelledby="news-title">
        <p className="eyebrow" data-reveal>
          Lab News &amp; Announcements
        </p>
        <h2 id="news-title" className="sec-title" data-reveal>
          In the <em>news</em>
        </h2>
        <p className="sec-lead" data-reveal>
          Milestones, awards, and coverage from the lab&apos;s first years.
        </p>
        <ul className={styles.grid}>
          {news.map((n, i) => {
            const external = n.link?.startsWith('http');
            return (
              <li
                key={n.id}
                className={styles.card}
                data-reveal
                style={{ ['--rd' as string]: `${(i % 3) * 60}ms` }}
              >
                <div className={styles.top}>
                  <Icon name={n.icon ?? 'doc'} size={26} className={styles.icon} />
                  <span className={styles.meta}>
                    {KIND_TAG[n.kind] && <span className={styles.tag}>{KIND_TAG[n.kind]}</span>}
                    <span className="label">{displayDate(n)}</span>
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{n.title}</h3>
                {n.description && <p className={styles.desc}>{n.description}</p>}
                {n.link &&
                  (external ? (
                    <a href={n.link} target="_blank" rel="noopener" className={styles.more}>
                      Read more <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <Link href={n.link} className={styles.more}>
                      Read more <span aria-hidden="true">→</span>
                    </Link>
                  ))}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
