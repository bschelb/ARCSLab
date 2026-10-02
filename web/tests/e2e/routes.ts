import publications from '../../data/publications.json' with { type: 'json' };
import research from '../../data/research.json' with { type: 'json' };
import team from '../../data/team.json' with { type: 'json' };

/** Top-level pages plus one example of each detail-page type (fast, every-browser checks). */
export const ROUTES = [
  '/',
  '/research',
  '/publications',
  '/team',
  '/pi',
  '/funding',
  '/talks',
  '/contact',
  '/join',
  '/research/human-ai-teaming',
  '/research/evaluation-validation',
  '/team/sarah-mendoza',
  '/team/elizabeth-hughes',
] as const;

/** Every URL in /sitemap.xml, as paths (sitemap.spec checks the two stay identical). */
export const SITEMAP_ROUTES: string[] = [
  '/',
  '/research',
  '/publications',
  '/team',
  '/pi',
  '/funding',
  '/talks',
  '/join',
  '/contact',
  ...research.map((a) => `/research/${a.slug}`),
  ...team.people.filter((p) => p.group !== 'pi').map((p) => `/team/${p.slug}`),
  ...publications.map((p) => `/papers/${p.id}`),
];
