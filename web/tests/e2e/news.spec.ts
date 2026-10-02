import { expect, test } from './fixtures';

test.describe('News & Talks timeline', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('one dated timeline, newest year first, every item listed', async ({ page }) => {
    await page.goto('/talks');
    await expect(page.locator('h1')).toContainText('News');
    const years = (await page.locator('main h2').allTextContents()).map(Number);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    const total = await page.locator('li[data-kind]').count();
    expect(total).toBe(22);
    await expect(page.locator('[aria-live="polite"]')).toHaveText('22 items');
  });

  test('kind chips filter, expose aria-pressed and round-trip through ?kind=', async ({ page }) => {
    await page.goto('/talks');
    const press = page.getByRole('button', { name: 'Press' });
    await press.click();
    await expect(press).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\?kind=press$/);
    await expect(page.locator('li[data-kind]')).toHaveCount(3);
    await expect(page.locator('li[data-kind="press"]')).toHaveCount(3);
    await page.getByRole('button', { name: 'Keynotes' }).click();
    await expect(page.locator('li[data-kind]')).toHaveCount(1);
    await page.goto('/talks?kind=award');
    await expect(page.getByRole('button', { name: 'Awards' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('li[data-kind]')).toHaveCount(5);
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page).toHaveURL(/\/talks$/);
    await expect(page.locator('li[data-kind]')).toHaveCount(22);
  });

  test('without JavaScript every item is listed', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/talks?kind=press');
    await expect(page.locator('li[data-kind]')).toHaveCount(22);
    await ctx.close();
  });
});
