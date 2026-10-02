/**
 * WCAG contrast for every documented text/background token pair (plan 4.2, D8, D14).
 * Token values are read from app/globals.css, so the test tracks the real stylesheet.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8');

function token(name: string): string {
  const m = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css);
  if (!m?.[1]) throw new Error(`token --color-${name} not found`);
  return m[1].trim();
}

type RGB = [number, number, number];
function parse(color: string, over?: RGB): RGB {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex?.[1]) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16)) as RGB;
  const rgba = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(color);
  if (rgba && over) {
    const a = Number(rgba[4]);
    return [1, 2, 3].map((i, k) => Math.round(Number(rgba[i]) * a + over[k]! * (1 - a))) as RGB;
  }
  throw new Error(`unparsed color ${color}`);
}
const lum = ([r, g, b]: RGB) =>
  [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i]!, 0);
function ratio(fg: string, bg: string): number {
  const b = parse(token(bg));
  const f = parse(token(fg), b);
  const [hi, lo] = [lum(f), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum] — 4.5 body text, 3 large text / UI.
const PAIRS: [string, string, number][] = [
  ['text', 'paper', 4.5],
  ['text', 'paper-2', 4.5],
  ['text', 'white', 4.5],
  ['text-muted', 'paper', 4.5],
  ['text-muted', 'paper-2', 4.5],
  ['orange-text', 'paper', 4.5],
  ['orange-text', 'paper-2', 4.5],
  ['orange-text', 'white', 4.5],
  ['dk-text', 'ink', 4.5],
  ['dk-text-2', 'ink', 4.5],
  ['dk-muted', 'ink', 4.5],
  ['dk-muted', 'ink-2', 4.5],
  ['orange', 'ink', 4.5], // orange words and numerals on dark
  ['text', 'orange', 4.5], // primary button label
  ['ink', 'orange', 4.5], // mark-block emphasis, primary button on dark
  ['white', 'orange-text', 4.5], // primary button hover
  ['text', 'paper', 3], // focus ring on light
  ['orange', 'ink', 3], // focus ring on dark
];

describe('token contrast (WCAG 2.2 AA)', () => {
  it.each(PAIRS)('%s on %s ≥ %s:1', (fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('never uses Tennessee Orange as text on light backgrounds', () => {
    expect(ratio('orange', 'paper')).toBeLessThan(3);
    expect(css).not.toMatch(/color:\s*var\(--color-orange\);[^}]*\n[^}]*background:\s*var\(--color-paper/);
  });
});
