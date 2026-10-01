// Type declarations for astro-site/src/lib/papers.ts, so `tsc` does not compile the Astro
// sources (written for Astro's looser compiler). Vitest resolves `@legacy/*` to the real files.
import type { PaperType } from '@/lib/schemas';

export interface Paper {
  id: string;
  year: number | string;
  type: PaperType;
  title: string;
  authors: string;
  authorsList?: string[];
  venue: string;
  venueShort?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  tags?: string[];
  pdf?: string;
  award?: string | null;
}

export function slugify(input: string): string;
export function authorList(p: Paper): string[];
export function toBibtex(p: Paper): string;
export function getRelated(paper: Paper, all: Paper[], limit?: number): Paper[];
export function typeLabel(type: PaperType): string;
export function labRoster(team: {
  pi: { name: string };
  phdStudents: { name: string }[];
  dengStudents: { name: string }[];
  undergraduates: { name: string }[];
  alumni: { name: string }[];
}): string[];
export function markLabMembers(authors: string, memberNames: string[]): string;
export const LAB_MARK: string;
