# ARCS Lab migration: progress log

Hand-off log for `NEXTJS_VERCEL_MIGRATION_PLAN.md`. Every phase appends an entry under
"Phase log". Decision changes go under "Decisions" before the phase they affect.

---

## Decisions

All section 1 decisions were confirmed by Dr. Schelble on 1 October 2026 and are current.

| # | Decision | Current choice |
|---|---|---|
| D1 | Framework | Next.js 16 App Router, React 19, TypeScript strict |
| D2 | Styling | Tailwind CSS v4; existing tokens in `@theme` plus a small motif layer |
| D3 | Rendering | Every public page prerendered at build; no runtime data fetching |
| D4 | Hosting | Vercel Git integration, Root Directory `web/`, preview per branch |
| D5 | Vercel plan | Hobby (free) tier |
| D6 | Contact form | Existing Formspree endpoint (`xvzwzoal`), submitted with `fetch` |
| D7 | Paper management | Git workflow: edit JSON, add PDF, PR, review preview, merge |
| D8 | Brand colors | Official UT palette: Tennessee Orange `#FF8200`, White, Smokey `#58595B`, Smokey X `#333333` for text; `--orange-text` `#b84600` for orange text on light. Rules in plan 4.2 |
| D9 | Navigation | Research, Publications, Team, PI, Funding, News & Talks, Join; Contact as the button (applied in Phase 5) |
| D10 | New pages | `/join`, `/research/<area>`, `/team/<person>` |
| D11 | Dark mode | Not added |
| D12 | Analytics | Vercel Web Analytics and Speed Insights |
| D13 | Working copy | `~/dev/ARCSLab` on the MacBook Air, outside OneDrive |

| D14 | Design identity | **Pending Dr. Schelble's choice (1 Oct 2026).** He asked that the site be built in React (it is: React 19 via Next.js 16; every page and component is a React component) and that the design be upgraded and clearly distinct from beauschelble.com. That overrides plan 2.3's "preserve the Two intelligences concept": the personal site uses the same Fraunces/grotesk/Plex Mono trio, a human/AI node canvas, a grid background and the same Reveal and count-up patterns. After a review of 20 award-winning and research sites, three directions were proposed (A Technical Drawing, recommended; B Research Report; C Contour) at https://claude.ai/artifact/Tqt7RZztoDUojMyeHqMvRA. Phase 3 waits on this choice. What stays fixed under any direction: URLs, the SEO graph, the PDF reader, group framing, no emoji, reduced motion, WCAG 2.2 AA, the D8 UT palette. |

Still needed from Dr. Schelble before Phase 5: current recruiting status (open or closed, and
for which term), and optional answers for the Join page FAQ.

### Rollback reference: DNS as of 1 October 2026 (pre-cutover)

Captured with `dig` on 1 Oct 2026. Nameservers: `finley.ns.cloudflare.com`,
`mariah.ns.cloudflare.com` (Cloudflare, proxying off).

| Name | Type | Value | TTL |
|---|---|---|---|
| `arcslab.io` | A | `185.199.108.153` | 300 |
| `arcslab.io` | A | `185.199.109.153` | 300 |
| `arcslab.io` | A | `185.199.110.153` | 300 |
| `arcslab.io` | A | `185.199.111.153` | 300 |
| `arcslab.io` | AAAA | none | |
| `arcslab.io` | TXT | `google-site-verification=NskZzjwj44GgFENK-I8Jm6Y9Jicunsjk5BjsC-67ai0` (keep) | |
| `arcslab.io` | MX | none | |
| `www.arcslab.io` | CNAME | `bschelb.github.io.` | 300 |

The TTLs already read 300 s (Cloudflare "Auto"), so runbook step 2 may need no change.
Phase 7 re-checks this.

---

## Phase log

### Phase 0: Preparation and baseline (1 October 2026)

**Summary.** Created branch `migrate/nextjs` from `main` @ `0973763` in the new working copy
`~/dev/ARCSLab`, and captured the production baseline that later phases diff against.

- Working copy: cloned to `~/dev/ARCSLab`. `setup-macbook-air.sh` then confirmed the tools
  (git 2.50.1, Node 24.15.0, gh logged in, Claude Code), copied in the plan, `CLAUDE.md`,
  `README.txt` and `.claude/`, and cloned the personal site to `~/dev/beauschelble-com`
  (`2f3856e`, 1 Oct 2026).
- `astro-site` builds cleanly off OneDrive: `npm ci && npm run build` makes 57 pages in about 0.5 s.
- `migration/url-inventory.txt` lists 117 paths:
  - 57 HTML routes (8 site pages and 49 `/papers/<id>`);
  - 2 generated sitemaps (`/sitemap-index.xml`, `/sitemap-0.xml`);
  - 58 static files from `astro-site/public`: 42 PDFs, 9 files under `/assets/`, the OG
    image, 3 under `/pdfjs/`, `robots.txt`, `site.webmanifest` and `CNAME`.
- Cross-check: the 57 build routes are identical to the live `sitemap-0.xml`.
- `migration/scripts/capture-seo.mjs` (zero dependencies) writes `migration/seo-baseline.json`
  covering all 57 routes, every one HTTP 200. Per route it records:
  - title, description, robots, keywords, author, theme-color;
  - canonical and other `<link rel>` targets;
  - `og:*`/`article:*`, `twitter:*`, `citation_*` and `dc.*` tags, with repeated names as arrays;
  - parsed JSON-LD.
  Keys are sorted, and two consecutive runs produced byte-identical files. Phase 4's
  `check-parity.mjs` should import `extractSeo()` from this script, so both sides are parsed
  the same way.
- `migration/scripts/capture-screens.mjs` captured 114 full-page screenshots (57 routes at
  390 and 1440 px) with Playwright 1.63.0 Chromium, using `reducedMotion: 'reduce'` so
  reveals, counters and the canvas settle to their final state.
- `migration/scripts/capture-lighthouse.mjs` ran mobile Lighthouse 13.5.0, three runs per
  route; the run with the median performance score is kept. Screenshots and Lighthouse JSON
  are in `migration/baseline/` (gitignored).
- `migration/package.json` holds the baseline tooling (`playwright`, `lighthouse`). It is
  separate from the future `web/` app and is deleted in Phase 8.

**Verification.**

- Spot-checked `/`, `/pi` and `/papers/flathmann-2023-ai-teammate-etiquette` by hand against
  the raw HTML. The title, canonical, count of og/twitter/citation/dc tags (13, 13 and 37) and
  count of JSON-LD blocks (1, 3 and 3) all match the baseline.
- Viewed screenshots of `/` (390 px) and the paper page (1440 px). Both rendered fully, with
  the PDF reader showing page 1.

**Lighthouse baseline (production, mobile, median of 3, 1 Oct 2026).**

| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | Page weight |
|---|---|---|---|---|---|---|---|---|
| `/` | 93 | 93 | 100 | 100 | 3.2 s | 0 | 0 ms | 331 KB |
| `/publications` | 93 | 92 | 100 | 100 | 3.2 s | 0 | 0 ms | 331 KB |
| `/papers/schelble-2022-lets-think-together` | 99 | 92 | 100 | 100 | 1.8 s | 0 | 0 ms | 1272 KB |
| `/team` | 75 | 96 | 100 | 100 | 21.5 s | 0.007 | 0 ms | 8425 KB |
| `/contact` | 77 | 93 | 100 | 100 | 6.5 s | 0 | 0 ms | 782 KB |

`/team` confirms finding F1: the PI portrait (3.5 MB) and one student headshot (4.0 MB)
dominate its 8.4 MB and 21.5 s LCP. `/contact`'s LCP includes the Google Maps iframe (F9).

**Counts.**

- Publications: 49 (26 journal, 17 conference, 3 book chapter, 3 workshop), matching CLAUDE.md.
- PDFs: 42 on disk and 42 publications with `pdf` set.

**Deviations, surprises and plan/code conflicts.**

1. **Home canonical has a trailing slash.** Pages emit `https://arcslab.io/`, but the
   sitemap `<loc>` is `https://arcslab.io` with no slash. Every other canonical is extensionless
   with no trailing slash. Phase 4 must keep `https://arcslab.io/` as the home canonical and
   in the JSON-LD `@id`s. The sitemap difference is harmless.
2. **The paper reader already has a partial toolbar** in production: zoom −/+, a percentage,
   "Fit width" and "Open in new tab". Plan 3.5 lists these as new. The code wins on facts:
   Phase 4 ports these controls and adds the page count, download button and text layer.
3. **Finding F14 does not reproduce in a fresh clone.** The OneDrive conflict copies were in
   the old OneDrive `dist/`; the clean clone has none.
4. **The unused hero photo is 15 MB** on disk (`astro-site/public/assets/downtownPic.jpg`),
   not 16 MB as in F1. It is still dropped in Phase 2.
5. **The personal site has two copies.** `~/Desktop/Personal_Website` is stale (`036de7c`,
   17 Sep 2026). `~/dev/beauschelble-com` is current (`2f3856e`, 1 Oct 2026), and later
   phases use only that one.
6. **`README.txt` is a legacy note** about the pre-Astro root `assets/` folder. The setup
   script copies it into the clone, where it stays gitignored. It holds no migration context.
7. **The setup script left a stale backup** at `NEXTJS_VERCEL_MIGRATION_PLAN.md.bak-20261001-191842`:
   a mid-edit copy of the plan that differed only in setup instructions. It is gitignored
   through `*.bak-*`.

**Open questions for Dr. Schelble.** None block Phase 1. Recruiting status and Join FAQ
answers are needed before Phase 5.

### Phase 1: Scaffold, tooling, CI and Vercel project (1 October 2026)

**Summary.** `web/` now holds an empty Next.js 16 app with the full toolchain:
- scaffolded with `create-next-app@16.3.8` (TypeScript, Tailwind, ESLint, App Router, no
  `src/`, `@/*` alias, npm, with its `AGENTS.md`);
- a placeholder home page reading "ARCS Lab — migration in progress";
- CI on GitHub Actions, Dependabot, and the Vercel ignore step.

CI run `36941498105` is green.

**Exact installed versions.**

| Package | Version | Package | Version |
|---|---|---|---|
| next | 16.3.8 | eslint | 9.39.5 |
| react, react-dom | 19.2.8 | eslint-config-next | 16.3.8 |
| typescript | 5.9.3 | prettier | 3.9.9 |
| tailwindcss, @tailwindcss/postcss | 4.3.3 | prettier-plugin-tailwindcss | 0.8.1 |
| zod | 4.6.5 | vitest | 5.0.3 |
| @vercel/analytics | 2.0.1 | @playwright/test | 1.63.0 |
| @vercel/speed-insights | 2.0.0 | @axe-core/playwright | 4.13.0 |
| pdfjs-dist | 6.3.289 | @lhci/cli | 0.15.1 |
| @types/node | 24.19.1 | Node (local, `.nvmrc`, `engines`) | 24.15.0 / `24` / `>=24 <25` |

**Config decisions.**

- **TypeScript stays on 5.9.3** (`~5.9.3`) although `typescript@latest` is 7.0.2. The plan
  pins 5.x, and the TS 7 native compiler is a new major.
- **ESLint stays on 9.39.5** although 10.11.0 is out. `eslint-config-next` 16.3.8 depends on
  plugins (react 7.37, jsx-a11y 6.10, import 2.32) that still target ESLint 9.
- **Fonts.** next/font exposes `--font-fraunces`, `--font-space-grotesk` and
  `--font-plex-mono`. `@theme inline` maps them to `--font-serif`, `--font-sans` and
  `--font-mono`, which avoids a self-referencing variable now that Tailwind owns `--font-*`.
  Weights and styles match the Astro Google Fonts URL: Fraunces opsz with italics, Space
  Grotesk variable, Plex Mono 400/500 with italics.
- **`next.config.ts`:**
  - `poweredByHeader: false` and `trailingSlash: false`;
  - images: AVIF/WebP formats, `qualities: [75]`;
  - `headers()` with the plan 3.9 set. HSTS has no `preload`. The CSP is report-only and
    adds `'unsafe-eval'` only under `next dev`, as the bundled CSP guide requires;
  - PDF headers on `/papers/:file([^/]+\.pdf)`: `application/pdf`, `inline`, one-hour cache;
  - `redirects()`: `/index.html` → `/`, `/:path(.+)\.html` → `/:path`, and both Astro
    sitemaps → `/sitemap.xml`, all as 308s.
- **The PDF.js copy also writes `/pdfjs/SOURCE.txt`**, because that path is in
  `url-inventory.txt`.
- **Scripts:** `typecheck` is `next typegen && tsc --noEmit`, so the `LayoutProps` and
  `PageProps` globals exist in CI before any build. `prebuild` runs `copy:pdfjs` and then
  `validate:data`.
- **Vitest config is `vitest.config.mts`.** Vite 8 warns about ESM in a `.ts` config when the
  package has no `"type": "module"`.
- **Playwright** has three projects. It reads `PLAYWRIGHT_BASE_URL`, falling back to
  `npm run start` locally. When `VERCEL_AUTOMATION_BYPASS_SECRET` is set, it sends
  `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie`.
- **Ignored Build Step** is in `web/vercel.json`: `ignoreCommand: git diff --quiet HEAD^ HEAD -- .`.
  Vercel's vercel.json docs (checked 1 Oct 2026) say the file lives in the project's root
  directory and that exit 0 skips the build.
- **Action versions:** CI uses `actions/checkout@v7` and `actions/setup-node@v7`, the latest
  releases. Node comes from `web/.nvmrc`, and the npm cache is keyed on `web/package-lock.json`.

**Verification.**

- Locally: `lint`, `typecheck`, `test` (4 unit tests on the headers and redirects config) and
  `build` all pass.
- Against `next start`: `curl -I` shows every security header and no `X-Powered-By`.
  `/papers/x.html` → 308 `/papers/x`, `/index.html` → 308 `/`, `/sitemap-0.xml` → 308
  `/sitemap.xml`, and `/pdfjs/pdf.min.mjs` → 200 `application/javascript`.
- The Playwright smoke test (home renders with `noindex`; `.html` redirect is a 308) passes in
  Chromium, WebKit and Firefox.

**Vercel status.** No Vercel project is connected yet: the commit has no Vercel status, and
the only GitHub deployments are `github-pages`.

**Deviations and notes.**

- **Main will fail on Vercel until cutover.** Once the project is imported with Root
  Directory `web` and production branch `main`, production deploys from `main` fail, because
  `main` has no `web/` until Phase 7. This is harmless while DNS points at GitHub Pages.
  Previews from `migrate/nextjs` work normally.
- **`web/CLAUDE.md` is not committed.** create-next-app generated it containing only
  `@AGENTS.md`, and the root `.gitignore` ignores every `CLAUDE.md`. `AGENTS.md` is committed.

### Phase 2: Data layer, libraries and assets (1 October 2026)

**Summary.** All content and logic are ported into `web/` with typed, validated data. The
parity tests prove the outputs match both the Astro libs and production. CI run
`36943011222` is green.

**Data (`web/data/*.json`, written by `scripts/migrate-data.mjs`).**

- 49 publications, 6 research areas, 14 people plus 12 collaborators, 8 grants (5 active,
  3 pending), 10 talks, 18 news items.
- The script asserts that every original string or number survives, either verbatim or as
  one of 96 logged transformations:
  - **publications:** `"In Press"` → `status: "in-press"` (1).
  - **research:** emoji → icon names, using the `iconMap` in `research.astro` (6).
  - **team:**
    - photos → `/images/people/<slug>.jpg` (4);
    - `tenure` → `startYear`/`endYear` (10);
    - the PI's hand-typed `stats` (`49+`, `$2.8M`, `5`, `10`) removed. They are now
      computed, and tests assert the computed values equal the old ones.
  - **funding:**
    - `amount` strings → integers (8);
    - `piRole` → `role` + `effortPct` (8);
    - status strings → `status` + `internal` (8);
    - `totalAwardedAsPI` removed (computed).
  - **talks and news:** month strings → ISO `YYYY-MM` (27); media `tag` → `kind` (18).
- **Schema refinements against the plan 5 sketch:**
  - `NewsItem.kind` adds `talk`, `publication`, `funding` and `lab`, because the media items
    use those tags.
  - Talks and news are separate files (`talks.json` holds only `invited-talk` and `keynote`,
    so the "Invited Talks" stat is its length). `lib/news.ts` merges them.
  - `Person` gains PI-only fields (`title`, `subtitle`, `department`, `email`, `degrees`).
    Link keys are renamed (`personalWebsite` → `website`, `googleScholar` → `scholar`).
  - Research `pubs` gain `paperId`.
- **No clean month for "Spring 2026"** (a Tennessee Engineer article). It is stored as
  `date: "2026-04"` with `dateLabel: "Spring 2026"`, so it displays as written and keeps its
  current position in the list. This is the only date without a month.
- **Start years for the PI and PhD students**, who have no `tenure` in the Astro data, come
  from CLAUDE.md: Mendoza 2025, Tian 2025, Nagaraju 2026. The PI is 2024, when the lab was
  founded.
- **`funderShort` labels and the grant `id` slugs** follow the CLAUDE.md funding table.
- **Research `matchTags` are a first mapping**, drawn from each area's description and
  bullets. Every publication matches at least one area. Only Phase 5's area pages use them;
  please review.
- **One research featured pub has an abbreviated title** ("A Comparative Evaluation of Ad
  Hoc Team Performance in Modern Collaborative Technology"). It maps to
  `schelble-2024-ad-hoc-teams` through an explicit override; the other 17 match by title.
- **`site.recruiting = { open: true }`**, from the current copy ("We admit PhD students …
  and are actively recruiting"). `term` and `note` wait for Dr. Schelble.

**Libraries (`web/lib/`).**

- **`schemas.ts`:** Zod 4 schemas, with types inferred from them.
- **`data.ts`:** parses every file when imported, so the build fails on bad data.
- **`validate.ts` and `scripts/validate-data.ts`** (run through `tsx` in `prebuild`):
  - errors: schema violations, duplicates, a missing PDF, `pdf` ≠ `<id>.pdf`, a missing photo,
    an `authorsList` length that differs from the display author count, a dangling paper
    reference, emoji (`\p{Extended_Pictographic}`), a person listed as both member and
    collaborator;
  - warnings: an unreferenced PDF, a publication matching no research area, a member with no
    author alias. Ten warnings today, all for members with no publications.
- **`papers.ts` and `seo.ts`** are ported. `markLabMembers` returns `{text, isLabMember}[]`
  segments, so components never need `dangerouslySetInnerHTML`.
- **New helpers:**
  - `funding.ts`: `piTotal` = $2,802,201; pending and not-funded grants are hidden;
  - `people.ts`: alias matching, `profileHref` (the PI → `/pi`), monograms;
  - `news.ts`: stable ISO sort and the merged timeline;
  - `format.ts`: `Jul 2026` and `July 2026` styles, USD, tenure;
  - `stats.ts`: every headline number, computed from data.

**Tests: 331 Vitest tests.**

- **Parity:** for all 49 papers, `toBibtex`, `citationMetaTags`, `scholarlyArticleNode` and
  `getRelated` match the Astro functions (imported from `astro-site/src/lib`). Citation and
  DC tags, ScholarlyArticle, the site graph, ProfilePage and all 56 breadcrumb lists also
  deep-equal `migration/seo-baseline.json`. That covers Phase 4's JSON-LD and citation
  parity ahead of time.
- **Mutation check:** altering one citation field failed 98 tests, and dropping one roster
  member failed 2, so the oracles do catch regressions.
- **Data tests:** funding totals, type counts (26/17/3/3), awards (5), talks (10),
  people-to-publication matching, legacy round-trips for tenure, date and amount strings,
  ISO order reproducing the curated order, and validation catching emoji, missing PDFs,
  duplicates, dangling ids and bad author counts.

**Assets (`scripts/optimize-images.mjs`, sharp, long edge ≤ 1600 px, quality 82).**

| File | Before | After | Size |
|---|---|---|---|
| `public/images/people/beau-schelble.jpg` | 3593 KB | 145 KB | 1066×1600 |
| `public/images/people/sarah-mendoza.jpg` | 4087 KB | 96 KB | 1065×1600 |
| `public/images/people/yayun-tian.jpg` | 410 KB | 374 KB | 1200×1600 |
| `public/images/people/naveena-nagaraju.jpg` | 204 KB | 206 KB | 1200×1600 |
| `app/icon.png` / `app/apple-icon.png` / `public/images/logo-nav.png` | 108 KB | 32 / 9 / 5 KB | 512 / 180 / 92 px |
| `public/assets/DSCF0563-Beaus-Workstation.jpg` (JSON-LD `Person.image`) | 3593 KB | 145 KB | 1066×1600 |
| `public/assets/Frame 3.png` (`Organization.logo`, `rel=icon`) | 108 KB | 32 KB | 512×512 |
| `public/assets/{apple-touch-icon,icon-192,icon-512}.png`, `public/og/arcs-lab-og.png` | | copied | |

- **PDFs:** 42 copied to `public/papers/`.
- **`downtownPic.jpg`** (15 MB, 6624×3860) is not carried over. A grep found no reference
  in `astro-site/`, the root HTML or `web/`. Phase 4 must handle its URL in
  `url-inventory.txt`, either with a 308 or as an intentional 404.
- **Headshot URLs:** the old `/assets/{sarah,yayun,naveena}Headshot.jpg` paths get 308s in
  Phase 4.
- **Two portraits stay large.** The Yayun (374 KB) and Naveena (206 KB) sources were already
  small, so re-encoding saved little. `next/image` serves resized AVIF/WebP, so neither file
  is delivered at that size.

**Deviations and notes.**

- **Type shims for the Astro libs.** TS 5.9 rejects a type predicate in the Astro `site.ts`
  that Astro's compiler allowed. It is fixed in `web/lib/site.ts`; the Astro copy is
  untouched. The tests import the Astro libs through an `@legacy` alias: Vitest resolves the
  real files, while `tsc` sees `tests/legacy/*.d.ts`.
- **CI now installs `astro-site/` dependencies**, because Vite reads the Astro tsconfig when
  it transforms those imports. Phase 8 removes both this step and the parity tests that need
  `astro-site/`.
- **New dev dependencies:** `sharp` 0.35.5 and `tsx` 4.23.15.
- **Phase 3 is blocked on D14.** The plan's "faithful port" would reproduce the design that
  overlaps the personal site, so Phase 3 now builds the chosen direction instead.
