import { afterEach, describe, expect, it, vi } from 'vitest';
import { join } from '@/lib/data';
import { published } from '@/lib/drafts';
import { recruitingDetail, recruitingHeadline, recruitingSentence } from '@/lib/recruiting';
import { site } from '@/lib/site';

describe('recruiting copy (driven by site.recruiting)', () => {
  it('reflects the status Dr. Schelble confirmed', () => {
    expect(site.recruiting).toEqual({ open: true, term: 'Spring, Summer, or Fall 2027' });
    expect(recruitingHeadline(site.recruiting)).toBe('Now recruiting');
    expect(recruitingDetail(site.recruiting)).toBe('For a Spring, Summer, or Fall 2027 start');
    expect(recruitingSentence(site.recruiting)).toBe(
      'The ARCS Lab is recruiting students for a Spring, Summer, or Fall 2027 start.',
    );
  });

  it('handles a closed or term-less status without inventing a term', () => {
    expect(recruitingHeadline({ open: false })).toBe('Not recruiting right now');
    expect(recruitingSentence({ open: false })).toBe('The ARCS Lab is not recruiting right now.');
    expect(recruitingDetail({ open: true })).not.toMatch(/\d{4}/);
    expect(recruitingDetail({ open: false, note: 'Reopening in 2028.' })).toBe(
      'Reopening in 2028.',
    );
  });
});

describe('drafts', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('previews and local builds show drafts', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(published(join.faq)).toHaveLength(join.faq.length);
  });

  it('production builds drop them', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const shown = published(join.faq);
    expect(shown.some((f) => f.draft)).toBe(false);
    expect(shown).toHaveLength(join.faq.filter((f) => !f.draft).length);
  });
});
