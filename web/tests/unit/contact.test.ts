import { describe, expect, it } from 'vitest';
import { inquiryFromSearch, mailtoFallback, validateContact } from '@/lib/contact';

const ok = { first_name: 'Jane', last_name: 'Smith', email: 'jane@utk.edu', message: 'Hello' };

describe('contact form rules', () => {
  it('accepts a complete message', () => {
    expect(validateContact(ok)).toEqual({});
  });

  it('flags each missing or malformed field, in form order', () => {
    const e = validateContact({ first_name: ' ', last_name: '', email: 'jane@', message: '' });
    expect(Object.keys(e)).toEqual(['first_name', 'last_name', 'email', 'message']);
    expect(e.email).toMatch(/like name@university\.edu/);
    expect(validateContact({ ...ok, email: '' }).email).toBe('Enter your email address.');
  });

  it('preselects the inquiry type from ?type=', () => {
    expect(inquiryFromSearch('?type=prospective')).toBe('Prospective Graduate Student');
    expect(inquiryFromSearch('?type=media')).toBe('Media / Press');
    expect(inquiryFromSearch('?type=spam')).toBeUndefined();
  });

  it('builds a prefilled mailto fallback', () => {
    const href = mailtoFallback('bschelbl@utk.edu', { ...ok, type: 'Media / Press' });
    expect(href.startsWith('mailto:bschelbl@utk.edu?subject=')).toBe(true);
    expect(decodeURIComponent(href)).toContain('ARCS Lab Website Inquiry: Media / Press');
    expect(decodeURIComponent(href)).toContain('Hello\n\nJane Smith\njane@utk.edu');
  });
});
