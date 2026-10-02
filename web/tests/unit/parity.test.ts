/**
 * Parity oracles (plan Phase 2, step 4). The new lib functions must produce output identical
 * to the original Astro functions, imported directly from astro-site/src/lib, for all 49
 * publications — and identical to what production served, per migration/seo-baseline.json.
 */
import { describe, expect, it } from 'vitest';
import legacyPublications from '../../../astro-site/src/data/publications.json';
import legacyResearch from '../../../astro-site/src/data/research.json';
import legacyTeam from '../../../astro-site/src/data/team.json';
import * as legacyPapers from '@legacy/papers';
import * as legacySeo from '@legacy/seo';
import baseline from '../../../migration/seo-baseline.json';
import { publications, researchAreas, team } from '@/lib/data';
import {
  getRelated,
  labRoster,
  markLabMembers,
  slugify,
  toBibtex,
  typeLabel,
  type AuthorSegment,
} from '@/lib/papers';
import {
  breadcrumbNode,
  citationMetaTags,
  ldjson,
  profilePageNode,
  scholarlyArticleNode,
  siteGraph,
} from '@/lib/seo';

type LegacyPaper = legacyPapers.Paper;
const legacyById = new Map(
  (legacyPublications as unknown as LegacyPaper[]).map((p) => [p.id, p] as const),
);
const legacy = (id: string): LegacyPaper => {
  const p = legacyById.get(id);
  if (!p) throw new Error(`No legacy paper ${id}`);
  return p;
};

interface BaselinePage {
  title: string | null;
  citation: Record<string, string | string[]>;
  dc: Record<string, string | string[]>;
  jsonld: Record<string, unknown>[];
}
const pages = (baseline as unknown as { pages: Record<string, BaselinePage> }).pages;

/** Sort object keys recursively so deep-equality ignores key order (as the baseline does). */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]),
    );
  }
  return v;
}

/** Group `[name, content]` pairs like the baseline: repeated names become arrays. */
function groupTags(tags: [string, string][], prefix: (n: string) => boolean) {
  const out: Record<string, string | string[]> = {};
  for (const [name, content] of tags) {
    if (!prefix(name)) continue;
    const prev = out[name];
    out[name] =
      prev === undefined ? content : Array.isArray(prev) ? [...prev, content] : [prev, content];
  }
  return out;
}

function renderLegacyHtml(segments: AuthorSegment[]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return segments.map((s) => esc(s.text) + (s.isLabMember ? legacyPapers.LAB_MARK : '')).join('');
}

describe('data covers every publication', () => {
  it('has the same 49 ids in the same order', () => {
    expect(publications).toHaveLength(49);
    expect(publications.map((p) => p.id)).toEqual([...legacyById.keys()]);
  });
});

describe.each(publications.map((p) => [p.id, p] as const))('paper %s', (id, paper) => {
  // A PDF added after cutover adds citation_pdf_url and an encoding node that the frozen
  // Astro data and production baseline cannot have, so those comparisons don't apply.
  const pdfAddedSinceCutover = paper.pdf !== legacy(id).pdf;

  it('toBibtex matches the Astro original', () => {
    expect(toBibtex(paper)).toBe(legacyPapers.toBibtex(legacy(id)));
  });

  it.skipIf(pdfAddedSinceCutover)('citationMetaTags matches the Astro original', () => {
    expect(citationMetaTags(paper)).toEqual(legacySeo.citationMetaTags(legacy(id)));
  });

  it.skipIf(pdfAddedSinceCutover)('scholarlyArticleNode matches the Astro original', () => {
    expect(scholarlyArticleNode(paper)).toEqual(legacySeo.scholarlyArticleNode(legacy(id)));
  });

  it('getRelated matches the Astro original', () => {
    const legacyAll = [...legacyById.values()];
    expect(getRelated(paper, publications).map((p) => p.id)).toEqual(
      legacyPapers.getRelated(legacy(id), legacyAll).map((p) => p.id),
    );
  });

  it.skipIf(pdfAddedSinceCutover)('matches production: citation_* and dc.* tags', () => {
    const page = pages[`/papers/${id}`];
    expect(page).toBeDefined();
    const tags = citationMetaTags(paper);
    expect(groupTags(tags, (n) => n.startsWith('citation_'))).toEqual(page?.citation);
    expect(groupTags(tags, (n) => n.startsWith('dc.'))).toEqual(page?.dc);
  });

  it.skipIf(pdfAddedSinceCutover)('matches production: ScholarlyArticle JSON-LD', () => {
    const served = pages[`/papers/${id}`]?.jsonld.find((n) => n['@type'] === 'ScholarlyArticle');
    expect(sortKeys(scholarlyArticleNode(paper))).toEqual(served);
  });
});

describe('site-wide JSON-LD', () => {
  it('siteGraph matches the Astro original and production', () => {
    expect(siteGraph()).toEqual(legacySeo.siteGraph());
    for (const route of ['/', '/research', '/papers/schelble-2022-lets-think-together']) {
      const served = pages[route]?.jsonld.find((n) => '@graph' in n);
      expect(sortKeys(siteGraph())).toEqual(served);
    }
  });

  it('profilePageNode for /pi matches production', () => {
    const served = pages['/pi']?.jsonld.find((n) => n['@type'] === 'ProfilePage');
    expect(served).toBeDefined();
    const opts = {
      url: served?.url as string,
      name: served?.name as string,
      description: served?.description as string,
    };
    expect(profilePageNode(opts)).toEqual(legacySeo.profilePageNode(opts));
    expect(sortKeys(profilePageNode(opts))).toEqual(served);
  });

  it('breadcrumbNode matches the Astro original and production for every subpage', () => {
    for (const [route, page] of Object.entries(pages)) {
      const served = page.jsonld.find((n) => n['@type'] === 'BreadcrumbList');
      if (!served) continue;
      const items = served.itemListElement as { name: string; item: string }[];
      const trail = items.map((i): [string, string] => [
        i.name,
        i.item.replace('https://arcslab.io', ''),
      ]);
      expect(breadcrumbNode(trail), route).toEqual(legacySeo.breadcrumbNode(trail));
      expect(sortKeys(breadcrumbNode(trail)), route).toEqual(served);
    }
  });

  it('ldjson escapes "<" exactly like the Astro original', () => {
    const node = { a: '</script><b>' };
    expect(ldjson(node)).toBe(legacySeo.ldjson(node));
  });
});

describe('lab-member marking (group framing)', () => {
  const roster = labRoster(team.people);

  it('the roster matches the Astro roster: PI, PhD, DEng, undergraduates, alumni', () => {
    expect(roster).toEqual(legacyPapers.labRoster(legacyTeam));
  });

  it('marks the same names as the Astro original in every publication author list', () => {
    for (const p of publications) {
      expect(renderLegacyHtml(markLabMembers(p.authors, roster)), p.id).toBe(
        legacyPapers.markLabMembers(p.authors, legacyPapers.labRoster(legacyTeam)),
      );
    }
  });

  it('marks the same names in every research-area featured publication', () => {
    const legacyAuthors = legacyResearch.flatMap((a) => a.pubs.map((p) => p.authors));
    const newAuthors = researchAreas.flatMap((a) => a.pubs.map((p) => p.authors));
    expect(newAuthors).toEqual(legacyAuthors);
    for (const authors of newAuthors) {
      expect(renderLegacyHtml(markLabMembers(authors, roster))).toBe(
        legacyPapers.markLabMembers(authors, legacyPapers.labRoster(legacyTeam)),
      );
    }
  });

  it('marks the PI exactly like every other member, and segments rebuild the string', () => {
    const authors = 'Mendoza, S., Tian, Y., Schelble, B.G., Hauptman, A., & Robert, L.';
    const segs = markLabMembers(authors, roster);
    expect(segs.map((s) => s.text).join('')).toBe(authors);
    expect(segs.filter((s) => s.isLabMember).map((s) => s.text)).toEqual([
      'Mendoza, S.',
      'Tian, Y.',
      'Schelble, B.G.',
    ]);
  });
});

describe('small helpers', () => {
  it('slugify and typeLabel match the Astro originals', () => {
    for (const p of publications) {
      expect(slugify(p.title)).toBe(legacyPapers.slugify(p.title));
      expect(typeLabel(p.type)).toBe(legacyPapers.typeLabel(p.type));
    }
  });
});
