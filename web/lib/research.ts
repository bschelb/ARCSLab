/** Research-area helpers: which papers, people and funded projects belong to an area. */
import { publicationsFor } from './people';
import type { Grant, Person, Publication, ResearchArea } from './schemas';
import { displayedGrants } from './funding';

/** Papers whose tags meet the area's matchTags, newest first (data order within a year). */
export function areaPapers(area: Pick<ResearchArea, 'matchTags'>, pubs: Publication[]) {
  const tags = new Set(area.matchTags);
  return pubs.filter((p) => p.tags.some((t) => tags.has(t))).sort((a, b) => b.year - a.year);
}

/** Slugs of the areas a paper belongs to. */
export function paperAreas(
  paper: Pick<Publication, 'tags'>,
  areas: Pick<ResearchArea, 'slug' | 'matchTags'>[],
) {
  return areas.filter((a) => a.matchTags.some((t) => paper.tags.includes(t))).map((a) => a.slug);
}

/**
 * Lab members (PI included, alumni too) who author at least one of the area's papers, in
 * roster order, matched through `authorAliases`.
 */
export function areaPeople(papers: Publication[], people: Person[]): Person[] {
  return people.filter((p) => publicationsFor(p, papers).length > 0);
}

/** The area's displayed funded projects (pending and not-funded never show). */
export function areaGrants(area: Pick<ResearchArea, 'grants'>, grants: Grant[]): Grant[] {
  const ids = area.grants?.ids ?? [];
  return displayedGrants(grants).filter((g) => ids.includes(g.id));
}

/** Previous and next areas in program order, wrapping around. */
export function adjacentAreas<T extends Pick<ResearchArea, 'slug'>>(areas: T[], slug: string) {
  const i = areas.findIndex((a) => a.slug === slug);
  const n = areas.length;
  return { prev: areas[(i - 1 + n) % n], next: areas[(i + 1) % n] };
}

/** "Evaluation & Validation" → ["Evaluation &", "Validation."] for the orange emphasis block. */
export function splitTitle(title: string): [string, string] {
  const at = title.lastIndexOf(' ');
  return at < 0 ? ['', `${title}.`] : [title.slice(0, at), `${title.slice(at + 1)}.`];
}

/** A meta description from longer copy: whole words, at most `max` characters. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '')}…`;
}
