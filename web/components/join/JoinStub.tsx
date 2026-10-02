import Link from 'next/link';
import { recruitingSentence } from '@/lib/recruiting';
import { site } from '@/lib/site';
import styles from './JoinStub.module.css';

/**
 * The short "Join" block on /team and /contact. It keeps the old `#join` anchor alive and
 * points to /join, the single source for recruiting (plan 4.3).
 */
export default function JoinStub({ tone = 'light' }: { tone?: 'light' | 'ink' }) {
  const r = site.recruiting;
  return (
    <section
      id="join"
      className={`section ${styles.stub} ${tone === 'ink' ? `section-ink on-dark ${styles.ink}` : ''}`}
      aria-labelledby="join-title"
    >
      <div>
        <p className="eyebrow">Opportunities</p>
        <h2 id="join-title" className="sec-title">
          Join the <em>ARCS Lab</em>
        </h2>
        <p className={styles.text}>
          {r.open && <span className={`status-dot ${styles.dot}`} aria-hidden="true" />}
          {recruitingSentence(r)} PhD, DEng and undergraduate roles, what we look for, and how to
          apply are all on one page.
        </p>
      </div>
      <Link href="/join" className="btn btn-primary">
        How to join{' '}
        <span className="arr" aria-hidden="true">
          →
        </span>
      </Link>
    </section>
  );
}
