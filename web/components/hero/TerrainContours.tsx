'use client';

import { useEffect, useRef, useState } from 'react';
import { TERRAIN_H, TERRAIN_SRC, TERRAIN_W, coverTransform, toGrid } from './terrain-geo';
import type { createRenderer } from './terrain-render';
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

export interface TerrainContoursProps {
  /** Animate (home hero) or draw one still frame (page headers, footer). */
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

/**
 * Contour lines generated from real East Tennessee elevation data (decorative, aria-hidden).
 *
 * Performance (Phase 6): the contours are computed and drawn in a Web Worker on an
 * OffscreenCanvas, so the main thread stays free; browsers without OffscreenCanvas fall back
 * to drawing on the main thread at idle time. Work starts only once the canvas is near the
 * viewport (the footer costs nothing at load), animation pauses off-screen and in hidden
 * tabs, the device pixel ratio is capped at 2, and reduced motion draws a single still frame.
 */
export default function TerrainContours({
  animate = false,
  focus = { x: 0.6, y: 0.5 },
  places = false,
  intensity = 1,
  placesMinX = 0,
  className,
}: TerrainContoursProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const fx = focus.x;
  const fy = focus.y;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const moving = animate && !reduced;
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const box = () => wrap.getBoundingClientRect();

    // The canvas is created here (not in JSX) so each effect run gets a fresh one:
    // a canvas can hand its control to an OffscreenCanvas only once.
    const makeCanvas = () => {
      const c = document.createElement('canvas');
      c.className = styles.canvas ?? '';
      c.setAttribute('aria-hidden', 'true');
      c.dataset.animate = String(moving);
      wrap.prepend(c);
      return c;
    };
    let canvas = makeCanvas();

    let worker: Worker | null = null;
    let fallback: ReturnType<typeof createRenderer> | null = null;
    let raf = 0;
    let last = 0;
    let started = false;
    let visible = true;
    let cancelled = false;
    const markReady = () => {
      canvas.dataset.ready = 'true';
    };

    const startWorker = () => {
      const offscreen = canvas.transferControlToOffscreen();
      worker = new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' });
      let ready = false;
      worker.onmessage = (e: MessageEvent<{ type: string }>) => {
        if (e.data.type === 'ready') {
          ready = true;
          markReady();
        }
      };
      // If the worker cannot load or crashes before its first frame, draw on the main thread
      // instead, on a fresh canvas (the old one handed its control to the worker).
      worker.onerror = () => {
        if (ready || cancelled) return;
        worker?.terminate();
        worker = null;
        canvas.remove();
        canvas = makeCanvas();
        void startFallback().catch(() => {});
      };
      const { width, height } = box();
      worker.postMessage(
        {
          type: 'init',
          canvas: offscreen,
          src: TERRAIN_SRC,
          width,
          height,
          dpr: dpr(),
          animate: moving,
          focus: { x: fx, y: fy },
          intensity,
        },
        [offscreen],
      );
    };

    const startFallback = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Only browsers without OffscreenCanvas download the renderer on the main thread.
      const { createRenderer, heightsFromPixels } = await import('./terrain-render');
      const img = new Image();
      img.src = TERRAIN_SRC;
      await img.decode();
      if (cancelled) return;
      const off = document.createElement('canvas');
      off.width = TERRAIN_W;
      off.height = TERRAIN_H;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0);
      const base = heightsFromPixels(octx.getImageData(0, 0, TERRAIN_W, TERRAIN_H).data);
      fallback = createRenderer(ctx, base, { animate: moving, focus: { x: fx, y: fy }, intensity });
      const { width, height } = box();
      fallback.resize(width, height, dpr());
      fallback.draw(moving ? performance.now() : 0);
      markReady();
      if (!moving) return;
      const loop = (t: number) => {
        if (cancelled) return;
        if (visible && !document.hidden && t - last > 62) {
          fallback?.draw(t);
          last = t;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (started || cancelled) return;
      started = true;
      const run = () => {
        if (cancelled) return;
        try {
          if ('transferControlToOffscreen' in canvas && typeof Worker !== 'undefined')
            startWorker();
          else void startFallback().catch(() => {});
        } catch {
          void startFallback().catch(() => {});
        }
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1200 });
      else setTimeout(run, 200);
    };

    const setVisible = (v: boolean) => {
      visible = v;
      worker?.postMessage({ type: 'visible', visible: v && !document.hidden });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = entry?.isIntersecting ?? true;
        if (v) start();
        setVisible(v);
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(wrap);
    const onVis = () => setVisible(visible);
    document.addEventListener('visibilitychange', onVis);

    const ro = new ResizeObserver(() => {
      const { width, height } = box();
      setSize({ w: width, h: height });
      if (worker) worker.postMessage({ type: 'resize', width, height, dpr: dpr() });
      else if (fallback) {
        fallback.resize(width, height, dpr());
        fallback.draw(moving ? performance.now() : 0);
      }
    });
    ro.observe(wrap);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      worker?.terminate();
      canvas.remove();
    };
  }, [animate, fx, fy, intensity]);

  // Survey marks need room: skip them on narrow screens, where the text covers the map.
  const marks =
    places && size.w >= 760
      ? PLACES.map((p) => {
          const { scale, ox, oy } = coverTransform(size.w, size.h, { x: fx, y: fy });
          const [gx, gy] = toGrid(p.lat, p.lon);
          return { ...p, x: ox + gx * scale, y: oy + gy * scale };
        }).filter(
          (p) =>
            p.x >= Math.max(8, size.w * placesMinX) &&
            p.y >= 8 &&
            p.x <= size.w - 150 &&
            p.y <= size.h - 40,
        )
      : [];

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ''}`} aria-hidden="true">
      {marks.map((m) => (
        <span
          key={m.name}
          className={`${styles.mark} ${m.lab ? styles.lab : ''}`}
          style={{ left: m.x, top: m.y }}
        >
          {m.name}
        </span>
      ))}
    </div>
  );
}
