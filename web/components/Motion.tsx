'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * One small island for scroll reveals and count-ups across the site.
 *
 * Content is complete in the server HTML. On mount, only elements still below the fold get
 * hidden and then revealed as they scroll in, so nothing above the fold flashes, and
 * no-JS visitors and crawlers always see everything. Count-ups likewise only run for
 * stats that start off-screen; the final value is already in the HTML. Reduced motion: off.
 */
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;

    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
      below,
    );
    reveals.forEach((el) => el.classList.add('reveal-pending'));
    const rio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.remove('reveal-pending');
          rio.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    reveals.forEach((el) => rio.observe(el));

    const counters = Array.from(document.querySelectorAll<HTMLElement>('[data-count]')).filter(
      below,
    );
    const run = (el: HTMLElement) => {
      const target = Number(el.dataset.count ?? '0');
      const decimals = (el.dataset.count ?? '').split('.')[1]?.length ?? 0;
      const prefix = el.dataset.prefix ?? '';
      const suffix = el.dataset.suffix ?? '';
      const final = el.textContent;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min((t - t0) / 1400, 1);
        const v = target * (1 - Math.pow(1 - p, 3));
        el.textContent =
          p < 1
            ? `${prefix}${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
            : final;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          run(e.target as HTMLElement);
          cio.unobserve(e.target);
        }
      },
      { threshold: 0.4 },
    );
    counters.forEach((el) => cio.observe(el));

    return () => {
      rio.disconnect();
      cio.disconnect();
      reveals.forEach((el) => el.classList.remove('reveal-pending'));
    };
  }, [pathname]);

  return null;
}
