const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

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

test('M44.1: /start projects the arrival contract with one primary action and no late-loop CTA leakage', async ({ page }) => {
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
  await expect(root).toHaveAttribute('data-zhc-progress-step', '1');
  await expect(root).toHaveAttribute('data-zhc-progress-total', '9');
  await expect(root).toHaveAttribute('data-zhc-next-unlock', 'first_worker');

  await expect(page.getByRole('heading', { name: 'Start a company with your agent.' })).toBeVisible();
  await expect(page.getByText('What happens here', { exact: true })).toBeVisible();
  await expect(page.getByText('Your first loop', { exact: true })).toBeVisible();
  await expect(enterBtn).toBeVisible();
  await expect(enterBtn).toHaveAttribute('data-zhc-primary-action', 'true');
  expect(await visiblePrimaryActionCount(page)).toBe(1);

  await expect(page.getByRole('button', {
    name: /Open headquarters|Run first mission|Save to company memory|See next quest|Start next quest/
  })).toHaveCount(0);
});

test('M44.1: /start marks loading and recoverable auth cancellation states explicitly', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        if (!email) return null;
        return { id: 'mock-user', email };
      },
    });
  });

  await mockPrivyConfig(page, { enabled: true });
  await page.goto('/start');

  const root = page.getByTestId('start-card');
  await page.getByRole('button', { name: 'Enter' }).click();

  await expect(root).toHaveAttribute('data-zhc-overlay-state', 'loading');
  await expect(page.getByTestId('privy-auth-box')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(root).toHaveAttribute('data-zhc-overlay-state', 'recoverable_error');
  await expect(root).toHaveAttribute('data-zhc-blocker-key', 'needs_auth');
  await expect(root).toHaveAttribute('data-zhc-next-unlock', 'first_worker');
  await expect(page.locator('#startStatus')).toHaveText('Login cancelled.');
  await expect(page.getByTestId('privy-auth-box')).toBeHidden();
  expect(await visiblePrimaryActionCount(page)).toBe(1);
});
