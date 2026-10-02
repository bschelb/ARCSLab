/** Headline numbers, computed from data (F6). Pages render these; nothing is typed by hand. */
import { grants, publications, talks } from './data';
import { piTotal } from './funding';
import type { Grant, NewsItem, PaperType, Publication } from './schemas';

export function countByType(pubs: Publication[]): Record<PaperType, number> {
  const counts: Record<PaperType, number> = {
    journal: 0,
    conference: 0,
    'book chapter': 0,
    workshop: 0,
  };
  for (const p of pubs) counts[p.type] += 1;
  return counts;
}

export function computeStats(input: { pubs: Publication[]; grants: Grant[]; talks: NewsItem[] }) {
  return {
    publications: input.pubs.length,
    piFunding: piTotal(input.grants),
    /** Publications carrying a real award (best paper, honorable mention, featured, …). */
    bestPaperAwards: input.pubs.filter((p) => p.award).length,
    /** Invited talks plus keynotes. */
    invitedTalks: input.talks.length,
    byType: countByType(input.pubs),
  };
}

export const stats = computeStats({ pubs: publications, grants, talks });
