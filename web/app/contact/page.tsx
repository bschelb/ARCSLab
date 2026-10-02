import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from '@/components/contact/ContactForm';
import JoinStub from '@/components/join/JoinStub';
import PageHeader from '@/components/layout/PageHeader';
import Icon from '@/components/ui/Icon';
import { pageMetadata } from '@/lib/metadata';
import styles from './contact.module.css';

export const metadata = pageMetadata({
  title: 'Contact | ARCS Lab | UT Knoxville',
  description:
    'Contact the ARCS Lab at UT Knoxville — inquiries from prospective graduate students, research collaborators, industry partners, and press are welcome.',
  path: '/contact',
});

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=851+Neyland+Drive,+Knoxville,+TN+37996';

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Contact', '/contact'],
        ]}
      />
      <PageHeader
        index="07"
        crumb="Communication"
        title="Open"
        titleEm="channel."
        lead="We welcome inquiries from prospective graduate students, research collaborators, industry partners, and members of the press. Don't hesitate to reach out."
        focus={{ x: 0.62, y: 0.55 }}
      />

      <div className={styles.body}>
        <section className={styles.left} aria-labelledby="info-title">
          <p className="eyebrow">Lab Information</p>
          <h2 id="info-title" className={styles.panelH}>
            Contact &amp; Location
          </h2>
          <dl className={styles.info}>
            <div>
              <Icon name="pin" size={19} className={styles.infoIcon} />
              <dt className="label">Location</dt>
              <dd>
                515 John D. Tickle Engineering Building
                <br />
                851 Neyland Drive, Knoxville, TN 37996
              </dd>
            </div>
            <div>
              <Icon name="mail" size={19} className={styles.infoIcon} />
              <dt className="label">Email</dt>
              <dd>
                <a href="mailto:bschelbl@utk.edu">bschelbl@utk.edu</a>
              </dd>
            </div>
            <div>
              <Icon name="globe" size={19} className={styles.infoIcon} />
              <dt className="label">Lab Website</dt>
              <dd>
                <a href="https://arcslab.io">arcslab.io</a>
              </dd>
            </div>
            <div>
              <Icon name="user" size={19} className={styles.infoIcon} />
              <dt className="label">PI Personal Site</dt>
              <dd>
                <a href="https://beauschelble.com" target="_blank" rel="noopener">
                  beauschelble.com
                </a>
              </dd>
            </div>
            <div>
              <Icon name="building" size={19} className={styles.infoIcon} />
              <dt className="label">Department</dt>
              <dd>
                <a href="https://tickle.utk.edu/ise/" target="_blank" rel="noopener">
                  Industrial &amp; Systems Engineering
                  <br />
                  Tickle College of Engineering, UTK
                </a>
              </dd>
            </div>
          </dl>
          <div className={`${styles.map} on-dark`}>
            <p className={styles.mapCoords}>35.9544° N / 83.9295° W</p>
            <p className={styles.mapAddr}>
              John D. Tickle Engineering Building · 851 Neyland Drive, Knoxville, TN 37996
            </p>
            <a href={MAPS_URL} target="_blank" rel="noopener" className="btn btn-light">
              Open in Google Maps{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </section>

        <section className={styles.right} aria-labelledby="form-title">
          <p className="eyebrow">Send a Message</p>
          <h2 id="form-title" className={styles.panelH}>
            Contact Form
          </h2>
          <ContactForm />
        </section>
      </div>

      <JoinStub tone="ink" />
    </>
  );
}
