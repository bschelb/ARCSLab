import { expect, test, type Page } from './fixtures';
import { ROUTES } from './routes';

/** Tab once; return what got focus and whether a focus indicator is visible on it. */
// Safari (and Playwright's WebKit) moves Tab between form controls only by default;
// Option+Tab is how a keyboard user reaches links there.
const TAB = () => (test.info().project.name === 'webkit' ? 'Alt+Tab' : 'Tab');

async function tab(page: Page, shift = false) {
  await page.keyboard.press(shift ? `Shift+${TAB()}` : TAB());
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { label: '(body)', visible: false };
    const cs = getComputedStyle(el);
    const after = getComputedStyle(el, '::after');
    const ring =
      (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) ||
      (after.outlineStyle !== 'none' && parseFloat(after.outlineWidth) >= 2) ||
      cs.boxShadow !== 'none';
    const label = (
      el.getAttribute('aria-label') ||
      (el as HTMLInputElement).labels?.[0]?.textContent ||
      el.textContent ||
      el.tagName
    )
      .replace(/\s+/g, ' ')
      .trim();
    return { label, visible: ring };
  });
}

async function tabUntil(page: Page, match: RegExp, max = 80) {
  for (let i = 0; i < max; i++) {
    const f = await tab(page);
    expect(f.visible, `visible focus on "${f.label}"`).toBe(true);
    if (match.test(f.label)) return f;
  }
  throw new Error(`never reached ${match}`);
}

test.describe('keyboard-only walkthrough', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('skip link, then logo, primary nav in visual order, then Contact', async ({ page }) => {
    await page.goto('/');
    const skip = await tab(page);
    expect(skip.label).toBe('Skip to main content');
    expect(skip.visible).toBe(true);
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeInViewport();
    const order: string[] = [];
    for (let i = 0; i < 9; i++) {
      const f = await tab(page);
      expect(f.visible, f.label).toBe(true);
      order.push(f.label);
    }
    expect(order).toEqual([
      'ARCS Lab home',
      'Research',
      'Publications',
      'Team',
      'PI',
      'Funding',
      'News & Talks',
      'Join',
      'Contact',
    ]);
  });

  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/research');
    await tab(page);
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('publications explorer is fully operable from the keyboard', async ({ page }) => {
    await page.goto('/publications');
    await tabUntil(page, /^Search publications$/);
    await page.keyboard.type('trust');
    await expect(page).toHaveURL(/\?q=trust$/);
    await tabUntil(page, /^Journals$/);
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Journals' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await tabUntil(page, /^Award-Winning$/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/award=1/);
    await tabUntil(page, /^Clear filters$/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/publications$/);
  });

  test('PDF reader toolbar works from the keyboard', async ({ page }) => {
    await page.goto('/papers/schelble-2022-lets-think-together');
    const toolbar = page.getByRole('toolbar', { name: 'PDF reader controls' });
    await expect(toolbar.getByText(/Page 1 of \d+/)).toBeVisible({ timeout: 20_000 });
    const zoom = toolbar.getByLabel(/^Zoom \d+%$/);
    const before = await zoom.textContent();
    await tabUntil(page, /^Zoom in$/);
    await page.keyboard.press('Enter');
    await expect(zoom).not.toHaveText(before ?? '');
    await tabUntil(page, /^PDF of /);
  });

  test('contact form fields come in visual order; the honeypot is skipped', async ({ page }) => {
    await page.goto('/contact');
    await tabUntil(page, /^First Name \*$/);
    const rest: string[] = [];
    for (let i = 0; i < 6; i++) {
      const f = await tab(page);
      expect(f.visible, f.label).toBe(true);
      rest.push(f.label);
    }
    expect(rest).toEqual([
      'Last Name *',
      'Email *',
      'Affiliation',
      'Inquiry Type',
      'Message *',
      'Send Message →',
    ]);
  });

  test('join FAQ opens with Enter and Space', async ({ page }) => {
    await page.goto('/join');
    await tabUntil(page, /Is funding available/);
    await page.keyboard.press('Enter');
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    await tab(page);
    await page.keyboard.press('Space');
    await expect(page.locator('details').nth(1)).toHaveAttribute('open', '');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });

  test('no animation runs: still terrain, no reveals, no looping CSS', async ({ page }) => {
    for (const route of ['/', '/research', '/publications']) {
      await page.goto(route);
      await expect(page.locator('canvas[data-ready="true"]').first()).toBeAttached({
        timeout: 15_000,
      });
      for (const flag of await page
        .locator('canvas')
        .evaluateAll((cs) => cs.map((c) => (c as HTMLCanvasElement).dataset.animate)))
        expect(flag, route).toBe('false');
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(300);
      expect(await page.locator('.reveal-pending').count(), route).toBe(0);
      const running = await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity,
            ).length,
      );
      expect(running, route).toBe(0);
    }
  });
});

test.describe('target size (WCAG 2.2 SC 2.5.8, 24 x 24 px)', () => {
  for (const width of [390, 1440]) {
    test(`interactive targets at ${width}px`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'layout check runs once, in Chromium');
      await page.setViewportSize({ width, height: 900 });
      const small: string[] = [];
      for (const route of ROUTES) {
        await page.goto(route);
        const found = await page.evaluate(() => {
          const out: string[] = [];
          const els = document.querySelectorAll<HTMLElement>(
            'a[href], button, input:not([type=hidden]), select, textarea, summary',
          );
          for (const el of els) {
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (el.closest('[aria-hidden="true"], [hidden]')) continue;
            if (el.tabIndex < 0) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue; // skip link, sr-only
            // Inline exception: links inside a sentence of running text.
            if (cs.display === 'inline' && el.tagName === 'A') continue;
            if (r.width < 24 || r.height < 24)
              out.push(
                `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
              );
          }
          return out;
        });
        small.push(...found.map((f) => `${route}: ${f}`));
      }
      expect([...new Set(small)]).toEqual([]);
    });
  }
});
