/**
 * Draft content (Phase 5 content rule): anything not drawn from existing site content,
 * CLAUDE.md or PROGRESS.md carries `draft: true` in data. Production builds drop it;
 * previews and local builds show it with a visible "Draft" tag so it can be reviewed.
 */
import { isProduction } from './robots';

export function showDrafts(): boolean {
  return !isProduction();
}

/** The items a build may show: everything on previews, non-drafts in production. */
export function published<T extends { draft?: boolean }>(items: readonly T[]): T[] {
  return showDrafts() ? [...items] : items.filter((i) => !i.draft);
}
