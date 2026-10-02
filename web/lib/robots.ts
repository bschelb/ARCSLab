/**
 * Indexing policy. Only the production deployment may be indexed; previews and local builds
 * are always noindex (Vercel also adds `x-robots-tag: noindex` to protected previews).
 * The production string is byte-identical to the Astro site's robots meta tag.
 */
export const PRODUCTION_ROBOTS =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
export const PREVIEW_ROBOTS = 'noindex, nofollow';

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function robotsContent(): string {
  return isProduction() ? PRODUCTION_ROBOTS : PREVIEW_ROBOTS;
}
