import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import Authors, { LabMarkKey } from '@/components/papers/Authors';
import PersonCard from '@/components/people/PersonCard';
import { FIGURES } from '@/components/research/figures';
import TechFigure from '@/components/research/TechFigure';
import DraftTag from '@/components/ui/DraftTag';
import Icon from '@/components/ui/Icon';
import { grants, publications, researchAreas, team } from '@/lib/data';
import { showDrafts } from '@/lib/drafts';
import { formatUsd } from '@/lib/format';
import { pageMetadata } from '@/lib/metadata';
import { typeLabel } from '@/lib/papers';
import { profileHref } from '@/lib/people';
import {
  adjacentAreas,
  areaGrants,
  areaPapers,
  areaPeople,
  clampDescription,
  splitTitle,
} from '@/lib/research';
import styles from './area.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return researchAreas.map((a) => ({ slug: a.slug }));
}

const bySlug = (slug: string) => researchAreas.find((a) => a.slug === slug);

export async function generateMetadata({ params }: PageProps<'/research/[slug]'>) {
  const { slug } = await params;
  const area = bySlug(slug);
  if (!area) return {};
  return pageMetadata({
    title: `${area.title} | Research | ARCS Lab | UT Knoxville`,
    description: clampDescription(area.description),
    path: `/research/${area.slug}`,
  });
}

// Header crops: each area shows a different stretch of the terrain.
const FOCUS = [
  { x: 0.95, y: 0.85 },
  { x: 0.2, y: 0.3 },
  { x: 0.6, y: 0.2 },
  { x: 0.8, y: 0.6 },
  { x: 0.35, y: 0.75 },
  { x: 0.1, y: 0.55 },
];

const METHODS = ['Quantitative', 'Qualitative', 'Computational'];

export default async function AreaPage({ params }: PageProps<'/research/[slug]'>) {
  const { slug } = await params;
  const area = bySlug(slug);
  if (!area) notFound();

  const index = researchAreas.indexOf(area);
  const papers = areaPapers(area, publications);
  const people = areaPeople(papers, team.people);
  const funded = !area.grants?.draft || showDrafts() ? areaGrants(area, grants) : [];
  const { prev, next } = adjacentAreas(researchAreas, area.slug);
  const figure = FIGURES[area.slug];
  const [title, titleEm] = splitTitle(area.title);
  const trail: [string, string][] = [
    ['Home', '/'],
    ['Research', '/research'],
    [area.title, `/research/${area.slug}`],
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={<Breadcrumbs trail={trail} visible />}
        index={area.num}
        crumb={`Research Area · ${area.tag}`}
        title={title}
        titleEm={titleEm}
        lead={area.description}
        stats={[
          { value: `${papers.length}`, label: 'Publications' },
          { value: `${people.length}`, label: 'Lab Authors' },
          ...(funded.length ? [{ value: `${funded.length}`, label: 'Funded Projects' }] : []),
        ]}
        focus={FOCUS[index % FOCUS.length]}
      />

      {/* Overview */}
      <section className={`section ${styles.overview}`} aria-labelledby="focus-title">
        <div className={styles.text}>
          {area.description2 && <p className={styles.lede}>{area.description2}</p>}
          <h2 id="focus-title" className="label">
            Research focus
          </h2>
          <ol className={styles.bullets}>
            {area.bullets.map((b, i) => (
              <li key={b}>
                <span className={styles.bulletNum} aria-hidden="true">
                  {area.num}.{i + 1}
                </span>
                {b}
              </li>
            ))}
          </ol>
          <div className={styles.methods}>
            <h2 className="label">Methods</h2>
            <p>
              Like all ARCS Lab research, this area is mixed-methods:{' '}
              {METHODS.map((m, i) => (
                <span key={m}>
                  <span className="tag">{m}</span>
                  {i < METHODS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
            <Link href="/research#methods" className={styles.inline}>
              How we work <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        {figure && (
          <div className={styles.figure}>
            <TechFigure figure={figure} index={area.num} />
          </div>
        )}
      </section>

      {/* Representative publications */}
      {area.pubs.length > 0 && (
        <section className="section section-ink on-dark" aria-labelledby="rep-title">
          <p className="eyebrow" data-reveal>
            {area.num} · Selected Work
          </p>
          <h2 id="rep-title" className="sec-title" data-reveal>
            Representative <em>publications</em>
          </h2>
          <ul className={styles.featured}>
            {area.pubs.map((pub, i) => (
              <li key={pub.title} data-reveal style={{ ['--rd' as string]: `${i * 60}ms` }}>
                <p className={styles.featVenue}>{pub.venue}</p>
                <h3 className={styles.featTitle}>
                  {pub.paperId ? (
                    <Link href={`/papers/${pub.paperId}`}>{pub.title}</Link>
                  ) : (
                    pub.title
                  )}
                </h3>
                <p className={styles.featAuthors}>
                  <Authors authors={pub.authors} />
                </p>
                {pub.award && (
                  <p className={styles.award}>
                    <Icon name="trophy" size={12} className="badge-ico" />
                    {pub.award}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All related publications */}
      <section className="section" aria-labelledby="pubs-title">
        <div className={styles.headRow}>
          <div>
            <p className="eyebrow" data-reveal>
              Publications
            </p>
            <h2 id="pubs-title" className="sec-title" data-reveal>
              {papers.length} papers in <em>{area.title}</em>
            </h2>
          </div>
          <Link href={`/publications?area=${area.slug}`} className={styles.viewAll}>
            Filter in publications <span aria-hidden="true">→</span>
          </Link>
        </div>
        <LabMarkKey className={styles.key} />
        <ul className={styles.rows}>
          {papers.map((p) => (
            <li key={p.id}>
              <Link href={`/papers/${p.id}`} className={styles.row}>
                <span className={styles.year}>{p.year}</span>
                <span className={styles.main}>
                  <span className={styles.title}>{p.title}</span>
                  <span className={styles.authors}>
                    <Authors authors={p.authors} />
                  </span>
                  <span className={styles.venue}>
                    {typeLabel(p.type)} · {p.venueShort ?? p.venue}
                  </span>
                </span>
                <span className={styles.badges}>
                  {p.award && (
                    <span className={styles.awardTag}>
                      <Icon name="trophy" size={12} className="badge-ico" />
                      Award
                    </span>
                  )}
                  {p.pdf && <span className="tag">Free PDF</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* People */}
      {people.length > 0 && (
        <section className="section section-paper-2" aria-labelledby="people-title">
          <p className="eyebrow" data-reveal>
            People
          </p>
          <h2 id="people-title" className="sec-title" data-reveal>
            Lab members in <em>this area</em>
          </h2>
          <p className="sec-lead" data-reveal>
            ARCS Lab members who have authored publications in {area.title}.
          </p>
          <div className={styles.people}>
            {people.map((p, i) => (
              <div key={p.slug} data-reveal style={{ ['--rd' as string]: `${i * 60}ms` }}>
                <PersonCard
                  person={p}
                  role={p.group === 'pi' ? 'Principal Investigator' : p.role}
                  href={profileHref(p)}
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Funded projects */}
      {funded.length > 0 && (
        <section className="section" aria-labelledby="funded-title">
          <p className="eyebrow" data-reveal>
            Funding
          </p>
          <h2 id="funded-title" className="sec-title" data-reveal>
            Related funded <em>projects</em>
            {area.grants?.draft && <DraftTag />}
          </h2>
          <ul className={styles.grants}>
            {funded.map((g) => (
              <li key={g.id} data-reveal>
                <p className="label">
                  {g.funderShort} · {g.role}
                </p>
                <h3 className={styles.grantTitle}>{g.title}</h3>
                <p className={styles.grantMeta}>
                  {g.funder} · {formatUsd(g.amount)}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/funding" className={styles.inline}>
            All funded research <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      {/* Prev / next */}
      <nav className={`${styles.pager} on-dark`} aria-label="Research areas">
        {prev && (
          <Link href={`/research/${prev.slug}`} className={styles.pagerLink} rel="prev">
            <span className="label">← Previous area · {prev.num}</span>
            <span className={styles.pagerTitle}>{prev.title}</span>
          </Link>
        )}
        {next && (
          <Link
            href={`/research/${next.slug}`}
            className={`${styles.pagerLink} ${styles.pagerNext}`}
            rel="next"
          >
            <span className="label">Next area · {next.num} →</span>
            <span className={styles.pagerTitle}>{next.title}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
