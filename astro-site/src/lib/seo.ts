/**
 * Structured-data (JSON-LD) builders and academic <meta> helpers for the ARCS Lab.
 *
 * Two audiences are served:
 *  - Search engines / the Knowledge Graph, via schema.org JSON-LD. Unlike the
 *    PI's personal site (which is Person-centric), this graph is
 *    **Organization-centric**: the ARCS Lab is the primary entity and the PI is
 *    modeled as its founder/member.
 *  - Google Scholar, via Highwire Press `citation_*` <meta> tags — the canonical
 *    mechanism academic indexers use to discover and parse papers.
 */

import { absoluteUrl, orgSameAs, pi, piSameAs, researchKeywords, site } from "../data/site";
import { authorList, type Paper } from "./papers";

const PERSON_ID = `${site.url}/#person`;
const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

const META_KEYWORDS = new Set(["ARCS Lab", "University of Tennessee", "Beau Schelble"]);
const topicKeywords = researchKeywords.filter((k) => !META_KEYWORDS.has(k));

/** The University of Tennessee, Knoxville as a referenceable Organization node. */
function utkOrganization() {
  return {
    "@type": "CollegeOrUniversity",
    name: "University of Tennessee, Knoxville",
    sameAs: site.links.utk,
  };
}

function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: site.address.streetAddress,
    addressLocality: site.address.addressLocality,
    addressRegion: site.address.addressRegion,
    postalCode: site.address.postalCode,
    addressCountry: site.address.addressCountry,
  };
}

/** The canonical Person node for the PI, Dr. Beau G. Schelble. */
export function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: pi.name,
    alternateName: [...pi.alternateName],
    givenName: pi.givenName,
    familyName: pi.familyName,
    honorificSuffix: pi.honorificSuffix,
    jobTitle: pi.jobTitle,
    description: pi.description,
    url: site.links.personalSite,
    image: absoluteUrl(pi.image),
    email: `mailto:${pi.email}`,
    knowsAbout: topicKeywords,
    worksFor: { ...utkOrganization() },
    affiliation: { "@id": ORG_ID },
    alumniOf: { "@type": "CollegeOrUniversity", name: pi.alumniOf.name, sameAs: pi.alumniOf.sameAs },
    workLocation: { "@type": "Place", address: postalAddress() },
    sameAs: piSameAs(),
  };
}

/** The ARCS Lab as a ResearchOrganization — the primary entity of the site. */
export function organizationNode() {
  return {
    "@type": "ResearchOrganization",
    "@id": ORG_ID,
    name: site.name,
    alternateName: site.shortName,
    url: site.url,
    email: `mailto:${site.email}`,
    description: site.description,
    logo: absoluteUrl("/assets/Frame 3.png"),
    image: absoluteUrl(site.ogImage),
    parentOrganization: utkOrganization(),
    foundingDate: "2024",
    founder: { "@id": PERSON_ID },
    member: { "@id": PERSON_ID },
    knowsAbout: topicKeywords,
    address: postalAddress(),
    sameAs: orgSameAs(),
  };
}

/** Site-wide WebSite node. Establishes the canonical name/publisher of the site. */
export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: site.url,
    name: site.name,
    alternateName: site.shortName,
    description: site.description,
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
  };
}

/** The `@graph` emitted once, site-wide, from BaseLayout (Org + Person + WebSite). */
export function siteGraph() {
  return { "@context": "https://schema.org", "@graph": [organizationNode(), personNode(), websiteNode()] };
}

/** ProfilePage wrapper (e.g. the PI page) whose mainEntity is the PI Person. */
export function profilePageNode(opts: { url: string; name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${opts.url}#profilepage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en-US",
    mainEntity: personNode(),
  };
}

/** A BreadcrumbList from an ordered list of [name, path] pairs. */
export function breadcrumbNode(trail: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

const periodicalTypeByPaper: Record<Paper["type"], string> = {
  journal: "Periodical",
  conference: "Periodical",
  workshop: "Periodical",
  "book chapter": "Book",
};

/** Rich ScholarlyArticle node for a single paper. */
export function scholarlyArticleNode(paper: Paper) {
  const url = absoluteUrl(`/papers/${paper.id}`);
  const pdfUrl = paper.pdf ? absoluteUrl(`/papers/${paper.pdf}`) : undefined;
  const sameAsLinks = [
    ...(paper.doi ? [`https://doi.org/${paper.doi}`] : []),
    ...(paper.url && paper.url !== `https://doi.org/${paper.doi}` ? [paper.url] : []),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": `${url}#article`,
    headline: paper.title,
    name: paper.title,
    url,
    mainEntityOfPage: url,
    inLanguage: "en-US",
    datePublished: String(paper.year),
    author: authorList(paper).map((name) => ({
      "@type": "Person",
      name,
      ...(name.includes("Schelble") ? { "@id": PERSON_ID, sameAs: piSameAs() } : {}),
    })),
    isPartOf: { "@type": periodicalTypeByPaper[paper.type], name: paper.venue },
    publisher: { "@type": "Organization", name: paper.venue },
    ...(paper.doi ? { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: paper.doi } } : {}),
    ...(paper.abstract ? { abstract: paper.abstract } : {}),
    ...(paper.tags?.length ? { keywords: paper.tags.join(", ") } : {}),
    ...(pdfUrl ? { encoding: { "@type": "MediaObject", contentUrl: pdfUrl, encodingFormat: "application/pdf" } } : {}),
    ...(sameAsLinks.length ? { sameAs: sameAsLinks } : {}),
    isAccessibleForFree: Boolean(pdfUrl),
  };
}

/**
 * Highwire Press / Google Scholar `citation_*` (+ a little Dublin Core) meta tags
 * for a paper, returned as `[name, content]` pairs. Authors expand to one
 * `citation_author` tag each — render the array directly into <head>.
 */
export function citationMetaTags(paper: Paper): [string, string][] {
  const tags: [string, string][] = [
    ["citation_title", paper.title],
    ...authorList(paper).map((a): [string, string] => ["citation_author", a]),
    ["citation_publication_date", String(paper.year)],
    ["citation_date", String(paper.year)],
    ["citation_author_institution", "University of Tennessee, Knoxville"],
    ["dc.title", paper.title],
    ...authorList(paper).map((a): [string, string] => ["dc.creator", a]),
    ["dc.date", String(paper.year)],
    ["dc.language", "en"],
  ];

  if (paper.type === "journal") {
    tags.push(["citation_journal_title", paper.venueShort ?? paper.venue]);
  } else if (paper.type === "conference" || paper.type === "workshop") {
    tags.push(["citation_conference_title", paper.venueShort ?? paper.venue]);
  } else {
    tags.push(["citation_inbook_title", paper.venue]);
  }

  if (paper.doi) {
    tags.push(["citation_doi", paper.doi]);
    tags.push(["dc.identifier", `doi:${paper.doi}`]);
  }
  if (paper.abstract) tags.push(["citation_abstract", paper.abstract]);
  if (paper.tags?.length) tags.push(["citation_keywords", paper.tags.join("; ")]);
  if (paper.pdf) {
    tags.push(["citation_pdf_url", absoluteUrl(`/papers/${paper.pdf}`)]);
    tags.push(["citation_fulltext_world_readable", ""]);
  }
  return tags;
}

/** Serialize a JSON-LD node to a string that is safe to inline via `set:html`. */
export function ldjson(node: unknown): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}
