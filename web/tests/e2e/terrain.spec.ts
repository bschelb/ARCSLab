import { expect, test } from './fixtures';

test.describe('terrain contours', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('draw in a Web Worker on an OffscreenCanvas', async ({ page }) => {
    const workers: string[] = [];
    page.on('worker', (w) => workers.push(w.url()));
    await page.goto('/');
    await expect(page.locator('canvas[data-ready="true"]').first()).toBeAttached({
      timeout: 15_000,
    });
    expect(workers.length).toBeGreaterThan(0);
  });

  test('fall back to the main thread when the worker cannot load', async ({ page }) => {
    await page.route(/worker.*\.js|\.worker\./, (route) => route.abort());
    await page.goto('/');
    await expect(page.locator('canvas[data-ready="true"]').first()).toBeAttached({
      timeout: 15_000,
    });
  });
});
