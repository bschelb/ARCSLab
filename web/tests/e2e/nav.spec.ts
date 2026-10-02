import { expect, test } from '@playwright/test';

test.describe('mobile navigation sheet', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens, traps focus, closes on Escape and returns focus', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const sheet = page.locator('#mobile-nav');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('link', { name: /Research/ })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('closes after navigating', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: /Team/ }).click();
    await expect(page).toHaveURL(/\/team$/);
    await expect(page.locator('#mobile-nav')).toBeHidden();
  });
});

test('desktop nav marks the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/funding');
  await expect(
    page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Funding' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('publication filters expose pressed state and announce counts', async ({ page }) => {
  await page.goto('/publications');
  const journals = page.getByRole('button', { name: 'Journals' });
  await journals.click();
  await expect(journals).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[aria-live="polite"]')).toHaveText('26 of 49 publications');
  await expect(page.locator('#pub-list li[data-type]:visible')).toHaveCount(26);
  await page.getByRole('button', { name: 'Award-Winning' }).click();
  await expect(page.locator('#pub-list li[data-type]:visible')).toHaveCount(5);
});

test('unknown routes return the 404 page', async ({ page }) => {
  const res = await page.goto('/nope-not-here');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('not here');
});

test('legacy .html URLs redirect permanently', async ({ request }) => {
  const res = await request.get('/research.html', { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()['location']).toBe('/research');
});

test('robots meta follows the environment', async ({ page }) => {
  await page.goto('/');
  const robots = page.locator('meta[name="robots"]');
  if (process.env.EXPECT_PRODUCTION === '1')
    await expect(robots).toHaveAttribute('content', /^index,follow/);
  else await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
});
