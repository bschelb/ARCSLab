# ARCS Lab Website — SEO + PDF Plan

**Goal:** Bring the lab site (Astro, arcslab.io) to the same SEO + publication-PDF
standard as the personal site (Next.js, beauschelble.com), adapted for static
GitHub Pages hosting.

## The key constraint
The lab site is **static Astro on GitHub Pages — no server.** The personal site's
server-only pieces (dynamic PDF route, admin upload, runtime OG images) become static
equivalents: PDFs in `public/papers/`, paper pages built at compile time, and
"uploading a paper" = edit JSON + commit + push.

## Where the gap is
The lab `<head>` has only title/description/fonts; `publications.json` has only
year/type/title/authors/venue/award. Missing: canonical/OG/Twitter, JSON-LD,
Google Scholar `citation_*` tags, sitemap/robots/manifest, per-paper pages, PDF reader,
downloads, and BibTeX.

## Plan (phases)
0. **Data model** — add an `id` (slug) to each publication; then incrementally add
   `doi`, `abstract`, `tags`, `pdf`. Everything else builds on this.
1. **SEO foundation** — central site config; upgrade `BaseLayout` head (canonical, OG,
   Twitter, robots); site-wide JSON-LD (Lab as Organization + PI as Person + WebSite);
   add `@astrojs/sitemap`; static `robots.txt`, web manifest, and OG share image.
2. **PDF infrastructure** — create `public/papers/`; reuse the ~45 author-version PDFs
   already on the personal site. Author-accepted / open versions only (DOI-only otherwise).
3. **Paper pages + reader** — generate `/papers/<slug>` at build time, each with an
   in-browser iframe PDF reader, download button, BibTeX, DOI link, abstract, related
   work, plus ScholarlyArticle + breadcrumb JSON-LD and Scholar `citation_*` meta.
4. **List upgrade** — link publication rows to their pages; add "Free PDF" badges.
5. **Per-page polish** — PI ProfilePage JSON-LD; per-page descriptions, canonicals,
   breadcrumbs.
6. **Verify & launch** — build, validate structured data (Rich Results) + Scholar tags,
   push to `main` (auto-deploys), submit the sitemap in Search Console.

## Watch out for
- No server → paper management is git-based, not an upload UI.
- Host only shareable PDFs (copyright).
- Use a consistent PI `@id` + `sameAs` back to the personal site so Google links the two
  profiles as one entity.

## Sequence
SEO foundation first (highest ROI, lowest risk) → PDF pages/reader → polish →
enrich DOIs/abstracts over time.
</content>
