/** Display formatting for dates, money and tenures. Pure functions, no locale surprises. */

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function parseIso(iso: string): { year: number; month: number; day?: number } {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(iso);
  if (!m) throw new Error(`Not an ISO month/day: ${iso}`);
  return { year: Number(m[1]), month: Number(m[2]), day: m[3] ? Number(m[3]) : undefined };
}

/** "2026-07" → "Jul 2026" (plan 4.6 display style). */
export function formatMonthShort(iso: string): string {
  const { year, month } = parseIso(iso);
  return `${MONTHS_LONG[month - 1]?.slice(0, 3)} ${year}`;
}

/** "2026-07" → "July 2026" (the Astro site's display style, used by the faithful port). */
export function formatMonthLong(iso: string): string {
  const { year, month } = parseIso(iso);
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

/** Display date for a news/talk item: its `dateLabel` when set ("Spring 2026"), else the month. */
export function displayDate(
  item: { date: string; dateLabel?: string },
  style: 'short' | 'long' = 'long',
): string {
  if (item.dateLabel) return item.dateLabel;
  return style === 'short' ? formatMonthShort(item.date) : formatMonthLong(item.date);
}

/** 2077811 → "$2,077,811". */
export function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/** 2802201 → "$2.8M"; 718690 → "$719K"; 1750 → "$1,750". */
export function formatUsdCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 10_000) return `$${Math.round(amount / 1000)}K`;
  return formatUsd(amount);
}

/** (2024) → "2024–Present"; (2024, 2026) → "2024–2026". */
export function formatTenure(startYear: number, endYear?: number): string {
  return `${startYear}–${endYear ?? 'Present'}`;
}
