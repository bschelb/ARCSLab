import type { Metadata, Viewport } from 'next';
import { Big_Shoulders, JetBrains_Mono, Public_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import JsonLd from '@/components/JsonLd';
import Motion from '@/components/Motion';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteNav from '@/components/layout/SiteNav';
import SkipLink from '@/components/layout/SkipLink';
import { robotsContent } from '@/lib/robots';
import { siteGraph } from '@/lib/seo';
import { researchKeywords, site } from '@/lib/site';
import './globals.css';

// "Contour" type system (D14): a condensed display voice for headlines and numerals,
// a public-service sans for reading, and a mono for coordinates and labels. All three are
// self-hosted by next/font at build, so visitors make no request to Google.
const bigShoulders = Big_Shoulders({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-big-shoulders',
  fallback: ['Archivo Narrow', 'Arial Narrow', 'Impact', 'sans-serif'],
  adjustFontFallback: false,
});
// Phase 6 (LCP): only the two faces that paint the largest text are preloaded. Public Sans
// ships the upright variable face only (venue names use the browser's oblique), and the mono
// labels load without a preload, swapping in from the fallback.
const publicSans = Public_Sans({
  subsets: ['latin'],
  style: ['normal'],
  variable: '--font-public-sans',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  description: site.description,
  keywords: researchKeywords.join(', '),
  authors: [{ name: 'Beau G. Schelble' }],
  publisher: site.name,
  // Production gets the Astro site's exact robots string; previews and local builds noindex.
  robots: robotsContent(),
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${bigShoulders.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <JsonLd data={siteGraph()} />
        <SkipLink />
        <SiteNav />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <Motion />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
