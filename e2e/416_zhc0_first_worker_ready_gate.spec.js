const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  randomPort,
  startPrivyTestServer,
  stopServer,
  waitForServerHealth
} = require('./helpers/privy_test_server');

const RESET_TOKEN = 'test-reset';

async function bootstrapFirstWorkerGate(requestContext, baseUrl) {
  const resetResp = await requestContext.post(`${baseUrl}/__test__/reset`, { headers: { 'x-test-reset': RESET_TOKEN } });
  expect(resetResp.ok()).toBeTruthy();

  const bootstrapResp = await requestContext.post(`${baseUrl}/__test__/session/bootstrap-onboarding`, {
    headers: { 'x-test-reset': RESET_TOKEN },
    data: {
      step: 'brain',
      profile: {
        humanName: 'Robin',
        agentName: 'OpenClaw'
      }
    }
  });
  expect(bootstrapResp.ok()).toBeTruthy();
  const body = await bootstrapResp.json();
  expect(body?.ok).toBe(true);
  expect(body?.onboarding?.registrationComplete).toBe(true);
  expect(body?.onboarding?.step).toBe('brain');
}

test('M44.2: first-worker gate blocks founders progression until brain sync succeeds and recovers in place', async ({ page }) => {
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const storePath = path.join(
    os.tmpdir(),
    `agent-town-zhc0-first-worker-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  const launched = startPrivyTestServer({ port, storePath });

  try {
    await waitForServerHealth(baseUrl, launched.readLogs);
    await bootstrapFirstWorkerGate(page.request, baseUrl);

    let llmSyncAttempts = 0;
    await page.route(`${baseUrl}/api/agent/lite/llm/config`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      llmSyncAttempts += 1;
      if (llmSyncAttempts === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, error: 'TEST_BRAIN_SYNC_FAILED' })
        });
        return;
      }
      await route.continue();
    });

    await page.goto(`${baseUrl}/app`);
    await page.getByRole('button', { name: 'Open Town Hall' }).click();

    const gateRoot = page.getByTestId('zhc-first-worker-gate');
    await expect(gateRoot).toBeVisible();
    await expect(gateRoot).toHaveAttribute('data-zhc-phase', 'first_worker_online');
    await expect(gateRoot).toHaveAttribute('data-zhc-overlay-state', 'blocked');
    await expect(gateRoot).toHaveAttribute('data-zhc-blocker-key', 'needs_brain');
    await expect(gateRoot).toHaveAttribute('data-zhc-next-unlock', 'alignment');
    await expect(page.locator('#townHallGateHint')).toContainText('Use Open Brain to bring your first worker online');

    const openBrainBtn = page.getByTestId('townhall-open-brain-btn');
    await expect(openBrainBtn).toHaveAttribute('data-zhc-primary-action', 'true');
    await expect(page.getByTestId('townhall-continue-btn')).toBeDisabled();

    await openBrainBtn.click();

    const brainRoot = page.getByTestId('zhc-first-worker-root');
    await expect(brainRoot).toBeVisible();
    await expect(brainRoot).toHaveAttribute('data-zhc-phase', 'first_worker_online');
    await expect(brainRoot).toHaveAttribute('data-zhc-overlay-state', 'blocked');
    await expect(brainRoot).toHaveAttribute('data-zhc-blocker-key', 'needs_brain');
    await expect(page.getByTestId('lite-llm-save')).toHaveAttribute('data-zhc-primary-action', 'true');
    await page.locator('#llmKeyInput').fill('sk-test-first-worker');

    await page.getByTestId('lite-llm-save').click();
    await expect(brainRoot).toHaveAttribute('data-zhc-overlay-state', 'recoverable_error');
    await expect(page.locator('#llmLine')).toContainText('Brain config failed: TEST_BRAIN_SYNC_FAILED');
    await expect(page.getByTestId('lite-llm-save')).toHaveAttribute('data-zhc-primary-action', 'true');
    await expect(page.locator('#brainContinueBtn')).toBeDisabled();

    await page.getByTestId('lite-llm-save').click();
    await expect(brainRoot).toHaveAttribute('data-zhc-overlay-state', 'ready');
    await expect(page.locator('#llmLine')).toContainText('Brain configured.');

    const brainContinueBtn = page.locator('#brainContinueBtn');
    await expect(brainContinueBtn).toBeEnabled();
    await expect(brainContinueBtn).toHaveAttribute('data-zhc-primary-action', 'true');
    await brainContinueBtn.click();

    await expect(gateRoot).toBeVisible();
    await expect(gateRoot).toHaveAttribute('data-zhc-overlay-state', 'ready');
    await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled();
    await expect(page.getByTestId('townhall-continue-btn')).toHaveAttribute('data-zhc-primary-action', 'true');
  } finally {
    await stopServer(launched.child);
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});
