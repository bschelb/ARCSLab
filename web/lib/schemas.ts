/**
 * Zod schemas for everything in `data/*.json` (plan section 5).
 *
 * `lib/data.ts` parses every file through these at import time, so a bad edit fails the
 * build with a readable message. `scripts/validate-data.ts` runs the same parse plus the
 * cross-file integrity checks in `lib/validate.ts`.
 */
import { z } from 'zod';
import { ICON_NAMES } from './icons';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase words joined by hyphens');
const nonEmpty = z.string().trim().min(1);
/** A site-relative path (`/papers/x`) or an absolute http(s) URL. */
const href = z.string().regex(/^(\/|https?:\/\/)/, 'must start with / or http(s)://');
const year = z.number().int().min(2000).max(2100);
/** `YYYY-MM` or `YYYY-MM-DD`. */
const isoMonthOrDay = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/, 'must be YYYY-MM or YYYY-MM-DD');

export const iconName = z.enum(ICON_NAMES);

// ── Publications ────────────────────────────────────────────────────────────

export const paperType = z.enum(['journal', 'conference', 'book chapter', 'workshop']);

export const publicationSchema = z
  .object({
    /** `<lastname>-<year>-<stem>`; also the PDF basename and the `/papers/<id>` URL. */
    id: slug,
    year,
    /** Split out of the Astro `award` field, where "In Press" used to live. */
    status: z.enum(['published', 'in-press']),
    type: paperType,
    title: nonEmpty,
    /** Curated display string in the lab's house format ("Schelble, B.G., …"), kept as-is. */
    authors: nonEmpty,
    /** Full names, in order. Powers citation_author, BibTeX and people matching. */
    authorsList: z.array(nonEmpty).min(1),
    venue: nonEmpty,
    venueShort: nonEmpty.optional(),
    /** Real awards only. */
    award: nonEmpty.optional(),
    doi: nonEmpty.optional(),
    url: z.url().optional(),
    abstract: nonEmpty.optional(),
    tags: z.array(nonEmpty),
    /** PDF basename in `public/papers/`; the file must exist. */
    pdf: z
      .string()
      .regex(/^[a-z0-9-]+\.pdf$/)
      .optional(),
  })
  .strict();

export const publicationsSchema = z.array(publicationSchema);

// ── Research areas ──────────────────────────────────────────────────────────

export const featuredPubSchema = z
  .object({
    /** Short curated author string ("Schelble, Mallick, & McNeese"). */
    authors: nonEmpty,
    title: nonEmpty,
    venue: nonEmpty,
    award: nonEmpty.optional(),
    /** The matching publications.json entry, when there is one. */
    paperId: slug.optional(),
  })
  .strict();

export const researchAreaSchema = z
  .object({
    slug,
    num: z.string().regex(/^\d{2}$/),
    icon: iconName,
    tag: nonEmpty,
    title: nonEmpty,
    description: nonEmpty,
    description2: nonEmpty.optional(),
    bullets: z.array(nonEmpty),
    pubs: z.array(featuredPubSchema),
    /** Publication tags that link papers to this area (plan 5). */
    matchTags: z.array(nonEmpty).min(1),
  })
  .strict();

export const researchAreasSchema = z.array(researchAreaSchema);

// ── People ──────────────────────────────────────────────────────────────────

export const personGroup = z.enum(['pi', 'phd', 'deng', 'undergrad', 'alumni']);

export const personSchema = z
  .object({
    slug,
    name: nonEmpty,
    group: personGroup,
    role: nonEmpty,
    /** Site-relative path under `public/`; the file must exist. */
    photo: z
      .string()
      .regex(/^\/images\/people\/[a-z0-9-]+\.jpg$/)
      .optional(),
    /** CSS object-position for the portrait crop. */
    cropPosition: nonEmpty.optional(),
    education: nonEmpty.optional(),
    degree: nonEmpty.optional(),
    startYear: year,
    endYear: year.optional(),
    bio: nonEmpty.optional(),
    shortBio: nonEmpty.optional(),
    /** Alumni only: where they went next. `null` while unknown. */
    outcome: nonEmpty.nullable().optional(),
    /** Full-name spellings used in `authorsList`, for matching publications to people. */
    authorAliases: z.array(nonEmpty).optional(),
    links: z
      .object({
        website: z.url().optional(),
        scholar: z.url().optional(),
        orcid: z.url().optional(),
        linkedin: z.url().optional(),
        github: z.url().optional(),
      })
      .strict()
      .optional(),
    // PI-only profile fields.
    title: nonEmpty.optional(),
    subtitle: nonEmpty.optional(),
    department: nonEmpty.optional(),
    email: z.email().optional(),
    degrees: z.record(z.string(), nonEmpty).optional(),
  })
  .strict()
  .refine((p) => p.endYear === undefined || p.endYear >= p.startYear, {
    message: 'endYear must not be before startYear',
  })
  .refine((p) => (p.group === 'alumni') === (p.endYear !== undefined), {
    message: 'alumni (and only alumni) have an endYear',
  });

export const collaboratorSchema = z
  .object({ name: nonEmpty, institution: nonEmpty, area: nonEmpty })
  .strict();

export const teamSchema = z
  .object({
    people: z.array(personSchema),
    /** Outside collaborators: never lab members, never marked in author lists. */
    collaborators: z.array(collaboratorSchema),
  })
  .strict();

// ── Funding ─────────────────────────────────────────────────────────────────

export const grantSchema = z
  .object({
    id: slug,
    /** Pending and not-funded grants stay in data but are never displayed. */
    status: z.enum(['active', 'completed', 'pending', 'not-funded']),
    title: nonEmpty,
    funder: nonEmpty,
    funderShort: nonEmpty,
    role: z.enum(['PI', 'Co-PI']),
    effortPct: z.number().int().min(1).max(100).optional(),
    /** USD, whole dollars. */
    amount: z.number().int().positive(),
    internal: z.boolean(),
    period: z.object({ start: isoMonthOrDay, end: isoMonthOrDay.optional() }).strict().optional(),
    description: nonEmpty.optional(),
    relatedPublications: z.array(slug).optional(),
  })
  .strict();

export const fundingSchema = z.object({ grants: z.array(grantSchema) }).strict();

// ── Talks and news ──────────────────────────────────────────────────────────

export const newsKind = z.enum([
  'invited-talk',
  'keynote',
  'press',
  'talk',
  'publication',
  'award',
  'funding',
  'lab',
]);

export const newsItemSchema = z
  .object({
    id: slug,
    /** Sortable ISO month or day. */
    date: isoMonthOrDay,
    /** Display override when the source date is not a month, e.g. "Spring 2026". */
    dateLabel: nonEmpty.optional(),
    kind: newsKind,
    title: nonEmpty,
    venue: nonEmpty.optional(),
    location: nonEmpty.optional(),
    virtual: z.boolean().optional(),
    speaker: nonEmpty.optional(),
    description: nonEmpty.optional(),
    icon: iconName.optional(),
    link: href.nullable(),
  })
  .strict();

/** Invited talks and keynotes (the "Invited Talks" stat counts these). */
export const talksSchema = z
  .array(newsItemSchema)
  .refine((items) => items.every((t) => t.kind === 'invited-talk' || t.kind === 'keynote'), {
    message: 'talks.json holds only invited-talk and keynote items',
  });

/** Press, awards and other lab news (the "Media & Recent News" cards). */
export const newsSchema = z.array(newsItemSchema);

// ── Join (recruiting) ───────────────────────────────────────────────────────

/** Content not yet confirmed by Dr. Schelble: shown with a "Draft" tag on previews, hidden in production. */
const draft = z.boolean().optional();

export const joinSchema = z
  .object({
    roles: z.array(
      z
        .object({ id: slug, icon: iconName, title: nonEmpty, desc: nonEmpty, req: nonEmpty, draft })
        .strict(),
    ),
    lookingFor: z.object({ intro: nonEmpty, backgrounds: z.array(nonEmpty).min(1) }).strict(),
    steps: z.array(z.object({ title: nonEmpty, body: nonEmpty, draft }).strict()).min(1),
    faq: z.array(z.object({ q: nonEmpty, a: nonEmpty, draft }).strict()),
  })
  .strict();

export type Publication = z.infer<typeof publicationSchema>;
export type PaperType = z.infer<typeof paperType>;
export type ResearchArea = z.infer<typeof researchAreaSchema>;
export type FeaturedPub = z.infer<typeof featuredPubSchema>;
export type Person = z.infer<typeof personSchema>;
export type PersonGroup = z.infer<typeof personGroup>;
export type Collaborator = z.infer<typeof collaboratorSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Grant = z.infer<typeof grantSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type NewsKind = z.infer<typeof newsKind>;
export type Join = z.infer<typeof joinSchema>;
