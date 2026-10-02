import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/** Web app manifest, ported from astro-site/public/site.webmanifest (also still served there). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: 'Human-AI teaming research at the University of Tennessee, Knoxville.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: site.themeColor,
    theme_color: site.themeColor,
    lang: 'en-US',
    icons: [
      { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
