/** Roster helpers: groups, profile links, and matching people to their publications. */
import type { Person, PersonGroup, Publication } from './schemas';

export const GROUP_ORDER: readonly PersonGroup[] = ['pi', 'phd', 'deng', 'undergrad', 'alumni'];

export function byGroup(people: Person[], group: PersonGroup): Person[] {
  return people.filter((p) => p.group === group);
}

/** Current lab members (everyone but alumni), PI first, in data order. */
export function currentMembers(people: Person[]): Person[] {
  return people.filter((p) => p.group !== 'alumni');
}

export function personBySlug(people: Person[], slug: string): Person | undefined {
  return people.find((p) => p.slug === slug);
}

/** Where a person's card links: the PI keeps the dedicated /pi page (D9). */
export function profileHref(person: Pick<Person, 'group' | 'slug'>): string {
  return person.group === 'pi' ? '/pi' : `/team/${person.slug}`;
}

/** The person's name without an honorific ("Dr. Beau G. Schelble" → "Beau G. Schelble"). */
export function plainName(person: Pick<Person, 'name'>): string {
  return person.name.replace(/^Dr\.\s+/, '');
}

/** Initials for the monogram shown when a member has no photo ("Owen Fair" → "OF"). */
export function monogram(person: Pick<Person, 'name'>): string {
  const parts = plainName(person)
    .split(/\s+/)
    .filter((w) => !/^[A-Z]\.$/.test(w));
  return (
    (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')
  ).toUpperCase();
}

/** Publications that list this person, matched through `authorAliases` against `authorsList`. */
export function publicationsFor(person: Pick<Person, 'authorAliases'>, pubs: Publication[]) {
  const aliases = new Set(person.authorAliases ?? []);
  if (!aliases.size) return [];
  return pubs.filter((p) => p.authorsList.some((a) => aliases.has(a)));
}
