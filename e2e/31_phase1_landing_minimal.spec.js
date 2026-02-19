const { test, expect } = require('@playwright/test');
const { expectHiddenOrAbsent } = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('landing is minimal, single-path, and setup-gated', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('landing-title')).toHaveText('Welcome to the Wild West!');
  await expect(page.getByTestId('auth-signin')).toBeVisible({ timeout: 1000 });
  await expect(page.getByTestId('auth-signup')).toBeVisible({ timeout: 1000 });

  const maybeVideo = page.getByTestId('landing-video');
  if (await maybeVideo.count()) {
    await expect(maybeVideo).toBeVisible();
  }

  await expect(page.getByTestId('path-human')).toHaveCount(0);
  await expect(page.getByTestId('path-coop')).toHaveCount(0);
  await expect(page.getByTestId('path-agent')).toHaveCount(0);

  await expectHiddenOrAbsent(page.getByTestId('sigil-grid'));
  await expectHiddenOrAbsent(page.getByTestId('sigil-key'));
  await expectHiddenOrAbsent(page.getByTestId('open-btn'));
});
