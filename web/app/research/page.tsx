import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import Authors, { LabMarkKey } from '@/components/papers/Authors';
import { FIGURES } from '@/components/research/figures';
import TechFigure from '@/components/research/TechFigure';
import Icon from '@/components/ui/Icon';
import { researchAreas } from '@/lib/data';
import type { IconName } from '@/lib/icons';
import { pageMetadata } from '@/lib/metadata';
import styles from './research.module.css';

export const metadata = pageMetadata({
  title: 'Research | ARCS Lab | UT Knoxville',
  description:
    'ARCS Lab research areas: human-AI teaming, trustworthy AI, training, situational awareness, applied robotics, and evaluation of AI teammates.',
  path: '/research',
});

const METHODS: { icon: IconName; num: string; title: string; desc: string }[] = [
  {
    icon: 'chart',
    num: 'M-01',
    title: 'Quantitative',
    desc: 'Controlled experiments, surveys, behavioral measurement, structural equation modeling, network analysis, and statistical inference to test causal hypotheses about human-AI interaction.',
  },
  {
    icon: 'message',
    num: 'M-02',
    title: 'Qualitative',
    desc: 'Thematic analysis, think-aloud protocols, semi-structured interviews, and expert elicitation to contextualize findings and surface constructs that resist quantification.',
  },
  {
    icon: 'cpu',
    num: 'M-03',
    title: 'Computational',
    desc: 'Reinforcement learning models, game-theoretic frameworks, agent-based simulation, and generative AI tools to build and test formal models of human-AI collaborative behavior.',
  },
];

const DOMAINS: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'target',
    title: 'Defense & Command',
    desc: 'Shared situational awareness in electronically contested environments, AI on the battlefield, and compromised AI mitigation for warfighters.',
  },
  {
    icon: 'factory',
    title: 'Advanced Manufacturing',
    desc: 'Collaborative robotics integration, human-cobot workload distribution, and trust in automated manufacturing workflows.',
  },
  {
    icon: 'pulse',
    title: 'Healthcare',
    desc: 'Ethical AI decision support in clinical settings, adaptive autonomy for healthcare AI teammates, and human factors in medical AI deployment.',
  },
  {
    icon: 'alert',
    title: 'Emergency Response',
    desc: 'Human-robot teaming in search-and-rescue, AI decision support for first responders, and team cognition under high-stress conditions.',
  },
  {
    icon: 'lock',
    title: 'Cybersecurity',
    desc: 'Human behavior modeling in cybersecurity contexts, cognitive biases in security decision-making, and AI-assisted defense strategies.',
  },
  {
    icon: 'briefcase',
    title: 'Future of Work',
    desc: 'AI teammate integration in organizational contexts, workforce augmentation, and the human dimensions of AI-enabled productivity.',
  },
  {
    icon: 'scale',
    title: 'Responsible AI',
    desc: 'AI ethics in practice, responsible deployment frameworks, and the societal implications of human-AI teaming at scale.',
  },
  {
    icon: 'brain',
    title: 'Decision-Making',
    desc: 'Human-AI complementarity in complex decisions, cognitive bias mitigation, and advice-taking from AI systems under uncertainty.',
  },
];

export default function ResearchPage() {
  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Research', '/research'],
        ]}
      />
      <PageHeader
        index="01"
        crumb="Research Program"
        title="The science of"
        titleEm="working together."
        lead="We use rigorous mixed-methods inquiry to understand and improve how humans and AI systems collaborate — building the scientific foundation for trustworthy, high-performing human-AI teams across mission-critical domains."
        stats={[
          { value: `${researchAreas.length}`, label: 'Research Areas' },
          { value: '3', label: 'Methodological Traditions' },
          { value: '8', label: 'Applied Domains' },
        ]}
        focus={{ x: 0.95, y: 0.85 }}
      />

      <div className={styles.areas}>
        {researchAreas.map((area) => {
          const figure = FIGURES[area.slug];
          return (
            <section
              key={area.slug}
              id={area.slug}
              className={styles.area}
              aria-labelledby={`${area.slug}-title`}
            >
              <div className={styles.rail} data-reveal>
                <span className={styles.num}>{area.num}</span>
                <Icon name={area.icon} size={28} className={styles.icon} />
                <span className="tag">{area.tag}</span>
                <h2 id={`${area.slug}-title`} className={styles.title}>
                  {area.title}
                </h2>
                <Link href={`/research/${area.slug}`} className={styles.explore}>
                  Explore this area<span className="sr-only">: {area.title}</span>{' '}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className={styles.body}>
                <div className={styles.text} data-reveal>
                  <p className={styles.desc}>{area.description}</p>
                  {area.description2 && <p className={styles.desc}>{area.description2}</p>}
                  <ul className={styles.bullets}>
                    {area.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
                {figure && (
                  <div className={styles.figure} data-reveal>
                    <TechFigure figure={figure} index={area.num} />
                  </div>
                )}
                <div className={styles.pubs} data-reveal>
                  <div className={styles.pubsHead}>
                    <h3 className="label">Representative Publications</h3>
                    <LabMarkKey />
                  </div>
                  <ul>
                    {area.pubs.map((pub) => (
                      <li key={pub.title}>
                        <strong>
                          <Authors authors={pub.authors} /> ({pub.venue.match(/\d{4}/)?.[0] ?? ''}).
                        </strong>{' '}
                        {pub.paperId ? (
                          <Link href={`/papers/${pub.paperId}`} className={styles.pubLink}>
                            {pub.title}
                          </Link>
                        ) : (
                          pub.title
                        )}
                        . <em>{pub.venue}</em>
                        {pub.award && (
                          <span className={styles.award}>
                            <Icon name="trophy" size={12} className="badge-ico" />
                            {pub.award}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section id="methods" className="section section-ink on-dark" aria-labelledby="methods-title">
        <p className="eyebrow" data-reveal>
          Methodology
        </p>
        <h2 id="methods-title" className="sec-title" data-reveal>
          How we <em>work</em>
        </h2>
        <p className="sec-lead" data-reveal>
          ARCS Lab research is fundamentally interdisciplinary and mixed-methods, combining the
          rigor of experimental science with the depth of qualitative inquiry.
        </p>
        <div className={styles.methods}>
          {METHODS.map((m, i) => (
            <article
              key={m.num}
              className={styles.method}
              data-reveal
              style={{ ['--rd' as string]: `${i * 80}ms` }}
            >
              <Icon name={m.icon} size={30} className={styles.methodIcon} />
              <p className={styles.methodNum}>{m.num}</p>
              <h3 className={styles.methodTitle}>{m.title}</h3>
              <p className={styles.methodDesc}>{m.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="domains-title">
        <p className="eyebrow" data-reveal>
          Applied Domains
        </p>
        <h2 id="domains-title" className="sec-title" data-reveal>
          Where we <em>work</em>
        </h2>
        <p className="sec-lead" data-reveal>
          Our research addresses real-world challenges across high-stakes domains where human-AI
          teaming has the greatest potential impact.
        </p>
        <div className={styles.domains}>
          {DOMAINS.map((d, i) => (
            <article
              key={d.title}
              className={styles.domain}
              data-reveal
              style={{ ['--rd' as string]: `${(i % 4) * 60}ms` }}
            >
              <Icon name={d.icon} size={26} className={styles.domainIcon} />
              <h3 className={styles.domainTitle}>{d.title}</h3>
              <p className={styles.domainDesc}>{d.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
