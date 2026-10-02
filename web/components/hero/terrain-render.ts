/**
 * The terrain contour renderer, shared by the Web Worker (OffscreenCanvas, the normal path)
 * and the main-thread fallback. Pure drawing: no DOM, no React, works on either context type.
 */
import { contourLevels, marchContours, smoothHeights } from '@/lib/contours';
import meta from '@/lib/terrain.json';
import { TERRAIN_H, TERRAIN_W, coverTransform } from './terrain-geo';

export { TERRAIN_H, TERRAIN_SRC, TERRAIN_W } from './terrain-geo';

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface RenderOptions {
  animate: boolean;
  focus: { x: number; y: number };
  intensity: number;
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

/** Heights in metres from the heightmap's red channel (RGBA pixels, row-major). */
export function heightsFromPixels(px: ArrayLike<number>): Float32Array {
  const raw = new Float32Array(TERRAIN_W * TERRAIN_H);
  const span = meta.maxElevationM - meta.minElevationM;
  for (let i = 0; i < raw.length; i++)
    raw[i] = meta.minElevationM + ((px[i * 4] ?? 0) / 255) * span;
  return smoothHeights(raw, TERRAIN_W, TERRAIN_H, 1, 1);
}

export function createRenderer(ctx: Ctx2D, base: Float32Array, opts: RenderOptions) {
  const warpA = opts.animate ? noiseField(TERRAIN_W, TERRAIN_H, 11, 22) : null;
  const warpB = opts.animate ? noiseField(TERRAIN_W, TERRAIN_H, 29, 22) : null;
  const work = opts.animate ? new Float32Array(base.length) : base;
  const minor: number[] = [];
  const index: number[] = [];
  let cw = 0;
  let ch = 0;

  const stroke = (segs: number[], width: number, color: string) => {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < segs.length; i += 4) {
      ctx.moveTo(segs[i] ?? 0, segs[i + 1] ?? 0);
      ctx.lineTo(segs[i + 2] ?? 0, segs[i + 3] ?? 0);
    }
    ctx.stroke();
  };

  return {
    resize(width: number, height: number, dpr: number) {
      cw = width;
      ch = height;
      ctx.canvas.width = Math.max(1, Math.round(width * dpr));
      ctx.canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    /** Draw one frame; `t` in ms drives the breathing and the uphill flow (0 = still). */
    draw(t: number) {
      if (warpA && warpB && work !== base) {
        // Breathing: blend two noise fields (±16 m) on a slow circle.
        const theta = t / 9000;
        const ca = Math.cos(theta) * 16;
        const sb = Math.sin(theta) * 16;
        for (let i = 0; i < work.length; i++)
          work[i] = (base[i] ?? 0) + (warpA[i] ?? 0) * ca + (warpB[i] ?? 0) * sb;
      }
      const levels = contourLevels(meta.minElevationM, meta.maxElevationM, {
        count: 40,
        power: 2,
        phase: (t / 32000) % 1,
        indexEvery: 5,
      });
      const { scale, ox, oy } = coverTransform(cw, ch, opts.focus);
      minor.length = 0;
      index.length = 0;
      marchContours(work, TERRAIN_W, TERRAIN_H, levels, (li, x1, y1, x2, y2) => {
        (levels[li]?.index ? index : minor).push(
          ox + x1 * scale,
          oy + y1 * scale,
          ox + x2 * scale,
          oy + y2 * scale,
        );
      });
      ctx.clearRect(0, 0, cw, ch);
      stroke(minor, 1, `rgba(255,255,255,${(0.12 * opts.intensity).toFixed(3)})`);
      stroke(index, 1.25, `rgba(255,130,0,${(0.5 * opts.intensity).toFixed(3)})`);
    },
  };
}
