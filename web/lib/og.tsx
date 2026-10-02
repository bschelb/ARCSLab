import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReactNode } from 'react';

/** Shared assets and frame for the generated Open Graph images (1200 × 630, D14 Contour style). */
export const OG_SIZE = { width: 1200, height: 630 };

const asset = (p: string) => readFile(path.join(process.cwd(), 'assets', p));

export async function ogAssets() {
  const [black, bold, sans, mono, bg] = await Promise.all([
    asset('fonts/BigShoulders-Black.ttf'),
    asset('fonts/BigShoulders-Bold.ttf'),
    asset('fonts/PublicSans-Medium.ttf'),
    asset('fonts/JetBrainsMono-Medium.ttf'),
    asset('og-contours.png'),
  ]);
  return {
    background: `data:image/png;base64,${bg.toString('base64')}`,
    fonts: [
      { name: 'Big Shoulders', data: black, weight: 900 as const, style: 'normal' as const },
      { name: 'Big Shoulders', data: bold, weight: 700 as const, style: 'normal' as const },
      { name: 'Public Sans', data: sans, weight: 500 as const, style: 'normal' as const },
      { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
    ],
  };
}

/** The common frame: contour background, lab label top-left, URL and coordinates along the bottom. */
export function OgFrame({
  background,
  label,
  footer,
  children,
}: {
  background: string;
  label: string;
  footer: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#14100b',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={background}
        width={1200}
        height={630}
        alt=""
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '56px 64px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: 'JetBrains Mono',
            fontSize: 22,
            letterSpacing: 3,
            color: 'rgba(255,255,255,0.78)',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 18, height: 18, background: '#ff8200' }} />
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            letterSpacing: 2,
            color: 'rgba(255,255,255,0.72)',
            textTransform: 'uppercase',
          }}
        >
          <span>{footer}</span>
          <span style={{ color: '#ff8200' }}>35.9544° N / 83.9295° W</span>
        </div>
      </div>
    </div>
  );
}
