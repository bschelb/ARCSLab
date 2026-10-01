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
