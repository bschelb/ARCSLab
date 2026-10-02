import { ImageResponse } from 'next/og';
import { publications, researchAreas } from '@/lib/data';
import { OG_SIZE, OgFrame, ogAssets } from '@/lib/og';
import { areaPapers } from '@/lib/research';

export const alt = 'ARCS Lab research area';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return researchAreas.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = researchAreas.find((a) => a.slug === slug);
  const { background, fonts } = await ogAssets();
  const count = area ? areaPapers(area, publications).length : 0;
  return new ImageResponse(
    <OgFrame
      background={background}
      label={area ? `ARCS Lab · Research Area ${area.num}` : 'ARCS Lab · Research'}
      footer={`arcslab.io/research${area ? ` · ${count} publications` : ''}`}
    >
      <div
        style={{
          display: 'flex',
          maxWidth: 1060,
          fontFamily: 'Big Shoulders',
          fontWeight: 900,
          fontSize: 120,
          lineHeight: 0.9,
          textTransform: 'uppercase',
          color: '#ffffff',
        }}
      >
        {area?.title ?? 'Research'}
      </div>
      {area && (
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            marginTop: 26,
            padding: '6px 14px',
            fontFamily: 'JetBrains Mono',
            fontSize: 24,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: '#14100b',
            background: '#ff8200',
          }}
        >
          {area.tag}
        </div>
      )}
    </OgFrame>,
    { ...size, fonts },
  );
}
