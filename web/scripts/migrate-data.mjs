#!/usr/bin/env node
// One-off (re-runnable) conversion of the Astro content JSON into the plan section 5 shapes.
//
//   node scripts/migrate-data.mjs
//
// Reads ../astro-site/src/data/*.json, writes data/*.json, prints a field-by-field summary of
// every transformation, and fails unless every original string/number value survives — either
// verbatim somewhere in the new data, or as an explicitly logged transformation.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.resolve(root, '..', 'astro-site', 'src', 'data');
const outDir = path.join(root, 'data');

const read = async (f) => JSON.parse(await readFile(path.join(srcDir, f), 'utf8'));
const src = {
  publications: await read('publications.json'),
  research: await read('research.json'),
  team: await read('team.json'),
  funding: await read('funding.json'),
  talks: await read('talks.json'),
};

/** Every value that does not survive verbatim is logged here: { file, field, from, to, why }. */
const transforms = [];
const log = (file, field, from, to, why) => transforms.push({ file, field, from, to, why });

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const omitUndefined = (o) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// ── Publications ────────────────────────────────────────────────────────────
const publications = src.publications.map((p) => {
  const inPress = p.award === 'In Press';
  if (inPress)
    log(
      'publications',
      `${p.id}.award`,
      'In Press',
      'status: "in-press"',
      'F11: status split out of award',
    );
  return omitUndefined({
    id: p.id,
    year: p.year,
    status: inPress ? 'in-press' : 'published',
    type: p.type,
    title: p.title,
    authors: p.authors,
    authorsList: p.authorsList,
    venue: p.venue,
    venueShort: p.venueShort,
    award: p.award && !inPress ? p.award : undefined,
    doi: p.doi,
    url: p.url,
    abstract: p.abstract,
    tags: p.tags ?? [],
    pdf: p.pdf,
  });
});

// ── Research areas ──────────────────────────────────────────────────────────
// Icon names come from the iconMap in astro-site/src/pages/research.astro.
const ICON_BY_EMOJI = {
  '🤝': 'network',
  '🔒': 'shield',
  '📚': 'layers',
  '🎯': 'radar',
  '🤖': 'bot',
  '🔬': 'flask',
};
const AREA_SLUGS = [
  'human-ai-teaming',
  'trustworthy-ai',
  'training',
  'situational-awareness',
  'applied-robotics',
  'evaluation-validation',
];
// Publication tags that link papers to each area. A first mapping drawn from each area's
// description and bullets; reviewable, and only Phase 5's area pages consume it.
const MATCH_TAGS = {
  'human-ai-teaming': [
    'human-AI teaming',
    'team cognition',
    'shared mental models',
    'team dynamics',
    'team composition',
    'communication',
    'leadership',
  ],
  'trustworthy-ai': [
    'trust',
    'AI ethics',
    'responsible AI',
    'explainability',
    'acceptance',
    'risk frameworks',
    'decision-making',
  ],
  training: ['training', 'simulation', 'generative AI'],
  'situational-awareness': [
    'situational awareness',
    'information sharing',
    'cybersecurity',
    'defense',
  ],
  'applied-robotics': [
    'adaptive autonomy',
    'safety',
    'high-risk environments',
    'reinforcement learning',
    'healthcare',
  ],
  'evaluation-validation': [
    'methods',
    'review',
    'perception',
    'collaborative technology',
    'design',
    'applied settings',
    'future of work',
  ],
};

// research.json abbreviates some titles; these map to their publications.json ids explicitly.
const PAPER_ID_OVERRIDES = {
  'A Comparative Evaluation of Ad Hoc Team Performance in Modern Collaborative Technology':
    'schelble-2024-ad-hoc-teams',
};

const research = src.research.map((a, i) => {
  const slug = AREA_SLUGS[i];
  const icon = ICON_BY_EMOJI[a.icon];
  if (!slug || !icon) throw new Error(`research[${i}] has no slug or icon mapping`);
  log(
    'research',
    `${slug}.icon`,
    a.icon,
    icon,
    'F11: emoji replaced by icon name (research.astro iconMap)',
  );
  const pubs = a.pubs.map((pub) => {
    const want = norm(pub.title);
    const paperId =
      PAPER_ID_OVERRIDES[pub.title] ??
      publications.find((p) => norm(p.title) === want || norm(p.title).startsWith(want))?.id;
    return omitUndefined({
      authors: pub.authors,
      title: pub.title,
      venue: pub.venue,
      award: pub.award,
      paperId,
    });
  });
  return omitUndefined({
    slug,
    num: a.num,
    icon,
    tag: a.tag,
    title: a.title,
    description: a.description,
    description2: a.description2 ?? undefined,
    bullets: a.bullets,
    pubs,
    matchTags: MATCH_TAGS[slug],
  });
});

// ── People ──────────────────────────────────────────────────────────────────
const LINK_KEYS = {
  personalWebsite: 'website',
  googleScholar: 'scholar',
  orcid: 'orcid',
  linkedin: 'linkedin',
  github: 'github',
};
// Start years for members whose JSON has no tenure, from the CV data in CLAUDE.md
// (PhD students) and the lab's founding (PI, August 2024).
const START_YEAR = {
  'beau-schelble': 2024,
  'sarah-mendoza': 2025,
  'yayun-tian': 2025,
  'naveena-nagaraju': 2026,
};

function parseTenure(who, tenure) {
  const m = /^(\d{4})–(Present|\d{4})$/.exec(tenure ?? '');
  if (!m) return undefined;
  log(
    'team',
    `${who}.tenure`,
    tenure,
    `startYear: ${m[1]}${m[2] === 'Present' ? '' : `, endYear: ${m[2]}`}`,
    'plan 5: numeric start/end years',
  );
  return { startYear: Number(m[1]), endYear: m[2] === 'Present' ? undefined : Number(m[2]) };
}

function authorAliases(name) {
  const parts = name
    .replace(/^Dr\.\s+/, '')
    .trim()
    .split(/\s+/);
  const last = parts.at(-1);
  const initial = parts[0][0];
  const found = new Set();
  for (const p of publications) {
    for (const a of p.authorsList) {
      const ap = a.trim().split(/\s+/);
      if (ap.at(-1) === last && ap[0][0] === initial) found.add(a);
    }
  }
  return found.size ? [...found].sort() : undefined;
}

function person(raw, group) {
  const slug = slugify(raw.name.replace(/^Dr\.\s+/, '').replace(/\b([A-Z])\.\s*/g, ''));
  const years = parseTenure(slug, raw.tenure) ?? { startYear: START_YEAR[slug] };
  if (years.startYear === undefined) throw new Error(`No start year for ${slug}`);
  let photo;
  if (raw.photo) {
    photo = `/images/people/${slug}.jpg`;
    log('team', `${slug}.photo`, raw.photo, photo, 'resized by scripts/optimize-images.mjs (F1)');
  }
  let links;
  if (raw.links && Object.keys(raw.links).length) {
    links = {};
    for (const [k, v] of Object.entries(raw.links)) {
      const key = LINK_KEYS[k];
      if (!key) throw new Error(`Unknown link key ${k} on ${slug}`);
      links[key] = v;
    }
  }
  let degrees;
  let education = raw.education;
  if (education && typeof education === 'object') {
    degrees = education;
    education = undefined;
  }
  if (raw.stats) {
    for (const [k, v] of Object.entries(raw.stats)) {
      log(
        'team',
        `${slug}.stats.${k}`,
        String(v),
        'computed from data (lib/stats.ts)',
        'F6: no hand-typed stats',
      );
    }
  }
  return omitUndefined({
    slug,
    name: raw.name,
    group,
    role: raw.role,
    photo,
    cropPosition: raw.cropPosition,
    education,
    degree: raw.degree,
    startYear: years.startYear,
    endYear: years.endYear,
    bio: raw.bio,
    shortBio: raw.shortBio,
    outcome: group === 'alumni' ? (raw.outcome ?? null) : undefined,
    authorAliases: authorAliases(raw.name),
    links,
    title: raw.title,
    subtitle: raw.subtitle,
    department: raw.department,
    email: raw.email,
    degrees,
  });
}

const team = {
  people: [
    person(src.team.pi, 'pi'),
    ...src.team.phdStudents.map((p) => person(p, 'phd')),
    ...src.team.dengStudents.map((p) => person(p, 'deng')),
    ...src.team.undergraduates.map((p) => person(p, 'undergrad')),
    ...src.team.alumni.map((p) => person(p, 'alumni')),
  ],
  collaborators: src.team.collaborators,
};

// ── Funding ─────────────────────────────────────────────────────────────────
// funderShort labels and ids follow the funding table in CLAUDE.md.
const GRANT_META = [
  ['aro-shared-world-models', 'ARO'],
  ['aro-compromised-ai-teammates', 'ARO'],
  ['utk-ai-teammate-acceptance', 'UTK Internal'],
  ['utk-drap-adaptive-teammates', 'UTK DRAP'],
  ['utk-ise-undergraduate-support', 'UTK ISE Dept'],
];
const PENDING_META = [
  ['ari-talos', 'ARI'],
  ['ari-unite', 'ARI'],
  ['nsf-transactive-memory', 'NSF'],
];

function grant(raw, [id, funderShort], status) {
  const amount = Number(raw.amount.replace(/[$,]/g, ''));
  log('funding', `${id}.amount`, raw.amount, amount, 'F11: numeric USD');
  const role = /^(PI|Co-PI)(?: — (\d+)%)?$/.exec(raw.piRole);
  if (!role) throw new Error(`Unparsed piRole ${raw.piRole}`);
  log(
    'funding',
    `${id}.piRole`,
    raw.piRole,
    `role: ${role[1]}${role[2] ? `, effortPct: ${role[2]}` : ''}`,
    'plan 5',
  );
  const internal = raw.status === 'Active — Internal';
  if (raw.status)
    log(
      'funding',
      `${id}.status`,
      raw.status,
      `status: ${status}, internal: ${internal}`,
      'plan 5',
    );
  else log('funding', `${id}.status`, '(pending list)', `status: ${status}`, 'plan 5');
  return omitUndefined({
    id,
    status,
    title: raw.title,
    funder: raw.funder,
    funderShort,
    role: role[1],
    effortPct: role[2] ? Number(role[2]) : undefined,
    amount,
    internal,
    description: raw.description,
  });
}

log(
  'funding',
  'totalAwardedAsPI',
  src.funding.totalAwardedAsPI,
  'computed (lib/funding.ts piTotal)',
  'F6',
);
const funding = {
  grants: [
    ...src.funding.active.map((g, i) => grant(g, GRANT_META[i], 'active')),
    ...src.funding.pending.map((g, i) => grant(g, PENDING_META[i], 'pending')),
  ],
};

// ── Talks and news ──────────────────────────────────────────────────────────
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
// "Spring 2026" has no month. It sorts as April (mid-spring), which also keeps its current
// position between "June 2026" and the April items, and displays as written.
const SEASON_MONTH = { Spring: 4, Summer: 7, Fall: 10, Autumn: 10, Winter: 1 };

function isoDate(file, id, raw) {
  let m = /^([A-Z][a-z]+) (\d{4})$/.exec(raw);
  if (m && MONTHS.includes(m[1])) {
    const iso = `${m[2]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}`;
    log(file, `${id}.date`, raw, iso, 'F11: ISO dates');
    return { date: iso };
  }
  m = /^([A-Z][a-z]+) (\d{4})$/.exec(raw);
  if (m && SEASON_MONTH[m[1]]) {
    const iso = `${m[2]}-${String(SEASON_MONTH[m[1]]).padStart(2, '0')}`;
    log(
      file,
      `${id}.date`,
      raw,
      `date: ${iso}, dateLabel: "${raw}"`,
      'season kept as display label',
    );
    return { date: iso, dateLabel: raw };
  }
  throw new Error(`Unparsed date "${raw}"`);
}

const usedIds = new Set();
function newsId(date, title) {
  const base = slugify(`${date} ${title}`).slice(0, 64).replace(/-+$/, '');
  let id = base;
  for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
  usedIds.add(id);
  return id;
}

const talks = src.talks.invitedTalks.map((t) => {
  const tmpId = slugify(t.title).slice(0, 40);
  const d = isoDate('talks', tmpId, t.date);
  return omitUndefined({
    id: newsId(d.date, t.title),
    ...d,
    kind: /^Keynote\b/.test(t.title) ? 'keynote' : 'invited-talk',
    title: t.title,
    venue: t.venue,
    location: t.location,
    virtual: /virtual/i.test(t.location) ? true : undefined,
    speaker: t.speaker,
    link: t.link,
  });
});

const news = src.talks.media.map((item) => {
  const tmpId = slugify(item.title).slice(0, 40);
  const d = isoDate('news', tmpId, item.date);
  const kind = item.tag.toLowerCase();
  log('news', `${tmpId}.tag`, item.tag, `kind: ${kind}`, 'plan 5: kind field');
  return omitUndefined({
    id: newsId(d.date, item.title),
    ...d,
    kind,
    title: item.title,
    description: item.description,
    icon: item.icon,
    link: item.link,
  });
});

// ── Write ───────────────────────────────────────────────────────────────────
const out = { publications, research, team, funding, talks, news };
await mkdir(outDir, { recursive: true });
for (const [name, data] of Object.entries(out)) {
  await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
}

// ── Survival check ──────────────────────────────────────────────────────────
function leaves(value, acc = []) {
  if (typeof value === 'string' || typeof value === 'number') acc.push(String(value));
  else if (Array.isArray(value)) value.forEach((v) => leaves(v, acc));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => leaves(v, acc));
  return acc;
}
const newValues = new Set(leaves(out));
const transformed = new Set(transforms.map((t) => String(t.from)));
const lost = [];
for (const [file, data] of Object.entries(src)) {
  for (const v of leaves(data)) {
    if (!newValues.has(v) && !transformed.has(v)) lost.push(`${file}: ${JSON.stringify(v)}`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(
  'migrate-data: wrote',
  Object.entries(out)
    .map(
      ([k, v]) =>
        `data/${k}.json (${
          Array.isArray(v)
            ? v.length
            : Object.values(v)
                .map((x) => x.length)
                .join('+')
        })`,
    )
    .join(', '),
);
const byField = new Map();
for (const t of transforms) {
  const key = `${t.file} · ${t.field.replace(/^[^.]+\./, '*.')} — ${t.why}`;
  byField.set(key, [...(byField.get(key) ?? []), t]);
}
console.log('\nTransformations by field:');
for (const [key, list] of byField) {
  console.log(`  ${key}: ${list.length}`);
  for (const t of list.slice(0, 3))
    console.log(
      `      ${JSON.stringify(t.from)} → ${typeof t.to === 'string' ? t.to : JSON.stringify(t.to)}`,
    );
  if (list.length > 3) console.log(`      … and ${list.length - 3} more`);
}
console.log('\nResearch featured pubs matched to papers:');
for (const a of research)
  for (const p of a.pubs) console.log(`  ${a.slug}: ${p.paperId ?? '(no match)'} ← ${p.title}`);
console.log('\nAuthor aliases:');
for (const p of team.people)
  console.log(`  ${p.slug}: ${(p.authorAliases ?? []).join('; ') || '(none)'}`);

if (lost.length) {
  console.error(
    `\nFAIL: ${lost.length} original value(s) did not survive:\n  ${lost.join('\n  ')}`,
  );
  process.exit(1);
}
console.log(`\nOK: every original value survives (${transforms.length} logged transformations).`);
