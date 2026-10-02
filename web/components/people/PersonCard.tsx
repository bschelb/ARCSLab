import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { monogram } from '@/lib/people';
import type { Person } from '@/lib/schemas';
import styles from './PersonCard.module.css';

interface PersonCardProps {
  person: Pick<Person, 'name' | 'photo' | 'cropPosition'>;
  role: string;
  /** Short description under the role. */
  children?: ReactNode;
  href?: string;
  /** Extra line in mono, e.g. tenure. */
  meta?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * One card design for every group (PI, PhD, DEng, undergraduates, alumni). Members
 * without a photo get a monogram on the terrain-ink ground, never a stock silhouette.
 * With `href`, the name is a stretched link: the whole card clicks through, while the
 * link's accessible name stays the person's name rather than the whole bio.
 */
export default function PersonCard({
  person,
  role,
  children,
  href,
  meta,
  sizes,
  priority,
}: PersonCardProps) {
  const body = (
    <>
      <div className={`${styles.media} ${person.photo ? '' : styles.mediaMono}`}>
        {person.photo ? (
          <Image
            src={person.photo}
            alt={person.name}
            fill
            sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw'}
            style={{ objectPosition: person.cropPosition ?? 'center 20%' }}
            priority={priority}
          />
        ) : (
          <span className={styles.monogram} aria-hidden="true">
            {monogram(person)}
          </span>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>
          {href ? (
            <Link href={href} className={styles.nameLink}>
              {person.name}
            </Link>
          ) : (
            person.name
          )}
        </h3>
        <p className={styles.role}>{role}</p>
        {meta && <p className={styles.meta}>{meta}</p>}
        {children && <div className={styles.desc}>{children}</div>}
      </div>
    </>
  );
  return <article className={`${styles.card} ${href ? styles.link : ''}`}>{body}</article>;
}
