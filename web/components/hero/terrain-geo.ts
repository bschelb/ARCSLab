/** Grid size, source and cover-crop geometry for the terrain (tiny: shipped with the page). */
import meta from '@/lib/terrain.json';

export const TERRAIN_W = meta.width;
export const TERRAIN_H = meta.height;
export const TERRAIN_SRC = '/terrain/east-tn.webp';

/** Cover-crop transform from grid coordinates to CSS pixels (shared by canvas and overlay). */
export function coverTransform(cw: number, ch: number, focus: { x: number; y: number }) {
  const scale = Math.max(cw / (TERRAIN_W - 1), ch / (TERRAIN_H - 1));
  return {
    scale,
    ox: (cw - (TERRAIN_W - 1) * scale) * focus.x,
    oy: (ch - (TERRAIN_H - 1) * scale) * focus.y,
  };
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
