import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import Authors, { LabMarkKey } from '@/components/papers/Authors';
import PublicationFilters from '@/components/papers/PublicationFilters';
import Icon from '@/components/ui/Icon';
import { publications } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { stats } from '@/lib/stats';
import styles from './publications.module.css';

export const metadata = pageMetadata({
  title: 'Publications | ARCS Lab | UT Knoxville',
  description: `${publications.length}+ peer-reviewed publications from the ARCS Lab on human-AI teaming, trust in AI, and collaborative systems.`,
  path: '/publications',
});

const TYPE_LABEL: Record<string, string> = {
  journal: 'Journal',
  conference: 'Conference',
  'book chapter': 'Book Ch.',
  workshop: 'Workshop',
};

export default function PublicationsPage() {
  const years = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);
  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Publications', '/publications'],
        ]}
      />
      <PageHeader
        index="02"
        crumb="Scholarly Output"
        title="What we've"
        titleEm="published."
        lead="A complete record of peer-reviewed journal articles, conference papers, book chapters, and workshop contributions from the ARCS Lab and its collaborators."
        stats={[
          { value: `${stats.publications}+`, label: 'Total Publications' },
          { value: `${stats.byType.journal}`, label: 'Journal Articles' },
          { value: `${stats.byType.conference}`, label: 'Conference Papers' },
          { value: `${stats.byType['book chapter']}`, label: 'Book Chapters' },
          { value: `${stats.bestPaperAwards}`, label: 'Best Paper Awards' },
        ]}
        focus={{ x: 0.45, y: 0.4 }}
      />

      <div className={styles.filters}>
        <PublicationFilters listId="pub-list" total={publications.length} />
        <LabMarkKey className={styles.key} />
      </div>

      <div id="pub-list" className={styles.list}>
        {years.map((year) => {
          const items = publications.filter((p) => p.year === year);
          return (
            <section
              key={year}
              data-year-group=""
              className={styles.group}
              aria-labelledby={`y${year}`}
            >
              <div className={styles.yearHead}>
                <h2 id={`y${year}`} className={styles.year}>
                  {year}
                </h2>
                <span className={styles.rule} aria-hidden="true" />
                <span className="label">{items.length} works</span>
              </div>
              <ul className={styles.rows}>
                {items.map((pub) => (
                  <li key={pub.id} data-type={pub.type} data-award={pub.award ? 'yes' : 'no'}>
                    <Link href={`/papers/${pub.id}`} className={styles.row}>
                      <span className={styles.type}>{TYPE_LABEL[pub.type]}</span>
                      <span className={styles.main}>
                        <span className={styles.title}>{pub.title}</span>
                        <span className={styles.authors}>
                          <Authors authors={pub.authors} />
                        </span>
                        <span className={styles.venue}>{pub.venue}</span>
                      </span>
                      <span className={styles.aside}>
                        {pub.award && (
                          <span className={styles.award}>
                            <Icon name="trophy" size={12} className="badge-ico" />
                            {pub.award}
                          </span>
                        )}
                        {pub.status === 'in-press' && (
                          <span className={styles.press}>In Press</span>
                        )}
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
          );
        })}
      </div>
    </>
  );
}
