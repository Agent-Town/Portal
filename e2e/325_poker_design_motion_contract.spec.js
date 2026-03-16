const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

async function openDelayedLobby(page) {
  await page.route('**/api/poker/play/tables**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });
  await page.goto('/poker/play?embed=1');
  await expect(page.locator('[data-poker-section="route-loading"][data-poker-state="loading"]')).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 motion: poker keeps meaningful transitions by default and disables them for reduced motion', async ({ browser }) => {
  const normalContext = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    reducedMotion: 'no-preference',
  });
  const normalPage = await normalContext.newPage();
  await openDelayedLobby(normalPage);
  const normalLoading = await normalPage.locator('[data-poker-state="loading"] .pokerStateShell').evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      animationName: computed.animationName,
    };
  });
  await expect(normalPage.locator('[data-poker-section="quick-seat"] button[type="submit"]')).toBeVisible();
  const normalButton = await normalPage.locator('[data-poker-section="quick-seat"] button[type="submit"]').evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      transitionDuration: computed.transitionDuration,
    };
  });
  await normalContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  await openDelayedLobby(reducedPage);
  const reducedLoading = await reducedPage.locator('[data-poker-state="loading"] .pokerStateShell').evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      animationName: computed.animationName,
    };
  });
  await expect(reducedPage.locator('[data-poker-section="quick-seat"] button[type="submit"]')).toBeVisible();
  const reducedButton = await reducedPage.locator('[data-poker-section="quick-seat"] button[type="submit"]').evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      transitionDuration: computed.transitionDuration,
    };
  });
  await reducedContext.close();

  expect(normalLoading.animationName).toContain('pokerStatePulse');
  expect(normalButton.transitionDuration).not.toMatch(/^0s(?:,\s*0s)*$/);
  expect(reducedLoading.animationName).toBe('none');
  expect(reducedButton.transitionDuration).toMatch(/^0s(?:,\s*0s)*$/);
});
