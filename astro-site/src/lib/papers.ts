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
