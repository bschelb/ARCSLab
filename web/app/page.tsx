import Link from 'next/link';
import TerrainContours from '@/components/hero/TerrainContours';
import Authors, { LabMarkKey } from '@/components/papers/Authors';
import PersonCard from '@/components/people/PersonCard';
import Icon from '@/components/ui/Icon';
import { publications, researchAreas, team } from '@/lib/data';
import type { IconName } from '@/lib/icons';
import { pageMetadata } from '@/lib/metadata';
import { byGroup } from '@/lib/people';
import styles from './home.module.css';

export const metadata = pageMetadata({
  title: 'ARCS Lab | AI & Robotics for Collaborative Systems | UT Knoxville',
  path: '/',
});

// Home-page summaries of the six areas (verbatim from the Astro home page). Each links to the
// matching area on /research by position.
const PILLARS: { num: string; icon: IconName; title: string; desc: string }[] = [
  {
    num: '01',
    icon: 'network',
    title: 'Intelligent Information Sharing',
    desc: 'Modeling information-sharing, team cognition, and workload to create synergistic human–machine partnerships across complex, high-stakes environments.',
  },
  {
    num: '02',
    icon: 'shield',
    title: 'Trustworthy AI',
    desc: 'Designing transparent AI behaviors that accurately calibrate trust, support responsible AI adoption, and contribute to meaningful AI acceptance.',
  },
  {
    num: '03',
    icon: 'layers',
    title: 'Training',
    desc: 'Improving skill transference from training to operations through intelligent interventions, human-centered design, and psychological fidelity.',
  },
  {
    num: '04',
    icon: 'radar',
    title: 'Situational Awareness',
    desc: 'Developing real-time adaptive interfaces that surface mission-critical cues and promote collective understanding in electronically contested environments.',
  },
  {
    num: '05',
    icon: 'bot',
    title: 'Applied Robotics',
    desc: 'Integrating collaborative robots and unmanned ground vehicles into advanced manufacturing workflows and high-stakes emergency response scenarios.',
  },
  {
    num: '06',
    icon: 'flask',
    title: 'Evaluation & Validation',
    desc: "Developing rigorous experimental frameworks to test AI teammates' effectiveness, safety, and resilience through mixed-methods empirical research.",
  },
];

export default function HomePage() {
  const recent = [...publications].sort((a, b) => b.year - a.year).slice(0, 6);
  const pi = byGroup(team.people, 'pi')[0];
  const phd = byGroup(team.people, 'phd');

  return (
    <>
      {/* Exact production values Next's metadata resolver can't express (see lib/metadata.ts). */}
      <link rel="canonical" href="https://arcslab.io/" />
      <meta property="og:url" content="https://arcslab.io/" />

      {/* HERO */}
      <section className={`${styles.hero} on-dark`} aria-labelledby="hero-title">
        <TerrainContours animate places placesMinX={0.47} focus={{ x: 0.7, y: 0.5 }} />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>
            <span className="status-dot" aria-hidden="true" />
            <span>
              <span className={styles.hl}>ARCS Lab</span> · AI &amp; Robotics for Collaborative
              Systems · Knoxville, TN
            </span>
          </p>
          <h1 id="hero-title" className={styles.heroTitle}>
            Humans and AI, engineered to think as <em className="mark-block">one team.</em>
          </h1>
          <p className={styles.heroDesc}>
            We advance the science of human-AI teaming through rigorous, human-centered research —
            designing trustworthy AI teammates for defense, advanced manufacturing, healthcare, and
            emergency response.
          </p>
          <div className={styles.heroActions}>
            <Link href="/research" className="btn btn-primary">
              Explore the Research{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </Link>
            <Link href="/publications" className="btn btn-light">
              Publications{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
        <p className={styles.heroCaption}>
          <span>35.9544° N / 83.9295° W</span>
          <span>Terrain · Great Smoky Mountains to the Cumberland Plateau · USGS 3DEP</span>
        </p>
      </section>

      {/* MISSION */}
      <section className={styles.mission} aria-labelledby="mission-k">
        <h2 id="mission-k" className="label">
          Mission
        </h2>
        <p>
          &ldquo;Advancing human-AI teaming by understanding and optimizing collaborative systems
          comprising both human and computational elements — to enhance performance and safety
          across manufacturing, healthcare, defense, and beyond.&rdquo;
        </p>
      </section>

      {/* RESEARCH AREAS */}
      <section className="section" aria-labelledby="research-title">
        <div className={styles.headRow}>
          <div>
            <p className="eyebrow" data-reveal>
              01 · Research Program
            </p>
            <h2 id="research-title" className="sec-title" data-reveal>
              Six pillars of human-AI teaming <em>research</em>
            </h2>
          </div>
          <Link href="/research" className={styles.viewAll} data-reveal>
            View all research <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="sec-lead" data-reveal>
          Our interdisciplinary program integrates quantitative, qualitative, and computational
          methods to understand and improve human-AI collaborative systems.
        </p>
        <div className={styles.pillars}>
          {PILLARS.map((p, i) => (
            <Link
              key={p.num}
              href={`/research#${researchAreas[i]?.slug ?? ''}`}
              className={styles.pillar}
              data-reveal
              style={{ ['--rd' as string]: `${Math.min(i, 5) * 60}ms` }}
            >
              <span className={styles.pillarTop}>
                <span className={styles.pillarNum}>{p.num}</span>
                <Icon name={p.icon} size={30} className={styles.pillarIcon} />
              </span>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarDesc}>{p.desc}</p>
              <span className={styles.pillarGo}>
                Learn more <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENT PUBLICATIONS */}
      <section className="section section-ink on-dark" aria-labelledby="pubs-title">
        <p className="eyebrow" data-reveal>
          02 · Latest Work
        </p>
        <h2 id="pubs-title" className="sec-title" data-reveal>
          Recent <em>publications</em>
        </h2>
        <p className="sec-lead" data-reveal>
          Published across leading venues of the HFES, ACM, and IEEE communities — Human Factors,
          PACM HCI, IEEE Transactions on Human-Machine Systems, and more.
        </p>
        <ol className={styles.pubList}>
          {recent.map((pub) => (
            <li key={pub.id} className={styles.pubItem} data-reveal>
              <span className={styles.pubYear}>{pub.year}</span>
              <div>
                <Link href={`/papers/${pub.id}`} className={styles.pubTitle}>
                  {pub.title}
                </Link>
                <p className={styles.pubMeta}>
                  <Authors authors={pub.authors} /> · <em>{pub.venue}</em>
                </p>
              </div>
              <span className={styles.pubBadges}>
                {pub.award && (
                  <span className={styles.award}>
                    <Icon name="trophy" size={12} className="badge-ico" />
                    {pub.award}
                  </span>
                )}
                {pub.status === 'in-press' && <span className={styles.award}>In Press</span>}
                {pub.pdf && <span className="tag">Free PDF</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className={styles.pubsFoot}>
          <LabMarkKey />
          <Link href="/publications" className="btn btn-primary">
            All publications{' '}
            <span className="arr" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* TEAM PREVIEW */}
      <section className="section" aria-labelledby="team-title">
        <div className={styles.headRow}>
          <div>
            <p className="eyebrow" data-reveal>
              03 · The Team
            </p>
            <h2 id="team-title" className="sec-title" data-reveal>
              The people behind the <em>partnership</em>
            </h2>
          </div>
          <Link href="/team" className={styles.viewAll} data-reveal>
            Meet the full team <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="sec-lead" data-reveal>
          A growing community of researchers advancing the science of human-AI collaboration at the
          University of Tennessee, Knoxville.
        </p>
        <div className={styles.teamGrid}>
          {pi && (
            <div data-reveal>
              <PersonCard person={pi} role="PI · Founding Director" href="/pi">
                {pi.shortBio}
              </PersonCard>
            </div>
          )}
          {phd.map((s, i) => (
            <div key={s.slug} data-reveal style={{ ['--rd' as string]: `${(i + 1) * 70}ms` }}>
              <PersonCard person={s} role="PhD Student" href={`/team#${s.slug}`}>
                {s.shortBio}
              </PersonCard>
            </div>
          ))}
          <Link href="/join" className={styles.joinTile} data-reveal>
            <span className={styles.joinPlus} aria-hidden="true">
              +
            </span>
            <span className={styles.joinName}>Join the ARCS Lab</span>
            <span className={styles.joinRole}>Recruiting PhD Students</span>
            <span className={styles.joinDesc}>
              We seek motivated PhD students in ISE, CS, HCI, and Psychology. Email Dr. Schelble
              with your CV.
            </span>
          </Link>
        </div>
      </section>

      {/* FUNDING BAND */}
      <section className={styles.sponsors} aria-labelledby="sponsors-k">
        <h2 id="sponsors-k" className="label">
          Sponsored By
        </h2>
        <ul>
          <li>
            <span className={styles.sponsorAbbr}>ARO</span>
            <span className={styles.sponsorName}>Army Research Office</span>
          </li>
          <li>
            <span className={styles.sponsorAbbr}>UTK</span>
            <span className={styles.sponsorName}>University of Tennessee</span>
          </li>
        </ul>
      </section>

      {/* CONTACT CTA */}
      <section className={`section section-ink on-dark ${styles.cta}`} aria-labelledby="cta-title">
        <div>
          <p className="eyebrow" data-reveal>
            04 · Get in Touch
          </p>
          <h2 id="cta-title" className="sec-title" data-reveal>
            Let&apos;s build the next generation of <em>teams.</em>
          </h2>
          <p className="sec-lead" data-reveal>
            Interested in collaboration, graduate study, or partnership? We&apos;d love to hear from
            you.
          </p>
          <div className={styles.heroActions} data-reveal>
            <Link href="/contact" className="btn btn-primary">
              Contact the Lab{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </Link>
            <Link href="/join" className="btn btn-light">
              Prospective Students{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
        <ul className={styles.ctaInfo}>
          <li className={styles.ctaItem} data-reveal>
            <Icon name="pin" size={20} className={styles.ctaIcon} />
            <div>
              <p className="label">Location</p>
              <p>
                515 John D. Tickle Engineering Building
                <br />
                851 Neyland Drive, Knoxville, TN 37996
              </p>
            </div>
          </li>
          <li className={styles.ctaItem} data-reveal>
            <Icon name="mail" size={20} className={styles.ctaIcon} />
            <div>
              <p className="label">Email</p>
              <p>
                <a href="mailto:bschelbl@utk.edu">bschelbl@utk.edu</a>
              </p>
            </div>
          </li>
          <li className={styles.ctaItem} data-reveal>
            <Icon name="building" size={20} className={styles.ctaIcon} />
            <div>
              <p className="label">Department</p>
              <p>
                Industrial &amp; Systems Engineering
                <br />
                Tickle College of Engineering, UTK
              </p>
            </div>
          </li>
          <li className={styles.ctaItem} data-reveal>
            <Icon name="globe" size={20} className={styles.ctaIcon} />
            <div>
              <p className="label">Lab Website</p>
              <p>
                <a href="https://arcslab.io">arcslab.io</a>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </>
  );
}
