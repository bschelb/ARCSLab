import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import TerrainContours from '@/components/hero/TerrainContours';
import Icon from '@/components/ui/Icon';
import { team } from '@/lib/data';
import { formatUsd } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import { pageMetadata } from '@/lib/metadata';
import { byGroup } from '@/lib/people';
import { profilePageNode } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { stats } from '@/lib/stats';
import styles from './pi.module.css';

export const metadata = pageMetadata({
  title: 'Dr. Beau Schelble | Principal Investigator | ARCS Lab',
  description:
    'Dr. Beau G. Schelble — Assistant Professor of Industrial & Systems Engineering at UT Knoxville and Founding Director of the ARCS Lab. Expert in human-AI teaming.',
  path: '/pi',
});

const LINKS: { href: string; icon: IconName; label: string }[] = [
  { href: 'https://beauschelble.com', icon: 'globe', label: 'Personal Site' },
  {
    href: 'https://scholar.google.com/citations?user=ggHXV-4AAAAJ',
    icon: 'book',
    label: 'Scholar',
  },
  { href: 'https://orcid.org/0000-0003-3704-697X', icon: 'link', label: 'ORCID' },
  {
    href: 'https://www.researchgate.net/profile/Beau-Schelble',
    icon: 'flask',
    label: 'ResearchGate',
  },
  {
    href: 'https://www.linkedin.com/in/beau-schelble-ph-d-498675135/',
    icon: 'briefcase',
    label: 'LinkedIn',
  },
];

const HONORS: {
  yr: string;
  title: string;
  org: string;
  badge?: { icon: IconName; text: string };
}[] = [
  {
    yr: '2025',
    title: '2023 & 2024 Featured Article, ACM Transactions on Interactive Intelligent Systems',
    org: 'Association for Computing Machinery',
    badge: { icon: 'award', text: 'Featured' },
  },
  {
    yr: '2024',
    title: 'Most Outstanding Graduate Student, Human-Centered Computing PhD Program',
    org: 'Clemson University',
    badge: { icon: 'trophy', text: 'Award' },
  },
  {
    yr: '2023',
    title: 'Best Journal of Cognitive Engineering and Decision Making Article of 2022',
    org: 'JCEDM · SAGE Journals',
    badge: { icon: 'trophy', text: 'Best Article' },
  },
  {
    yr: '2023',
    title: 'Outstanding Graduate Research Assistant Nominee',
    org: 'Clemson University Graduate Student Government',
  },
  {
    yr: '2022',
    title:
      'Best Paper Honorable Mention — ACM International Conference on Supporting Group Work (GROUP)',
    org: '"Let\'s Think Together! Assessing Shared Mental Models, Performance, and Trust in Human-Agent Teams"',
    badge: { icon: 'trophy', text: 'Best Paper HM' },
  },
  {
    yr: '2021',
    title: 'Nominated for Best Overall Paper — HICSS-54',
    org: 'Hawaii International Conference on System Sciences',
    badge: { icon: 'trophy', text: 'Nominee' },
  },
  {
    yr: '2020',
    title: 'Best Overall Paper — 8th International Conference on Human-Agent Interaction (ACM HAI)',
    org: '"Invoking Principles of Groupware to Develop and Evaluate Present and Future Human-Agent Teams"',
    badge: { icon: 'trophy', text: 'Best Paper' },
  },
  {
    yr: '2019–21',
    title: 'NSF/NRT THINKER Fellowship — $95,000',
    org: 'Technology-Human Integrated Knowledge Education and Research, Clemson University',
    badge: { icon: 'award', text: 'Fellowship' },
  },
];

const AFFILIATIONS: { abbr: string; name: string; yr: string }[] = [
  { abbr: 'HFES', name: 'Human Factors and Ergonomics Society', yr: 'Member since 2018' },
  { abbr: 'ACM', name: 'Association for Computing Machinery', yr: 'Member since 2020' },
  {
    abbr: 'IEEE',
    name: 'Institute of Electrical and Electronics Engineers',
    yr: 'Member since 2024',
  },
  { abbr: 'IISE', name: 'Institute of Industrial and System Engineers', yr: 'Member since 2024' },
  { abbr: 'ASEE', name: 'American Society for Engineering Education', yr: 'Member since 2024' },
  {
    abbr: 'ASME JAVS',
    name: 'Associate Editor, ASME Journal of Autonomous Vehicles and Systems',
    yr: 'Editorial Board since 2025',
  },
  {
    abbr: 'Human Factors',
    name: 'Editorial Board, Human Factors: The Journal of the Human Factors and Ergonomics Society',
    yr: 'Editorial Board since 2026',
  },
  {
    abbr: 'MULTITRUST',
    name: 'Organizing Committee, 5th Workshop on Multidisciplinary Perspectives on Human-AI Team Trust (HHAI 2026)',
    yr: 'Program committee since 2023',
  },
  {
    abbr: 'NSF · ARO · ONR',
    name: 'Review panelist, NSF CISE & CMMI; ad hoc proposal reviewer, Army Research Office & Office of Naval Research',
    yr: 'Grant reviewer since 2024',
  },
];

const COURSES = [
  { code: 'IE 304', title: 'Introduction to Human Factors Engineering' },
  { code: 'IE 423', title: 'Industrial Safety' },
  { code: 'IE 691', title: 'Human-AI Teaming Measurement, Evaluation, and Development' },
];

export default function PiPage() {
  const pi = byGroup(team.people, 'pi')[0];
  const fundingTotal = formatUsd(stats.piFunding);
  const fundingM = (stats.piFunding / 1_000_000).toFixed(1);

  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Principal Investigator', '/pi'],
        ]}
      />
      <JsonLd
        data={profilePageNode({
          url: absoluteUrl('/pi'),
          name: 'Dr. Beau G. Schelble — Principal Investigator, ARCS Lab',
          description:
            'Dr. Beau G. Schelble, Founding Director of the ARCS Lab and Assistant Professor of Industrial & Systems Engineering at the University of Tennessee, Knoxville. Research on human-AI teaming, trust, and team cognition.',
        })}
      />

      <div className={styles.hero}>
        <div className={`${styles.left} on-dark`}>
          <TerrainContours focus={{ x: 0.5, y: 0.5 }} intensity={0.7} />
          <div className={styles.leftInner}>
            <p className={styles.crumb}>
              <span className={styles.ix}>04</span>
              <span className={styles.sep} aria-hidden="true" />
              <span>ARCS Lab — Principal Investigator</span>
            </p>
            {pi?.photo && (
              <div className={styles.avatar}>
                <Image
                  src={pi.photo}
                  alt={pi.name}
                  fill
                  priority
                  sizes="180px"
                  style={{ objectPosition: pi.cropPosition ?? 'center 20%' }}
                />
              </div>
            )}
            <h1 className={styles.name}>
              Dr. Beau G.
              <br />
              <span className="mark-block">Schelble</span>
            </h1>
            <p className={styles.ttl}>Assistant Professor, Industrial &amp; Systems Engineering</p>
            <p className={styles.org}>
              Founding Director, ARCS Lab · Tickle College of Engineering
            </p>
            <ul className={styles.links}>
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener">
                    <Icon name={l.icon} size={14} /> {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="mailto:bschelbl@utk.edu">
                  <Icon name="mail" size={14} /> Email
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.right}>
          <p className="eyebrow">About the PI</p>
          <h2 className={styles.bioH}>About Dr. Schelble</h2>
          <div className={styles.bio}>
            <p>
              Dr. Beau G. Schelble is an Assistant Professor of Industrial &amp; Systems Engineering
              and the Founding Director of the AI &amp; Robotics for Collaborative Systems (ARCS)
              Lab in the Tickle College of Engineering at the University of Tennessee, Knoxville. He
              received his Ph.D. in Human-Centered Computing from Clemson University in 2023. His
              expertise lies in human-AI/autonomy teaming, human-centered AI, and collaborative
              intelligent systems engineering, with an emphasis on trust, shared knowledge,
              intelligent information sharing, and situational awareness. Dr. Schelble has served as
              Principal Investigator on awards totaling {fundingTotal} to date, including two Army
              Research Office awards — one focused on preventing, identifying, and mitigating the
              impact of compromised AI teammates through shared situation awareness and mental model
              accuracy, and one on the formation, drift, and reconciliation of shared world models
              in human-AI teams operating under degraded information environments.
            </p>
            <p>
              Dr. Schelble&apos;s research program integrates quantitative, qualitative, and
              computational methods to study and design human-AI teams capable of improving the
              human condition across a wide range of applications, such as advanced manufacturing,
              cybersecurity, emergency response, and command and control. He has published nearly 50
              works on human-AI teaming and human-centered AI in leading venues of the HFES, ACM,
              and IEEE communities (e.g., Human Factors, Proceedings of the ACM on Human-Computer
              Interaction, and IEEE Transactions on Human-Machine Systems). His work has earned him
              five best paper awards/nominations. He also contributes to the scholarly community as
              an editorial board member for <em>Human Factors</em> and an Associate Editor for the
              ASME Journal of Autonomous Vehicles and Systems, serves on NSF review panels and
              multiple program and organizing committees, and reviews for a wide array of journals
              (e.g., Human Factors; IJHCI; IJHCS; Behavior &amp; Information Technology; Computers
              in Human Behavior).
            </p>
            <p>
              At UT Knoxville, Dr. Schelble teaches undergraduate and graduate courses in human
              factors and industrial safety, and actively mentors Ph.D. and undergraduate
              researchers. He is frequently invited to speak on human-AI teaming, recently
              delivering a keynote at the MULTITRUST workshop at HHAI 2026 in Brussels and invited
              talks at the National Academies&apos; Board on Human-Systems Integration, West
              Point&apos;s &ldquo;AI on the Battlefield&rdquo; workshop, and Eindhoven University of
              Technology, where he shares evidence-based guidance for building ethical, trustworthy,
              and high-performing human-AI teams.
            </p>
          </div>
        </div>
      </div>

      <dl className={`${styles.statband} on-dark`}>
        <div>
          <dt className="label">Publications</dt>
          <dd className="stat-num">
            <span data-count={stats.publications}>{stats.publications}</span>+
          </dd>
        </div>
        <div>
          <dt className="label">PI Funding</dt>
          <dd className="stat-num">
            <span data-count={fundingM} data-prefix="$" data-suffix="M">
              ${fundingM}M
            </span>
          </dd>
        </div>
        <div>
          <dt className="label">Best Paper Awards</dt>
          <dd className="stat-num">
            <span data-count={stats.bestPaperAwards}>{stats.bestPaperAwards}</span>
          </dd>
        </div>
        <div>
          <dt className="label">Invited Talks</dt>
          <dd className="stat-num">
            <span data-count={stats.invitedTalks}>{stats.invitedTalks}</span>
          </dd>
        </div>
      </dl>

      <section className="section" aria-labelledby="edu-title">
        <p className="eyebrow" data-reveal>
          Academic Background
        </p>
        <h2 id="edu-title" className="sec-title" data-reveal>
          <em>Education</em>
        </h2>
        <div className={styles.edu}>
          <article className={styles.eduCard} data-reveal>
            <p className="label">Doctor of Philosophy</p>
            <h3>Human-Centered Computing</h3>
            <p className={styles.school}>Clemson University</p>
            <p className={styles.yr}>2023</p>
            <p className={styles.note}>
              Advisor: Dr. Nathan J. McNeese. Dissertation:{' '}
              <em>Leveraging Artificial Intelligence for Team Cognition in Human-AI Teams</em>.
              NSF/NRT THINKER Fellow.
            </p>
          </article>
          <article className={styles.eduCard} data-reveal style={{ ['--rd' as string]: '100ms' }}>
            <p className="label">Bachelor of Science</p>
            <h3>Psychology (Human Factors)</h3>
            <p className={styles.school}>Clemson University</p>
            <p className={styles.yr}>2018</p>
            <p className={styles.note}>
              Departmental Honors Graduate. Jervey Memorial Scholar. Class of 1958 Golden
              Anniversary Scholar.
            </p>
          </article>
        </div>
      </section>

      <section className="section section-paper-2" aria-labelledby="honors-title">
        <p className="eyebrow" data-reveal>
          Recognition
        </p>
        <h2 id="honors-title" className="sec-title" data-reveal>
          Honors &amp; <em>awards</em>
        </h2>
        <ol className={styles.honors}>
          {HONORS.map((h) => (
            <li key={h.title} data-reveal>
              <span className={styles.hYr}>{h.yr}</span>
              <div>
                <p className={styles.hTitle}>{h.title}</p>
                <p className={styles.hOrg}>{h.org}</p>
              </div>
              {h.badge ? (
                <span className={styles.hBadge}>
                  <Icon name={h.badge.icon} size={12} className="badge-ico" />
                  {h.badge.text}
                </span>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-ink on-dark" aria-labelledby="aff-title">
        <p className="eyebrow" data-reveal>
          Memberships &amp; Professional Service
        </p>
        <h2 id="aff-title" className="sec-title" data-reveal>
          <em>Affiliations</em>
        </h2>
        <ul className={styles.aff}>
          {AFFILIATIONS.map((a, i) => (
            <li key={a.abbr} data-reveal style={{ ['--rd' as string]: `${(i % 3) * 60}ms` }}>
              <span className={styles.affAbbr}>{a.abbr}</span>
              <span className={styles.affName}>{a.name}</span>
              <span className="label">{a.yr}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="teach-title">
        <p className="eyebrow" data-reveal>
          Education &amp; Training
        </p>
        <h2 id="teach-title" className="sec-title" data-reveal>
          Teaching at <em>UTK</em>
        </h2>
        <ul className={styles.courses}>
          {COURSES.map((c, i) => (
            <li key={c.code} data-reveal style={{ ['--rd' as string]: `${i * 80}ms` }}>
              <span className={styles.code}>{c.code}</span>
              <span className={styles.cTitle}>{c.title}</span>
              <span className="label">Instructor of Record · Tickle College of Engineering</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
