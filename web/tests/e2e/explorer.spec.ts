import { expect, test, type Page } from '@playwright/test';

const rows = (page: Page) => page.locator('#pub-list li[data-paper]');
const count = (page: Page) => page.locator('[aria-live="polite"]');

test.describe('publications explorer', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('server-rendered list is complete before any filtering', async ({ page }) => {
    await page.goto('/publications');
    await expect(rows(page)).toHaveCount(49);
    await expect(count(page)).toHaveText('49 publications');
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  test('search filters by text and writes ?q= to the URL', async ({ page }) => {
    await page.goto('/publications');
    await page.getByRole('searchbox', { name: 'Search publications' }).fill('shared mental');
    await expect(page).toHaveURL(/\?q=shared\+mental$/);
    const n = await rows(page).count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(49);
    await expect(count(page)).toHaveText(`${n} of 49 publications`);
  });

  test('type chips are exclusive and expose aria-pressed', async ({ page }) => {
    await page.goto('/publications');
    const journals = page.getByRole('button', { name: 'Journals' });
    await journals.click();
    await expect(journals).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(rows(page)).toHaveCount(26);
    await expect(count(page)).toHaveText('26 of 49 publications');
    await page.getByRole('button', { name: 'Book Chapters' }).click();
    await expect(rows(page)).toHaveCount(3);
    await expect(page).toHaveURL(/\?type=chapter$/);
  });

  test('award and free PDF toggles combine', async ({ page }) => {
    await page.goto('/publications');
    const award = page.getByRole('button', { name: 'Award-Winning' });
    await award.click();
    await expect(award).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(5);
    await page.getByRole('button', { name: 'Free PDF' }).click();
    await expect(page).toHaveURL(/award=1&pdf=1/);
    const n = await rows(page).count();
    expect(n).toBeLessThanOrEqual(5);
    await award.click();
    await expect(award).toHaveAttribute('aria-pressed', 'false');
  });

  test('year, area and sort selects', async ({ page }) => {
    await page.goto('/publications');
    await page.getByLabel('Year').selectOption('2025');
    await expect(page.locator('#pub-list h2')).toHaveText(['2025']);
    await page.getByLabel('Year').selectOption('');
    await page.getByLabel('Research area').selectOption('training');
    await expect(page).toHaveURL(/\?area=training$/);
    const n = await rows(page).count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(49);
    await page.getByLabel('Research area').selectOption('');
    await page.getByLabel('Sort').selectOption('oldest');
    const years = await page.locator('#pub-list h2').allTextContents();
    expect(years.map(Number)).toEqual([...years.map(Number)].sort((a, b) => a - b));
  });

  test('a shared URL restores the filters (round trip)', async ({ page }) => {
    await page.goto('/publications?type=journal&award=1&q=trust');
    await expect(page.getByRole('searchbox', { name: 'Search publications' })).toHaveValue('trust');
    await expect(page.getByRole('button', { name: 'Journals' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Award-Winning' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const n = await rows(page).count();
    await expect(count(page)).toHaveText(`${n} of 49 publications`);
    // Area deep links from /research/<slug> land filtered.
    await page.goto('/publications?area=trustworthy-ai');
    await expect(page.getByLabel('Research area')).toHaveValue('trustworthy-ai');
  });

  test('clear filters resets everything and the URL', async ({ page }) => {
    await page.goto('/publications?type=workshop&pdf=1&q=team');
    await page.getByRole('button', { name: 'Clear filters' }).first().click();
    await expect(page).toHaveURL(/\/publications$/);
    await expect(rows(page)).toHaveCount(49);
    await expect(page.getByRole('searchbox', { name: 'Search publications' })).toHaveValue('');
  });

  test('no matches shows an empty state with a way out', async ({ page }) => {
    await page.goto('/publications?q=zzzz-no-such-paper');
    await expect(page.getByText('No publications match those filters.')).toBeVisible();
    await expect(count(page)).toHaveText('0 of 49 publications');
    await page.locator('#pub-list').getByRole('button', { name: 'Clear filters' }).click();
    await expect(rows(page)).toHaveCount(49);
  });
});

test.describe('publications explorer without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every publication is listed, even with a filter query', async ({ page }) => {
    await page.goto('/publications?type=workshop');
    await expect(rows(page)).toHaveCount(49);
    await expect(page.locator('a[href^="/papers/"]')).toHaveCount(49);
  });
});
