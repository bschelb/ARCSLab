/**
 * Shared Playwright fixtures. Every spec imports `test` and `expect` from here, so the whole
 * suite doubles as the CSP gate (plan Phase 6): an init script reports each
 * `securitypolicyviolation` event (fired for report-only and enforced policies alike) to the
 * test, across navigations, and a test that triggers one fails with the directive and URI.
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ cspViolations: string[] }>({
  cspViolations: [
    async ({ page }, use, testInfo) => {
      const seen: string[] = [];
      await page.exposeFunction('__reportCsp', (msg: string) => seen.push(msg));
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          (window as unknown as { __reportCsp: (m: string) => void }).__reportCsp(
            `${e.effectiveDirective} blocked ${e.blockedURI || '(inline)'} on ${location.pathname}`,
          );
        });
      });
      await use(seen);
      if (testInfo.status === testInfo.expectedStatus)
        expect([...new Set(seen)], 'Content-Security-Policy violations').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from '@playwright/test';
