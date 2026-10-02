import type { Metadata } from 'next';
import { absoluteUrl, site } from './site';

export interface PageMeta {
  /** Full <title>, exactly as production (no template). */
  title: string;
  description?: string;
  /** Canonical path, extensionless, no trailing slash ("/" for home). */
  path: string;
  ogType?: 'website' | 'article';
  /** Extra <meta name> tags (e.g. citation_* for Google Scholar); arrays repeat the tag. */
  other?: Record<string, string | string[]>;
}

/**
 * Per-page metadata matching the Astro BaseLayout <head>: canonical, Open Graph and Twitter
 * values are identical to production (migration/seo-baseline.json), except og:image /
 * twitter:image, which now point at generated images (an intentional Phase 4 difference).
 */
export function pageMetadata({
  title,
  description = site.description,
  path,
  ogType = 'website',
  other,
}: PageMeta): Metadata {
  const isHome = path === '/';
  const url = isHome ? `${site.url}/` : absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    // Next's resolver turns a bare "/" into the origin without its slash, but production's
    // home canonical and og:url are "https://arcslab.io/". The home page renders those two
    // tags itself (<HomeCanonical>); every other page uses the metadata API.
    ...(isHome ? {} : { alternates: { canonical: url } }),
    openGraph: {
      type: ogType,
      siteName: site.shortName,
      title,
      description,
      ...(isHome ? {} : { url }),
      locale: 'en_US',
    },
    // Images come from the opengraph-image / twitter-image file conventions (generated in the
    // D14 style); the old static /og/arcs-lab-og.png stays served for cached previews.
    twitter: { card: 'summary_large_image', title, description },
    ...(other ? { other } : {}),
  };
}
