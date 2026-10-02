import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { breadcrumbNode } from '@/lib/seo';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbsProps {
  /** [name, path] pairs, emitted verbatim as BreadcrumbList JSON-LD (identical to production). */
  trail: [string, string][];
  /** Render a visible trail too; `labels` can override the visible names (e.g. a long title). */
  visible?: boolean;
  labels?: string[];
}

export default function Breadcrumbs({ trail, visible = false, labels }: BreadcrumbsProps) {
  return (
    <>
      <JsonLd data={breadcrumbNode(trail)} />
      {visible && (
        <nav aria-label="Breadcrumb" className={styles.nav}>
          <ol>
            {trail.map(([name, path], i) => {
              const label = labels?.[i] ?? name;
              const last = i === trail.length - 1;
              return (
                <li key={path}>
                  {last ? (
                    <span aria-current="page">{label}</span>
                  ) : (
                    <Link href={path}>{label}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </>
  );
}
