import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import JoinStub from '@/components/join/JoinStub';
import PersonCard from '@/components/people/PersonCard';
import Icon from '@/components/ui/Icon';
import { team } from '@/lib/data';
import { formatTenure, formatUsdCompact } from '@/lib/format';
import { pageMetadata } from '@/lib/metadata';
import { byGroup, currentMembers } from '@/lib/people';
import { stats } from '@/lib/stats';
import styles from './team.module.css';

export const metadata = pageMetadata({
  title: 'Team | ARCS Lab | UT Knoxville',
  description:
    'Meet the ARCS Lab team — PI Dr. Beau Schelble, PhD and DEng students, undergraduate researchers, and collaborators across leading institutions.',
  path: '/team',
});

function RosterLabel({ idx, title }: { idx: string; title: string }) {
  return (
    <div className={styles.roster} data-reveal>
      <span className="label">/ {idx}</span>
      <h2>{title}</h2>
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}

export default function TeamPage() {
  const pi = byGroup(team.people, 'pi')[0];
  const phd = byGroup(team.people, 'phd');
  const deng = byGroup(team.people, 'deng');
  const undergrads = byGroup(team.people, 'undergrad');
  const alumni = byGroup(team.people, 'alumni');

  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Team', '/team'],
        ]}
      />
      <PageHeader
        index="03"
        crumb="People"
        title="The minds behind"
        titleEm="the machines."
        lead="A collaborative community of researchers and students advancing the science of human-AI teaming at the University of Tennessee, Knoxville."
        stats={[
          { value: `${currentMembers(team.people).length}`, label: 'Lab Members' },
          { value: `${phd.length}`, label: 'PhD Students' },
          { value: `${team.collaborators.length}`, label: 'External Collaborators' },
        ]}
        focus={{ x: 0.55, y: 0.45 }}
      />

      {pi && (
        <section className="section" aria-labelledby="pi-name">
          <RosterLabel idx="Leadership" title="Principal Investigator" />
          <div className={styles.pi} data-reveal>
            <div className={styles.piImg}>
              <Image
                src={pi.photo ?? ''}
                alt={pi.name}
                fill
                sizes="(max-width: 860px) 100vw, 380px"
                style={{ objectPosition: pi.cropPosition ?? 'center 20%' }}
              />
            </div>
            <div className={styles.piBody}>
              <h3 id="pi-name" className={styles.piName}>
                {pi.name}
              </h3>
              <p className={styles.piTitle}>{pi.title}</p>
              <p className={styles.piTitle}>{pi.subtitle}</p>
              <p className={styles.piDept}>{pi.department}</p>
              <p className={styles.piBio}>{pi.bio}</p>
              <ul className={styles.piLinks}>
                <li>
                  <a href={`mailto:${pi.email}`}>
                    <Icon name="mail" size={14} /> {pi.email}
                  </a>
                </li>
                {pi.links?.scholar && (
                  <li>
                    <a href={pi.links.scholar} target="_blank" rel="noopener">
                      <Icon name="book" size={14} /> Scholar
                    </a>
                  </li>
                )}
                {pi.links?.orcid && (
                  <li>
                    <a href={pi.links.orcid} target="_blank" rel="noopener">
                      <Icon name="link" size={14} /> ORCID
                    </a>
                  </li>
                )}
                {pi.links?.website && (
                  <li>
                    <a href={pi.links.website} target="_blank" rel="noopener">
                      <Icon name="globe" size={14} /> Personal Site
                    </a>
                  </li>
                )}
              </ul>
              <dl className={styles.piStats}>
                <div>
                  <dt className="label">Publications</dt>
                  <dd className="stat-num">{stats.publications}+</dd>
                </div>
                <div>
                  <dt className="label">PI Funding</dt>
                  <dd className="stat-num">{formatUsdCompact(stats.piFunding)}</dd>
                </div>
                <div>
                  <dt className="label">Best Paper Awards</dt>
                  <dd className="stat-num">{stats.bestPaperAwards}</dd>
                </div>
                <div>
                  <dt className="label">Invited Talks</dt>
                  <dd className="stat-num">{stats.invitedTalks}</dd>
                </div>
              </dl>
              <Link href="/pi" className={styles.piMore}>
                Full PI profile <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className={`section ${styles.students}`} aria-label="Students and alumni">
        <RosterLabel idx="Doctoral" title="PhD Students" />
        <div className={styles.phdGrid}>
          {phd.map((s, i) => (
            <div
              key={s.slug}
              id={s.slug}
              className={styles.anchor}
              data-reveal
              style={{ ['--rd' as string]: `${i * 80}ms` }}
            >
              <PersonCard
                person={s}
                role={s.role}
                meta={s.education}
                sizes="(max-width: 700px) 100vw, 33vw"
              >
                <p>{s.bio}</p>
                {s.links?.scholar && (
                  <p className={styles.cardLinks}>
                    <a href={s.links.scholar} target="_blank" rel="noopener">
                      Scholar
                    </a>
                  </p>
                )}
              </PersonCard>
            </div>
          ))}
        </div>

        <RosterLabel idx="Applied Doctoral" title="Doctor of Engineering Students" />
        <div className={styles.smallGrid}>
          {deng.map((s, i) => (
            <div
              key={s.slug}
              id={s.slug}
              className={styles.anchor}
              data-reveal
              style={{ ['--rd' as string]: `${i * 60}ms` }}
            >
              <PersonCard person={s} role={s.role} meta={formatTenure(s.startYear, s.endYear)}>
                <p>{s.bio}</p>
              </PersonCard>
            </div>
          ))}
        </div>

        <RosterLabel idx="Undergraduate" title="Undergraduate Researchers" />
        <div className={styles.smallGrid}>
          {undergrads.map((s, i) => (
            <div
              key={s.slug}
              id={s.slug}
              className={styles.anchor}
              data-reveal
              style={{ ['--rd' as string]: `${i * 60}ms` }}
            >
              <PersonCard
                person={s}
                role={s.role}
                meta={`${s.degree} · ${formatTenure(s.startYear, s.endYear)}`}
              >
                <p>{s.bio}</p>
              </PersonCard>
            </div>
          ))}
        </div>

        <RosterLabel idx="Alumni" title="Lab Alumni" />
        <div className={styles.smallGrid}>
          {alumni.map((s, i) => (
            <div
              key={s.slug}
              id={s.slug}
              className={styles.anchor}
              data-reveal
              style={{ ['--rd' as string]: `${i * 60}ms` }}
            >
              <PersonCard
                person={s}
                role={s.role}
                meta={`${s.degree} · ${formatTenure(s.startYear, s.endYear)}`}
              >
                {s.outcome && <p>Now: {s.outcome}</p>}
              </PersonCard>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-ink on-dark" aria-labelledby="collab-title">
        <p className="eyebrow" data-reveal>
          External Network
        </p>
        <h2 id="collab-title" className="sec-title" data-reveal>
          Key <em>collaborators</em>
        </h2>
        <p className="sec-lead" data-reveal>
          The lab&apos;s research network spans leading institutions in human factors, HCI, and
          organizational science.
        </p>
        <ul className={styles.collabs}>
          {team.collaborators.map((c, i) => (
            <li key={c.name} data-reveal style={{ ['--rd' as string]: `${(i % 4) * 50}ms` }}>
              <span className={styles.collabName}>{c.name}</span>
              <span className={styles.collabInst}>{c.institution}</span>
              <span className="label">{c.area}</span>
            </li>
          ))}
        </ul>
      </section>

      <JoinStub />
    </>
  );
}
