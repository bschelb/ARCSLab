'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isActive, NAV_CTA, NAV_ITEMS } from '@/lib/nav';
import styles from './SiteNav.module.css';

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Close the sheet whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile sheet: lock scroll, trap focus, Escape closes and returns focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sheet = sheetRef.current;
    const focusables = () =>
      Array.from(sheet?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [toggleRef.current, ...focusables()].filter((x): x is HTMLElement => !!x);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <header className={`${styles.nav} on-dark ${scrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.logo} aria-label="ARCS Lab home">
        <Image src="/images/logo-nav.png" alt="" width={46} height={46} priority />
        <span className={styles.logoText}>
          ARCS <span className={styles.logoLab}>Lab</span>
          <span className={styles.logoSub}>Human–AI Teaming · UT Knoxville</span>
        </span>
      </Link>

      <nav aria-label="Primary" className={styles.desktop}>
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.link}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={NAV_CTA.href}
              className={styles.cta}
              aria-current={isActive(pathname, NAV_CTA.href) ? 'page' : undefined}
            >
              {NAV_CTA.label}
            </Link>
          </li>
        </ul>
      </nav>

      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <span className={`${styles.bars} ${open ? styles.barsOpen : ''}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        id="mobile-nav"
        ref={sheetRef}
        className={`${styles.sheet} ${open ? styles.sheetOpen : ''}`}
        hidden={!open}
      >
        <nav aria-label="Primary mobile">
          <ul>
            {[...NAV_ITEMS, NAV_CTA].map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.sheetLink}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.sheetIdx} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.sheetFoot}>35.9544° N / 83.9295° W · Knoxville, TN</p>
      </div>
    </header>
  );
}
