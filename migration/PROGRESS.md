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

| D14 | Design identity | **C · Contour**, chosen by Dr. Schelble on 1 Oct 2026 (options page: https://claude.ai/artifact/Tqt7RZztoDUojMyeHqMvRA). The site is React 19 via Next.js 16. The design is distinct from beauschelble.com: it drops the Fraunces/Space Grotesk/Plex Mono trio, the node canvas and the "Two intelligences" serif/mono framing, overriding plan 2.3 on those points. Specifics: <br>• **Type:** Big Shoulders (display and numerals, uppercase), Public Sans (body), JetBrains Mono (coordinates and labels). <br>• **Color:** ink grounds with Tennessee Orange; light paper reading sections; UT palette per D8. <br>• **Hero:** animated contour lines generated from real elevation data for East Tennessee: the Great Smokies, the Valley & Ridge past Hardin Valley, Walden Ridge, and the Cumberland Plateau and Crab Orchard Mountains. The lines shift dynamically, but the regional pattern stays recognizable. <br>• **Headline:** "HUMANS AND AI, ENGINEERED TO THINK AS **ONE TEAM.**" in Big Shoulders, with "ONE TEAM." on a Tennessee Orange block, from the screenshot Dr. Schelble supplied. <br>• **Research:** technical-drawing team-topology figures from option A illustrate the research page. <br>Unchanged: URLs, the SEO graph, the PDF reader, group framing, no emoji, reduced motion, WCAG 2.2 AA. |

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

### Phase 3: Design system, layout and page port (1–2 October 2026)

**Summary.** Every existing page is rebuilt in React 19 / Next 16 in the D14 "Contour"
identity, with content copied verbatim from the `.astro` sources and the P0 fixes applied.
Routes: `/`, `/research`, `/publications`, `/team`, `/pi`, `/funding`, `/talks`, `/contact`,
and the 404 page, all statically prerendered.

**Scope change (D14).** The plan called Phase 3 a faithful visual port. Dr. Schelble instead
chose a new, distinct identity, so this phase ports content and structure faithfully into the
new design. The screenshot comparison against `migration/baseline/screens` therefore differs
on every page by design. The only differences are the D14 visual language plus the changes
listed below.

**Design system.**

- **Tokens** in `app/globals.css` `@theme`:
  - official UT palette (D8): Tennessee Orange `#FF8200`, `--orange-text` `#b84600`, Smokey
    `#58595B`, Smokey X `#333333` for text;
  - ink `#14100b` for dark grounds;
  - neutral warm-gray paper: `--paper` `#f4f3f1`, `--paper-2` `#eeece8`. `paper-2` is
    lightened from `#eae8e4`, where orange text measured only 4.38:1;
  - lines `#d8d5cf` / `#b9b5ad`;
  - fluid type scale, `--section-y`, and motion tokens (160/240/400 ms, one curve).
- **`tests/unit/contrast.test.ts`** reads the tokens from the CSS and checks 18 text and UI
  pairs (all pass). Examples: text on paper 11.39:1, orange-text on paper 4.84:1 and on
  paper-2 4.55:1, Smokey X on orange 5.08:1, ink on orange 7.62:1.
- **Fonts** via next/font: Big Shoulders (display, numerals, uppercase), Public Sans (body),
  JetBrains Mono (labels and coordinates). Big Shoulders has no automatic fallback metrics, so
  an explicit fallback stack is set.
- **Signature emphasis:** `.mark-block`, an orange block behind the words (from Dr.
  Schelble's screenshot). It is used in the hero, page headers and the PI name. It is
  `inline-block` with its own line box, so the fill never covers the line above.
- **Icons:** the Icon set is ported verbatim from `Icon.astro` (34 icons) as JSX data in
  `lib/icon-paths.ts`, with no `innerHTML`.

**Components.**

- **`SiteNav`:**
  - fixed ink bar with the current nav items;
  - `aria-current` marks the active page;
  - mobile full-height sheet with `aria-expanded`/`aria-controls`, a focus trap, Escape to
    close (focus returns to the toggle), body scroll lock, and closing on navigation.
- **Other layout pieces:** `SiteFooter`, `SkipLink`, `PageHeader`.
- **`TerrainContours`** draws the real East Tennessee heightmap:
  - marching squares over 40 power-spaced levels, with a slow uphill phase plus a ±16 m
    noise "breath";
  - survey marks at Clingmans Dome, Mt. Le Conte, Hardin Valley, Oak Ridge, the Crab Orchard
    Mountains and the ARCS Lab;
  - pauses when off-screen or the tab is hidden; device pixel ratio capped at 2; a single
    still frame under reduced motion; `aria-hidden`.
  - It animates in the home hero, and draws still crops in page headers, the PI panel, the
    footer and the 404 page.
- **`TechFigure`** renders six technical-drawing team topologies, one per research area
  (option A's figure, as Dr. Schelble asked), with orange signals on the routes. Each is SVG
  with `role="img"` and descriptive alt text, and its signals are static under reduced motion.
- **`PersonCard`** is one design for all groups. Members without a photo get a monogram
  (16:9 tile).
- **`Authors`** marks every lab member with the same orange dot, PI included, with a visually
  hidden "(ARCS Lab member)".
- **`Motion`** is one island for reveals and count-ups. Only elements below the fold at load
  are hidden; content and final stat values are always in the HTML.
- **`PublicationFilters`** uses `aria-pressed` and a polite live count.
- **`JsonLd`** emits the site graph from the root layout; breadcrumbs and ProfilePage JSON-LD
  are emitted per page.

**P0 fixes delivered.**

- skip link, visible focus, one `h1` per page, landmarks (`main#main`);
- the mobile sheet behavior above;
- 404 page;
- hero canvas pause, device-pixel-ratio cap and reduced motion;
- home publication rows link to `/papers/<id>` (the route arrives in Phase 4);
- home research cards link to `/research#<slug>` (by position), and home student cards link
  to `/team#<slug>`;
- one PersonCard design; collaborators kept separate (ink section);
- `/pi` stats rendered on the server and computed from data (F5, F6); the bio's
  "$2,802,201" now also comes from data;
- `next/image` for every portrait;
- the sponsor band keeps text wordmarks.

**Intentional differences beyond the redesign (all logged here).**

1. **Contact map:** the Google Maps iframe is replaced by an address card with an "Open in
   Google Maps" link. This P1 item was pulled forward because the iframe loaded third-party
   scripts and conflicts with the planned `frame-src 'none'` CSP. The form itself is
   unchanged and still posts to Formspree (`xvzwzoal`). Required fields are now marked in
   text, and inputs have `autocomplete`.
2. **New copy (two small additions):**
   - the hero caption "35.9544° N / 83.9295° W · Terrain · Great Smoky Mountains to the
     Cumberland Plateau · USGS 3DEP" (data attribution, and coordinates the footer already
     showed);
   - the 404 page copy ("404 · Off the map", "This page is not here.", "The address may have
     changed or never existed. These sections will get you back on course.").
3. **Hero headline:** set uppercase in CSS (the source text is unchanged), with "one team."
   on the orange block, per Dr. Schelble's screenshot.
4. **Team page:** the PI card gains a "Full PI profile →" link to `/pi`.
5. **Research page:** representative publications link to their paper pages where
   `paperId` exists (all 18 do).
6. **Talks page:** dates display from ISO data. They are identical to before ("July 2026",
   "Spring 2026").
7. **Lab-member mark:** a ★ before; now an orange dot (D14 comparison table).

**Verification.**

- `lint`, `typecheck` and `validate:data` pass; 350 unit tests pass (parity, data, contrast,
  config).
- Playwright: 54 tests pass across Chromium, WebKit and Firefox (axe runs in Chromium only).
  They cover:
  - axe with zero serious or critical violations on all 8 routes plus the 404 page, at
    390 px and 1440 px;
  - one `h1`, a main landmark and a skip link on every page;
  - the mobile sheet: focus, Escape, return focus, scroll lock, closing on navigation;
  - desktop `aria-current`;
  - filters: `aria-pressed`, the live count "26 of 49", award filter = 5;
  - 404 status;
  - the `.html` 308;
  - `noindex` before launch;
  - with JavaScript disabled: every page visible with nothing left reveal-hidden, PI stats
    `49 / $2.8M / 5 / 10`, the 6 home paper links, all 49 publications listed.
- axe initially flagged an invalid `dl` structure in the home contact block (now a list) and
  in-text links distinguished only by color. In-text links are now underlined site-wide.
- No horizontal overflow on any route at 390 or 1440 px. Every route was reviewed by
  screenshot at both widths.

**Lighthouse (mobile, local production build, median of 3).**

| Route | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | Weight |
|---|---|---|---|---|---|---|---|---|
| `/` | 95 | 100 | 96 | 66 | 2.9 s | 0 | 52 ms | 424 KB |
| `/publications` | 94 | 100 | 96 | 66 | 3.1 s | 0 | 1 ms | 403 KB |
| `/research` | 94 | 100 | 96 | 66 | 3.1 s | 0 | 7 ms | 405 KB |
| `/team` | 93 | 100 | 96 | 66 | 3.2 s | 0 | 50 ms | 520 KB |
| `/contact` | 98 | 100 | 96 | 66 | 2.4 s | 0 | 9 ms | 389 KB |

- SEO 66 is the deliberate `noindex` of Phase 1; Phase 4 makes robots environment-aware.
- Best practices 96 is the local 404s for `/_vercel/insights` and `/_vercel/speed-insights`,
  which exist only on Vercel.
- `/team` LCP went from 21.5 s on production to 3.2 s.
- LCP is above the 2.0 s budget everywhere. That is a Phase 6 gate; the likely lever is the
  Big Shoulders font on the hero `h1`.

**Notes for later phases.**

- **Report-only CSP:** browsers ignore `upgrade-insecure-requests` while the policy is
  report-only (a console notice). It takes effect when Phase 6 enforces the CSP.
- **Paper links 404 until Phase 4:** the home, research and publication rows already link to
  `/papers/<id>`.
- **Nav labels:** "Join" and "News & Talks" arrive in Phase 5 (D9). The P1 items stay out of
  scope.
