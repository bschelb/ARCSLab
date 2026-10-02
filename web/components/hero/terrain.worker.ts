/// <reference lib="webworker" />
/**
 * Draws the terrain contours on an OffscreenCanvas transferred from TerrainContours, so the
 * per-frame marching squares never touch the main thread.
 *
 * Messages in:  init { canvas, src, width, height, dpr, animate, still, focus, intensity }
 *               resize { width, height, dpr } · visible { visible }
 *               pointer { x, y } · pointer-leave
 * Messages out: ready
 */
import {
  TERRAIN_H,
  TERRAIN_W,
  createRenderer,
  heightsFromPixels,
  type RenderOptions,
} from './terrain-render';

type InitMessage = {
  type: 'init';
  canvas: OffscreenCanvas;
  src: string;
  width: number;
  height: number;
  dpr: number;
  /** Animate (home hero) or a single frame. */
  animate: boolean;
} & Pick<RenderOptions, 'focus' | 'intensity'>;
type Message =
  | InitMessage
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'visible'; visible: boolean }
  | { type: 'pointer'; x: number; y: number }
  | { type: 'pointer-leave' };

const scope = self as unknown as DedicatedWorkerGlobalScope;
let renderer: ReturnType<typeof createRenderer> | null = null;
let animate = false;
let visible = true;
let timer: ReturnType<typeof setTimeout> | undefined;
const t0 = performance.now();

// ~24 fps: smooth enough for the cursor lift and sweep, still light on the worker.
const FRAME_MS = 42;
function loop() {
  timer = undefined;
  if (!renderer || !animate || !visible) return;
  renderer.draw(performance.now() - t0 + 1100);
  timer = setTimeout(loop, FRAME_MS);
}

scope.onmessage = async (e: MessageEvent<Message>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    const ctx = msg.canvas.getContext('2d');
    if (!ctx) return;
    const blob = await (await fetch(msg.src)).blob();
    const bitmap = await createImageBitmap(blob);
    const off = new OffscreenCanvas(TERRAIN_W, TERRAIN_H);
    const octx = off.getContext('2d', { willReadFrequently: true });
    if (!octx) return;
    octx.drawImage(bitmap, 0, 0);
    const base = heightsFromPixels(octx.getImageData(0, 0, TERRAIN_W, TERRAIN_H).data);
    animate = msg.animate;
    renderer = createRenderer(ctx, base, {
      animate: msg.animate,
      focus: msg.focus,
      intensity: msg.intensity,
    });
    renderer.resize(msg.width, msg.height, msg.dpr);
    renderer.draw(animate ? performance.now() - t0 + 1100 : 0);
    scope.postMessage({ type: 'ready' });
    if (animate) timer = setTimeout(loop, FRAME_MS);
  } else if (msg.type === 'resize' && renderer) {
    renderer.resize(msg.width, msg.height, msg.dpr);
    renderer.draw(animate ? performance.now() - t0 + 1100 : 0);
  } else if (msg.type === 'pointer') {
    renderer?.setPointer({ x: msg.x, y: msg.y });
  } else if (msg.type === 'pointer-leave') {
    renderer?.setPointer(null);
  } else if (msg.type === 'visible') {
    visible = msg.visible;
    if (visible && animate && timer === undefined) loop();
  }
};
