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

test('team profiles: Person JSON-LD with memberOf the lab, matched publications', async ({
  page,
}) => {
  await page.goto('/team/sarah-mendoza');
  await expect(page.locator('h1')).toContainText('Mendoza');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Sarah Mendoza');
  const nodes = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
  const person = nodes.find(
    (n) => n['@type'] === 'Person' && n.url?.endsWith('/team/sarah-mendoza'),
  );
  expect(person).toBeTruthy();
  expect(person.memberOf.memberOf['@id']).toBe('https://arcslab.io/#organization');
  expect(person.memberOf.startDate).toBe('2025');
  expect(await page.locator('a[href^="/papers/"]').count()).toBeGreaterThan(0);
});

test('alumni profiles carry an end date and no empty sections', async ({ page }) => {
  await page.goto('/team/elizabeth-hughes');
  const nodes = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
  const person = nodes.find((n) => n['@type'] === 'Person' && n.url?.includes('/team/'));
  expect(person.memberOf.endDate).toBe('2026');
  await expect(page.getByRole('heading', { name: /papers? with/i })).toHaveCount(0);
});

test('every team card links to its profile (PI to /pi)', async ({ page }) => {
  await page.goto('/team');
  await page.getByRole('link', { name: 'Yayun Tian', exact: true }).click();
  await expect(page).toHaveURL(/\/team\/yayun-tian$/);
  await page.goto('/team');
  const hrefs = await page
    .locator('main a[href^="/team/"]')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(13);
});
