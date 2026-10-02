import { describe, expect, it } from 'vitest';
import nextConfig, { contentSecurityPolicy, securityHeaders } from '@/next.config';

describe('next.config', () => {
  it('sends every security header from plan 3.9 on all routes', async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const global = rules.find((r) => r.source === '/:path*');
    const keys = global?.headers.map((h) => h.key) ?? [];
    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'X-Frame-Options',
        'Content-Security-Policy',
      ]),
    );
    expect(securityHeaders.find((h) => h.key === 'Strict-Transport-Security')?.value).not.toContain(
      'preload',
    );
    expect(keys).not.toContain('Content-Security-Policy-Report-Only');
  });

  it('enforces the CSP with the plan 3.9 directives', () => {
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("connect-src 'self' https://formspree.io");
    expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
  });

  it('keeps production strict: no third-party origins outside previews', () => {
    expect(contentSecurityPolicy).not.toContain('vercel.live');
    expect(contentSecurityPolicy).toContain("frame-src 'none'");
  });

  it('serves PDFs inline', async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const pdf = rules.find((r) => r.source.startsWith('/papers/'));
    expect(pdf?.headers).toContainEqual({ key: 'Content-Disposition', value: 'inline' });
  });

  it('redirects legacy .html and Astro sitemap URLs permanently', async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects.every((r) => r.permanent)).toBe(true);
    expect(redirects.map((r) => r.source)).toEqual(
      expect.arrayContaining(['/index.html', '/sitemap-index.xml', '/sitemap-0.xml']),
    );
  });
});
