import { expect, test } from './fixtures';

const production = process.env.EXPECT_PRODUCTION === '1';

test('/join shows the recruiting status from site.recruiting', async ({ page }) => {
  await page.goto('/join');
  const status = page.getByRole('region', { name: 'Now recruiting' });
  await expect(status).toContainText('For a Spring, Summer, or Fall 2027 start');
  await expect(status.getByRole('link', { name: /Start an inquiry/ })).toHaveAttribute(
    'href',
    '/contact?type=prospective',
  );
  await expect(page.getByRole('heading', { level: 3 })).toContainText([
    'PhD Students',
    'DEng Students',
    'Undergraduate Researchers',
  ]);
});

test('/join FAQ items open and close with the keyboard', async ({ page }) => {
  await page.goto('/join');
  const first = page.locator('details').first();
  await expect(first).not.toHaveAttribute('open', '');
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('p')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(first).not.toHaveAttribute('open', '');
});

test(`drafts are ${production ? 'hidden in production' : 'tagged on previews'}`, async ({
  page,
}) => {
  await page.goto('/join');
  const tags = page.locator('.draft-tag');
  if (production) await expect(tags).toHaveCount(0);
  else expect(await tags.count()).toBeGreaterThan(0);
});

for (const route of ['/team', '/contact']) {
  test(`${route}#join is a stub that links to /join`, async ({ page }) => {
    await page.goto(`${route}#join`);
    const stub = page.locator('section#join');
    await expect(stub).toBeVisible();
    await expect(stub).toContainText(
      'recruiting students for a Spring, Summer, or Fall 2027 start',
    );
    await expect(stub.getByRole('link', { name: /How to join/ })).toHaveAttribute('href', '/join');
    await stub.getByRole('link', { name: /How to join/ }).click();
    await expect(page).toHaveURL(/\/join$/);
  });
}
