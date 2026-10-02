'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  FORMSPREE_ENDPOINT,
  INQUIRY_TYPES,
  inquiryFromSearch,
  mailtoFallback,
  validateContact,
  type ContactErrors,
  type ContactValues,
} from '@/lib/contact';
import { site } from '@/lib/site';
import { useUrlSearch } from '@/lib/url-search';
import styles from './ContactForm.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const FIELDS: (keyof ContactValues)[] = ['first_name', 'last_name', 'email', 'message'];

// true once hydrated; the server (and no-JS) render keeps native browser validation.
const noop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/**
 * The contact form (plan 4.3). Without JavaScript it is a plain POST to Formspree with native
 * validation. With JavaScript it validates inline, sends with fetch (Accept: application/json),
 * and shows pending, success and error states; the error state offers a prefilled mailto.
 * `_gotcha` is Formspree's honeypot: if a bot fills it, nothing is sent and it sees "success".
 */
export default function ContactForm() {
  const hydrated = useHydrated();
  const urlType = inquiryFromSearch(useUrlSearch());
  const [type, setType] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<ContactErrors>({});
  const [sentValues, setSentValues] = useState<Partial<ContactValues> & { type?: string }>({});
  const doneRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'sent') doneRef.current?.focus();
    if (status === 'error') alertRef.current?.focus();
  }, [status]);

  const values = (form: HTMLFormElement): ContactValues => {
    const d = new FormData(form);
    const get = (k: string) => String(d.get(k) ?? '');
    return {
      first_name: get('first_name'),
      last_name: get('last_name'),
      email: get('email'),
      message: get('message'),
    };
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = values(form);
    const found = validateContact(v);
    setErrors(found);
    const firstBad = FIELDS.find((f) => found[f]);
    if (firstBad) {
      form.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }
    const data = new FormData(form);
    setSentValues({ ...v, type: String(data.get('inquiry_type') ?? '') });
    if (String(data.get('_gotcha') ?? '')) {
      setStatus('sent');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      setStatus(res.ok ? 'sent' : 'error');
      if (res.ok) form.reset();
    } catch {
      setStatus('error');
    }
  }

  /** Clear a field's error as soon as its value becomes valid. */
  function onFieldChange(name: keyof ContactValues, form: HTMLFormElement | null) {
    if (!errors[name] || !form) return;
    const next = validateContact(values(form));
    setErrors((prev) => ({ ...prev, [name]: next[name] }));
  }

  if (status === 'sent') {
    return (
      <div className={styles.done} role="status">
        <h3 ref={doneRef} tabIndex={-1} className={styles.doneTitle}>
          Message sent.
        </h3>
        <p>
          Thank you{sentValues.first_name ? `, ${sentValues.first_name}` : ''}. We typically respond
          within 2–3 business days. For urgent inquiries, email Dr. Schelble directly at{' '}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setStatus('idle');
            setErrors({});
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const field = (name: keyof ContactValues) => ({
    name,
    id: `cf-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `cf-${name}-error` : undefined,
    onChange: (e: { currentTarget: { form: HTMLFormElement | null } }) =>
      onFieldChange(name, e.currentTarget.form),
    required: true,
  });
  const error = (name: keyof ContactValues) =>
    errors[name] ? (
      <p id={`cf-${name}-error`} className={styles.error}>
        <span className={styles.errorMark} aria-hidden="true">
          !
        </span>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form
      action={FORMSPREE_ENDPOINT}
      method="POST"
      className={styles.form}
      onSubmit={onSubmit}
      noValidate={hydrated}
      aria-busy={status === 'sending'}
    >
      <input type="hidden" name="_subject" value="ARCS Lab Website Inquiry" />
      <div className={styles.hp} aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className={styles.req}>Fields marked * are required.</p>
      <div className={styles.row}>
        <div className={styles.group}>
          <label htmlFor="cf-first_name">First Name *</label>
          <input
            {...field('first_name')}
            type="text"
            placeholder="Jane"
            autoComplete="given-name"
          />
          {error('first_name')}
        </div>
        <div className={styles.group}>
          <label htmlFor="cf-last_name">Last Name *</label>
          <input
            {...field('last_name')}
            type="text"
            placeholder="Smith"
            autoComplete="family-name"
          />
          {error('last_name')}
        </div>
      </div>
      <div className={styles.group}>
        <label htmlFor="cf-email">Email *</label>
        <input
          {...field('email')}
          type="email"
          placeholder="jane@university.edu"
          autoComplete="email"
        />
        {error('email')}
      </div>
      <div className={styles.group}>
        <label htmlFor="cf-aff">Affiliation</label>
        <input
          id="cf-aff"
          type="text"
          name="affiliation"
          placeholder="University / Organization"
          autoComplete="organization"
        />
      </div>
      <div className={styles.group}>
        <label htmlFor="cf-type">Inquiry Type</label>
        <select
          id="cf-type"
          name="inquiry_type"
          value={type ?? urlType ?? INQUIRY_TYPES[0].label}
          onChange={(e) => setType(e.target.value)}
        >
          {INQUIRY_TYPES.map((t) => (
            <option key={t.param} value={t.label}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.group}>
        <label htmlFor="cf-message">Message *</label>
        <textarea {...field('message')} placeholder="Tell us about your interest or inquiry..." />
        {error('message')}
      </div>

      {status === 'error' && (
        <div ref={alertRef} tabIndex={-1} className={styles.alert} role="alert">
          <p>
            <strong>Your message wasn&apos;t sent.</strong> Please try again, or email it instead.
          </p>
          <a href={mailtoFallback(site.email, sentValues)} className="btn btn-ghost">
            Email {site.email}
          </a>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Message'}{' '}
        <span className="arr" aria-hidden="true">
          →
        </span>
      </button>
      <p className={styles.note}>
        We typically respond within 2–3 business days. For urgent inquiries, email Dr. Schelble
        directly at <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </form>
  );
}
