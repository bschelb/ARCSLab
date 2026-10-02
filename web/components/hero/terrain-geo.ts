/** Grid size, source and cover-crop geometry for the terrain (tiny: shipped with the page). */
import meta from '@/lib/terrain.json';

export const TERRAIN_W = meta.width;
export const TERRAIN_H = meta.height;
export const TERRAIN_SRC = '/terrain/east-tn.webp';

/** A grid point (gx, gy) that must land on canvas point (x, y), in CSS pixels. */
export interface TerrainPin {
  gx: number;
  gy: number;
  x: number;
  y: number;
}

/**
 * Cover-crop transform from grid coordinates to CSS pixels (shared by canvas and overlay).
 * With a pin, the map is placed so the pinned grid point lands exactly on its target, zooming
 * in only as far as needed to still cover the canvas.
 */
export function coverTransform(
  cw: number,
  ch: number,
  focus: { x: number; y: number },
  pin?: TerrainPin | null,
) {
  const cover = Math.max(cw / (TERRAIN_W - 1), ch / (TERRAIN_H - 1));
  if (!pin) {
    return {
      scale: cover,
      ox: (cw - (TERRAIN_W - 1) * cover) * focus.x,
      oy: (ch - (TERRAIN_H - 1) * cover) * focus.y,
    };
  }
  // Each edge of the map must stay at or beyond its canvas edge: x - gx·s ≤ 0 and
  // x + (W-1-gx)·s ≥ cw, likewise for y.
  const need = (t: number, g: number, size: number, span: number) =>
    Math.max(g > 0 ? t / g : 0, span - g > 0 ? (size - t) / (span - g) : 0);
  const scale = Math.max(
    cover,
    need(pin.x, pin.gx, cw, TERRAIN_W - 1),
    need(pin.y, pin.gy, ch, TERRAIN_H - 1),
  );
  return { scale, ox: pin.x - pin.gx * scale, oy: pin.y - pin.gy * scale };
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** lon/lat → heightmap grid coordinates (the heightmap is Web Mercator). */
export function toGrid(lat: number, lon: number): [number, number] {
  const { bbox } = meta;
  const x = ((lon - bbox.west) / (bbox.east - bbox.west)) * TERRAIN_W;
  const y =
    ((mercY(bbox.north) - mercY(lat)) / (mercY(bbox.north) - mercY(bbox.south))) * TERRAIN_H;
  return [x, y];
}
