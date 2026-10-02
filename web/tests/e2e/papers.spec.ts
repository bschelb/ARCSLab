import { expect, test } from './fixtures';

const WITH_PDF = 'schelble-2022-lets-think-together';
const WITHOUT_PDF = 'benda-2026-trust-repair';

test('paper page renders its first PDF page, with a text layer and a working download', async ({
  page,
  request,
}) => {
  await page.goto(`/papers/${WITH_PDF}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Let's Think Together");
  const toolbar = page.getByRole('toolbar', { name: 'PDF reader controls' });
  await expect(toolbar.getByText(/Page 1 of \d+/)).toBeVisible({ timeout: 20_000 });
  const firstPage = page.getByRole('region', { name: /^Page 1 of/ });
  await expect
    .poll(() => firstPage.locator('canvas').evaluate((c: HTMLCanvasElement) => c.width))
    .toBeGreaterThan(0);
  await expect.poll(() => firstPage.locator('span').count()).toBeGreaterThan(10);
  await expect(firstPage.locator('canvas')).toHaveAttribute('aria-hidden', 'true');

  const download = page.getByRole('link', { name: 'Download the PDF' });
  await expect(download).toHaveAttribute('href', `/papers/${WITH_PDF}.pdf`);
  const pdf = await request.get(`/papers/${WITH_PDF}.pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect(pdf.headers()['content-disposition']).toBe('inline');

  await toolbar.getByRole('button', { name: 'Zoom in' }).click();
  await expect(toolbar.getByLabel(/^Zoom \d+%$/)).not.toHaveText('');
});

test('paper without a PDF shows the request-a-copy block', async ({ page }) => {
  await page.goto(`/papers/${WITHOUT_PDF}`);
  await expect(page.getByText('A shareable copy of this work is not posted here')).toBeVisible();
  await expect(page.getByRole('toolbar', { name: 'PDF reader controls' })).toHaveCount(0);
});

test('citation copies in BibTeX and APA', async ({ page, browserName, context }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`/papers/${WITH_PDF}`);
  await page.getByRole('button', { name: 'APA' }).click();
  await page.getByRole('button', { name: 'Copy citation' }).click();
  await expect(page.getByText('APA citation copied')).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("(2021). Let's Think Together!");
});

test('paper pages carry Scholar citation tags and the empty full-text flag', async ({ page }) => {
  await page.goto(`/papers/${WITH_PDF}`);
  await expect(page.locator('head meta[name="citation_pdf_url"]')).toHaveAttribute(
    'content',
    `https://arcslab.io/papers/${WITH_PDF}.pdf`,
  );
  await expect(page.locator('head meta[name="citation_author"]')).toHaveCount(5);
  await expect(page.locator('head meta[name="citation_fulltext_world_readable"]')).toHaveCount(1);
});

test('unknown paper slugs return 404', async ({ request }) => {
  expect((await request.get('/papers/not-a-real-paper')).status()).toBe(404);
});

for (const [from, to] of [
  ['/index.html', '/'],
  ['/research.html', '/research'],
  [`/papers/${WITH_PDF}.html`, `/papers/${WITH_PDF}`],
  ['/sitemap-index.xml', '/sitemap.xml'],
  ['/assets/sarahHeadshot.jpg', '/images/people/sarah-mendoza.jpg'],
] as const) {
  test(`${from} redirects permanently to ${to}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toBe(to);
  });
}

test('robots: preview builds disallow everything; production allows and lists the sitemap', async ({
  request,
}) => {
  const body = await (await request.get('/robots.txt')).text();
  if (process.env.EXPECT_PRODUCTION === '1') {
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: https://arcslab.io/sitemap.xml');
  } else {
    expect(body).toContain('Disallow: /');
    expect(body).not.toContain('Sitemap:');
  }
});

test('sitemap lists every page and paper with canonical URLs', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // 8 pages + 49 papers (the production set) + Phase 5: /join, 6 research areas, 13 profiles
  expect(locs).toHaveLength(77);
  expect(new Set(locs).size).toBe(locs.length);
  expect(locs).toContain('https://arcslab.io/');
  expect(locs).toContain('https://arcslab.io/join');
  expect(locs.filter((l) => l?.includes('/research/'))).toHaveLength(6);
  expect(locs.filter((l) => l?.includes('/team/'))).toHaveLength(13);
  expect(locs).toContain(`https://arcslab.io/papers/${WITH_PDF}`);
});
