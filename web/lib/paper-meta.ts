import type { Metadata } from 'next';
import { pageMetadata } from './metadata';
import { paperDescription, type Paper } from './papers';
import { citationMetaTags } from './seo';

/** Group citation/DC [name, content] pairs into Next's `other` map; repeated names become arrays. */
export function groupMetaTags(tags: [string, string][]): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [name, content] of tags) {
    const prev = out[name];
    out[name] =
      prev === undefined ? content : Array.isArray(prev) ? [...prev, content] : [prev, content];
  }
  return out;
}

/** Metadata for /papers/<id>, matching the Astro paper page's <head> (including citation_* and dc.*). */
export function paperMetadata(paper: Paper): Metadata {
  return pageMetadata({
    title: `${paper.title} | ARCS Lab`,
    description: paperDescription(paper),
    path: `/papers/${paper.id}`,
    ogType: 'article',
    // Next drops empty-content tags, so citation_fulltext_world_readable (content="") is
    // rendered by the page itself (<ScholarFlags>), which React hoists into <head>.
    other: groupMetaTags(citationMetaTags(paper).filter(([, content]) => content !== '')),
  });
}
