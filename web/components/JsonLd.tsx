import { ldjson } from '@/lib/seo';

/**
 * Renders schema.org JSON-LD. Server component; the only sanctioned use of
 * dangerouslySetInnerHTML in the app (ldjson escapes "<" so the payload cannot close the tag).
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldjson(item) }} />
      ))}
    </>
  );
}
