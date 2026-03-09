const { test, expect } = require('@playwright/test');
const { waitForLiteApi } = require('./helpers/trainer');

async function readRuntimeWorkerSessionId(page) {
  await page.waitForFunction(async () => {
    try {
      if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.runtimeSessionContext !== 'function') {
        return false;
      }
      const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
        runtimeContext: {
          origin: window.location.origin,
          teamCode: '',
          houseId: '',
        },
        runtimeState: {},
      });
      const data = snapshot?.data || snapshot || null;
      return typeof data?.sessionId === 'string' && data.sessionId.trim().length > 0;
    } catch {
      return false;
    }
  }, null, { timeout: 10000 });

  return await page.evaluate(async () => {
    const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
      runtimeContext: {
        origin: window.location.origin,
        teamCode: '',
        houseId: '',
      },
      runtimeState: {},
    });
    const data = snapshot?.data || snapshot || null;
    return String(data?.sessionId || '').trim();
  });
}

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('direct /trainer entry redirects into the modal-preserving hub route', async ({ request, page }) => {
  const redirect = await request.fetch('/trainer', {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(302);
  expect(String(redirect.headers().location || '')).toBe('/app?modal=trainer');

  await page.goto('/trainer');
  await expect(page).toHaveURL(/\/app\?modal=trainer$/);
  await expect(page.getByTestId('trainer-modal')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('trainer-root')).toBeVisible({ timeout: 1500 });
});

test('opening and closing trainer preserves hub path and worker session continuity', async ({ page }) => {
  await page.goto('/app?liteDriver=phase1');
  await waitForLiteApi(page);

  const trainerBtn = page.getByTestId('agent-open-trainer');
  await expect(trainerBtn).toHaveCount(1);
  const initialSessionId = await readRuntimeWorkerSessionId(page);
  expect(initialSessionId).toMatch(/^sess_/);

  const sidebar = page.locator('#agentSidebar');
  const minimized = await sidebar.evaluate((node) => node.classList.contains('minimized'));
  if (minimized) {
    await page.locator('#agentSidebar .sidebar-header').click();
  }

  await trainerBtn.click();
  const openUrl = new URL(page.url());
  expect(openUrl.pathname).toBe('/app');
  expect(openUrl.searchParams.get('liteDriver')).toBe('phase1');
  expect(openUrl.searchParams.get('modal')).toBe('trainer');
  await expect(page.getByTestId('trainer-modal')).toBeVisible({ timeout: 5000 });
  const openedSessionId = await readRuntimeWorkerSessionId(page);
  expect(openedSessionId).toBe(initialSessionId);

  await page.locator('#trainerModalClose').click();
  await expect(page.getByTestId('trainer-modal')).toHaveAttribute('aria-hidden', 'true');
  const closedUrl = new URL(page.url());
  expect(closedUrl.pathname).toBe('/app');
  expect(closedUrl.searchParams.get('liteDriver')).toBe('phase1');
  expect(closedUrl.searchParams.get('modal')).toBe(null);
  const closedSessionId = await readRuntimeWorkerSessionId(page);
  expect(closedSessionId).toBe(initialSessionId);
});
