import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every page shows its content (nothing left hidden by reveal)', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator('h1'), route).toBeVisible();
      expect(await page.locator('.reveal-pending').count(), route).toBe(0);
    }
  });

  test('PI stats render real values, not zeros (F5)', async ({ page }) => {
    await page.goto('/pi');
    const values = await page.locator('dl [data-count]').allTextContents();
    expect(values).toEqual(['49', '$2.8M', '5', '10']);
  });

  test('home publications link to their paper pages (F7)', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('a[href^="/papers/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBe(6);
  });

  test('all 49 publications are listed', async ({ page }) => {
    await page.goto('/publications');
    await expect(page.locator('#pub-list li[data-paper]')).toHaveCount(49);
  });
});
