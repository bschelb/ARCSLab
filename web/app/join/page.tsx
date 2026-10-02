import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import DraftTag from '@/components/ui/DraftTag';
import Icon from '@/components/ui/Icon';
import { join } from '@/lib/data';
import { published } from '@/lib/drafts';
import { pageMetadata } from '@/lib/metadata';
import { PROSPECTIVE_CONTACT, recruitingDetail, recruitingHeadline } from '@/lib/recruiting';
import { site } from '@/lib/site';
import styles from './join.module.css';

export const metadata = pageMetadata({
  title: 'Join the Lab | ARCS Lab | UT Knoxville',
  description:
    'Join the ARCS Lab at UT Knoxville: PhD, Doctor of Engineering and undergraduate research positions in human-AI teaming, with recruiting status and how to apply.',
  path: '/join',
});

export default function JoinPage() {
  const r = site.recruiting;
  const roles = published(join.roles);
  const steps = published(join.steps);
  const faq = published(join.faq);

  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Join', '/join'],
        ]}
      />
      <PageHeader
        index="08"
        crumb="Opportunities"
        title="Join the"
        titleEm="ARCS Lab."
        lead="The ARCS Lab recruits motivated students and researchers interested in human-AI teaming, human factors, HCI, and collaborative systems. We offer a rigorous, supportive, and interdisciplinary research environment at a leading research university."
        focus={{ x: 0.3, y: 0.6 }}
      />

      {/* Recruiting status, from site.recruiting */}
      <section
        className={`${styles.status} ${r.open ? styles.open : styles.closed}`}
        aria-labelledby="status-title"
      >
        <div>
          <p className="label">Recruiting status</p>
          <h2 id="status-title" className={styles.statusHead}>
            {r.open && <span className="status-dot" aria-hidden="true" />}
            {recruitingHeadline(r)}
          </h2>
          <p className={styles.statusDetail}>{recruitingDetail(r)}</p>
        </div>
        <div className={styles.actions}>
          <Link href={PROSPECTIVE_CONTACT} className="btn btn-primary">
            Start an inquiry{' '}
            <span className="arr" aria-hidden="true">
              →
            </span>
          </Link>
          <a href={`mailto:${site.email}`} className="btn btn-ghost">
            Email Dr. Schelble
          </a>
        </div>
      </section>

      {/* Roles */}
      <section className="section" aria-labelledby="roles-title">
        <p className="eyebrow" data-reveal>
          01 · Positions
        </p>
        <h2 id="roles-title" className="sec-title" data-reveal>
          Ways to <em>join</em>
        </h2>
        <ul className={styles.roles}>
          {roles.map((role, i) => (
            <li
              key={role.id}
              id={role.id}
              className={styles.role}
              data-reveal
              style={{ ['--rd' as string]: `${i * 80}ms` }}
            >
              <Icon name={role.icon} size={30} className={styles.roleIcon} />
              <h3 className={styles.roleTitle}>
                {role.title}
                {role.draft && <DraftTag />}
              </h3>
              <p className={styles.roleDesc}>{role.desc}</p>
              <p className={styles.roleReq}>{role.req}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Fit */}
      <section className={`section section-paper-2 ${styles.fit}`} aria-labelledby="fit-title">
        <div>
          <p className="eyebrow" data-reveal>
            02 · Fit
          </p>
          <h2 id="fit-title" className="sec-title" data-reveal>
            What we <em>look for</em>
          </h2>
        </div>
        <div data-reveal>
          <p className={styles.fitIntro}>{join.lookingFor.intro}</p>
          <ul className={styles.backgrounds} aria-label="Backgrounds">
            {join.lookingFor.backgrounds.map((b) => (
              <li key={b} className="tag">
                {b}
              </li>
            ))}
          </ul>
          <p className={styles.fitMore}>
            See the <Link href="/research">research areas</Link> and{' '}
            <Link href="/publications">recent publications</Link> for the questions we work on.
          </p>
        </div>
      </section>

      {/* How to apply */}
      <section className="section section-ink on-dark" aria-labelledby="apply-title">
        <p className="eyebrow" data-reveal>
          03 · Process
        </p>
        <h2 id="apply-title" className="sec-title" data-reveal>
          How to <em>apply</em>
        </h2>
        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <li
              key={s.title}
              className={styles.step}
              data-reveal
              style={{ ['--rd' as string]: `${i * 80}ms` }}
            >
              <span className={styles.stepNum} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.stepTitle}>
                {s.title}
                {s.draft && <DraftTag />}
              </h3>
              <p className={styles.stepBody}>{s.body}</p>
            </li>
          ))}
        </ol>
        <div className={styles.applyCta} data-reveal>
          <Link href={PROSPECTIVE_CONTACT} className="btn btn-primary">
            Start an inquiry{' '}
            <span className="arr" aria-hidden="true">
              →
            </span>
          </Link>
          <a href={`mailto:${site.email}`} className="btn btn-light">
            {site.email}
          </a>
        </div>
      </section>

      {/* FAQ */}
      {faq.length > 0 && (
        <section className={`section ${styles.faqWrap}`} aria-labelledby="faq-title">
          <div>
            <p className="eyebrow" data-reveal>
              04 · Questions
            </p>
            <h2 id="faq-title" className="sec-title" data-reveal>
              Frequently <em>asked</em>
            </h2>
          </div>
          <div className={styles.faq}>
            {faq.map((f) => (
              <details key={f.q} className={styles.qa}>
                <summary>
                  <span>
                    {f.q}
                    {f.draft && <DraftTag />}
                  </span>
                  <span className={styles.plus} aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
