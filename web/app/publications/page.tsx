import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import { LabMarkKey } from '@/components/papers/Authors';
import PublicationsExplorer from '@/components/papers/PublicationsExplorer';
import { publications, researchAreas, team } from '@/lib/data';
import type { ExplorerPaper } from '@/lib/explorer';
import { pageMetadata } from '@/lib/metadata';
import { labRoster, markLabMembers } from '@/lib/papers';
import { paperAreas } from '@/lib/research';
import { stats } from '@/lib/stats';

export const metadata = pageMetadata({
  title: 'Publications | ARCS Lab | UT Knoxville',
  description: `${publications.length}+ peer-reviewed publications from the ARCS Lab on human-AI teaming, trust in AI, and collaborative systems.`,
  path: '/publications',
});

const roster = labRoster(team.people);

export default function PublicationsPage() {
  // Newest first, curated data order within a year (the explorer's default view).
  const papers: ExplorerPaper[] = [...publications]
    .sort((a, b) => b.year - a.year)
    .map((p) => ({
      id: p.id,
      year: p.year,
      type: p.type,
      title: p.title,
      authors: markLabMembers(p.authors, roster),
      venue: p.venue,
      ...(p.award ? { award: p.award } : {}),
      inPress: p.status === 'in-press',
      pdf: Boolean(p.pdf),
      areas: paperAreas(p, researchAreas),
      haystack: [p.title, p.authors, ...p.authorsList, p.venue, p.venueShort ?? '', ...p.tags]
        .join(' ')
        .toLowerCase(),
    }));
  const years = [...new Set(papers.map((p) => p.year))];

  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['Publications', '/publications'],
        ]}
      />
      <PageHeader
        index="02"
        crumb="Scholarly Output"
        title="What we've"
        titleEm="published."
        lead="A complete record of peer-reviewed journal articles, conference papers, book chapters, and workshop contributions from the ARCS Lab and its collaborators."
        stats={[
          { value: `${stats.publications}+`, label: 'Total Publications' },
          { value: `${stats.byType.journal}`, label: 'Journal Articles' },
          { value: `${stats.byType.conference}`, label: 'Conference Papers' },
          { value: `${stats.byType['book chapter']}`, label: 'Book Chapters' },
          { value: `${stats.bestPaperAwards}`, label: 'Best Paper Awards' },
        ]}
        focus={{ x: 0.45, y: 0.4 }}
      />
      <PublicationsExplorer
        papers={papers}
        years={years}
        areas={researchAreas.map((a) => ({ slug: a.slug, title: a.title }))}
        legend={<LabMarkKey />}
      />
    </>
  );
}
