const { test, expect } = require('@playwright/test');
const { fetchSessionState, expectHiddenOrAbsent } = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function expectHiddenOrDisabled(locator) {
  const count = await locator.count();
  if (!count) return;
  const target = locator.first();
  if (await target.isVisible()) {
    await expect(target).toBeDisabled();
  } else {
    await expect(target).toBeHidden();
  }
}

test('hatch completion gates sigils/open and writes hatch state to /api/state', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 500 });

  await expectHiddenOrAbsent(page.getByTestId('sigil-grid'));
  await expectHiddenOrAbsent(page.getByTestId('sigil-key'));
  await expectHiddenOrDisabled(page.getByTestId('open-btn'));

  await page.getByTestId('hatch-btn').click();
  await expect(page.getByTestId('hatch-status')).toContainText(/complete|hatched|ready/i, { timeout: 1000 });

  const state = await fetchSessionState(page);
  expect(state.hatch).toBeTruthy();
  expect(state.hatch.complete).toBe(true);
  expect(state.hatch.agentKind).toBe('openclaw-lite');
});

