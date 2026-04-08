const { test, expect } = require('@playwright/test');
const { enterHatch, ensureAppShell, ensureBrainPanelVisible } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openHatchVia(page, intent = 'signin', { navigate = false } = {}) {
  await enterHatch(page, intent, { navigate });
  await ensureBrainPanelVisible(page);
  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 1500 });
}

async function captureVisibleHatchControls(page) {
  const candidateIds = [
    'townhall-human-submit-btn',
    'townhall-agent-submit-btn',
    'townhall-register-btn',
    'townhall-continue-btn',
    'lite-llm-panel'
  ];
  const ids = [];
  for (const id of candidateIds) {
    const locator = page.getByTestId(id);
    if (!(await locator.count())) continue;
    if (await locator.first().isVisible()) ids.push(id);
  }
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
  await ensureAppShell(page);

  await openHatchVia(page, 'signin');
  const signinControls = await captureVisibleHatchControls(page);
  expect(signinControls.length).toBeGreaterThanOrEqual(2);
  expect(signinControls).toContain('lite-llm-panel');

  await page.reload();
  await openHatchVia(page, 'signin');
  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 500 });

  await resetSessionFromBrowser(page);
  await ensureAppShell(page);

  await openHatchVia(page, 'signup');
  const signupControls = await captureVisibleHatchControls(page);
  expect(signupControls).toEqual(signinControls);
});
