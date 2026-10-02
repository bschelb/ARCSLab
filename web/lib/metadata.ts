import type { Metadata } from 'next';
import { absoluteUrl, site } from './site';

interface PageMeta {
  /** Full <title>, exactly as production (no template). */
  title: string;
  description?: string;
  /** Canonical path, extensionless, no trailing slash ("/" for home). */
  path: string;
  /** Site-relative social image; defaults to the site OG image. */
  image?: string;
  ogType?: 'website' | 'article';
}

/**
 * Per-page metadata matching the Astro BaseLayout <head>: canonical, Open Graph and
 * Twitter values are identical to production (migration/seo-baseline.json).
 */
export function pageMetadata({
  title,
  description = site.description,
  path,
  image = site.ogImage,
  ogType = 'website',
}: PageMeta): Metadata {
  const url = path === '/' ? `${site.url}/` : absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: ogType,
      siteName: site.shortName,
      title,
      description,
      url,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}
