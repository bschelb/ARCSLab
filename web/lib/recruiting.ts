/** Recruiting copy, driven by `site.recruiting` (the single source for /join, stubs and home). */
export interface Recruiting {
  open: boolean;
  term?: string;
  note?: string;
}

/** "Now recruiting" / "Not recruiting right now". */
export function recruitingHeadline(r: Recruiting): string {
  return r.open ? 'Now recruiting' : 'Not recruiting right now';
}

/** "For a Spring, Summer, or Fall 2027 start", the note, or a neutral fallback. */
export function recruitingDetail(r: Recruiting): string {
  if (r.note) return r.note;
  if (r.open) return r.term ? `For a ${r.term} start` : 'Graduate and undergraduate positions';
  return 'Check back for future openings, or get in touch to introduce yourself.';
}

/** One sentence for stubs, callouts and llms.txt. */
export function recruitingSentence(r: Recruiting): string {
  if (!r.open) return 'The ARCS Lab is not recruiting right now.';
  return r.term
    ? `The ARCS Lab is recruiting students for a ${r.term} start.`
    : 'The ARCS Lab is recruiting graduate students and undergraduate researchers.';
}

/** Contact form link with the inquiry type preselected (plan 4.3). */
export const PROSPECTIVE_CONTACT = '/contact?type=prospective';
