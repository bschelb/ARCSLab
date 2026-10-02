import { expect, test } from '@playwright/test';

test('research area pages: breadcrumbs, related papers, pager', async ({ page }) => {
  await page.goto('/research/trustworthy-ai');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link')).toHaveText(['Home', 'Research']);
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Trustworthy AI');
  await expect(page.locator('h1')).toContainText('Trustworthy');
  const papers = page.locator('a[href^="/papers/"]');
  expect(await papers.count()).toBeGreaterThan(5);
  await expect(page.getByRole('link', { name: /Filter in publications/ })).toHaveAttribute(
    'href',
    '/publications?area=trustworthy-ai',
  );
  await page.getByRole('navigation', { name: 'Research areas' }).getByRole('link').last().click();
  await expect(page).toHaveURL(/\/research\/training$/);
});

test('home research cards and the overview link to area pages', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('a[href^="/research/"]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(6);
  await page.goto('/research');
  await page.getByRole('link', { name: /Explore this area\W+Training/ }).click();
  await expect(page).toHaveURL(/\/research\/training$/);
});
