import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

// "Two intelligences, one team": a humanist serif is the human voice, a technical mono is
// the machine voice, bridged by a grotesk for body and UI. next/font self-hosts all three
// at build, so visitors make no request to Google.
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://arcslab.io'),
  title: 'ARCS Lab',
  description: 'AI & Robotics for Collaborative Systems Lab, University of Tennessee, Knoxville.',
  // Placeholder until Phase 4 adds environment-aware robots: previews must never be indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
