import JsonLd from '@/components/JsonLd';
import { breadcrumbNode } from '@/lib/seo';

/** BreadcrumbList JSON-LD (identical to production). The visible trail arrives in Phase 5. */
export default function Breadcrumbs({ trail }: { trail: [string, string][] }) {
  return <JsonLd data={breadcrumbNode(trail)} />;
}
