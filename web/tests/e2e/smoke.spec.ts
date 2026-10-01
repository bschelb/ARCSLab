import { expect, test } from '@playwright/test';

test('home renders and is not indexable before launch', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('legacy .html URLs redirect permanently', async ({ request }) => {
  const res = await request.get('/research.html', { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()['location']).toBe('/research');
});
