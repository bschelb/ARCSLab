import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './fixtures';

const FORMSPREE = 'https://formspree.io/f/xvzwzoal';

async function fill(page: Page) {
  await page.getByLabel('First Name *').fill('Jane');
  await page.getByLabel('Last Name *').fill('Smith');
  await page.getByLabel('Email *').fill('jane@university.edu');
  await page.getByLabel('Message *').fill('Interested in a PhD for Fall 2027.');
}

test.describe('contact form', () => {
  test('success: posts to Formspree with Accept: application/json', async ({ page }) => {
    let request: { accept?: string; body: string } | undefined;
    await page.route(FORMSPREE, async (route) => {
      request = {
        accept: route.request().headers()['accept'],
        body: route.request().postData() ?? '',
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/contact');
    await fill(page);
    await page.getByRole('button', { name: /Send Message/ }).click();
    const done = page.getByRole('heading', { name: 'Message sent.' });
    await expect(done).toBeVisible();
    await expect(done).toBeFocused();
    expect(request?.accept).toBe('application/json');
    expect(request?.body).toContain('Interested in a PhD for Fall 2027.');
    expect(request?.body).toContain('Prospective Graduate Student');
    expect(request?.body).toContain('ARCS Lab Website Inquiry');
  });

  test('pending state disables the button while sending', async ({ page }) => {
    let release: () => void = () => {};
    const held = new Promise<void>((r) => (release = r));
    await page.route(FORMSPREE, async (route) => {
      await held;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/contact');
    await fill(page);
    await page.getByRole('button', { name: /Send Message/ }).click();
    const sending = page.getByRole('button', { name: /Sending/ });
    await expect(sending).toBeDisabled();
    release();
    await expect(page.getByRole('heading', { name: 'Message sent.' })).toBeVisible();
  });

  test('error: shows an alert with a prefilled mailto fallback', async ({ page }) => {
    await page.route(FORMSPREE, (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: '{"errors":[]}' }),
    );
    await page.goto('/contact');
    await fill(page);
    await page.getByRole('button', { name: /Send Message/ }).click();
    const alert = page.locator('form').getByRole('alert');
    await expect(alert).toContainText("Your message wasn't sent.");
    const mailto = await alert.getByRole('link').getAttribute('href');
    expect(mailto).toMatch(/^mailto:bschelbl@utk\.edu\?subject=/);
    expect(decodeURIComponent(mailto ?? '')).toContain('Interested in a PhD for Fall 2027.');
    // the visitor's text is still in the form for a retry
    await expect(page.getByLabel('Message *')).toHaveValue('Interested in a PhD for Fall 2027.');
  });

  test('honeypot: a filled _gotcha sends nothing but looks successful', async ({ page }) => {
    let sent = false;
    await page.route(FORMSPREE, (route) => {
      sent = true;
      return route.fulfill({ status: 200, body: '{}' });
    });
    await page.goto('/contact');
    await fill(page);
    await page.locator('input[name="_gotcha"]').fill('bot', { force: true });
    await page.getByRole('button', { name: /Send Message/ }).click();
    await expect(page.getByRole('heading', { name: 'Message sent.' })).toBeVisible();
    expect(sent).toBe(false);
  });

  test('inline validation: errors linked to fields, focus on the first', async ({ page }) => {
    let sent = false;
    await page.route(FORMSPREE, (route) => {
      sent = true;
      return route.fulfill({ status: 200, body: '{}' });
    });
    await page.goto('/contact');
    await page.getByLabel('Email *').fill('not-an-email');
    await page.getByRole('button', { name: /Send Message/ }).click();
    const first = page.getByLabel('First Name *');
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute('aria-invalid', 'true');
    await expect(first).toHaveAccessibleDescription('Enter your first name.');
    await expect(page.getByLabel('Email *')).toHaveAccessibleDescription(/name@university\.edu/);
    await first.fill('Jane');
    await expect(first).not.toHaveAttribute('aria-invalid', 'true');
    expect(sent).toBe(false);
  });

  test('axe is clean with validation errors showing', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'axe runs once, in Chromium');
    await page.goto('/contact');
    await page.getByRole('button', { name: /Send Message/ }).click();
    await expect(page.getByLabel('First Name *')).toHaveAttribute('aria-invalid', 'true');
    const results = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  });

  test('?type= preselects the inquiry type', async ({ page }) => {
    await page.goto('/contact?type=media');
    await expect(page.getByLabel('Inquiry Type')).toHaveValue('Media / Press');
    await page.goto('/contact?type=prospective');
    await expect(page.getByLabel('Inquiry Type')).toHaveValue('Prospective Graduate Student');
  });

  test('address card links to Google Maps (no map iframe)', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Open in Google Maps/ })).toHaveAttribute(
      'href',
      /google\.com\/maps/,
    );
  });
});

test('without JavaScript the form is a native POST with required fields', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/contact');
  const form = page.locator('form').first();
  await expect(form).toHaveAttribute('action', FORMSPREE);
  await expect(form).toHaveAttribute('method', 'POST');
  await expect(form).not.toHaveAttribute('novalidate', '');
  await expect(page.getByLabel('Email *')).toHaveAttribute('required', '');
  await ctx.close();
});
