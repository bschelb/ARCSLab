import type { MetadataRoute } from 'next';
import { publications } from '@/lib/data';
import { site } from '@/lib/site';

/**
 * All indexable pages and every paper page. URLs match the canonicals exactly (the home URL
 * keeps its trailing slash). Phase 5 adds /join, /research/<slug> and /team/<slug> here.
 * lastModified is omitted: stamping build time on every URL teaches crawlers to ignore it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: {
    path: string;
    priority: number;
    changeFrequency: 'weekly' | 'monthly' | 'yearly';
  }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/research', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/publications', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/team', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pi', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/funding', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/talks', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  ];
  return [
    ...pages.map((p) => ({
      url: p.path === '/' ? `${site.url}/` : `${site.url}${p.path}`,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...publications.map((p) => ({
      url: `${site.url}/papers/${p.id}`,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
