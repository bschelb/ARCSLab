/**
 * Central site configuration for the ARCS Lab website.
 *
 * This is the single source of truth for the lab's identity, the PI's identity,
 * canonical links, and the research keyword set used across <meta> tags and
 * structured data (JSON-LD). Ported and lab-flavored from the personal site's
 * `lib/site.ts`, but re-centered on the **Lab (Organization)** as the primary
 * entity, with the PI modeled as a member.
 */

export const site = {
  name: "AI & Robotics for Collaborative Systems (ARCS) Lab",
  shortName: "ARCS Lab",
  title: "ARCS Lab · Human-AI Teaming · University of Tennessee, Knoxville",
  description:
    "The AI & Robotics for Collaborative Systems (ARCS) Lab at the University of Tennessee, Knoxville advances the science and engineering of human-AI teaming — trust, team cognition, shared mental models, and responsible AI in high-stakes collaborative systems.",
  url: "https://arcslab.io",
  email: "bschelbl@utk.edu",
  parentOrganization: "University of Tennessee, Knoxville",
  affiliation:
    "Department of Industrial & Systems Engineering, Tickle College of Engineering, The University of Tennessee, Knoxville",
  // Default Open Graph / social share image (1200×630).
  ogImage: "/og/arcs-lab-og.png",
  // Theme colors used in the web manifest + browser UI.
  themeColor: "#14100b",
  accentColor: "#ff6600",
  address: {
    streetAddress: "515 John D. Tickle Engineering Building, 851 Neyland Drive",
    addressLocality: "Knoxville",
    addressRegion: "TN",
    postalCode: "37996",
    addressCountry: "US",
  },
  /** Geo coordinates of the Tickle Engineering Building (shown in the footer). */
  geo: { latitude: 35.9544, longitude: -83.9295 },
  links: {
    scholar: "https://scholar.google.com/citations?user=ggHXV-4AAAAJ&hl=en",
    orcid: "https://orcid.org/0000-0003-3704-697X",
    researchGate: "https://www.researchgate.net/profile/Beau-Schelble",
    linkedin: "https://www.linkedin.com/in/beau-schelble-ph-d-498675135/",
    // The PI's UTK faculty profile (a page *about the person*).
    utkProfile: "https://tickle.utk.edu/ise/faculty/beau-schelble/",
    // The host department / college.
    ise: "https://ise.utk.edu",
    utk: "https://www.utk.edu",
    // The PI's personal site — links the two web identities into one entity.
    personalSite: "https://beauschelble.com",
  },
} as const;

/** The Principal Investigator — modeled as the lab's founder/member Person node. */
export const pi = {
  name: "Beau G. Schelble",
  alternateName: ["Beau Schelble", "Beau G. Schelble, PhD", "B. G. Schelble"],
  givenName: "Beau",
  familyName: "Schelble",
  honorificSuffix: "PhD",
  jobTitle: "Assistant Professor of Industrial & Systems Engineering",
  description:
    "Founding Director of the ARCS Lab and Assistant Professor of Industrial & Systems Engineering at the University of Tennessee, Knoxville. Research on human-AI teaming, team cognition, trust, and responsible AI in high-stakes environments.",
  image: "/assets/DSCF0563-Beaus-Workstation.jpg",
  email: "bschelbl@utk.edu",
  alumniOf: { name: "Clemson University", sameAs: "https://www.clemson.edu" },
} as const;

/**
 * Curated research keywords — used in <meta name="keywords">, the Organization /
 * Person `knowsAbout` properties, and as paper-keyword fallbacks. Ordered roughly
 * by search value.
 */
export const researchKeywords = [
  "human-AI teaming",
  "human-autonomy teaming",
  "human-AI collaboration",
  "team cognition",
  "shared mental models",
  "trust in AI",
  "human-robot interaction",
  "responsible AI",
  "AI ethics",
  "explainable AI",
  "situational awareness",
  "human-centered AI",
  "human factors engineering",
  "collaborative systems engineering",
  "industrial and systems engineering",
  "ARCS Lab",
  "University of Tennessee",
  "Beau Schelble",
];

/** External identity URLs for the **PI Person** `sameAs` graph. */
export function piSameAs(): string[] {
  const l = site.links;
  return [l.scholar, l.orcid, l.researchGate, l.linkedin, l.utkProfile, l.personalSite].filter(
    (u): u is string => Boolean(u),
  );
}

/** External identity URLs for the **Lab Organization** `sameAs` graph. */
export function orgSameAs(): string[] {
  const l = site.links;
  return [l.scholar, l.personalSite].filter((u): u is string => Boolean(u));
}

/** Resolve a site-relative path to an absolute URL for canonical/OG/structured data. */
export function absoluteUrl(path = ""): string {
  return `${site.url}${path.startsWith("/") || path === "" ? path : `/${path}`}`;
}
