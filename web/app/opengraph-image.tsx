import { ImageResponse } from 'next/og';
import { OG_SIZE, OgFrame, ogAssets } from '@/lib/og';

export const alt =
  'ARCS Lab — Humans and AI, engineered to think as one team. University of Tennessee, Knoxville.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  const { background, fonts } = await ogAssets();
  return new ImageResponse(
    <OgFrame
      background={background}
      label="ARCS Lab · AI & Robotics for Collaborative Systems"
      footer="arcslab.io · University of Tennessee, Knoxville"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Big Shoulders',
          fontWeight: 900,
          fontSize: 104,
          lineHeight: 0.9,
          color: '#ffffff',
          textTransform: 'uppercase',
        }}
      >
        <span>Humans and AI, engineered</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          to think as
          <span style={{ background: '#ff8200', color: '#14100b', padding: '6px 14px 0' }}>
            one team.
          </span>
        </span>
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
