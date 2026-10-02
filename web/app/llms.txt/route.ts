import { grants, news, publications, researchAreas, talks, team } from '@/lib/data';
import { formatUsd } from '@/lib/format';
import { displayedGrants, piTotal } from '@/lib/funding';
import { byGroup, plainName } from '@/lib/people';
import { absoluteUrl, site } from '@/lib/site';
import { stats } from '@/lib/stats';

// /llms.txt (https://llmstxt.org): a plain-Markdown briefing about the ARCS Lab for LLMs and
// AI search tools. Lab-centric, and built from the same data files as the pages.
export const dynamic = 'force-static';

export function GET() {
  const pi = byGroup(team.people, 'pi')[0];
  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    '## Key facts',
    '',
    `- Home: ${site.affiliation}`,
    `- Director: ${pi ? plainName(pi) : 'Beau G. Schelble'}, Founding Director (${absoluteUrl('/pi')}; personal site ${site.links.personalSite})`,
    `- Founded: 2024`,
    `- Publications: ${stats.publications} (${stats.byType.journal} journal articles, ${stats.byType.conference} conference papers, ${stats.byType['book chapter']} book chapters, ${stats.byType.workshop} workshop papers)`,
    `- Best paper awards and honors on publications: ${stats.bestPaperAwards}`,
    `- Funding awarded with the director as PI: ${formatUsd(piTotal(grants))}`,
    ...displayedGrants(grants)
      .filter((g) => !g.internal)
      .map((g) => `- Active award: "${g.title}" (${g.funder}, ${formatUsd(g.amount)})`),
    `- Invited talks: ${talks.length}`,
    `- Recruiting: ${site.recruiting.open ? `yes${site.recruiting.term ? `, for a ${site.recruiting.term} start` : ''}` : 'not currently'}`,
    `- Contact: ${site.email}`,
    '',
    '## Research areas',
    '',
    ...researchAreas.map(
      (a) => `- ${a.title} (${absoluteUrl('/research')}#${a.slug}): ${a.description}`,
    ),
    '',
    '## Pages',
    '',
    `- [Research](${absoluteUrl('/research')}): Research areas, methods and applied domains`,
    `- [Publications](${absoluteUrl('/publications')}): All publications; author-version PDFs where posted`,
    `- [Team](${absoluteUrl('/team')}): Lab members, alumni and collaborators`,
    `- [Principal Investigator](${absoluteUrl('/pi')}): Biography, honors, service and teaching`,
    `- [Funding](${absoluteUrl('/funding')}): Sponsored research`,
    `- [Talks & News](${absoluteUrl('/talks')}): Invited talks and lab news`,
    `- [Join](${absoluteUrl('/join')}): Recruiting status, open positions and how to apply`,
    `- [Contact](${absoluteUrl('/contact')}): Prospective students, collaborators, press`,
    '',
    '## Lab members',
    '',
    ...team.people.filter((p) => p.group !== 'alumni').map((p) => `- ${plainName(p)}: ${p.role}`),
    '',
    '## Recent news',
    '',
    ...news.slice(0, 6).map((n) => `- ${n.dateLabel ?? n.date}: ${n.title}`),
    '',
    '## Publications',
    '',
    ...publications.map(
      (p) =>
        `- [${p.title}](${absoluteUrl(`/papers/${p.id}`)}) (${p.year}, ${p.venueShort ?? p.venue})${p.pdf ? ` — PDF: ${absoluteUrl(`/papers/${p.pdf}`)}` : ''}`,
    ),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
