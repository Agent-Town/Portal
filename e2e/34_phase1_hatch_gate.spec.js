const { test, expect } = require('@playwright/test');
const { fetchSessionState } = require('./helpers/phase1');
const { enterHatch } = require('./helpers/phase2');

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

test('setup flow has no explicit hatch activation button and keeps sigils gated pre-connect', async ({ page }) => {
  await enterHatch(page, 'signup');

  await expect(page.getByTestId('match-status')).toContainText(/LOCKED/i);
  await expectHiddenOrDisabled(page.getByTestId('open-btn'));
  await expect(page.getByTestId('hatch-btn')).toHaveCount(0);

  const state = await fetchSessionState(page);
  expect(state.hatch).toBeTruthy();
  expect(state.hatch.complete).toBe(false);
  expect(state.hatch.agentKind ?? null).toBeNull();
  expect(state.agent?.connected).toBe(false);
});
