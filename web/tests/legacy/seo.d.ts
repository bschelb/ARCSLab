// Type declarations for astro-site/src/lib/seo.ts (see papers.d.ts).
import type { Paper } from './papers';

export function siteGraph(): Record<string, unknown>;
export function profilePageNode(opts: {
  url: string;
  name: string;
  description: string;
}): Record<string, unknown>;
export function breadcrumbNode(trail: [string, string][]): Record<string, unknown>;
export function scholarlyArticleNode(paper: Paper): Record<string, unknown>;
export function citationMetaTags(paper: Paper): [string, string][];
export function ldjson(node: unknown): string;
