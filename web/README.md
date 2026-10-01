# arcslab.io — Next.js app

The ARCS Lab website, migrating from `astro-site/` (GitHub Pages) to this Next.js 16 app on
Vercel. The spec is `../NEXTJS_VERCEL_MIGRATION_PLAN.md` and the hand-off log is
`../migration/PROGRESS.md`. Phase 8 turns this file into the full maintainer's guide.

## Local development

Requires Node 24 (`nvm use` reads `.nvmrc`).

```bash
npm ci
npm run dev          # http://localhost:3000 (copies PDF.js into public/pdfjs first)
npm run build        # production build (copies PDF.js and validates data first)
npm run start        # serve the production build
```

| Script                    | What it does                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint`                    | ESLint (flat config, `next/core-web-vitals` + TypeScript)                                                                                                                                                                 |
| `typecheck`               | `next typegen` then `tsc --noEmit` (strict, `noUncheckedIndexedAccess`)                                                                                                                                                   |
| `test`                    | Vitest unit tests in `tests/unit/`                                                                                                                                                                                        |
| `test:e2e`                | Playwright in Chromium, WebKit and Firefox. Set `PLAYWRIGHT_BASE_URL` to test a deployed URL, and `VERCEL_AUTOMATION_BYPASS_SECRET` for protected previews. Without a base URL it starts `npm run start`, so build first. |
| `validate:data`           | Data schema and integrity checks (placeholder until Phase 2)                                                                                                                                                              |
| `format` / `format:check` | Prettier with the Tailwind class-sorting plugin                                                                                                                                                                           |
| `copy:pdfjs`              | Copies `pdf.min.mjs` and `pdf.worker.min.mjs` from `pdfjs-dist` into `public/pdfjs/` (gitignored)                                                                                                                         |

## Vercel project settings

| Setting                       | Value                                                                                                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root Directory                | `web`                                                                                                                                                                                                                                                                        |
| Framework Preset              | Next.js                                                                                                                                                                                                                                                                      |
| Node.js Version               | 24.x                                                                                                                                                                                                                                                                         |
| Ignored Build Step            | Set in `vercel.json` (`ignoreCommand: git diff --quiet HEAD^ HEAD -- .`). The command runs from the Root Directory, so a commit that changes nothing under `web/` exits 0 and the deploy is skipped. Leave the dashboard setting on "Automatic"; `vercel.json` overrides it. |
| Web Analytics, Speed Insights | Enabled (the components are already in `app/layout.tsx`)                                                                                                                                                                                                                     |
| Deployment Protection         | "Protection Bypass for Automation" secret stored in GitHub as `VERCEL_AUTOMATION_BYPASS_SECRET`                                                                                                                                                                              |

Robots are `noindex` everywhere until Phase 4 makes them environment-aware.
