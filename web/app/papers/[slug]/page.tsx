import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import TerrainContours from '@/components/hero/TerrainContours';
import Authors, { LabMarkKey } from '@/components/papers/Authors';
import CopyCitation from '@/components/papers/CopyCitation';
import PdfReader from '@/components/papers/PdfReader';
import Icon from '@/components/ui/Icon';
import { publications, researchAreas, team } from '@/lib/data';
import { paperMetadata } from '@/lib/paper-meta';
import { getRelated, labRoster, markLabMembers, toApa, toBibtex, typeLabel } from '@/lib/papers';
import { citationMetaTags, scholarlyArticleNode } from '@/lib/seo';
import styles from './paper.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return publications.map((p) => ({ slug: p.id }));
}

const bySlug = (slug: string) => publications.find((p) => p.id === slug);

export async function generateMetadata({ params }: PageProps<'/papers/[slug]'>) {
  const { slug } = await params;
  const paper = bySlug(slug);
  return paper ? paperMetadata(paper) : {};
}

const roster = labRoster(team.people);

export default async function PaperPage({ params }: PageProps<'/papers/[slug]'>) {
  const { slug } = await params;
  const paper = bySlug(slug);
  if (!paper) notFound();

  const related = getRelated(paper, publications, 4);
  const publisherLink = paper.doi ? `https://doi.org/${paper.doi}` : paper.url;
  const pdfUrl = paper.pdf ? `/papers/${paper.pdf}` : undefined;
  const hasLabMember = markLabMembers(paper.authors, roster).some((s) => s.isLabMember);
  const areas = researchAreas.filter((a) => a.matchTags.some((t) => paper.tags.includes(t)));
  const trail: [string, string][] = [
    ['Home', '/'],
    ['Publications', '/publications'],
    [paper.venueShort ?? paper.title, `/papers/${paper.id}`],
  ];

  return (
    <>
      <JsonLd data={scholarlyArticleNode(paper)} />
      {/* Empty-content Scholar flags Next's metadata API would drop; React 19 hoists <meta> into <head>. */}
      {citationMetaTags(paper)
        .filter(([, content]) => content === '')
        .map(([name]) => (
          <meta key={name} name={name} content="" />
        ))}
      <header className={`${styles.head} on-dark`}>
        <TerrainContours focus={{ x: 0.4, y: 0.6 }} intensity={0.6} />
        <div className={styles.headInner}>
          <Breadcrumbs trail={trail} visible labels={['Home', 'Publications', paper.title]} />
          <div className={styles.chips}>
            <span className={styles.chip}>{typeLabel(paper.type)}</span>
            <span className={styles.chip}>{paper.year}</span>
            {paper.award && (
              <span className={`${styles.chip} ${styles.award}`}>
                <Icon name="trophy" size={12} className="badge-ico" />
                {paper.award}
              </span>
            )}
            {paper.status === 'in-press' && <span className={styles.chip}>In Press</span>}
          </div>
          <h1 className={styles.title}>{paper.title}</h1>
          <p className={styles.authors}>
            <Authors authors={paper.authors} />
          </p>
          {hasLabMember && <LabMarkKey className={styles.key} />}
          <p className={styles.venue}>
            {paper.venue}
            {paper.doi && <span className={styles.muted}> · DOI {paper.doi}</span>}
          </p>
          <div className={styles.actions}>
            {pdfUrl && (
              <a className="btn btn-primary" href={pdfUrl} download>
                <Icon name="doc" size={15} /> Download PDF
              </a>
            )}
            <a className="btn btn-light" href="#cite">
              <Icon name="book" size={15} /> Cite this work
            </a>
            {publisherLink && (
              <a className="btn btn-light" href={publisherLink} target="_blank" rel="noopener">
                <Icon name="link" size={15} /> Publisher <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {paper.abstract && (
          <section className={styles.section} aria-labelledby="abstract-h">
            <h2 id="abstract-h" className="eyebrow">
              Abstract
            </h2>
            <p className={styles.abstract}>{paper.abstract}</p>
          </section>
        )}

        <section className={styles.section} aria-labelledby="read-h">
          <h2 id="read-h" className="eyebrow">
            {pdfUrl ? 'Read online' : 'Full text'}
          </h2>
          {pdfUrl ? (
            <PdfReader
              url={pdfUrl}
              title={paper.title}
              downloadIcon={<Icon name="doc" size={14} />}
            />
          ) : (
            <p className={styles.missing}>
              A shareable copy of this work is not posted here
              {publisherLink ? ' — read the published version via the Publisher link above' : ''}.
              For an author copy, email <a href="mailto:bschelbl@utk.edu">bschelbl@utk.edu</a>.
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="cite-h">
          <h2 id="cite-h" className="eyebrow">
            Cite this work
          </h2>
          <CopyCitation bibtex={toBibtex(paper)} apa={toApa(paper)} />
        </section>

        {(paper.tags.length > 0 || areas.length > 0) && (
          <section className={styles.section} aria-labelledby="topics-h">
            <h2 id="topics-h" className="eyebrow">
              Topics
            </h2>
            {areas.length > 0 && (
              <ul className={styles.areaChips} aria-label="Research areas">
                {areas.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/research/${a.slug}`}>
                      <Icon name={a.icon} size={14} /> {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <ul className={styles.tags} aria-label="Keywords">
              {paper.tags.map((t) => (
                <li key={t} className="tag">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className={styles.section} aria-labelledby="related-h">
            <h2 id="related-h" className="eyebrow">
              Related work
            </h2>
            <ul className={styles.related}>
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/papers/${r.id}`} className={styles.relCard}>
                    <span className="label">
                      {typeLabel(r.type)} · {r.year}
                    </span>
                    <span className={styles.relTitle}>{r.title}</span>
                    <span className={styles.relVenue}>{r.venueShort ?? r.venue}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
