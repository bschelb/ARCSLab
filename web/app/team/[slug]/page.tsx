import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/layout/PageHeader';
import Authors, { LabMarkKey } from '@/components/papers/Authors';
import Icon from '@/components/ui/Icon';
import { publications, researchAreas, team } from '@/lib/data';
import { formatTenure } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import { pageMetadata } from '@/lib/metadata';
import { typeLabel } from '@/lib/papers';
import { monogram, plainName, publicationsFor } from '@/lib/people';
import { clampDescription, paperAreas, splitTitle } from '@/lib/research';
import type { Person, PersonGroup } from '@/lib/schemas';
import { memberPersonNode } from '@/lib/seo';
import styles from './profile.module.css';

export const dynamicParams = false;

/** Everyone but the PI, who keeps the dedicated /pi page (D9). */
const members = team.people.filter((p) => p.group !== 'pi');

export function generateStaticParams() {
  return members.map((p) => ({ slug: p.slug }));
}

const bySlug = (slug: string) => members.find((p) => p.slug === slug);

const GROUP_LABEL: Record<PersonGroup, string> = {
  pi: 'Principal Investigator',
  phd: 'PhD Student',
  deng: 'Doctor of Engineering Student',
  undergrad: 'Undergraduate Researcher',
  alumni: 'Lab Alumni',
};

const LINKS: { key: keyof NonNullable<Person['links']>; label: string; icon: IconName }[] = [
  { key: 'website', label: 'Website', icon: 'globe' },
  { key: 'scholar', label: 'Google Scholar', icon: 'book' },
  { key: 'orcid', label: 'ORCID', icon: 'link' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'link' },
  { key: 'github', label: 'GitHub', icon: 'link' },
];

/** One-line summary used for the header lead and the meta description. */
function summary(p: Person): string {
  const tenure = formatTenure(p.startYear, p.endYear);
  if (p.group === 'alumni')
    return `${p.role.replace(/^Lab /, '')} of the ARCS Lab (${tenure})${p.degree ? `, ${p.degree}` : ''}${p.outcome ? `. Now: ${p.outcome}` : ''}.`;
  return `${GROUP_LABEL[p.group]} in the ARCS Lab at the University of Tennessee, Knoxville, since ${p.startYear}.`;
}

export async function generateMetadata({ params }: PageProps<'/team/[slug]'>) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return {};
  return pageMetadata({
    title: `${plainName(p)} | Team | ARCS Lab | UT Knoxville`,
    description: clampDescription(p.shortBio ? `${summary(p)} ${p.shortBio}` : summary(p)),
    path: `/team/${p.slug}`,
  });
}

export default async function ProfilePage({ params }: PageProps<'/team/[slug]'>) {
  const { slug } = await params;
  const person = bySlug(slug);
  if (!person) notFound();

  const name = plainName(person);
  const [first, last] = splitTitle(name);
  const papers = publicationsFor(person, publications).sort((a, b) => b.year - a.year);
  const areaSlugs = new Set(papers.flatMap((p) => paperAreas(p, researchAreas)));
  const areas = researchAreas.filter((a) => areaSlugs.has(a.slug));
  const links = LINKS.filter((l) => person.links?.[l.key]);
  const lastName = name.split(/\s+/).at(-1) ?? name;
  const trail: [string, string][] = [
    ['Home', '/'],
    ['Team', '/team'],
    [name, `/team/${person.slug}`],
  ];

  return (
    <>
      <JsonLd
        data={memberPersonNode({
          ...person,
          description: person.shortBio,
          sameAs: links.map((l) => person.links?.[l.key]).filter((u): u is string => !!u),
        })}
      />
      <PageHeader
        breadcrumbs={<Breadcrumbs trail={trail} visible />}
        index="03"
        crumb={`Team · ${GROUP_LABEL[person.group]}`}
        title={first}
        titleEm={last}
        lead={summary(person)}
        focus={{ x: 0.55, y: 0.45 }}
      />

      <section className={`section ${styles.profile}`} aria-labelledby="about-title">
        <div className={`${styles.media} ${person.photo ? '' : styles.mono}`}>
          {person.photo ? (
            <Image
              src={person.photo}
              alt={person.name}
              fill
              priority
              sizes="(max-width: 860px) 100vw, 360px"
              style={{ objectPosition: person.cropPosition ?? 'center 20%' }}
            />
          ) : (
            <span className={styles.monogram} aria-hidden="true">
              {monogram(person)}
            </span>
          )}
        </div>
        <div className={styles.about}>
          <h2 id="about-title" className="label">
            About
          </h2>
          {person.bio && <p className={styles.bio}>{person.bio}</p>}
          <dl className={styles.facts}>
            <div>
              <dt className="label">Role</dt>
              <dd>{person.role}</dd>
            </div>
            {person.education && (
              <div>
                <dt className="label">Education</dt>
                <dd>{person.education}</dd>
              </div>
            )}
            {person.degree && (
              <div>
                <dt className="label">{person.group === 'alumni' ? 'Degree' : 'Program'}</dt>
                <dd>{person.degree}</dd>
              </div>
            )}
            <div>
              <dt className="label">In the lab</dt>
              <dd>{formatTenure(person.startYear, person.endYear)}</dd>
            </div>
            {person.outcome && (
              <div>
                <dt className="label">Now</dt>
                <dd>{person.outcome}</dd>
              </div>
            )}
          </dl>
          {links.length > 0 && (
            <ul className={styles.links} aria-label={`${name} elsewhere`}>
              {links.map((l) => (
                <li key={l.key}>
                  <a href={person.links?.[l.key]} target="_blank" rel="noopener">
                    <Icon name={l.icon} size={14} /> {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {areas.length > 0 && (
            <div className={styles.areas}>
              <h2 className="label">Research areas</h2>
              <ul>
                {areas.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/research/${a.slug}`} className={styles.areaChip}>
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {papers.length > 0 && (
        <section className="section section-paper-2" aria-labelledby="pubs-title">
          <div className={styles.headRow}>
            <div>
              <p className="eyebrow">Publications</p>
              <h2 id="pubs-title" className="sec-title">
                {papers.length} {papers.length === 1 ? 'paper' : 'papers'} with <em>{lastName}</em>
              </h2>
            </div>
            <LabMarkKey />
          </div>
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
                  {p.pdf && <span className="tag">Free PDF</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className={styles.back} aria-label="Team">
        <Link href={`/team#${person.slug}`} className="btn btn-ghost">
          <span aria-hidden="true">←</span> All team members
        </Link>
        <Link href="/join" className="btn btn-primary">
          Join the lab{' '}
          <span className="arr" aria-hidden="true">
            →
          </span>
        </Link>
      </nav>
    </>
  );
}
