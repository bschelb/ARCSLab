'use client';

import { useEffect, useRef } from 'react';
import { contourLevels, marchContours, smoothHeights } from '@/lib/contours';
import meta from '@/lib/terrain.json';
import styles from './TerrainContours.module.css';

/** Real places, drawn as faint survey marks so the terrain reads as East Tennessee. */
const PLACES: { name: string; lat: number; lon: number; lab?: boolean }[] = [
  { name: 'Clingmans Dome', lat: 35.5628, lon: -83.4985 },
  { name: 'Mt. Le Conte', lat: 35.6545, lon: -83.4362 },
  { name: 'Hardin Valley', lat: 35.9306, lon: -84.1688 },
  { name: 'Oak Ridge', lat: 36.0104, lon: -84.2696 },
  { name: 'Crab Orchard Mtns', lat: 36.0, lon: -84.73 },
  { name: 'ARCS Lab · Knoxville', lat: 35.9544, lon: -83.9295, lab: true },
];

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** lon/lat → heightmap grid coordinates (the heightmap is Web Mercator). */
function toGrid(lat: number, lon: number): [number, number] {
  const { bbox, width, height } = meta;
  const x = ((lon - bbox.west) / (bbox.east - bbox.west)) * width;
  const y = ((mercY(bbox.north) - mercY(lat)) / (mercY(bbox.north) - mercY(bbox.south))) * height;
  return [x, y];
}

/** Smooth value noise on the grid, used to make the field breathe a little. */
function noiseField(w: number, h: number, seed: number, cell: number): Float32Array {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const lattice = new Float32Array(gw * gh);
  let s = seed;
  for (let i = 0; i < lattice.length; i++) {
    s = (s * 16807) % 2147483647;
    lattice[i] = (s / 2147483647) * 2 - 1;
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = x / cell;
      const fy = y / cell;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = lattice[y0 * gw + x0] ?? 0;
      const b = lattice[y0 * gw + x0 + 1] ?? 0;
      const c = lattice[(y0 + 1) * gw + x0] ?? 0;
      const d = lattice[(y0 + 1) * gw + x0 + 1] ?? 0;
      out[y * w + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}

export interface TerrainContoursProps {
  /** Animate (home hero) or draw one still frame (page headers). */
  animate?: boolean;
  /** Which part of the map survives the cover crop, 0–1 on each axis. */
  focus?: { x: number; y: number };
  /** Draw survey marks for real places. */
  places?: boolean;
  /** Overall line strength, 0–1. */
  intensity?: number;
  /** Survey marks left of this fraction of the width are skipped (keeps them out from under text). */
  placesMinX?: number;
  className?: string;
}

export default function TerrainContours({
  animate = false,
  focus = { x: 0.6, y: 0.5 },
  places = false,
  intensity = 1,
  placesMinX = 0,
  className,
}: TerrainContoursProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const W = meta.width;
    const H = meta.height;
    let base: Float32Array | null = null;
    let warpA: Float32Array | null = null;
    let warpB: Float32Array | null = null;
    let work: Float32Array | null = null;
    let cw = 0;
    let ch = 0;
    let raf = 0;
    let visible = true;
    let cancelled = false;
    let last = 0;
    const fx = focus.x;
    const fy = focus.y;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.max(1, Math.round(cw * dpr));
      canvas.height = Math.max(1, Math.round(ch * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      if (!base || !work || !warpA || !warpB) return;
      // Breathing: blend two noise fields (±16 m) on a slow circle, and slide levels uphill.
      const theta = t / 9000;
      const ca = Math.cos(theta) * 16;
      const sb = Math.sin(theta) * 16;
      for (let i = 0; i < work.length; i++)
        work[i] = (base[i] ?? 0) + (warpA[i] ?? 0) * ca + (warpB[i] ?? 0) * sb;
      const phase = (t / 32000) % 1;
      const levels = contourLevels(meta.minElevationM, meta.maxElevationM, {
        count: 40,
        power: 2,
        phase,
        indexEvery: 5,
      });

      const scale = Math.max(cw / (W - 1), ch / (H - 1));
      const ox = (cw - (W - 1) * scale) * fx;
      const oy = (ch - (H - 1) * scale) * fy;
      const minor = new Path2D();
      const index = new Path2D();
      marchContours(work, W, H, levels, (li, x1, y1, x2, y2) => {
        const p = levels[li]?.index ? index : minor;
        p.moveTo(ox + x1 * scale, oy + y1 * scale);
        p.lineTo(ox + x2 * scale, oy + y2 * scale);
      });

      ctx.clearRect(0, 0, cw, ch);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255,255,255,${(0.12 * intensity).toFixed(3)})`;
      ctx.stroke(minor);
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = `rgba(255,130,0,${(0.5 * intensity).toFixed(3)})`;
      ctx.stroke(index);

      // Survey marks need room: skip them on narrow screens, where the text covers the map.
      if (places && cw >= 760) {
        ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
        ctx.textBaseline = 'middle';
        for (const p of PLACES) {
          const [gx, gy] = toGrid(p.lat, p.lon);
          const x = ox + gx * scale;
          const y = oy + gy * scale;
          if (x < Math.max(8, cw * placesMinX) || y < 8 || x > cw - 150 || y > ch - 40) continue;
          ctx.strokeStyle = p.lab ? 'rgba(255,130,0,0.95)' : 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1;
          const r = p.lab ? 7 : 4;
          ctx.beginPath();
          ctx.moveTo(x - r, y);
          ctx.lineTo(x + r, y);
          ctx.moveTo(x, y - r);
          ctx.lineTo(x, y + r);
          ctx.stroke();
          if (p.lab) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = p.lab ? 'rgba(255,130,0,0.95)' : 'rgba(255,255,255,0.5)';
          ctx.fillText(p.name.toUpperCase(), x + r + 5, y);
        }
      }
    };

    const loop = (t: number) => {
      if (cancelled) return;
      if (visible && !document.hidden && t - last > 42) {
        draw(t);
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };

    const img = new Image();
    img.decoding = 'async';
    img.src = '/terrain/east-tn.webp';
    img
      .decode()
      .then(() => {
        if (cancelled) return;
        const off = document.createElement('canvas');
        off.width = W;
        off.height = H;
        const octx = off.getContext('2d', { willReadFrequently: true });
        if (!octx) return;
        octx.drawImage(img, 0, 0);
        const px = octx.getImageData(0, 0, W, H).data;
        const raw = new Float32Array(W * H);
        const span = meta.maxElevationM - meta.minElevationM;
        for (let i = 0; i < raw.length; i++)
          raw[i] = meta.minElevationM + ((px[i * 4] ?? 0) / 255) * span;
        base = smoothHeights(raw, W, H, 1, 1);
        warpA = noiseField(W, H, 11, 22);
        warpB = noiseField(W, H, 29, 22);
        work = new Float32Array(W * H);
        resize();
        draw(animate && !reduced ? performance.now() : 0);
        canvas.dataset.ready = 'true';
        if (animate && !reduced) raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        /* decorative only: leave the plain ink ground */
      });

    const ro = new ResizeObserver(() => {
      resize();
      draw(animate && !reduced ? performance.now() : 0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [animate, focus.x, focus.y, places, intensity, placesMinX]);

  return <canvas ref={ref} className={`${styles.canvas} ${className ?? ''}`} aria-hidden="true" />;
}
