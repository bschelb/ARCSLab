import path from 'node:path';
import { describe, expect, it } from 'vitest';
import legacyFunding from '../../../astro-site/src/data/funding.json';
import legacyTalks from '../../../astro-site/src/data/talks.json';
import legacyTeam from '../../../astro-site/src/data/team.json';
import fundingJson from '@/data/funding.json';
import joinJson from '@/data/join.json';
import newsJson from '@/data/news.json';
import publicationsJson from '@/data/publications.json';
import researchJson from '@/data/research.json';
import talksJson from '@/data/talks.json';
import teamJson from '@/data/team.json';
import { grants, news, publications, researchAreas, talks, team } from '@/lib/data';
import {
  displayDate,
  formatMonthShort,
  formatTenure,
  formatUsd,
  formatUsdCompact,
} from '@/lib/format';
import { displayedGrants, piTotal, splitInternal } from '@/lib/funding';
import { sortByDateDesc, timeline } from '@/lib/news';
import { monogram, personBySlug, profileHref, publicationsFor } from '@/lib/people';
import { stats } from '@/lib/stats';
import { displayAuthorCount, validateContent, type RawContent } from '@/lib/validate';

const publicDir = path.resolve(__dirname, '../../public');
const raw = (): RawContent =>
  structuredClone({
    'publications.json': publicationsJson,
    'research.json': researchJson,
    'team.json': teamJson,
    'funding.json': fundingJson,
    'talks.json': talksJson,
    'news.json': newsJson,
    'join.json': joinJson,
  });

describe('funding totals (computed, never typed)', () => {
  it('the active PI total is $2,802,201, matching CLAUDE.md and the old hand-typed value', () => {
    expect(piTotal(grants)).toBe(2_802_201);
    expect(formatUsd(piTotal(grants))).toBe(legacyFunding.totalAwardedAsPI);
    expect(formatUsdCompact(piTotal(grants))).toBe(legacyTeam.pi.stats.piFunding);
  });

  it('hides pending and not-funded proposals', () => {
    const shown = displayedGrants(grants);
    expect(shown).toHaveLength(5);
    expect(shown.every((g) => g.status === 'active' || g.status === 'completed')).toBe(true);
    expect(grants.filter((g) => g.status === 'pending')).toHaveLength(3);
  });

  it('splits external sponsors from internal UTK awards in data order', () => {
    const { external, internal } = splitInternal(grants);
    expect(external.map((g) => g.funderShort)).toEqual(['ARO', 'ARO']);
    expect(internal.map((g) => g.funderShort)).toEqual([
      'UTK Internal',
      'UTK DRAP',
      'UTK ISE Dept',
    ]);
  });

  it('round-trips every legacy amount string', () => {
    const legacy = [...legacyFunding.active, ...legacyFunding.pending].map((g) => g.amount);
    expect(grants.map((g) => formatUsd(g.amount))).toEqual(legacy);
  });
});

describe('headline stats (computed, never typed)', () => {
  it('counts 49 publications: 26 journal, 17 conference, 3 book chapters, 3 workshop', () => {
    expect(stats.publications).toBe(49);
    expect(stats.byType).toEqual({ journal: 26, conference: 17, 'book chapter': 3, workshop: 3 });
    expect(legacyTeam.pi.stats.publications).toBe(`${stats.publications}+`);
  });

  it('counts 5 awards and 10 invited talks, matching the old hand-typed stats', () => {
    expect(stats.bestPaperAwards).toBe(legacyTeam.pi.stats.bestPaperAwards);
    expect(stats.invitedTalks).toBe(legacyTeam.pi.stats.invitedTalks);
  });

  it('keeps "In Press" out of awards', () => {
    expect(publications.filter((p) => p.status === 'in-press').map((p) => p.id)).toEqual([
      'olatunji-2026-bridging-hai-hri',
    ]);
    expect(publications.some((p) => p.award === 'In Press')).toBe(false);
  });
});

describe('people', () => {
  it('matches publications to people through authorAliases', () => {
    const ids = (slug: string) => {
      const person = personBySlug(team.people, slug);
      if (!person) throw new Error(slug);
      return publicationsFor(person, publications).map((p) => p.id);
    };
    expect(ids('gracyn-filer')).toEqual(['schelble-2025-info-sharing-trust-hfes']);
    expect(ids('sarah-mendoza')).toContain('mendoza-2026-catems');
    expect(ids('yayun-tian')).toContain('olatunji-2026-bridging-hai-hri');
    expect(ids('beau-schelble')).toHaveLength(49);
    expect(ids('owen-fair')).toEqual([]);
  });

  it('round-trips every legacy tenure string', () => {
    const legacy = [
      ...legacyTeam.dengStudents,
      ...legacyTeam.undergraduates,
      ...legacyTeam.alumni,
    ].map((p) => p.tenure);
    const people = team.people.filter((p) => ['deng', 'undergrad', 'alumni'].includes(p.group));
    expect(people.map((p) => formatTenure(p.startYear, p.endYear))).toEqual(legacy);
  });

  it('keeps the PI on /pi and gives everyone else a profile URL', () => {
    expect(team.people.filter((p) => profileHref(p) === '/pi').map((p) => p.slug)).toEqual([
      'beau-schelble',
    ]);
    expect(profileHref({ group: 'phd', slug: 'sarah-mendoza' })).toBe('/team/sarah-mendoza');
  });

  it('builds monograms without middle initials or honorifics', () => {
    expect(monogram({ name: 'Owen Fair' })).toBe('OF');
    expect(monogram({ name: 'Dr. Beau G. Schelble' })).toBe('BS');
    expect(monogram({ name: 'Daniel Opong-Duah' })).toBe('DO');
  });

  it('keeps collaborators separate from lab members', () => {
    const members = new Set(team.people.map((p) => p.name));
    expect(team.collaborators.some((c) => members.has(c.name))).toBe(false);
    expect(team.collaborators).toHaveLength(12);
  });
});

describe('talks and news dates', () => {
  it('round-trips every legacy date string through ISO + dateLabel', () => {
    expect(talks.map((t) => displayDate(t))).toEqual(legacyTalks.invitedTalks.map((t) => t.date));
    expect(news.map((n) => displayDate(n))).toEqual(legacyTalks.media.map((m) => m.date));
  });

  it('sorting by ISO date reproduces the curated order', () => {
    expect(sortByDateDesc(talks).map((t) => t.id)).toEqual(talks.map((t) => t.id));
    expect(sortByDateDesc(news).map((n) => n.id)).toEqual(news.map((n) => n.id));
  });

  it('merges talks and news into one dated timeline', () => {
    const items = timeline(talks, news);
    expect(items).toHaveLength(28);
    expect(items.every((x, i) => i === 0 || items[i - 1]!.date >= x.date)).toBe(true);
  });

  it('formats dates in the plan 4.6 style', () => {
    expect(formatMonthShort('2026-07')).toBe('Jul 2026');
    expect(displayDate({ date: '2026-04', dateLabel: 'Spring 2026' }, 'short')).toBe('Spring 2026');
  });

  it('identifies the keynote', () => {
    expect(talks.filter((t) => t.kind === 'keynote')).toHaveLength(1);
  });
});

describe('research areas', () => {
  it('replaces emoji with icon names and links every featured pub to a paper', () => {
    expect(researchAreas.map((a) => a.icon)).toEqual([
      'network',
      'shield',
      'layers',
      'radar',
      'bot',
      'flask',
    ]);
    const ids = new Set(publications.map((p) => p.id));
    for (const a of researchAreas)
      for (const p of a.pubs) expect(ids.has(p.paperId ?? '')).toBe(true);
  });
});

describe('validate:data', () => {
  it('passes on the real data with zero errors', () => {
    expect(validateContent(raw(), publicDir).errors).toEqual([]);
  });

  it('rejects an emoji anywhere in data', () => {
    const r = raw();
    (r['research.json'] as { icon: string }[])[0]!.icon = '🤝';
    (r['team.json'] as { people: { bio?: string }[] }).people[1]!.bio = 'Hello 🎉';
    const errors = validateContent(r, publicDir).errors;
    expect(errors.some((e) => e.includes('team.json') && e.includes('emoji'))).toBe(true);
    expect(errors.some((e) => e.includes('research.json') && e.includes('emoji'))).toBe(true);
  });

  it('rejects a missing PDF, a duplicate id, a dangling paperId and a bad author count', () => {
    const r = raw();
    const pubs = r['publications.json'] as { id: string; pdf?: string; authors: string }[];
    pubs[0]!.pdf = `${pubs[0]!.id}.pdf`;
    pubs[2]!.id = pubs[1]!.id;
    pubs[3]!.authors = 'Schelble, B.G.';
    (r['research.json'] as { pubs: { paperId?: string }[] }[])[0]!.pubs[0]!.paperId =
      'no-such-paper';
    const errors = validateContent(r, publicDir).errors.join('\n');
    expect(errors).toContain('is missing from public/papers/');
    expect(errors).toContain('duplicate id');
    expect(errors).toContain('"no-such-paper" is not a publication id');
    expect(errors).toContain('authorsList has');
  });

  it('reports schema violations with the file and path', () => {
    const r = raw();
    (r['funding.json'] as { grants: { amount: unknown }[] }).grants[0]!.amount = '$2,077,811';
    expect(validateContent(r, publicDir).errors.join('\n')).toMatch(
      /data\/funding\.json → grants\.0\.amount/,
    );
  });

  it('counts display authors in the house format', () => {
    expect(displayAuthorCount('Olatunji, S., Schelble, B.G., Tian, Y., & Robert, L.')).toBe(4);
    expect(displayAuthorCount("O'Neill, T.A., & de Visser, E.J.")).toBe(2);
  });
});

describe('paper helpers', () => {
  it('formats APA references from the curated author string', async () => {
    const { toApa, paperDescription } = await import('@/lib/papers');
    const p = publications.find((x) => x.id === 'schelble-2022-lets-think-together')!;
    expect(toApa(p)).toBe(
      `${p.authors} (2021). Let's Think Together! Assessing Shared Mental Models, Performance, and Trust in ` +
        `Human-Agent Teams. ${p.venue}. https://doi.org/10.1145/3492832`,
    );
    expect(
      toApa({
        ...p,
        title: 'Should AI Teammates Give All the Answers?',
        doi: undefined,
        url: undefined,
      }),
    ).toBe(`${p.authors} (2021). Should AI Teammates Give All the Answers? ${p.venue}.`);
    expect(paperDescription(p).length).toBeLessThanOrEqual(300);
  });
});
