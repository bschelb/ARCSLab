import { expect, test } from '@playwright/test';

test.describe('home page additions', () => {
  test.use({ javaScriptEnabled: false });

  test('stats strip shows values computed from data, linked to their pages', async ({ page }) => {
    await page.goto('/');
    const stats = page.getByRole('region', { name: 'The lab in numbers' });
    await expect(stats.locator('.stat-num')).toHaveText(['49', '$2.8M', '5', '10']);
    await expect(stats.getByRole('link')).toHaveCount(4);
    await expect(stats.getByRole('link', { name: /Best Paper Awards/ })).toHaveAttribute(
      'href',
      '/publications?award=1',
    );
  });

  test('Latest shows the three most recent news or talk items', async ({ page }) => {
    await page.goto('/');
    const latest = page.getByRole('region', { name: 'News & talks' });
    await expect(latest.getByRole('listitem')).toHaveCount(3);
    await expect(latest.getByRole('listitem').first()).toContainText('Jul 2026');
  });

  test('team preview lists every current member, each linked to a profile', async ({ page }) => {
    await page.goto('/');
    const team = page.getByRole('region', { name: /people behind/i });
    const hrefs = await team
      .locator('h3 a')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toHaveLength(12);
    expect(hrefs[0]).toBe('/pi');
    for (const h of hrefs.slice(1)) expect(h).toMatch(/^\/team\/[a-z-]+$/);
  });

  test('recruiting callout comes from site.recruiting and links to /join', async ({ page }) => {
    await page.goto('/');
    const band = page.getByRole('region', { name: 'Now recruiting' });
    await expect(band).toContainText('For a Spring, Summer, or Fall 2027 start');
    await expect(band.getByRole('link', { name: /How to join/ })).toHaveAttribute('href', '/join');
  });
});
