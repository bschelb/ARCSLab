import type { NextConfig } from 'next';

// Content-Security-Policy (plan 3.9). Enforced since Phase 6, after the full e2e suite (every
// spec fails on any securitypolicyviolation, see tests/e2e/fixtures.ts) and all 42 PDFs in the
// reader, in Chromium, WebKit and Firefox, measured zero violations under Report-Only.
// 'unsafe-inline' for scripts is the documented trade-off for fully static pages: a nonce
// would force every route to render dynamically. 'wasm-unsafe-eval' covers PDF.js image
// decoders. `next dev` needs 'unsafe-eval' for React's debugging features.
const isDev = process.env.NODE_ENV === 'development';
export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://formspree.io",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
  "frame-ancestors 'none'",
  // No upgrade-insecure-requests: every subresource is same-origin and HSTS already forces
  // HTTPS, so it adds nothing in production, while WebKit applies it to http://localhost and
  // breaks local test runs (Phase 6).
].join('; ');

export const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    // Next 16 allows only quality 75 by default (plan 3.6). Source photos are pre-sized by
    // scripts/optimize-images.mjs, so the default is enough.
    qualities: [75],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // GitHub Pages could not send these, which is why the reader renders to canvas.
        // Sending them now also makes the raw PDF open inline (plan 3.5).
        source: '/papers/:file([^/]+\\.pdf)',
        headers: [
          { key: 'Content-Type', value: 'application/pdf' },
          { key: 'Content-Disposition', value: 'inline' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },

  async redirects() {
    // URL parity with the Astro site (plan 3.4). Retained images keep their paths (PI portrait,
    // logo, PWA icons, OG image); renamed headshots 308 to their new homes. The unused 15 MB
    // /assets/downtownPic.jpg was never referenced and is intentionally gone (404).
    return [
      {
        source: '/assets/sarahHeadshot.jpg',
        destination: '/images/people/sarah-mendoza.jpg',
        permanent: true,
      },
      {
        source: '/assets/yayunHeadshot.jpg',
        destination: '/images/people/yayun-tian.jpg',
        permanent: true,
      },
      {
        source: '/assets/naveenaHeadshot.jpg',
        destination: '/images/people/naveena-nagaraju.jpg',
        permanent: true,
      },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/:path(.+)\\.html', destination: '/:path', permanent: true },
      { source: '/sitemap-index.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap-0.xml', destination: '/sitemap.xml', permanent: true },
    ];
  },
};

export default nextConfig;
