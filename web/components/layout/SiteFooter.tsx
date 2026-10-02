import Link from 'next/link';
import TerrainContours from '@/components/hero/TerrainContours';
import styles from './SiteFooter.module.css';

export default function SiteFooter() {
  return (
    <footer className={`${styles.footer} on-dark`}>
      <TerrainContours focus={{ x: 0.08, y: 0.35 }} intensity={0.55} />
      <div className={styles.top}>
        <div className={styles.brand}>
          <p className={styles.mark}>
            Engineering the future of <em>human–AI teamwork.</em>
          </p>
          <p>
            The AI &amp; Robotics for Collaborative Systems Lab — Department of Industrial &amp;
            Systems Engineering, Tickle College of Engineering, University of Tennessee, Knoxville.
          </p>
        </div>
        <nav aria-label="Explore" className={styles.col}>
          <h2>Explore</h2>
          <ul>
            <li>
              <Link href="/research">Research</Link>
            </li>
            <li>
              <Link href="/publications">Publications</Link>
            </li>
            <li>
              <Link href="/team">Team</Link>
            </li>
            <li>
              <Link href="/pi">Principal Investigator</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Lab" className={styles.col}>
          <h2>Lab</h2>
          <ul>
            <li>
              <Link href="/funding">Funding</Link>
            </li>
            <li>
              <Link href="/talks">News &amp; Talks</Link>
            </li>
            <li>
              <Link href="/join">Join</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </nav>
        <div className={styles.col}>
          <h2>Contact</h2>
          <address className={styles.addr}>
            515 John D. Tickle Engineering Building
            <br />
            851 Neyland Drive, Knoxville, TN 37996
            <br />
            <a href="mailto:bschelbl@utk.edu">bschelbl@utk.edu</a>
          </address>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2026 ARCS Lab · University of Tennessee, Knoxville</p>
        <p className={styles.coords}>
          <span className="status-dot" aria-hidden="true" />
          35.9544° N / 83.9295° W · Knoxville, TN
        </p>
      </div>
    </footer>
  );
}
