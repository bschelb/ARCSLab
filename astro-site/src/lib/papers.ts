/**
 * Pure helpers and types for publication records.
 *
 * Ported from the personal site's `lib/papers.ts`, with the Node `fs` I/O
 * removed — on this static Astro site the data is imported directly from
 * `src/data/publications.json`. Keep every function pure so it can run at build
 * time inside `.astro` frontmatter.
 */

export type PaperType = "journal" | "conference" | "workshop" | "book chapter";

export interface Paper {
  /** URL slug + PDF basename stem, e.g. `schelble-2025-context-trust-high-risk`. */
  id: string;
  year: number | string;
  type: PaperType;
  title: string;
  /** Display string in the lab's house format ("Schelble, B.G., …"). */
  authors: string;
  /** Structured author list (full names) — powers citation_author + BibTeX. */
  authorsList?: string[];
  venue: string;
  venueShort?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  tags?: string[];
  /** PDF basename living in `public/papers/`; absent ⇒ no hosted copy. */
  pdf?: string;
  award?: string | null;
}

/** Slugify a string the same way the personal site does (stable URLs). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** The structured author list, falling back to a parse of the display string. */
export function authorList(p: Paper): string[] {
  if (p.authorsList?.length) return p.authorsList;
  return p.authors
    .replace(/&/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function bibtexAuthor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  return `${last}, ${parts.slice(0, -1).join(" ")}`;
}

/** Generate a BibTeX entry for a paper (entry type chosen from `type`). */
export function toBibtex(p: Paper): string {
  const authors = authorList(p);
  const first = authors[0]?.split(/\s+/).pop()?.toLowerCase() ?? "schelble";
  const key = `${first}${p.year}${slugify(p.title).split("-")[0]}`;
  const bibAuthors = authors.map(bibtexAuthor).join(" and ");
  const fields: [string, string][] = [
    ["title", p.title],
    ["author", bibAuthors],
    ["year", String(p.year)],
  ];
  let entryType = "article";
  if (p.type === "journal") {
    fields.push(["journal", p.venue]);
  } else if (p.type === "conference" || p.type === "workshop") {
    entryType = "inproceedings";
    fields.push(["booktitle", p.venue]);
  } else {
    entryType = "incollection";
    fields.push(["booktitle", p.venue]);
  }
  if (p.doi) fields.push(["doi", p.doi]);
  else if (p.url) fields.push(["url", p.url]);
  const body = fields.map(([k, v]) => `  ${k} = {${v}}`).join(",\n");
  return `@${entryType}{${key},\n${body}\n}`;
}

/** Related papers sharing the most tags, then most recent first. */
export function getRelated(paper: Paper, all: Paper[], limit = 4): Paper[] {
  const tags = paper.tags ?? [];
  if (!tags.length) return [];
  return all
    .filter((p) => p.id !== paper.id)
    .map((p) => ({ p, score: (p.tags ?? []).filter((t) => tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.p.year) - Number(a.p.year))
    .slice(0, limit)
    .map((x) => x.p);
}

/** Human-readable label for a paper type (used in chips/headers). */
export function typeLabel(type: PaperType): string {
  switch (type) {
    case "journal":
      return "Journal Article";
    case "conference":
      return "Conference Paper";
    case "workshop":
      return "Workshop Paper";
    case "book chapter":
      return "Book Chapter";
    default:
      return type;
  }
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Everyone whose name earns a lab mark: the PI plus current members and alumni. */
export function labRoster(team: {
  pi: { name: string };
  phdStudents: { name: string }[];
  dengStudents: { name: string }[];
  undergraduates: { name: string }[];
  alumni: { name: string }[];
}): string[] {
  return [
    team.pi,
    ...team.phdStudents,
    ...team.dengStudents,
    ...team.undergraduates,
    ...team.alumni,
  ].map((m) => m.name.replace(/^Dr\.\s+/, ""));
}

/**
 * Star every ARCS Lab member inside a display author string.
 *
 * This is the lab's site, so the mark goes on the whole group (PI included)
 * rather than singling anyone out. Pass `labRoster(team)`. Handles both the
 * full house format ("Mendoza, S., Schelble, B.G., …"), matched on surname +
 * first initial with optional middle initials, and the short surname-only
 * lists in research.json ("Schelble, Mallick, & McNeese"). A same-surname
 * author with a different first initial is not marked.
 *
 * Returns HTML — the input is escaped first, so it is safe for `set:html`.
 */
export function markLabMembers(authors: string, memberNames: string[]): string {
  const patterns: string[] = [];
  for (const full of memberNames) {
    const parts = full.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    const initial = parts[0]?.[0];
    if (!last || !initial || parts.length < 2) continue;
    const l = escapeRegExp(last);
    patterns.push(
      `\\b${l}\\b(?!, (?!${initial}\\.)[A-Z]\\.)(?:, ${initial}\\.(?:\\s?[A-Z]\\.)*)?`,
    );
  }
  const out = escapeHtml(authors);
  if (!patterns.length) return out;
  const re = new RegExp(patterns.join("|"), "g");
  return out.replace(re, (m) => `${m}${LAB_MARK}`);
}

/** The inline marker appended after a lab member's name (styled by `.lab-mark`). */
export const LAB_MARK = '<sup class="lab-mark" title="ARCS Lab member">★</sup>';
