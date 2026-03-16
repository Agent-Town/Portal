const { test, expect } = require('@playwright/test');
const { ensureAppShell } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hub exposes one dominant primary action tied to the active district', async ({ page }) => {
  await ensureAppShell(page);

  const focusCard = page.getByTestId('town-focus-card');
  const focusTitle = page.getByTestId('town-focus-title');
  const primaryAction = page.getByTestId('town-primary-action');

  await expect(focusCard).toBeVisible({ timeout: 2000 });
  await expect(focusTitle).toBeVisible();
  await expect(primaryAction).toBeVisible();

  await expect(focusTitle).toContainText(/plan wagons/i);
  await expect(primaryAction).toContainText(/open plan wagons/i);

  const primaryActions = page.locator('[data-shell-priority="primary"]');
  await expect(primaryActions).toHaveCount(1);

  const hierarchy = await page.evaluate(() => {
    const primary = document.querySelector('[data-shell-priority="primary"]');
    const active = document.querySelector('.townDistrictHotspot.is-active .townDistrictLabel');
    const inactive = document.querySelector('.townDistrictHotspot:not(.is-active) .townDistrictLabel');
    if (!(primary instanceof HTMLElement) || !(active instanceof HTMLElement) || !(inactive instanceof HTMLElement)) {
      return null;
    }
    const primaryStyle = window.getComputedStyle(primary);
    const activeStyle = window.getComputedStyle(active);
    const inactiveStyle = window.getComputedStyle(inactive);
    return {
      primaryMinHeight: Math.round(primary.getBoundingClientRect().height),
      primaryWeight: primaryStyle.fontWeight,
      activeBackground: activeStyle.backgroundColor,
      inactiveBackground: inactiveStyle.backgroundColor,
      activeBorder: activeStyle.borderColor,
      inactiveBorder: inactiveStyle.borderColor,
      primaryLabelLength: primary.textContent.trim().length,
    };
  });

  expect(hierarchy).not.toBeNull();
  expect(hierarchy.primaryMinHeight).toBeGreaterThanOrEqual(44);
  expect(hierarchy.primaryLabelLength).toBeLessThanOrEqual(24);
  expect(hierarchy.activeBackground).not.toBe(hierarchy.inactiveBackground);
  expect(hierarchy.activeBorder).not.toBe(hierarchy.inactiveBorder);
});
