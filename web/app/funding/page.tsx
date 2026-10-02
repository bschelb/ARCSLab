import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import { grants } from '@/lib/data';
import { formatUsd } from '@/lib/format';
import { displayedGrants, piTotal, splitInternal } from '@/lib/funding';
import { pageMetadata } from '@/lib/metadata';
import type { Grant } from '@/lib/schemas';
import styles from './funding.module.css';

export const metadata = pageMetadata({
  title: 'Funding | ARCS Lab | UT Knoxville',
  description:
    'ARCS Lab sponsored research — funded by the Army Research Office and the University of Tennessee, Knoxville, with $2.8M+ awarded as PI.',
  path: '/funding',
});

const roleText = (g: Grant) => (g.effortPct ? `${g.role} — ${g.effortPct}%` : g.role);

export default function FundingPage() {
  const { external, internal } = splitInternal(grants);
  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Funding', '/funding'],
        ]}
      />
      <PageHeader
        index="05"
        crumb="Sponsored Research"
        title="Funded to solve"
        titleEm="hard problems."
        lead="The ARCS Lab is actively funded by the Army Research Office and the University of Tennessee, Knoxville — supporting research on the most consequential questions in human-AI teaming."
        stats={[
          { value: formatUsd(piTotal(grants)), label: 'Total Awarded as PI' },
          {
            value: `${displayedGrants(grants).filter((g) => g.status === 'active').length}`,
            label: 'Active Awards',
          },
        ]}
        focus={{ x: 0.2, y: 0.3 }}
      />

      <section className="section" aria-labelledby="grants-title">
        <p className="eyebrow" data-reveal>
          Current &amp; Awarded Funding
        </p>
        <h2 id="grants-title" className="sec-title" data-reveal>
          Active <em>grants</em>
        </h2>
        <div className={styles.grants}>
          {external.map((g, i) => (
            <article key={g.id} className={styles.grant} data-reveal>
              <div className={styles.head}>
                <span className={styles.status}>
                  <span className="status-dot" aria-hidden="true" /> Active
                </span>
                <span className="label">
                  AWARD-{String(i + 1).padStart(2, '0')} {'//'} EXTERNAL
                </span>
              </div>
              <h3 className={styles.title}>{g.title}</h3>
              <dl className={styles.meta}>
                <div>
                  <dt className="label">Funder</dt>
                  <dd>{g.funder}</dd>
                </div>
                <div>
                  <dt className="label">Role</dt>
                  <dd>{roleText(g)}</dd>
                </div>
                <div>
                  <dt className="label">Award</dt>
                  <dd className={styles.amount}>{formatUsd(g.amount)}</dd>
                </div>
              </dl>
              {g.description && <p className={styles.desc}>{g.description}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="section section-paper-2" aria-label="Internal awards">
        <ul className={styles.internal}>
          {internal.map((g, i) => (
            <li key={g.id} data-reveal style={{ ['--rd' as string]: `${i * 80}ms` }}>
              <p className={styles.intStatus}>
                <span className="status-dot" aria-hidden="true" /> Active — Internal
              </p>
              <h3 className={styles.intTitle}>{g.title}</h3>
              <p className={styles.intMeta}>
                {g.funder} · {roleText(g)} · {formatUsd(g.amount)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
