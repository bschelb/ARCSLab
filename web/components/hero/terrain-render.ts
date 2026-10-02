/**
 * The terrain contour renderer, shared by the Web Worker (OffscreenCanvas, the normal path)
 * and the main-thread fallback. Pure drawing: no DOM, no React, works on either context type.
 */
import { contourLevels, marchContours, smoothHeights } from '@/lib/contours';
import meta from '@/lib/terrain.json';
import { TERRAIN_H, TERRAIN_W, coverTransform, type TerrainPin } from './terrain-geo';

export { TERRAIN_H, TERRAIN_SRC, TERRAIN_W } from './terrain-geo';

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface RenderOptions {
  animate: boolean;
  focus: { x: number; y: number };
  intensity: number;
  /** No cursor (touch screens): the hill wanders the map on its own between taps. */
  autopilot?: boolean;
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

// Motion tuning for the animated hero (still frames ignore all of this).
const BREATH_M = 30; // two noise fields blended on a slow circle, metres
const BREATH_MS = 6000; // period scale of the breathing circle
const SWELL_M = 14; // a long wave rolling diagonally across the map, metres
const SWELL_MS = 2400;
const FLOW_MS = 20000; // one full uphill cycle of the contour levels
const LIFT_M = 70; // a gentle swell under the cursor, metres (kept subtle on purpose)
const LIFT_R = 22; // its radius, in grid cells: broad and soft
const SWEEP_MS = 7000; // one pass of the survey sweep across the map
const WANDER_X_MS = 4300; // autopilot path: a slow Lissajous over the upper map
const WANDER_Y_MS = 3100;

export function createRenderer(ctx: Ctx2D, base: Float32Array, opts: RenderOptions) {
  const warpA = opts.animate ? noiseField(TERRAIN_W, TERRAIN_H, 11, 22) : null;
  const warpB = opts.animate ? noiseField(TERRAIN_W, TERRAIN_H, 29, 22) : null;
  // Diagonal coordinate for the swell, precomputed once.
  const diag = opts.animate ? new Float32Array(base.length) : null;
  if (diag)
    for (let y = 0; y < TERRAIN_H; y++)
      for (let x = 0; x < TERRAIN_W; x++) diag[y * TERRAIN_W + x] = (x * 0.6 + y * 0.4) / 18;
  const work = opts.animate ? new Float32Array(base.length) : base;
  const minor: number[] = [];
  const index: number[] = [];
  let cw = 0;
  let ch = 0;
  let pin: TerrainPin | null = null;
  // Cursor lift: the target comes from pointer events; position and strength ease toward it.
  let target: { x: number; y: number } | null = null;
  let px = 0;
  let py = 0;
  let lift = 0;

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
    /** Canvas size in CSS pixels, plus an optional pin (see coverTransform). */
    resize(width: number, height: number, dpr: number, nextPin: TerrainPin | null = null) {
      cw = width;
      ch = height;
      pin = nextPin;
      ctx.canvas.width = Math.max(1, Math.round(width * dpr));
      ctx.canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    /** Cursor position in CSS pixels of the canvas, or null when it leaves. */
    setPointer(p: { x: number; y: number } | null) {
      if (p && !target && lift < 0.01) {
        px = p.x;
        py = p.y;
      }
      target = p;
    },
    /** Draw one frame; `t` in ms drives all motion (0 = still). */
    draw(t: number) {
      const { scale, ox, oy } = coverTransform(cw, ch, opts.focus, pin);
      if (warpA && warpB && diag && work !== base) {
        const theta = t / BREATH_MS;
        const ca = Math.cos(theta) * BREATH_M;
        const sb = Math.sin(theta) * BREATH_M;
        const sw = t / SWELL_MS;
        for (let i = 0; i < work.length; i++)
          work[i] =
            (base[i] ?? 0) +
            (warpA[i] ?? 0) * ca +
            (warpB[i] ?? 0) * sb +
            Math.sin((diag[i] ?? 0) - sw) * SWELL_M;

        // Ease the hill toward the cursor (or the autopilot path), and in or out as it
        // enters or leaves. A hill fading in from nothing starts where it is headed.
        const goal =
          target ??
          (opts.autopilot
            ? {
                x: cw * (0.5 + 0.42 * Math.sin(t / WANDER_X_MS)),
                y: ch * (0.3 + 0.2 * Math.sin(t / WANDER_Y_MS + 1.3)),
              }
            : null);
        if (goal) {
          if (lift < 0.01) {
            px = goal.x;
            py = goal.y;
          }
          // Slow follow: the swell drifts after the cursor rather than tracking it.
          px += (goal.x - px) * 0.06;
          py += (goal.y - py) * 0.06;
        }
        lift += ((goal ? 1 : 0) - lift) * 0.03;
        if (lift > 0.01) {
          const gx = (px - ox) / scale;
          const gy = (py - oy) / scale;
          const r = LIFT_R;
          const x0 = Math.max(0, Math.floor(gx - 3 * r));
          const x1 = Math.min(TERRAIN_W - 1, Math.ceil(gx + 3 * r));
          const y0 = Math.max(0, Math.floor(gy - 3 * r));
          const y1 = Math.min(TERRAIN_H - 1, Math.ceil(gy + 3 * r));
          const amp = LIFT_M * lift;
          for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++) {
              const d2 = ((x - gx) ** 2 + (y - gy) ** 2) / (r * r);
              const i = y * TERRAIN_W + x;
              work[i] = (work[i] ?? 0) + amp * Math.exp(-d2);
            }
        }
      }
      const levels = contourLevels(meta.minElevationM, meta.maxElevationM, {
        count: 40,
        power: 2,
        phase: (t / FLOW_MS) % 1,
        indexEvery: 5,
      });
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

      if (opts.animate && t > 0) {
        // Survey sweep: a band of light crosses the map and lights up the lines it passes.
        const u = ((t / SWEEP_MS) % 1) * 1.4 - 0.2;
        const cx = u * cw;
        const bw = Math.max(120, cw * 0.14);
        const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
        g.addColorStop(0, 'rgba(255,170,60,0)');
        g.addColorStop(0.5, 'rgba(255,170,60,0.9)');
        g.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = g;
        ctx.fillRect(cx - bw, 0, bw * 2, ch);
        ctx.restore();
        ctx.fillStyle = 'rgba(255,130,0,0.18)';
        ctx.fillRect(Math.round(cx), 0, 1, ch);
      }
    },
  };
}
