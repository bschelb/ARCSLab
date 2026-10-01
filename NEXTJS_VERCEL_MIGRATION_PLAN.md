# ARCS Lab Website: Migration to Next.js on Vercel, with a Design and UX Upgrade

**Prepared:** 1 October 2026
**Owner:** Dr. Beau G. Schelble
**Executor:** Claude Code running Opus 5.5 at High effort, one phase per session
**Status:** Section 1 decisions confirmed by Dr. Schelble on 1 October 2026. Ready for Phase 0.
**Working copy:** `~/dev/ARCSLab` on the MacBook Air, outside OneDrive. The Phase 0 setup steps create it. OneDrive is used only to carry files between Macs.

---

## 0. How to use this document

This plan has two readers.

- **Dr. Schelble** makes the decisions in section 1 and does the account, billing and DNS
  steps. Those steps are marked **[YOU]** throughout.
- **The executing agent** treats sections 1 to 9 as the specification. Section 10 holds one
  ready-to-paste prompt per phase.

How to run a phase:

1. Open a fresh Claude Code session in the repository root.
2. Select Opus 5.5 with High effort.
3. Paste that phase's prompt from section 10 exactly as written.
4. When the session ends, read its report and the new entry in `migration/PROGRESS.md`.
5. Open the Vercel preview URL and click through the site before starting the next phase.

Working agreements that apply to every phase:

- All work happens on the branch `migrate/nextjs`. Nothing is pushed to `main` until Phase 7.
- `astro-site/` stays untouched and keeps serving production until cutover.
- `migration/PROGRESS.md` is the hand-off log between sessions. Every phase appends an entry.
- When this plan and the code disagree, the code wins on facts and this plan wins on intent.
  The agent records the conflict in the log.

---

## 1. Decisions at a glance

Every decision below is settled. A later change is recorded in `migration/PROGRESS.md`
under "Decisions" before the phase it affects.

| # | Decision | Choice | Why | Status |
|---|---|---|---|---|
| D1 | Framework | Next.js 16 App Router (16.3.x today), React 19, TypeScript strict | Same family as beauschelble.com; static prerendering keeps SEO strong | Locked |
| D2 | Styling | Tailwind CSS v4, existing tokens moved into `@theme`, plus a small layer for signature motifs | Matches the personal site; tokens carry over unchanged | Locked |
| D3 | Rendering | Every public page prerendered at build; no runtime data fetching | Content changes only through git, so nothing needs a server per request | Locked |
| D4 | Hosting | Vercel Git integration, project Root Directory `web/`, a preview deploy per branch | Previews, headers, redirects, image optimization, analytics | Locked |
| D5 | Vercel plan | Hobby (free) tier | Dr. Schelble confirmed the site is personal use and qualifies | Decided 1 Oct 2026 |
| D6 | Contact form | Keep the existing Formspree endpoint, submitted with `fetch` for inline success and error states | Zero new accounts. A Resend route like the personal site's needs sending-domain DNS records and an API key, so it moves to the backlog. | Decided |
| D7 | Paper management | Git workflow: edit JSON, add PDF, open a PR, review the preview, merge | Vercel's filesystem is read-only, so the personal site's admin panel only works locally. PR review suits several editors. | Decided |
| D8 | Brand colors | Official UT palette: Tennessee Orange `#FF8200`, White `#FFFFFF`, Smokey `#58595B` as the secondary accent, and Smokey X `#333333` for text. Full rules in section 4.2. | The current `#ff6600` is labeled "UTK orange" in the code but is not the official value. Values are from brand.utk.edu/colors, checked 1 Oct 2026. | Decided 1 Oct 2026 |
| D9 | Navigation | Research, Publications, Team, PI, Funding, News & Talks, Join, with Contact as the button. The PI keeps a dedicated page at `/pi` and its own top-level nav item. | Dr. Schelble asked to keep a dedicated PI page. Join is added because recruiting has no page today. | Decided 1 Oct 2026 |
| D10 | New pages | Add `/join`, `/research/<area>`, and `/team/<person>` | Give prospective students, program officers and students' future employers a page each | Decided |
| D11 | Dark mode | Not added | The design already alternates paper and ink sections. A full dark theme doubles visual QA for little gain. | Decided |
| D12 | Analytics | Vercel Web Analytics and Speed Insights | No cookies, so no consent banner; same as the personal site | Decided |
| D13 | Working copy location | `~/dev/ARCSLab` on the MacBook Air, outside OneDrive | See finding F14. The migration runs from the Air. | Decided 1 Oct 2026 |

---

## 2. Current-state audit

### 2.1 What exists today

- Astro 5 static site in `astro-site/`, deployed by `.github/workflows/deploy.yml` to GitHub Pages.
- Domain `arcslab.io` is on Cloudflare DNS with proxying off. The apex has four GitHub Pages A
  records. `www` is a CNAME to `bschelb.github.io`. A `google-site-verification` TXT record
  exists and must be kept. There are no MX records, so email is unaffected.
- Eight pages (`index`, `research`, `publications`, `team`, `pi`, `funding`, `talks`,
  `contact`) plus 49 generated `/papers/<id>` pages.
- Content lives in `src/data/*.json`. Forty-two author-version PDFs live in `public/papers/`.
  PDF.js 6.1.200 is vendored in `public/pdfjs/`.
- SEO is strong. It has an Organization-centric JSON-LD graph, Google Scholar `citation_*`
  tags, BreadcrumbList, a sitemap, a manifest and an OG image.
- The personal site, cloned read-only to `~/dev/beauschelble-com` by the setup script (GitHub `bschelb/beauschelble-com`), runs
  Next.js 15, React 19, Tailwind v4 and Vercel Analytics. Its `lib/seo.ts`, `JsonLd`,
  `Reveal`, `NavBar`, `PublicationsExplorer`, `BibtexButton`, `sitemap.ts`, `robots.ts`,
  `opengraph-image.tsx` and `llms.txt/route.ts` are the reference implementations to adapt.

### 2.2 Findings

| ID | Area | Finding | Evidence | Fixed in |
|---|---|---|---|---|
| F1 | Performance | Very large images are shipped. An unused 16 MB, 6624×3860 photo sits in public assets. The PI portrait is 3.7 MB at 3333×5000. One student headshot is 4.2 MB at 2768×4160. A 1776 px logo PNG is used as a 40 px nav mark and favicon. | `public/assets/` | Phase 2, 3 |
| F2 | Accessibility | The primary button is white text on `#ff6600`, a 2.94:1 contrast ratio. AA requires 4.5:1. | `global.css` `.btn` | Phase 3 |
| F3 | Accessibility | `--orange-deep` (`#cc4f00`) on the paper background is 4.22:1. CLAUDE.md prescribes it for orange text, but it fails AA at body size. `#b84600` passes on both light backgrounds. | Contrast calculation | Phase 3 |
| F4 | Accessibility | There is no skip link and no `:focus-visible` style. The mobile menu has no Escape key handling or focus management. Filter buttons have no pressed state for screen readers, and result counts are not announced. | `BaseLayout.astro`, `publications.astro` | Phase 3, 5 |
| F5 | SEO and no-JS | The `/pi` stat counters render "0" in the HTML and count up only in JavaScript. Crawlers, link previews and no-JS visitors see zeros. | `pi.astro` lines 180–183 | Phase 3 |
| F6 | Data drift | PI stats (49, $2.8M, 5, 10) and the funding total ("$2,802,201") are typed by hand rather than computed from data. | `pi.astro`, `funding.json` | Phase 2, 3 |
| F7 | UX dead ends | Home "Recent publications" rows are not links. All six research cards link to the top of `/research`. Student cards link to the top of `/team`. | `index.astro` | Phase 3 |
| F8 | Duplicate content | Two different "Join the ARCS Lab" sections exist, one at `/team#join` and one at `/contact#join`. Their copy has already drifted apart. | `team.astro`, `contact.astro` | Phase 5 |
| F9 | Contact | The form posts straight to Formspree, which sends the visitor off-site. It has no inline success or error state and no spam honeypot. A Google Maps iframe loads third-party scripts on every visit. | `contact.astro` | Phase 5 |
| F10 | Publications | Filtering covers only type and awards. There is no search and no year, topic or free-PDF filter. Filter state is not in the URL, so a filtered view cannot be shared. | `publications.astro` | Phase 5 |
| F11 | Data model | "In Press" is stored in the `award` field. Funding amounts are strings. Talk dates are free text such as "July 2026". `research.json` still carries emoji `icon` values. | `src/data/*.json` | Phase 2 |
| F12 | Missing pages | There is no 404 page. | `src/pages/` | Phase 3 |
| F13 | Platform limits | GitHub Pages cannot set response headers, so there are no security headers and no PDF `Content-Disposition`. It cannot do server redirects, image optimization or per-branch previews. Both `/research` and `/research.html` return 200. | `curl -I` | Phase 4 |
| F14 | Workspace | The repo sits inside OneDrive. `astro-site/dist/` already holds OneDrive conflict copies (`_astro 2`, `assets 2`, `og 2`). Syncing `node_modules` and `.next` causes churn and file-lock build failures. | `ls astro-site/dist` | Resolved by working from `~/dev/ARCSLab` on the MacBook Air |
| F15 | Agent context | `CLAUDE.md` is gitignored, so a fresh clone loses it. Claude Code memory is keyed to the folder path, so moving the clone drops the saved group-framing rule. | `.gitignore` | Phase 0 |

### 2.3 What must be preserved

- **The "Two intelligences, one team" design concept.** It covers serif, mono and grotesk
  voices, blueprint grids, corner-tick frames, section indices, status dots, count-up
  readouts and the human-AI network hero canvas.
- **Every public URL**, every canonical URL and every PDF URL. Google Scholar indexes
  `citation_pdf_url`.
- **The JSON-LD graph and Scholar `citation_*` tags**, with the same `@id` values.
- **The PDF.js canvas reader.** It works even when a visitor's browser is set to download
  PDFs.
- **Group framing.** In author lists, every current lab member gets the same mark, PI
  included. The site never singles out the PI in author lists.
- **No emoji anywhere** in UI or data. Icons come from the SVG icon set.
- **Reduced-motion support** everywhere.

---

## 3. Target architecture

### 3.1 Stack

Versions are current as of 1 October 2026. The agent re-checks with `npm view <pkg> version`
in Phase 1 and uses the latest stable release within each major.

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | 16.3.x |
| UI | `react`, `react-dom` | 19.x |
| Language | `typescript` | 5.x, strict |
| Styling | `tailwindcss`, `@tailwindcss/postcss` | 4.3.x |
| Validation | `zod` | 4.x |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` | 2.x |
| PDF reader | `pdfjs-dist`, copied into `public/pdfjs/` at build | 6.3.x |
| Lint and format | ESLint flat config with `eslint-config-next`, Prettier with `prettier-plugin-tailwindcss` | latest |
| Tests | `vitest`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli` | latest |
| Runtime | Node 24 LTS, pinned in `.nvmrc`, `engines` and the Vercel project setting | 24.x |

Deliberately left out: Framer Motion, Three.js, any CMS, any database, and any component kit.
CSS and small client islands cover every interaction this site needs. The personal site
also ships without them.

### 3.2 Rendering model

- Components are Server Components by default. Every route is prerendered.
- Dynamic routes (`/papers/[slug]`, `/research/[slug]`, `/team/[slug]`) export
  `generateStaticParams` and `dynamicParams = false`, so unknown slugs return 404.
- Client components exist only where interaction requires them. That means the nav toggle,
  `Reveal`, `CountUp`, `HeroNetwork`, `PublicationsExplorer`, `PdfReader`, `CopyCitation` and
  `ContactForm`. Each receives minimal serializable props.
- No `proxy.ts`, which was called middleware before Next 16. No `cacheComponents`. No route
  reads cookies or headers.

### 3.3 Repository layout

```
ARCSLab/
├─ web/                          # Next.js app, Vercel Root Directory
│  ├─ app/
│  │  ├─ layout.tsx  page.tsx  not-found.tsx  globals.css
│  │  ├─ research/page.tsx       research/[slug]/page.tsx
│  │  ├─ publications/page.tsx
│  │  ├─ papers/[slug]/page.tsx  papers/[slug]/opengraph-image.tsx
│  │  ├─ team/page.tsx           team/[slug]/page.tsx
│  │  ├─ pi/page.tsx  funding/page.tsx  talks/page.tsx  join/page.tsx  contact/page.tsx
│  │  ├─ sitemap.ts  robots.ts  manifest.ts  opengraph-image.tsx  icon.png  apple-icon.png
│  │  └─ llms.txt/route.ts
│  ├─ components/                # layout/, ui/, sections/, papers/, people/
│  ├─ data/                      # *.json content, validated at build
│  ├─ lib/                       # site, seo, schemas, papers, people, funding, news, format
│  ├─ public/                    # papers/*.pdf, images/, og/, pdfjs/ (generated, gitignored)
│  ├─ scripts/                   # copy-pdfjs, optimize-images, migrate-data, check-parity
│  ├─ tests/                     # unit/, e2e/
│  ├─ AGENTS.md                  # generated by create-next-app; points at bundled Next docs
│  └─ next.config.ts  tsconfig.json  eslint.config.mjs  playwright.config.ts
│     vitest.config.ts  lighthouserc.json  .nvmrc  README.md
├─ migration/                    # PROGRESS.md, url-inventory.txt, seo-baseline.json, scripts/
│  └─ baseline/                  # screenshots and Lighthouse JSON (gitignored)
├─ astro-site/                   # untouched until Phase 8
└─ .github/
   ├─ workflows/ci.yml           # new
   ├─ workflows/deploy.yml       # GitHub Pages; removed in Phase 8
   └─ dependabot.yml             # new
```

### 3.4 URL parity and redirects

Trailing slashes stay off. Canonicals stay extensionless with no trailing slash, exactly as
today.

| Current URL | New behavior |
|---|---|
| `/`, `/research`, `/publications`, `/team`, `/pi`, `/funding`, `/talks`, `/contact` | Same path, 200 |
| `/papers/<id>` | Same path, 200 |
| `/papers/<id>.pdf` | Same static file, 200 |
| Any `/<path>.html` | 308 to `/<path>`; `/index.html` goes to `/` |
| `/sitemap-index.xml`, `/sitemap-0.xml` | 308 to `/sitemap.xml` |
| `/team#join`, `/contact#join` | Fragments never reach the server. Keep a short section with `id="join"` on both pages that links to `/join`. |
| `/assets/<file>` | Keep the path for every retained image. Renamed files, such as `Frame 3.png`, get a 308 to the new path. |
| `/og/arcs-lab-og.png` | Keep the file so cached social previews do not break |
| `/pdfjs/*` | Keep the path |
| `www.arcslab.io/*` | 308 to the apex, set in the Vercel domain settings |
| New: `/join`, `/research/<slug>`, `/team/<slug>`, `/llms.txt` | 200, and listed in the sitemap |

### 3.5 PDFs and the reader

- PDFs stay at `web/public/papers/<id>.pdf`. Git stores identical files once, so copying
  them adds no repository size.
- `next.config.ts` sets these headers for `/papers/:file*.pdf`: `Content-Type: application/pdf`,
  `Content-Disposition: inline`, and a browser cache of one hour. The Vercel CDN cache is
  cleared on every deploy.
- `scripts/copy-pdfjs.mjs` runs before `dev` and `build`. It copies `pdf.min.mjs` and
  `pdf.worker.min.mjs` from the installed `pdfjs-dist` into `public/pdfjs/`, which is
  gitignored. Dependabot then keeps PDF.js patched instead of a hand-vendored copy going
  stale.
- `PdfReader` is a client component. It loads `/pdfjs/pdf.min.mjs` with a dynamic import
  that the bundler ignores, and it keeps today's lazy page-by-page canvas rendering.
- New in the reader:
  - A toolbar with page count, fit-width zoom, open in new tab, and download.
  - A PDF.js text layer, so text can be selected and read by screen readers. The canvas is
    marked `aria-hidden`.
  - A visible download link that is always present as a fallback.
- If the text layer proves unstable, the reader ships without it and the log records why.

### 3.6 Images

- `scripts/optimize-images.mjs` uses `sharp` to resize source photos to at most 1600 px on
  the long edge at quality 82. Output goes to `web/public/images/`.
- All raster images render through `next/image` with explicit `width`, `height`, `sizes`
  and `alt`. Portraits keep their `cropPosition` as `object-position`.
- The unused 16 MB photo is not carried over. The log records this.
- The logo becomes `app/icon.png` (512 px), `app/apple-icon.png` (180 px), and a 2× nav asset.
- Next 16 allows only quality 75 by default. Either use the default or list the qualities
  needed in `images.qualities`.

### 3.7 Fonts

- Load Fraunces (with the optical-size axis and italics), Space Grotesk and IBM Plex Mono
  through `next/font/google`. Next self-hosts them at build, so visitors make no request to
  Google. That helps privacy, helps performance, and simplifies the content security policy.
- Expose them as `--font-serif`, `--font-sans` and `--font-mono` and map those into Tailwind
  `@theme`.

### 3.8 SEO surface

- Port `lib/seo.ts` with identical output. That covers the site-wide `@graph` of
  Organization, Person and WebSite, ProfilePage on `/pi`, ScholarlyArticle on papers, and
  BreadcrumbList on subpages. JSON-LD is emitted through a `JsonLd` server component.
- Use the Metadata API. Set `metadataBase` and a title template, and give every page its own
  `alternates.canonical`. Paper pages put `citation_*` tags in `metadata.other`, following
  the personal site.
- Titles and descriptions match today's values unless a phase changes them on purpose. Any
  change is logged.
- Add these routes:
  - `sitemap.ts` for all pages, papers, research areas and people.
  - `robots.ts`.
  - `manifest.ts`.
  - Generated Open Graph images for the site default, each paper and each research area.
  - `llms.txt`, lab-centric, modeled on the personal site's.
- Keep the PI's `@id` and `sameAs` linking to beauschelble.com, so search engines join the
  two sites into one entity.

### 3.9 Security headers

Set these in `next.config.ts` `headers()` for all routes:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`. Do not add `preload` or
  submit to the preload list without **[YOU]** approval.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `X-Frame-Options: DENY`
- A Content-Security-Policy sent as `Content-Security-Policy-Report-Only` until Phase 6
  shows zero violations, then enforced. Starting point:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://formspree.io;
worker-src 'self' blob:;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self' https://formspree.io;
frame-ancestors 'none';
upgrade-insecure-requests
```

`'unsafe-inline'` for scripts is the documented trade-off for fully static Next pages. A
nonce-based policy would force every page to render dynamically. PDF.js 6 may need
`'wasm-unsafe-eval'` for some image decoders. Confirm it against all 42 PDFs in report-only
mode before enforcing.

### 3.10 CI/CD

- **Vercel**
  - Production deploys from `main`. Every other branch gets a preview.
  - Root Directory is `web`.
  - An Ignored Build Step skips deploys when nothing under `web/` changed.
- **GitHub Actions `ci.yml`, on pull requests and pushes**
  - `npm ci`, then `lint`, `typecheck`, `validate:data`, `test` and `build`.
  - Node 24, with the npm cache keyed on `web/package-lock.json`.
- **GitHub Actions on `deployment_status` for successful Vercel previews**
  - Playwright end-to-end tests, axe, and Lighthouse CI against the preview URL.
  - Vercel protects previews by default. The tests send the `x-vercel-protection-bypass`
    header with a "Protection Bypass for Automation" secret stored as the GitHub secret
    `VERCEL_AUTOMATION_BYPASS_SECRET`.
- **Dependabot** runs weekly for npm (grouped minor and patch updates) and for GitHub Actions.
- **[YOU]** Protect `main` by requiring CI to pass before merging.

### 3.11 Content workflow after migration

1. Edit a file in `web/data/`, add a PDF to `web/public/papers/`, or add a photo to
   `web/public/images/people/`.
2. Open a pull request.
3. Vercel posts a preview URL. CI validates the data and fails with a readable message on a
   bad edit.
4. Merge. Production updates in about a minute.

`web/README.md` documents this step by step for publications, people, talks, grants and
recruiting status.

---

## 4. Design and UX program

### 4.1 Principles and audiences

Evolve the existing system rather than replace it. Each audience has a top task, and its
landing page should answer that task above the fold on a phone.

| Audience | Top task | Landing page |
|---|---|---|
| Prospective PhD, DEng and undergraduate students | Learn whether the lab is recruiting, whether it fits, and how to apply | `/join` |
| Program officers and collaborators | Judge credibility: research areas, funded work, outputs, people | `/research/<area>`, `/funding` |
| Researchers | Find, read and cite a paper | `/publications`, `/papers/<id>` |
| Media and event organizers | See recent news and talks, then get in touch | `/talks`, `/contact` |
| Students' future employers and committees | See a student's work and role | `/team/<person>` |

### 4.2 Design system foundation (Phase 3)

**Color tokens (D8, the official UT palette)** go into `@theme`. The brand values come from
brand.utk.edu/colors, checked 1 October 2026. Every ratio below was measured. The Phase 3
contrast test must reproduce these ratios.

| Token | Value | Source | Use |
|---|---|---|---|
| `--orange` | `#FF8200` | Tennessee Orange, PMS 151 | Fills, marks, primary buttons, and accents and emphasis on dark sections (7.62:1 on ink). Never text on light backgrounds (2.34:1 on paper). |
| `--smokey` | `#58595B` | Smokey, Cool Gray 11 | The secondary accent on light sections: eyebrows and mono labels, section indices, rules, icons, tag outlines, and muted text (6.61:1 on paper, 6.01:1 on paper-2). On dark sections it is decorative only (2.70:1 on ink). |
| `--text`, `--text-strong` | `#333333` | Smokey X, UT's web color for paragraph text | Body text and headings on light (11.90:1 on paper). This replaces the near-black `#14100b` for text, because UT's guide says black is not a brand color for type. |
| `--text-muted` | `#58595B` | Smokey | Muted labels and metadata on light |
| `--white` | `#FFFFFF` | White | Text on dark sections and card surfaces |
| `--orange-text` | `#b84600` | Derived, not a UT color | Only where orange text must appear on light: headline emphasis phrases and link hover (5.06:1 on paper, 4.60:1 on paper-2). UT's guide notes that Tennessee Orange text on white fails AA. Keep `--orange-deep` as an alias so ported CSS still resolves. |
| `--ink` | `#14100b` | Existing design token | Stays the dark ground of the blueprint "mission briefing" sections and the footer. It is a background only, never used for type. |

Rules that follow from the measurements:

- **Primary buttons** use a Tennessee Orange fill with Smokey X text (5.08:1). The hover
  state uses an `--orange-text` fill with white text (5.37:1). White text on Tennessee
  Orange is not allowed (2.49:1).
- **Never place** orange on a Smokey fill (2.82:1) or Smokey text on ink (2.70:1).
- **Focus rings** use Smokey X or Smokey on light sections and Tennessee Orange on dark ones.
  Tennessee Orange on paper is 2.34:1, below the 3:1 required for non-text contrast.
- **The hero canvas** keeps orange pulses for information sharing. Human and AI nodes stay
  white tints on ink. Smokey may be used there only as a decorative tone.
- **The neutral backgrounds and lines** (`--paper`, `--paper-2`, `--line`, `--line-strong`)
  are warm beiges today. Retune them toward a neutral warm-gray if they clash with the cool
  Smokey. Keep paper light enough that every ratio above still holds, and record the final
  values in the log.
- UT's official web link color, Globe `#006C93`, is not used by default. It measures 5.55:1
  on paper if it is wanted later.

**Type scale.** Define fluid `clamp()` steps once: display, h1 to h4, lead, body, small, and
mono label. Prose is capped at 68 characters per line.

**Spacing.** Add a section padding token, `--section-y: clamp(64px, 9vw, 110px)`, alongside
the existing `--gutter`.

**Motion.** Use three durations (160, 240 and 400 ms) and one easing curve. Reveal staggers
are capped at 6 steps. Everything respects reduced motion.

**Component inventory.** Port the Icon SVG set exactly. Build these components:

- Layout: `SiteNav`, `SiteFooter`, `SkipLink`, `PageHeader`, `SectionHeader` (eyebrow, index,
  title with an emphasis phrase, and lead), `Blueprint`, `Frame`, `Breadcrumbs` (visible
  plus JSON-LD).
- Controls: `Button`, which renders as a link or a button in primary, ghost and light
  variants. `Tag`, `StatusDot`.
- Content: `StatReadout` (value rendered on the server, with optional `CountUp`),
  `PaperRow`, `PaperCard`, `PersonCard` (photo or monogram), `AwardBadge`, `FreePdfBadge`,
  `LabMemberMark`, `EmptyState`, `Callout`.

Every interactive component defines hover, `:focus-visible`, active and disabled states.

### 4.3 Page-by-page changes

The table shows which phase delivers each change. P0 items go into the faithful port in
Phase 3. P1 items are the Phase 5 upgrades.

| Page | Change | Priority |
|---|---|---|
| Global | Skip link, visible focus, one `h1` per page, landmark elements | P0 |
| Global | Mobile menu as a full-height sheet with `aria-expanded` and `aria-controls`. Escape closes it, focus is trapped while open and returns to the toggle, body scroll locks, and the menu closes on navigation. | P0 |
| Global | 404 page with links to the main sections | P0 |
| Global | Visible breadcrumbs on paper, research-area and person pages | P1 |
| Global | Navigation per D9: Join added, PI kept as its own item, Talks relabeled "News & Talks". Check that the desktop nav fits on one line at 1280 px; below that width the mobile sheet takes over. | P1 |
| Home | Hero canvas pauses when off-screen or the tab is hidden. Device pixel ratio is capped at 2. Reduced motion shows a static frame. The `h1` stays the largest contentful paint. | P0 |
| Home | Recent publications link to their paper pages and show Free PDF badges and lab-member marks | P0 |
| Home | Research cards link to `#area` anchors in P0, then to `/research/<slug>` in P1 | P0, then P1 |
| Home | Stats strip computed from data: publications, PI funding, best-paper awards, invited talks | P1 |
| Home | "Latest" strip with the three most recent news or talk items | P1 |
| Home | Team preview shows every current member with the same card style, each linking to `/team/<slug>` | P1 |
| Home | Recruiting callout driven by `site.recruiting` | P1 |
| Home | Sponsor band keeps text wordmarks. Federal agency logos require permission to use. | P0 |
| Research | Each area gets a page at `/research/<slug>` with its description, methods, related publications (by tag mapping), related funded projects and the people involved | P1 |
| Publications | `PublicationsExplorer` — see the detail below this table | P1 |
| Paper | Reader toolbar and text layer (section 3.5) | P1 |
| Paper | Copy citation in BibTeX or APA | P1 |
| Paper | Research-area chips, related papers and a per-paper OG image | P1 |
| Team | One `PersonCard` design for PI, PhD, DEng, undergraduates and alumni. Members without a photo get a monogram, never a stock silhouette. | P0 |
| Team | `/team/<slug>` profiles with bio, interests, links, and publications matched from `authorsList`. Each has Person JSON-LD with `memberOf` the lab. | P1 |
| Team | Collaborators stay visibly separate from lab members | P0 |
| PI | Stat values rendered on the server and computed from data. ProfilePage JSON-LD unchanged. Link to beauschelble.com for the full CV. | P0 |
| Funding | Amounts and totals computed from numeric data. Active and completed awards shown; pending and not-funded hidden in code. Related publications per award. | P1 |
| News & Talks | Talks and media merged into one dated timeline at `/talks` with filter chips (Talk, Keynote, Press, Award). Dates sort properly. | P1 |
| Join | New single source for recruiting — see the detail below this table | P1 |
| Contact | Form reworked — see the detail below this table | P1 |
| Contact | Map iframe replaced by an address card with an "Open in Google Maps" link | P1 |

**Publications explorer (P1).**

- The server renders the full list, so crawlers and no-JS visitors get everything. The
  client adds:
  - Text search over title, authors, venue and tags.
  - Filters for type, year, research area, award-winning and free PDF.
  - A sort control.
  - "Clear filters".
- Filter state lives in the URL query, read from `window.location` so the page stays static.
- A polite live region announces the result count.
- Filter buttons expose `aria-pressed`.

**Join page (P1).** This replaces the two drifting copies with one source for recruiting.

- A recruiting status banner driven by data.
- Role cards for PhD, DEng and undergraduate students, plus what the lab looks for.
- Numbered steps for how to apply.
- A frequently asked questions section built with `<details>`.
- A button to the contact form with the inquiry type preselected through `?type=prospective`.

**Contact form (P1).**

- Submits with `fetch` and `Accept: application/json`.
- Inline validation, with error messages linked to fields through `aria-describedby`.
- A pending state while sending, a success panel, and an error state with a mailto fallback.
- A `_gotcha` honeypot field for spam.
- The inquiry type can be preselected from the query string.

### 4.4 Accessibility standard: WCAG 2.2 AA

- Text contrast is at least 4.5:1, or 3:1 for large text. Focus indicators and essential
  icons are at least 3:1.
- Every interactive element is reachable and operable by keyboard. Focus order follows
  visual order.
- Pointer targets are at least 24×24 px (success criterion 2.5.8).
- Headings follow outline order. Landmarks are present. Every page title is unique.
- Alt text: people photos use the person's name, decorative images use empty alt, and the
  canvas is `aria-hidden`.
- No information is conveyed by motion or color alone. Reduced motion stops all
  non-essential animation.
- Form fields have labels, errors are announced, and required fields are marked in text.
- The PDF reader offers a text layer and an always-visible download link.
- axe reports zero violations at serious or critical impact on every sitemap URL, at both
  390 px and 1440 px widths.

### 4.5 Performance budgets

Lab values are mobile Lighthouse runs on the Vercel preview.

| Metric | Budget |
|---|---|
| Largest Contentful Paint (lab) | 2.0 s or less |
| Cumulative Layout Shift | 0.05 or less |
| Total Blocking Time (lab) | 150 ms or less |
| Interaction to Next Paint (field, 75th percentile) | 200 ms or less |
| First-load JavaScript per content route, gzipped | 150 kB or less. PDF.js is excluded because it loads lazily on paper pages only. |
| Largest delivered image | 300 kB or less |
| Lighthouse scores on `/`, `/publications`, one paper page, `/team`, `/join` | 95 or more in all four categories |

### 4.6 Writing conventions for UI text

- Buttons are verbs: "Read paper", "Download PDF", "Copy citation", "Send message".
- Use one term per concept. The lab's members are the "Team" everywhere, in navigation,
  headings and URLs.
- Dates display as "Jul 2026" and are stored in ISO format.
- Use no emoji. Do not invent facts. New copy draws only on existing site content, the CV
  data in CLAUDE.md, or text Dr. Schelble supplies.

---

## 5. Data model and validation

Phase 2 writes Zod schemas in `web/lib/schemas.ts` and a one-off
`web/scripts/migrate-data.mjs`. The script converts the Astro JSON to the shapes below. It
must not lose any value, and it prints a summary of every field it transformed.

```ts
// Sketch only; exact field names may be refined in Phase 2 and recorded in the log.
Publication = {
  id: slug;                        // unchanged; also the PDF basename and URL
  year: number;
  status: 'published' | 'in-press';// split out of today's award field
  type: 'journal' | 'conference' | 'book chapter' | 'workshop';
  title: string;
  authors: string;                 // curated display string, kept as-is
  authorsList: string[];           // full names; length must equal the author count
  venue: string; venueShort?: string;
  award?: string;                  // real awards only
  doi?: string; url?: string; abstract?: string;
  tags: string[];
  pdf?: string;                    // the file must exist in public/papers
};
ResearchArea = { slug; num; icon: IconName; tag; title; description; description2?;
                 bullets: string[]; matchTags: string[] };  // matchTags link papers to areas
Person = { slug; name; group: 'pi'|'phd'|'deng'|'undergrad'|'alumni'; role;
           photo?; cropPosition?; education?; degree?;
           startYear: number; endYear?: number; bio; shortBio?; outcome?: string | null;
           authorAliases?: string[];   // spellings used in author lists, e.g. "B.G. Schelble"
           links?: { linkedin?; scholar?; orcid?; website?; github? } };
Collaborator = { name; institution; area };
Grant = { id; status: 'active'|'completed'|'pending'|'not-funded'; title; funder;
          funderShort; role; effortPct?: number; amount: number;   // USD
          internal: boolean; period?: { start: string; end?: string };
          description?; relatedPublications?: string[] };
NewsItem = { id; date: 'YYYY-MM' | 'YYYY-MM-DD';
             kind: 'invited-talk'|'keynote'|'press'|'award'|'media';
             title; venue?; location?; virtual?: boolean; description?; link?: string | null };
Site = { ...today's site.ts; recruiting: { open: boolean; term?: string; note?: string } };
```

Build-time integrity checks run as `npm run validate:data` and also from the build itself.
Errors fail the build. Warnings print.

- **Error:** a schema violation, a duplicate `id` or `slug`, a missing PDF for a `pdf`
  field, a missing photo file, or an emoji anywhere in data. Detect emoji with the regex
  `\p{Extended_Pictographic}`.
- **Warning:** a PDF in `public/papers/` that no publication references, a publication
  whose tags match no research area, or a lab member with no matching author name.
- Funding totals, counts of publications by type, award counts and talk counts come from
  data and are never typed by hand.

---

## 6. Engineering standards for the executing agent

- **Read version-matched docs before using any Next.js API.** Next 16 ships its docs in
  `web/node_modules/next/dist/docs/`, and `web/AGENTS.md` points there. These APIs may have
  changed since your training data. The Next 16 changes that matter here:
  - `params` and `searchParams` are Promises and must be awaited. The same applies in
    `opengraph-image`, `icon` and `sitemap`.
  - Turbopack is the default bundler.
  - `next lint` is gone, so run ESLint directly.
  - Middleware is now called `proxy`. This site does not need one.
  - `next/image` allows only quality 75 by default.
  - Next no longer overrides smooth scrolling during navigation. Add
    `data-scroll-behavior="smooth"` to `<html>` if global CSS sets smooth scrolling.
- Use TypeScript strict mode with `noUncheckedIndexedAccess`. Avoid `any`, and avoid
  `dangerouslySetInnerHTML` except in `JsonLd`. Author marking returns structured segments,
  not HTML strings.
- Server Components by default. `"use client"` goes only on leaf components that need it.
- Use the personal site as a reference, read-only. Adapt its patterns, but do not copy its
  emoji (its paper page uses one) and do not copy its person-centric framing. This site is
  lab-centric.
- Content parity: copy text from the Astro sources exactly. Change copy only when a phase
  says to, and log every intentional change.
- Tests are part of the work.
  - Vitest covers the `lib/` functions, the schemas, and the parity oracles.
  - Playwright covers navigation, the explorer, the reader, the form, the 404 page, and a
    run with JavaScript disabled.
- Commit in small, coherent steps with messages like `feat(web): port publications page`.
  End each commit message with the attribution trailer your session is configured to use.
  Push only the `migrate/nextjs` branch.
- When something is ambiguous:
  - Make the conservative choice that preserves current behavior, log it under
    "Decisions", and continue.
  - Stop and ask only for the stop conditions listed in each phase prompt.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Search ranking dip from URL or metadata changes | Identical canonicals and titles, 308s for every legacy form, an automated parity check against the Phase 0 baseline, sitemap resubmission, and Search Console monitoring for four weeks |
| Google Scholar loses PDFs | PDF URLs and `citation_pdf_url` values stay byte-identical |
| Downtime during the DNS switch | Domain added and verified in Vercel first. Switch at low traffic. GitHub Pages stays configured for 48 hours so rollback is a record swap. |
| Content security policy breaks PDF.js, analytics or the form | Report-only mode first, tested against all 42 PDFs before enforcement |
| Vercel Hobby limits | The site is static and about 70 MB including PDFs once the unused photo is dropped. Bandwidth and build minutes are far below Hobby limits. Watch the Vercel usage page after launch. |
| OneDrive file locks and conflict copies | Resolved: the working clone is `~/dev/ARCSLab` on the MacBook Air |
| Redesign scope creep | Phases are gated. Section 9 backlog items are out of scope unless promoted. |
| Context loss between agent sessions | This spec plus `migration/PROGRESS.md`, written at the end of every phase |
| Invented content on new pages | New copy draws only on existing sources. Unknowns become `draft: true` data that production builds hide, listed in the phase report. |

---

## 8. Cutover runbook (Phase 7)

| Step | Who | Action |
|---|---|---|
| 1 | Agent | On the final preview, confirm every gate in sections 4.4 and 4.5 passes and the parity check is at 100%. Open the PR from `migrate/nextjs` to `main` with the checklist. |
| 2 | YOU | At least 24 hours ahead, set the TTL on the `arcslab.io` A records and the `www` CNAME to 300 s or lower in Cloudflare. Leave the `google-site-verification` TXT record alone. |
| 3 | YOU | In Vercel, open Project, then Domains. Add `arcslab.io` as primary and `www.arcslab.io` redirecting to the apex. Note the exact records Vercel shows. |
| 4 | YOU | Merge the PR. Vercel builds production. GitHub Pages also rebuilds from `astro-site/`, which is harmless because DNS still points at Pages. |
| 5 | YOU | In Cloudflare, replace the four GitHub Pages A records with Vercel's apex record, and point the `www` CNAME at Vercel's target. Keep both records DNS-only (grey cloud), as Vercel recommends. |
| 6 | Agent | Verify DNS with `dig`. Check that `curl -I` shows `server: Vercel` with a valid certificate. Run the parity check against production, then spot-check `/sitemap.xml`, `/robots.txt`, a PDF, a `.html` redirect and an OG preview. |
| 7 | YOU | In Search Console, submit `/sitemap.xml`, remove `sitemap-index.xml`, and inspect `/`, `/publications` and one paper URL. Do the same in Bing Webmaster Tools if used. |
| 8 | YOU | After 48 stable hours, open GitHub, then Settings, then Pages, remove the custom domain, and unpublish. Phase 8 deletes the Pages workflow. |
| 9 | YOU | Watch Search Console coverage and the Vercel analytics 404 report for four weeks. |

**Rollback before step 8:** in Cloudflare, restore the A records `185.199.108.153`,
`185.199.109.153`, `185.199.110.153` and `185.199.111.153`, and set `www` back to a CNAME
for `bschelb.github.io`. The Astro site is still built and served by Pages.

---

## 9. Post-migration backlog (not in scope)

- Content-editing interface that commits JSON and PDFs to a pull request through the GitHub
  API.
- Contact form through a Resend route handler, which needs DNS records for the sending
  domain.
- Interactive research map, like the personal site's radial SVG.
- Site-wide search (Cmd or Ctrl+K) over papers, people and pages from a static index.
- Bulk `.bib` export of all publications. RSS or Atom feed for news.
- Upgrade beauschelble.com to Next 16 so both sites share one framework version.

---

## 10. Phase prompts

Each prompt is self-contained and starts in a fresh session.

### Phase 0: Preparation and baseline

**[YOU] on the MacBook Air, before running:**

1. Let OneDrive finish syncing. The OneDrive `Lab_Website/ARCSLab` folder should contain
   `NEXTJS_VERCEL_MIGRATION_PLAN.md`, `CLAUDE.md` and `setup-macbook-air.sh`.
2. Run the setup script from Terminal:

   ```bash
   bash "$HOME/Library/CloudStorage/OneDrive-UniversityofTennessee/Documents - UT_ARCS Lab/Lab_Website/ARCSLab/setup-macbook-air.sh"
   ```

   The script does six things:
   - It checks for the tools the phases need: git, Node 24 or later, the GitHub CLI
     logged in, and Claude Code.
   - It clones the lab repo to `~/dev/ARCSLab`, outside OneDrive.
   - It copies in the files git does not track: this plan, `CLAUDE.md`, `README.txt`
     and `.claude/`.
   - It clones the personal site to `~/dev/beauschelble-com` as a read-only reference.
   - It never deletes anything. It backs up a file before replacing it, so it is safe to
     re-run.
   - It prints a fix for anything missing, such as `brew install node@24` or
     `gh auth login`.
3. Re-run the script until it reports "Ready", or until the only warnings are for tools a
   later phase needs.
4. Open Claude Code in `~/dev/ARCSLab`, not in the OneDrive folder.

Claude Code memory is stored per Mac, so the Air does not have the saved group-framing rule.
Phase 0 writes that rule into `CLAUDE.md` so it travels with the project.

```text
You are preparing the ARCS Lab website (https://arcslab.io) for a migration from Astro on GitHub Pages to Next.js 16 on Vercel. This is Phase 0 of 9. It sets up the safety net that later phases measure against, so accuracy matters more than speed.

Read these first, in full: NEXTJS_VERCEL_MIGRATION_PLAN.md (the spec; sections 0–3 and 7 matter most now) and CLAUDE.md.

Goal: a migrate/nextjs branch containing the plan, a hand-off log, and a complete, machine-readable baseline of the current production site's URLs and SEO metadata. Later phases will diff against this baseline to prove nothing was lost.

Do the following:
1. Confirm the tree is clean apart from the untracked plan file, and up to date with origin/main. Create and switch to branch migrate/nextjs.
2. Create migration/PROGRESS.md with sections: Decisions, Phase log (one entry per phase: date, summary, verification results, deviations from plan, open questions). Record the section 1 defaults as current decisions, plus any overrides I gave you. Record the current DNS records (dig A/AAAA/CNAME/TXT for arcslab.io and www.arcslab.io) as the rollback reference.
3. Build astro-site (npm ci && npm run build in astro-site/). Generate migration/url-inventory.txt: every HTML route in extensionless form, and every file served from astro-site/public. Cross-check the HTML routes against the live https://arcslab.io/sitemap-index.xml and note any difference.
4. Write migration/scripts/capture-seo.mjs. For every HTML route, fetch the live production page and extract: <title>, meta description, canonical, robots, all og:* and twitter:* tags, all citation_* and dc.* tags (repeated tags kept as arrays), and the parsed JSON-LD blocks. Save the result as migration/seo-baseline.json. This file is the parity oracle for Phase 4, so make the output deterministic (sorted keys, stable order).
5. Capture visual and performance baselines into migration/baseline/, and add that folder to .gitignore:
   - Playwright full-page screenshots of every route at 390 px and 1440 px widths.
   - Mobile Lighthouse JSON for /, /publications, /papers/schelble-2022-lets-think-together, /team and /contact.
   Put a score summary table in PROGRESS.md.
6. Add to CLAUDE.md (it is gitignored, so edit it locally):
   - a short "Migration in progress" note pointing to the plan and the log;
   - this standing rule: "Lab site = group framing: in author lists, mark every lab member uniformly, PI included; never single out the PI."
7. Commit the plan, migration/ (except baseline/) and .gitignore changes. Push the branch.

Constraints: do not modify anything under astro-site/src or astro-site/public. Do not touch DNS, Vercel or GitHub settings. Use your scratchpad for throwaway files.

Stop and ask me if: the working tree is not clean, the live site is unreachable, or the live sitemap and the build disagree by more than a couple of URLs.

Definition of done: the branch is pushed. url-inventory.txt and seo-baseline.json cover every route, and you have spot-checked 3 routes by hand against view-source. PROGRESS.md has a Phase 0 entry.

End with a short report: what you captured, the counts (routes, files, PDFs), any surprises, and anything I need to decide before Phase 1.
```

### Phase 1: Scaffold, tooling, CI and Vercel project

**[YOU] before or during:**

1. In Vercel (Hobby plan, per D5), import `bschelb/ARCSLab`. Set Root Directory to `web`, the framework preset to
   Next.js, and Node to 24.x.
2. Enable Web Analytics and Speed Insights.
3. Create a "Protection Bypass for Automation" secret. Add it to the GitHub repo secrets as
   `VERCEL_AUTOMATION_BYPASS_SECRET`.

You can do these while the agent works. The agent will tell you when the first preview
should appear.

```text
You are executing Phase 1 of the ARCS Lab website migration (Astro/GitHub Pages → Next.js 16/Vercel). Read NEXTJS_VERCEL_MIGRATION_PLAN.md end to end (sections 3 and 6 are your spec this phase), CLAUDE.md, and migration/PROGRESS.md. Work on branch migrate/nextjs.

Goal: an empty but production-grade Next.js app in web/ with the full toolchain and CI in place. Every later phase should only add features, never fight tooling.

Context: the PI's personal site, cloned at ~/dev/beauschelble-com (if it is missing, clone the private GitHub repo bschelb/beauschelble-com there with gh), runs Next 15 + Tailwind v4 and is the house style for config and structure. Read it as a reference; never modify it. This app targets Next 16. After scaffolding, read the relevant guides in web/node_modules/next/dist/docs/ (start with 01-app/02-guides/upgrading/version-16.md) before writing config. The APIs differ from what you may remember.

Do the following:
1. Scaffold with create-next-app@latest into web/. Use TypeScript, Tailwind, ESLint, the App Router, no src/ directory, the @/* import alias and npm. Use non-interactive flags; check --help. Keep the generated AGENTS.md.
2. Pin Node 24: add .nvmrc and the engines field. Add the dependencies and devDependencies from plan section 3.1, using current stable versions (check with npm view).
3. Add npm scripts: dev, build, start, lint, typecheck, test (vitest), test:e2e (playwright), validate:data (a placeholder that exits 0 for now), copy:pdfjs. Wire copy:pdfjs into predev and prebuild. Write scripts/copy-pdfjs.mjs and gitignore public/pdfjs/.
4. Configure tsconfig (strict, noUncheckedIndexedAccess), eslint.config.mjs (flat config with next/core-web-vitals and TypeScript), and Prettier with the Tailwind plugin. Configure vitest and Playwright (chromium, webkit and firefox projects; base URL from an environment variable, defaulting to the local server).
5. Write next.config.ts with: poweredByHeader false; image settings per plan 3.6; a headers() function holding the security headers from plan 3.9, with the CSP in Report-Only form; a redirects() function stub with the .html and sitemap rules from plan 3.4 (others come in Phase 4).
6. Root layout skeleton: html lang="en" with data-scroll-behavior="smooth"; the three fonts via next/font exposed as CSS variables; Vercel Analytics and Speed Insights; a placeholder home page reading "ARCS Lab — migration in progress"; metadataBase https://arcslab.io and robots set to noindex. Preview deploys must never be indexed. Phase 4 replaces this with environment-aware robots.
7. Write .github/workflows/ci.yml: on pull requests and pushes to migrate/nextjs and main, working-directory web, Node 24 with npm cache, running ci, lint, typecheck, validate:data, test and build. Write .github/dependabot.yml with weekly npm updates (minor and patch grouped) for /web, and for github-actions. Leave deploy.yml untouched.
8. Add a Vercel Ignored Build Step command that skips the build when nothing under web/ changed (git diff --quiet HEAD^ HEAD -- .). Document it in web/README.md for me to paste into the Vercel settings, or put it in web/vercel.json if that works with Root Directory = web. Check the Vercel docs.
9. Verify locally: npm run lint, typecheck, test and build all pass. Then push, and confirm CI is green with gh run watch.

Constraints: do not create any content pages yet. Do not modify astro-site/. Do not change GitHub or Vercel settings yourself.

Stop and ask me if: create-next-app produces a Next major other than 16, or the build needs a config workaround you cannot justify from the bundled docs.

Definition of done: CI is green on the branch. A local production build passes. PROGRESS.md has a Phase 1 entry listing exact installed versions and any config decisions. Tell me exactly which Vercel dashboard settings to confirm, and when the first preview URL should appear.
```

### Phase 2: Data layer, libraries and assets

```text
You are executing Phase 2 of the ARCS Lab website migration. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (section 5 is your spec this phase; sections 2.3 and 6 are constraints), CLAUDE.md, and migration/PROGRESS.md. Work on branch migrate/nextjs in web/.

Goal: all content and logic ported into web/ with typed, validated data and tests that prove the outputs match the Astro site. Pages come in Phase 3; this phase makes them easy.

Do the following:
1. Copy astro-site/src/data/*.json and astro-site/src/data/site.ts into web/data and web/lib. Write web/lib/schemas.ts with Zod schemas per plan section 5. Write scripts/migrate-data.mjs to transform the copied JSON into the new shapes:
   - status split out of award ("In Press");
   - numeric grant amounts plus ids, statuses and funderShort;
   - ISO dates for talks and media, plus a kind field;
   - slugs, groups and startYear/endYear for people;
   - research areas with slug, icon names instead of emoji, and matchTags.
   Run it once and commit the transformed data. Have the script print a field-by-field summary, and assert that every original string value survives somewhere in the new data.
2. Port lib code from astro-site/src/lib (papers.ts, seo.ts) and the matching pieces of the personal site where useful. Change author marking so it returns structured segments ({text, isLabMember}) instead of HTML. Keep the group-framing rule: every current lab member is marked, PI included. Add lib/funding.ts (totals and filtering by status), lib/people.ts (roster, alias matching, publications per person), lib/news.ts (merged and sorted timeline), and lib/format.ts (dates, currency).
3. Implement validate:data per plan section 5 (errors fail, warnings print). Make the production build run the same validation.
4. Build parity oracles as Vitest tests. Import the original Astro lib functions directly from astro-site/src/lib (they are plain TypeScript) and assert identical output for all 49 publications:
   - toBibtex;
   - each JSON-LD builder (siteGraph, scholarlyArticle, breadcrumb, profilePage);
   - citation meta.
   Where the new data shape forces an adapter, test through the adapter. Add unit tests for funding totals: the active PI total must equal $2,802,201 per CLAUDE.md, or explain the difference. Also test publication counts by type, people-to-publication matching, and the emoji guard.
5. Assets:
   - Copy the PDFs to web/public/papers.
   - Write scripts/optimize-images.mjs (sharp; long edge 1600 px or less; quality 82) and produce web/public/images/people/* and the logo derivatives (app/icon.png 512, app/apple-icon.png 180, a 2× nav logo).
   - Keep /assets/ copies of any image referenced by an absolute URL in seo-baseline.json, such as the PI image in JSON-LD and og:image, so those URLs keep working.
   - Copy the og image.
   - Do not copy the unused downtownPic.jpg. Confirm it is unreferenced with grep first.
   - Record before and after sizes in PROGRESS.md.

Constraints: preserve content exactly. Every intentional data change must be explainable from plan section 5 and listed in the log. Do not build UI pages.

Stop and ask me if: the funding total or publication counts disagree with CLAUDE.md, or any data value has no clean home in the new schema.

Definition of done: validate:data, typecheck, lint, test and build pass, and CI is green. The parity tests cover all 49 papers. PROGRESS.md has a Phase 2 entry with the data-change summary and image size table.
```

### Phase 3: Design system, layout and faithful page port

```text
You are executing Phase 3 of the ARCS Lab website migration. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (sections 2.2, 2.3, 4.2, 4.3 rows marked P0, and 4.4 are your spec), CLAUDE.md (the design system and contrast rules), and migration/PROGRESS.md (check Decisions for D8, the official UT palette). Work on branch migrate/nextjs in web/.

Goal: every existing page rebuilt in React with the same content, structure and visual identity, plus the P0 fixes. A visitor should recognize the site, and it should now be faster, accessible and correct with JavaScript off. This is a port with targeted fixes, not the redesign. Phase 5 does the bigger UX changes, so resist adding P1 features now.

Do the following:
1. Design tokens: move the :root tokens from astro-site/src/styles/global.css into Tailwind v4 @theme in app/globals.css, applying the official UT palette and the color rules from plan 4.2 (token table, button colors, focus rings, the never-combine pairs, and the neutral retune). Add the type scale, spacing and motion tokens. Port the signature motifs (.blueprint, .frame, .eyebrow, .status-dot, reveal) as a small @layer components block or as React components. Write a tiny script or test that computes contrast for every documented text/background token pair and fails below AA.
2. Port Icon.astro into components/ui/Icon.tsx with the identical SVG set and a typed name union.
3. Build the layout: SiteNav with the current nav items (Join and the News & Talks label arrive in Phase 5) and the mobile-sheet behavior from plan 4.3; SiteFooter; SkipLink; PageHeader; SectionHeader; Button; and the other components from plan 4.2 that the existing pages need.
4. Port the pages /, /research, /publications, /team, /pi, /funding, /talks and /contact. Copy text verbatim from the .astro files. Page-level details:
   - Keep the existing publications filter behavior, with aria-pressed and a live result count added.
   - Port the hero network canvas as a client component, keeping its algorithm and look, and add the pause, device-pixel-ratio and reduced-motion behavior from plan 4.3.
   - StatReadout renders the final value on the server; the count-up runs only after hydration, and never under reduced motion.
   - Fix the P0 dead ends: home publication rows link to /papers/<id> (the route arrives in Phase 4; links may 404 until then), and research cards link to #anchors.
   - Use the same PersonCard design for every group, with monograms when there is no photo.
   - Add the 404 page.
   - Use next/image for every raster image.
   Each page gets metadata matching seo-baseline.json for title, description and canonical. Full JSON-LD parity is checked in Phase 4, but emit the site-wide graph from the root layout now.
5. Visual review:
   - Screenshot every route at 390 px and 1440 px with Playwright, against a local production build.
   - Compare each against migration/baseline/screens.
   - List every visible difference in PROGRESS.md as intentional (with the reason) or fixed.
6. Run axe on every route at both widths and fix all serious and critical issues. Run Lighthouse locally on / and /publications and record the scores.

Constraints: no new pages beyond 404. No copy rewrites. Do not invent content. Use the personal site's NavBar and Reveal as references, but keep this site's visual identity.

Stop and ask me if: a contrast fix would visibly change the brand beyond what plan 4.2 describes, or a page cannot be ported faithfully without a structural change.

Definition of done: all eight pages and the 404 render in a production build. axe is clean at serious and critical levels. The contrast test passes. The screenshot diff list is complete. CI is green and the Vercel preview is live. PROGRESS.md has a Phase 3 entry with scores and differences.
```

### Phase 4: Paper pages, PDF reader, SEO surface, redirects and headers

```text
You are executing Phase 4 of the ARCS Lab website migration. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (sections 3.4, 3.5, 3.8 and 3.9 are your spec), CLAUDE.md (the publications, PDFs and SEO section), and migration/PROGRESS.md. Work on branch migrate/nextjs in web/.

Goal: SEO and URL parity with production, proven by an automated check, plus the paper pages and the improved PDF reader. After this phase, the preview could replace production without losing any search equity.

Do the following:
1. /papers/[slug]: generateStaticParams over all publications, with dynamicParams = false. generateMetadata emits the title, description, canonical, Open Graph article data, and citation_* and dc.* tags via metadata.other. Emit ScholarlyArticle and BreadcrumbList JSON-LD. Port the page layout from astro-site/src/pages/papers/[slug].astro, including the "request a copy" block when there is no PDF. Add a visible breadcrumb, research-area chips, related papers, and CopyCitation (BibTeX and APA).
2. PdfReader client component per plan 3.5:
   - lazy, page-by-page canvas rendering ported from the Astro script;
   - a toolbar (page count, fit width, open in new tab, download);
   - the PDF.js text layer, with the canvas aria-hidden;
   - an always-visible download fallback.
   The import of /pdfjs/pdf.min.mjs must bypass the bundler. Check the bundled Next docs for how Turbopack treats ignore comments on dynamic imports, and verify that the built output really loads the file at runtime. Test it on at least 5 PDFs of different sizes, including the largest.
3. Add sitemap.ts (all pages and papers; research-area and people pages arrive in Phase 5, so structure the code to take them), robots.ts (allow all and point to the sitemap in production; disallow everything when VERCEL_ENV is not "production"), manifest.ts (port site.webmanifest), the default app/opengraph-image.tsx in brand style, papers/[slug]/opengraph-image.tsx, and llms.txt (lab-centric, built from data; model it on the personal site's).
4. Finish redirects() and headers() per plan 3.4 and 3.9: the .html rules, the sitemap rules, renamed assets, the PDF headers and the security headers (CSP still Report-Only).
5. Write scripts/check-parity.mjs, which runs against any base URL:
   a. Every URL in migration/url-inventory.txt returns 200, or a 308 to the expected target followed by a 200.
   b. For every HTML route, compare against migration/seo-baseline.json: title, description, canonical, robots (production mode), og:* and twitter:*, citation_*/dc.*, and JSON-LD (deep-equal after normalizing key order).
   Print a readable diff. Run it against a local production build started with VERCEL_ENV=production. Then fix every difference, or record it as intentional in PROGRESS.md with a reason. Expected intentional differences: the og:image URL if it now points to a generated image, and the theme color if D8 changed it.
6. Add Playwright tests for: the paper page renders its first PDF page and the download link works; a paper without a PDF shows the request block; each .html URL redirects; robots behaves differently in preview and production.

Constraints: PDF URLs and citation_pdf_url values must stay byte-identical to production. Do not enforce the CSP yet.

Stop and ask me if: parity cannot reach 100% without changing a canonical URL or a JSON-LD @id, or the text layer cannot be made reliable.

Definition of done: check-parity passes against a local production build, with any intentional differences listed. The e2e tests pass. CI is green and the preview is deployed. Then run check-parity against the preview URL, passing the bypass header and expecting robots to differ there. Record the results in a PROGRESS.md Phase 4 entry.
```

### Phase 5: UX upgrades (P1)

**[YOU] before running:**

- Supply the current recruiting status: open or closed, and for which term.
- Optionally supply answers for the Join page's frequently asked questions. Otherwise the
  agent drafts them only from existing site content and flags them for your review.

```text
You are executing Phase 5 of the ARCS Lab website migration. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (sections 4.1, 4.3 rows marked P1, 4.4, 4.5 and 4.6 are your spec), CLAUDE.md, and migration/PROGRESS.md (Decisions D9 and D10, plus any recruiting details I recorded). Work on branch migrate/nextjs in web/.

Goal: the UX improvements that make the site serve its audiences — prospective students, program officers, researchers, media, and students' future employers — better than the current site does. Parity is already proven. Keep it intact: re-run scripts/check-parity.mjs at the end, and expect only intentional differences.

Build these, in this order, committing after each one:
1. Navigation per D9, with the footer updated to match.
2. /join: the single source for recruiting, per plan 4.3. Replace the join sections on /team and /contact with short stubs that keep id="join" and link to /join. Drive recruiting status from site.recruiting.
3. /research/[slug] area pages, with related publications (matchTags), related grants, and people. Home research cards and the /research overview link to them.
4. The PublicationsExplorer per plan 4.3. The server-rendered list stays complete without JavaScript. The URL query reflects filter state, and the page stays statically rendered (read the query on the client). It has a polite live region for the result count. The personal site's PublicationsExplorer is a reference; this one adds research-area, year and free-PDF filters.
5. /team/[slug] profile pages with Person JSON-LD (memberOf the lab), and publications matched through authorAliases. The /team grid links each card to its profile.
6. A unified News & Talks timeline at /talks, with kind filter chips and ISO-sorted dates.
7. The ContactForm rework per plan 4.3 (fetch to Formspree with Accept: application/json, inline validation, pending, success and error states, _gotcha honeypot, inquiry type preselected from ?type=). Replace the map iframe with an address card and an external link.
8. Home page additions: a stats strip computed from data, a "Latest" strip, the full team preview, and the recruiting callout.

For every new route: metadata with a unique title and description, a canonical, breadcrumbs (visible and JSON-LD), a sitemap entry, an OG image where plan 3.8 calls for one, and llms.txt links.

Content rule: do not invent facts. New copy may draw only on existing site content, CLAUDE.md, or what I recorded in PROGRESS.md. Mark anything else as draft: true in data. Production builds hide drafts and preview builds show them with a visible "Draft" tag. List every draft in your report so I can supply the text.

Tests: Playwright for the explorer (search, each filter, URL round-trip, clear, no-JS fallback), the contact form (intercept the Formspree request and cover the success, error and honeypot paths), the join stubs, and mobile navigation. Add axe checks for every new route at both widths.

Stop and ask me if: a change would alter an existing URL or canonical, or the explorer cannot stay static without a structural compromise.

Definition of done: all eight items are built and tested. axe is clean at serious and critical levels. check-parity shows only intentional differences. CI is green and the preview is deployed. PROGRESS.md has a Phase 5 entry with the draft-content list and before/after screenshots of the home, publications and join pages.
```

### Phase 6: Quality hardening

```text
You are executing Phase 6 of the ARCS Lab website migration. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (sections 3.9, 3.10, 4.4 and 4.5 are your spec) and migration/PROGRESS.md. Work on branch migrate/nextjs in web/.

Goal: every quality gate in plan sections 4.4 and 4.5 measured and passing, with automation that keeps it that way after launch. Assume regressions exist and find them.

Do the following:
1. CI against previews: add a workflow triggered on deployment_status (state success, environment Preview) that runs the Playwright suite and Lighthouse CI against the preview URL, sending the x-vercel-protection-bypass header from the VERCEL_AUTOMATION_BYPASS_SECRET secret. Put the budgets from plan 4.5 in lighthouserc.json as assertions, for the five key URLs.
2. Accessibility:
   - axe on every sitemap URL at 390 px and 1440 px.
   - A keyboard-only Playwright walkthrough of the nav, mobile menu, explorer, paper reader toolbar, contact form and join FAQ, asserting visible focus and logical order.
   - A reduced-motion run asserting no animation runs.
   - A JavaScript-disabled run asserting every page shows its content, stats show real values, and links work.
   - A 24×24 px target-size check on interactive elements.
3. Performance: measure first-load JavaScript per route from the build output, LCP and CLS per key page, and the largest delivered image. Fix anything over budget. Likely places to look: client-component boundaries pulling in too much, the hero canvas, font loading, and image sizes.
4. Content security policy: run the full e2e suite and open all 42 PDFs in the reader while collecting CSP report-only violations (listen for securitypolicyviolation events in Playwright). Adjust the policy until violations are zero, then switch to the enforcing header. Re-run everything.
5. Cross-browser smoke tests in Chromium, WebKit and Firefox. Check links: all internal links must resolve. Report external link failures without failing the build.
6. Check that security headers are present on the preview (curl -I), and record the results.

Constraints: fix root causes, not tests. Do not loosen a budget or an axe rule to get green. If a budget is truly unreachable, explain why with data and propose the smallest change to the budget.

Definition of done: every gate passes on the preview and the CSP is enforced. The preview-triggered CI workflow is green. PROGRESS.md has a Phase 6 entry with a gate-by-gate results table, including the Lighthouse scores for the five key URLs.
```

### Phase 7: Cutover

**[YOU] own the DNS and settings steps.** Run this prompt when you are ready to launch. It
prepares everything and then walks you through section 8.

```text
You are executing Phase 7 of the ARCS Lab website migration: launch. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (section 8 is the runbook; section 7 lists the risks) and migration/PROGRESS.md.

Goal: arcslab.io served by Vercel with zero lost URLs and a tested rollback path. I make every DNS, Vercel-domain and GitHub-settings change myself. Your job is to verify before and after, and to tell me precisely what to do at each step.

Do the following:
1. Pre-flight on the latest preview: re-run check-parity (preview mode), the full e2e suite and Lighthouse CI. Confirm the Phase 6 gates still hold. Confirm the arcslab.io TTLs are 300 s or less with dig. If they are not, stop and tell me to lower them and wait 24 hours.
2. Open a PR from migrate/nextjs to main. Its description should hold: a summary of the migration, the gate results table, the list of intentional differences from PROGRESS.md, and the runbook checklist from plan section 8 with checkboxes. Do not merge it.
3. Walk me through runbook steps 3 to 5 one at a time. After each, wait for me to confirm before continuing. For the DNS step, tell me exactly which Cloudflare records to delete and add, using the values I read to you from the Vercel dashboard.
4. After I confirm the DNS change, poll until arcslab.io resolves to Vercel (dig against 1.1.1.1 and 8.8.8.8), then verify:
   - the TLS certificate is valid;
   - curl -I shows server: Vercel and the security headers;
   - check-parity passes against https://arcslab.io in production mode;
   - www redirects to the apex;
   - a .html URL returns a 308;
   - a PDF serves inline;
   - robots and the sitemap are correct.
5. If any check fails in a way that affects visitors, tell me the rollback steps from plan section 8 straight away, then diagnose.
6. Give me the Search Console steps (runbook step 7) and a reminder for step 8 in 48 hours.

Constraints: never merge, change DNS, or change repository or Vercel settings yourself. Production verification is read-only.

Definition of done: production passes every check. PROGRESS.md has a Phase 7 entry with timestamps and results. You have told me the date for the 48-hour step.
```

### Phase 8: Cleanup and documentation

Run this only after runbook step 8, when GitHub Pages is unpublished.

```text
You are executing Phase 8, the final phase of the ARCS Lab website migration. Read NEXTJS_VERCEL_MIGRATION_PLAN.md (sections 3.3 and 3.11) and migration/PROGRESS.md. Confirm from the log that Phase 7 finished and that I unpublished GitHub Pages. If not, stop and tell me.

Goal: a repository that only contains what runs in production, and documentation that lets me or a future agent maintain it without this plan.

Do the following on a new branch, chore/post-migration-cleanup:
1. Delete astro-site/, the legacy root *.html files (including any ARCS_Lab_Preview.html), the root assets/ folder if nothing references it, .github/workflows/deploy.yml, and SEO_AND_PDF_PLAN.md. Before deleting, grep the web/ app and the CI config to confirm nothing references them. Everything remains in git history.
2. Move NEXTJS_VERCEL_MIGRATION_PLAN.md and migration/PROGRESS.md into docs/migration-2026/. Delete the migration/ scripts that only served the cutover, but keep check-parity.mjs in web/scripts as a regression tool.
3. Write web/README.md as the maintainer's guide: local development, the content workflow (add a publication, PDF, person, talk, grant, or change recruiting status), the data validation errors and what they mean, deploy and preview behavior, how to update PDF.js, and the quality gates.
4. Rewrite CLAUDE.md for the new reality. It is gitignored, so edit it locally. Keep the project owner, design system, contrast rules (with the updated token values), lab data and group-framing rule. Replace the structure, deploy and publication-workflow sections to describe web/. Remove all Astro and GitHub Pages instructions.
5. Run the full check suite, open a PR, and stop. I will merge it.

Definition of done: the PR is open with CI green, and it lists what was deleted. The README and CLAUDE.md are updated. Report anything you found that still references the old stack.
```

---

*Sources for this plan: a full read of `astro-site/`, the beauschelble.com codebase,
the Next.js 16.3.8 bundled upgrade guide, live DNS and response headers for arcslab.io,
and contrast calculations for the current color tokens, all as of 1 October 2026.*
