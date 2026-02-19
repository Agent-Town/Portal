const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openHatchVia(page, intentTestId) {
  await page.getByTestId(intentTestId).click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 500 });
  await expect(page.getByTestId('hatch-status')).toBeVisible({ timeout: 500 });
}

async function captureVisibleHatchControls(page) {
  const controls = page.locator('[data-testid="hatch-panel"] [data-testid]');
  const ids = await controls.evaluateAll((nodes) => {
    return nodes
      .map((n) => n.getAttribute('data-testid'))
      .filter((id) => !!id && id !== 'hatch-panel');
  });
  ids.sort();
  return ids;
}

async function resetSessionFromBrowser(page) {
  const out = await page.evaluate(async () => {
    const resp = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    return { ok: resp.ok, status: resp.status };
  });
  expect(out.ok).toBeTruthy();
}

test('sign in and sign up both transition to the same setup flow and reload keeps setup visible', async ({ page }) => {
  await page.goto('/');

  await openHatchVia(page, 'auth-signin');
  const signinControls = await captureVisibleHatchControls(page);
  expect(signinControls.length).toBeGreaterThanOrEqual(2);
  expect(signinControls).toContain('lite-llm-panel');
  expect(signinControls).toContain('hatch-status');

  await page.reload();
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 500 });
  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 500 });

  await resetSessionFromBrowser(page);
  await page.goto('/');

  await openHatchVia(page, 'auth-signup');
  const signupControls = await captureVisibleHatchControls(page);
  expect(signupControls).toEqual(signinControls);
});
