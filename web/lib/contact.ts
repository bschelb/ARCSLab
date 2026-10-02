/** Contact form rules (plan 4.3), shared by the form and its unit tests. */

export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzwzoal';

/** Inquiry types: option labels are what Formspree receives (unchanged from the Astro form). */
export const INQUIRY_TYPES = [
  { param: 'prospective', label: 'Prospective Graduate Student' },
  { param: 'collaboration', label: 'Research Collaboration' },
  { param: 'industry', label: 'Industry Partnership' },
  { param: 'media', label: 'Media / Press' },
  { param: 'speaking', label: 'Speaking Invitation' },
  { param: 'general', label: 'General Inquiry' },
] as const;

export type InquiryLabel = (typeof INQUIRY_TYPES)[number]['label'];

/** ?type=prospective → "Prospective Graduate Student"; unknown values → undefined. */
export function inquiryFromSearch(search: string): InquiryLabel | undefined {
  const t = new URLSearchParams(search).get('type');
  return INQUIRY_TYPES.find((i) => i.param === t)?.label;
}

export interface ContactValues {
  first_name: string;
  last_name: string;
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field errors in form order; an empty object means the form can be sent. */
export function validateContact(v: ContactValues): ContactErrors {
  const e: ContactErrors = {};
  if (!v.first_name.trim()) e.first_name = 'Enter your first name.';
  if (!v.last_name.trim()) e.last_name = 'Enter your last name.';
  if (!v.email.trim()) e.email = 'Enter your email address.';
  else if (!EMAIL.test(v.email.trim()))
    e.email = 'Enter an email address like name@university.edu.';
  if (!v.message.trim()) e.message = 'Enter a message.';
  return e;
}

/** A mailto: link carrying the visitor's message, offered when sending fails. */
export function mailtoFallback(to: string, v: Partial<ContactValues> & { type?: string }): string {
  const subject = `ARCS Lab Website Inquiry${v.type ? `: ${v.type}` : ''}`;
  const name = [v.first_name, v.last_name].filter(Boolean).join(' ');
  const body = [v.message ?? '', '', name, v.email ?? ''].join('\n').trim();
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
