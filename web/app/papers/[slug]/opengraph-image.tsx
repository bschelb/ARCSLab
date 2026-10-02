import { ImageResponse } from 'next/og';
import { publications } from '@/lib/data';
import { OG_SIZE, OgFrame, ogAssets } from '@/lib/og';
import { typeLabel } from '@/lib/papers';

export const alt = 'ARCS Lab publication';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return publications.map((p) => ({ slug: p.id }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = publications.find((p) => p.id === slug);
  const { background, fonts } = await ogAssets();
  const title = paper?.title ?? 'ARCS Lab publication';
  const fontSize = title.length > 120 ? 54 : title.length > 80 ? 64 : 76;
  return new ImageResponse(
    <OgFrame
      background={background}
      label={paper ? `ARCS Lab · ${typeLabel(paper.type)} · ${paper.year}` : 'ARCS Lab'}
      footer={`arcslab.io/papers${paper?.pdf ? ' · Free PDF' : ''}`}
    >
      <div
        style={{
          display: 'flex',
          maxWidth: 1020,
          fontFamily: 'Big Shoulders',
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          color: '#ffffff',
        }}
      >
        {title}
      </div>
      {paper && (
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            maxWidth: 980,
            fontFamily: 'Public Sans',
            fontSize: 26,
            lineHeight: 1.35,
            color: '#ff8200',
          }}
        >
          {paper.venueShort ? `${paper.venueShort} · ${paper.year}` : paper.venue}
        </div>
      )}
    </OgFrame>,
    { ...size, fonts },
  );
}
