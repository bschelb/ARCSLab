/**
 * Contour-line geometry for the hero terrain (pure, shared by the client canvas and the
 * build-time preview renderer).
 *
 * Levels are spaced on a power curve so the low Valley & Ridge (Knoxville, Hardin Valley,
 * Oak Ridge) and the Cumberland escarpment get as many lines as the steep Smokies, instead of
 * the Smokies collapsing into a solid mass. A `phase` in [0, 1) slides every level up the
 * curve; cycling it makes the lines flow uphill and loop seamlessly.
 */

export interface ContourLevel {
  /** Elevation in the same units as the height field. */
  value: number;
  /** Every `indexEvery`th line is an index contour (drawn heavier, in orange). */
  index: boolean;
}

export interface LevelOptions {
  count: number;
  power: number;
  phase: number;
  indexEvery: number;
}

export function contourLevels(min: number, max: number, opts: LevelOptions): ContourLevel[] {
  const { count, power, phase, indexEvery } = opts;
  const levels: ContourLevel[] = [];
  for (let k = 0; k < count; k++) {
    const t = (k + phase) / count;
    levels.push({ value: min + Math.pow(t, power) * (max - min), index: k % indexEvery === 0 });
  }
  return levels;
}

/** First index in sorted `values` whose value is > x (binary search). */
function upperBound(values: Float64Array, x: number): number {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((values[mid] ?? 0) <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Marching squares over a row-major height grid. Calls `segment` with the level index and the
 * two endpoints in grid coordinates (x in [0, w-1], y in [0, h-1]). Each cell only visits the
 * levels its corners actually span, so cost is ~one pass over the grid plus the segments drawn.
 */
export function marchContours(
  heights: ArrayLike<number>,
  w: number,
  h: number,
  levels: readonly ContourLevel[],
  segment: (level: number, x1: number, y1: number, x2: number, y2: number) => void,
): void {
  const values = Float64Array.from(levels, (l) => l.value);
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const tl = heights[y * w + x] ?? 0;
      const tr = heights[y * w + x + 1] ?? 0;
      const br = heights[(y + 1) * w + x + 1] ?? 0;
      const bl = heights[(y + 1) * w + x] ?? 0;
      const lo = Math.min(tl, tr, br, bl);
      const hi = Math.max(tl, tr, br, bl);
      for (let li = upperBound(values, lo); li < values.length; li++) {
        const v = values[li] ?? 0;
        if (v >= hi) break;
        const code = (tl > v ? 8 : 0) | (tr > v ? 4 : 0) | (br > v ? 2 : 0) | (bl > v ? 1 : 0);
        const tx = x + (v - tl) / (tr - tl);
        const ry = y + (v - tr) / (br - tr);
        const bx = x + (v - bl) / (br - bl);
        const ly = y + (v - tl) / (bl - tl);
        switch (code) {
          case 1:
          case 14:
            segment(li, x, ly, bx, y + 1);
            break;
          case 2:
          case 13:
            segment(li, bx, y + 1, x + 1, ry);
            break;
          case 3:
          case 12:
            segment(li, x, ly, x + 1, ry);
            break;
          case 4:
          case 11:
            segment(li, tx, y, x + 1, ry);
            break;
          case 6:
          case 9:
            segment(li, tx, y, bx, y + 1);
            break;
          case 7:
          case 8:
            segment(li, x, ly, tx, y);
            break;
          case 5:
            segment(li, x, ly, tx, y);
            segment(li, bx, y + 1, x + 1, ry);
            break;
          case 10:
            segment(li, tx, y, x + 1, ry);
            segment(li, x, ly, bx, y + 1);
            break;
        }
      }
    }
  }
}

/**
 * Separable box blur, `passes` times (3 passes ≈ Gaussian). Removes the 8-bit stair steps of
 * the heightmap so low-relief valleys draw as smooth lines instead of jitter.
 */
export function smoothHeights(src: Float32Array, w: number, h: number, radius = 1, passes = 2): Float32Array {
  let a = src;
  let b = new Float32Array(src.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        let n = 0;
        for (let d = -radius; d <= radius; d++) {
          const xx = x + d;
          if (xx < 0 || xx >= w) continue;
          s += a[y * w + xx] ?? 0;
          n++;
        }
        b[y * w + x] = s / n;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        let n = 0;
        for (let d = -radius; d <= radius; d++) {
          const yy = y + d;
          if (yy < 0 || yy >= h) continue;
          s += b[yy * w + x] ?? 0;
          n++;
        }
        a = a === src ? new Float32Array(src.length) : a;
        a[y * w + x] = s / n;
      }
    }
  }
  return a === src ? Float32Array.from(src) : a;
}
