import type { MetadataRoute } from 'next';
import { publications, researchAreas, team } from '@/lib/data';
import { site } from '@/lib/site';

/**
 * All indexable pages and every paper page. URLs match the canonicals exactly (the home URL
 * keeps its trailing slash). Includes the Phase 5 routes: /join, /research/<slug> and /team/<slug>.
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
    { path: '/join', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  ];
  return [
    ...pages.map((p) => ({
      url: p.path === '/' ? `${site.url}/` : `${site.url}${p.path}`,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...researchAreas.map((a) => ({
      url: `${site.url}/research/${a.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...team.people
      .filter((p) => p.group !== 'pi')
      .map((p) => ({
        url: `${site.url}/team/${p.slug}`,
        changeFrequency: 'yearly' as const,
        priority: p.group === 'alumni' ? 0.4 : 0.6,
      })),
    ...publications.map((p) => ({
      url: `${site.url}/papers/${p.id}`,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
