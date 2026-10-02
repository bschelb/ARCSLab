import publications from '../../data/publications.json' with { type: 'json' };
import { expect, test } from './fixtures';

// Every posted PDF opens in the reader, renders its first page with a text layer, and
// scrolls to the end, with zero CSP violations (the cspViolations fixture fails the test
// otherwise). Plan Phase 6, step 4.
const withPdf = publications.filter((p) => 'pdf' in p && p.pdf);

test.describe('all PDFs in the reader', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const p of withPdf) {
    test(p.id, async ({ page }) => {
      await page.goto(`/papers/${p.id}`);
      const toolbar = page.getByRole('toolbar', { name: 'PDF reader controls' });
      await expect(toolbar.getByText(/Page 1 of \d+/)).toBeVisible({ timeout: 30_000 });
      const first = page.getByRole('region', { name: /^Page 1 of/ });
      await expect
        .poll(() => first.locator('canvas').evaluate((c: HTMLCanvasElement) => c.width))
        .toBeGreaterThan(0);
      // Scroll the reader to the last page so lazy pages (and their fonts/images) load.
      const host = page.getByLabel(`PDF of ${p.title}`);
      await host.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
      const total = Number(
        (await toolbar.getByText(/Page \d+ of \d+/).textContent())?.match(/of (\d+)/)?.[1],
      );
      await expect(page.getByRole('region', { name: `Page ${total} of ${total}` })).toBeVisible();
      await page.waitForTimeout(400);
    });
  }
});
