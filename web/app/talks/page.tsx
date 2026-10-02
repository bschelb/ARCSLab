import Breadcrumbs from '@/components/Breadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import NewsTimeline, { type TimelineEntry } from '@/components/news/NewsTimeline';
import Icon from '@/components/ui/Icon';
import { news, talks } from '@/lib/data';
import { displayDate } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import { pageMetadata } from '@/lib/metadata';
import { KIND_LABEL, filterFor, newsAndTalks } from '@/lib/news';
import type { NewsItem } from '@/lib/schemas';

export const metadata = pageMetadata({
  title: 'News & Talks | ARCS Lab | UT Knoxville',
  description:
    'Invited talks and news from the ARCS Lab — National Academies, West Point, Carnegie Mellon, UT Austin, and more.',
  path: '/talks',
});

const KIND_ICON: Partial<Record<NewsItem['kind'], IconName>> = {
  'invited-talk': 'mic',
  keynote: 'mic',
  press: 'doc',
};

function toEntry(n: NewsItem): TimelineEntry {
  const venue = n.venue && n.location?.includes(n.venue) ? undefined : n.venue;
  return {
    id: n.id,
    year: Number(n.date.slice(0, 4)),
    dateText: displayDate(n, 'short'),
    filter: filterFor(n.kind),
    kindLabel: n.virtual ? `${KIND_LABEL[n.kind]} · Virtual` : KIND_LABEL[n.kind],
    icon: <Icon name={n.icon ?? KIND_ICON[n.kind] ?? 'doc'} size={20} />,
    title: n.title,
    ...(venue ? { venue } : {}),
    ...(n.location ? { location: n.location } : {}),
    ...(n.description ? { description: n.description } : {}),
    ...(n.link ? { link: n.link } : {}),
    external: Boolean(n.link?.startsWith('http')),
  };
}

export default function TalksPage() {
  const entries = newsAndTalks(talks, news).map(toEntry);
  return (
    <>
      <Breadcrumbs
        trail={[
          ['Home', '/'],
          ['News & Talks', '/talks'],
        ]}
      />
      <PageHeader
        index="06"
        crumb="Visibility"
        title="News &"
        titleEm="talks."
        lead="Dr. Schelble and the ARCS Lab are active contributors to national conversations on human-AI teaming in defense, academia, and industry — with invited presentations at the National Academies, West Point, Carnegie Mellon, and beyond."
        stats={[
          { value: `${talks.length}`, label: 'Invited Talks' },
          { value: `${news.filter((n) => n.kind === 'press').length}`, label: 'Press Stories' },
          { value: `${news.filter((n) => n.kind === 'award').length}`, label: 'Awards' },
        ]}
        focus={{ x: 0.75, y: 0.6 }}
      />
      <NewsTimeline entries={entries} pinIcon={<Icon name="pin" size={13} />} />
    </>
  );
}
