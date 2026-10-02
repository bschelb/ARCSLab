import type { MetadataRoute } from 'next';
import { isProduction } from '@/lib/robots';
import { site } from '@/lib/site';

/** Production: allow everything and point at the sitemap. Previews and local builds: disallow all. */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
