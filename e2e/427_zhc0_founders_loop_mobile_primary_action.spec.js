const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.use({
  viewport: { width: 390, height: 844 },
});

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function mockPrivyConfig(page, { enabled = true } = {}) {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled,
        startPageEnabled: enabled,
        appPath: '/app',
        config: {
          appId: 'app-mock',
          loginMethod: 'email',
          enableDefaultBridge: false,
        },
      }),
    });
  });
}

async function visiblePrimaryActionCount(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('[data-zhc-primary-action="true"]')].filter((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;
  });
}

test('M44.1 mobile: arrival CTA stays in the initial viewport with no horizontal overflow', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async () => null,
    });
  });

  await mockPrivyConfig(page, { enabled: true });
  await page.goto('/start');

  const root = page.getByTestId('start-card');
  const enterBtn = page.getByRole('button', { name: 'Enter' });

  await expect(root).toHaveAttribute('data-zhc-phase', 'arrival');
  await expect(root).toHaveAttribute('data-zhc-overlay-state', 'ready');
  await expect(enterBtn).toBeVisible();
  await expect(enterBtn).toBeInViewport();
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  const layout = await page.evaluate(() => {
    const button = document.querySelector('[data-zhc-primary-action="true"]');
    const rect = button ? button.getBoundingClientRect() : null;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      buttonTop: rect ? rect.top : null,
      buttonBottom: rect ? rect.bottom : null,
      innerHeight: window.innerHeight,
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
  expect(layout.buttonTop).not.toBeNull();
  expect(layout.buttonBottom).not.toBeNull();
  expect(layout.buttonTop).toBeGreaterThanOrEqual(0);
  expect(layout.buttonBottom).toBeLessThanOrEqual(layout.innerHeight);

  await expect(page.locator('.startHeaderBadges')).toBeVisible();
  await expect(page.locator('.startHeroNote')).toBeVisible();
});
