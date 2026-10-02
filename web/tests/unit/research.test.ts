import { describe, expect, it } from 'vitest';
import { grants, publications, researchAreas, team } from '@/lib/data';
import {
  adjacentAreas,
  areaGrants,
  areaPapers,
  areaPeople,
  clampDescription,
  paperAreas,
  splitTitle,
} from '@/lib/research';

describe('research areas', () => {
  it('every area matches at least one paper, newest first', () => {
    for (const area of researchAreas) {
      const papers = areaPapers(area, publications);
      expect(papers.length, area.slug).toBeGreaterThan(0);
      const years = papers.map((p) => p.year);
      expect(years).toEqual([...years].sort((a, b) => b - a));
    }
  });

  it('paperAreas is the inverse of areaPapers', () => {
    for (const p of publications) {
      for (const slug of paperAreas(p, researchAreas)) {
        const area = researchAreas.find((a) => a.slug === slug)!;
        expect(areaPapers(area, publications)).toContain(p);
      }
    }
  });

  it('people come from authorAliases, PI included, collaborators never', () => {
    const hat = researchAreas.find((a) => a.slug === 'human-ai-teaming')!;
    const people = areaPeople(areaPapers(hat, publications), team.people);
    expect(people.map((p) => p.slug)).toContain('beau-schelble');
    const collaborators = new Set(team.collaborators.map((c) => c.name));
    for (const p of people) expect(collaborators.has(p.name)).toBe(false);
  });

  it('related grants never include pending or not-funded proposals', () => {
    for (const area of researchAreas) {
      for (const g of areaGrants(area, grants)) expect(['active', 'completed']).toContain(g.status);
    }
    expect(
      areaGrants({ grants: { ids: ['ari-unite', 'nsf-transactive-memory'] } }, grants),
    ).toEqual([]);
  });

  it('pager wraps around', () => {
    const first = researchAreas[0]!.slug;
    const last = researchAreas.at(-1)!.slug;
    expect(adjacentAreas(researchAreas, first).prev?.slug).toBe(last);
    expect(adjacentAreas(researchAreas, last).next?.slug).toBe(first);
  });

  it('splitTitle and clampDescription', () => {
    expect(splitTitle('Evaluation & Validation')).toEqual(['Evaluation &', 'Validation.']);
    expect(splitTitle('Training')).toEqual(['', 'Training.']);
    const long = researchAreas[0]!.description;
    const d = clampDescription(long);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith('…')).toBe(true);
    expect(clampDescription('Short.')).toBe('Short.');
  });
});
