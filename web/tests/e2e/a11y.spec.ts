import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

// axe at both plan widths; serious and critical violations fail (plan 4.4).
for (const width of [390, 1440]) {
  test.describe(`axe @ ${width}px`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    for (const route of [...ROUTES, '/this-page-does-not-exist']) {
      test(route, async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'axe runs once, in Chromium');
        await page.goto(route);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const serious = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );
        expect(
          serious.map(
            (v) =>
              `${v.id}: ${v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 3)
                .join(' | ')}`,
          ),
        ).toEqual([]);
      });
    }
  });
}

test('every page has exactly one h1, a main landmark and a skip link', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator('h1'), route).toHaveCount(1);
    await expect(page.locator('main#main'), route).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Skip to main content' }), route).toHaveCount(1);
  }
});
