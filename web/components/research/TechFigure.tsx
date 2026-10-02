'use client';

import { useEffect, useRef } from 'react';
import type { Figure } from './figures';
import styles from './TechFigure.module.css';

const MONO = 'var(--font-mono), ui-monospace, monospace';

/**
 * A technical drawing of a human-AI team. The figure is complete as static SVG; on the
 * client, orange signals travel the routes marked `signal` while the figure is on screen.
 * Reduced motion keeps the signals still.
 */
export default function TechFigure({ figure, index }: { figure: Figure; index: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-signal]'));
    const dots = Array.from(svg.querySelectorAll<SVGCircleElement>('circle[data-dot]'));
    const lengths = paths.map((p) => p.getTotalLength());
    const place = (t: number) => {
      paths.forEach((p, i) => {
        const len = lengths[i] ?? 0;
        const pt = p.getPointAtLength(((((t / 3400 + i * 0.29) % 1) + 1) % 1) * len);
        dots[i]?.setAttribute('cx', pt.x.toFixed(1));
        dots[i]?.setAttribute('cy', pt.y.toFixed(1));
      });
    };
    place(1100);
    svg.dataset.ready = 'true';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let visible = false;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? false;
    });
    io.observe(svg);
    const loop = (t: number) => {
      if (visible && !document.hidden) place(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const signalCount = figure.routes.filter((r) => r.signal).length;

  return (
    <figure className={styles.fig}>
      <svg
        ref={svgRef}
        viewBox="0 0 440 300"
        role="img"
        aria-label={figure.alt}
        className={styles.svg}
      >
        <g fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2">
          {figure.nodes.map((n, i) =>
            n.kind === 'box' ? (
              <rect key={`b${i}`} x={n.x} y={n.y} width={n.w} height={n.h} strokeDasharray="5 4" />
            ) : null,
          )}
        </g>
        <g fill="none" stroke="var(--color-text)" strokeWidth="1.6">
          {figure.routes.map((r, i) => (
            <path
              key={`r${i}`}
              d={r.d}
              data-signal={r.signal ? '' : undefined}
              strokeDasharray={r.dashed ? '4 4' : undefined}
              stroke={r.dashed ? 'var(--color-text-muted)' : undefined}
            />
          ))}
        </g>
        <g fill="var(--color-white)" stroke="var(--color-text)" strokeWidth="2">
          {figure.nodes.map((n, i) => {
            if (n.kind === 'human') return <circle key={`n${i}`} cx={n.x} cy={n.y} r={20} />;
            if (n.kind === 'ai')
              return (
                <g key={`n${i}`}>
                  <rect
                    x={n.x - 20}
                    y={n.y - 20}
                    width={40}
                    height={40}
                    strokeDasharray={n.compromised ? '4 3' : undefined}
                  />
                  {n.compromised && (
                    <path
                      d={`M${n.x - 26} ${n.y - 26} l12 12 M${n.x - 14} ${n.y - 26} l-12 12`}
                      stroke="var(--color-orange-text)"
                    />
                  )}
                </g>
              );
            return null;
          })}
        </g>
        <g fontFamily={MONO} fontSize="10" fill="var(--color-text)" textAnchor="middle">
          {figure.nodes.map((n, i) =>
            n.kind === 'box' ? null : (
              <text key={`l${i}`} x={n.x} y={n.y + 3.5}>
                {n.label}
              </text>
            ),
          )}
        </g>
        <g fontFamily={MONO} fontSize="9" fill="var(--color-text-muted)" letterSpacing="0.06em">
          {figure.nodes.map((n, i) =>
            n.kind === 'box' ? (
              <text key={`bl${i}`} x={n.x + 6} y={n.y + 13}>
                {n.label}
              </text>
            ) : null,
          )}
          {figure.notes.map((note, i) => (
            <text key={`t${i}`} x={note.x} y={note.y} textAnchor={note.anchor ?? 'start'}>
              {note.text}
            </text>
          ))}
          <text x="12" y="292">
            FIG. {index}
          </text>
        </g>
        <g fill="var(--color-orange)" className={styles.dots}>
          {Array.from({ length: signalCount }, (_, i) => (
            <circle key={`d${i}`} data-dot="" r={4.5} cx={-20} cy={-20} />
          ))}
        </g>
      </svg>
      <figcaption className={styles.cap}>
        <span>
          Fig. {index} · {figure.caption}
        </span>
        <span>{figure.detail}</span>
      </figcaption>
    </figure>
  );
}
