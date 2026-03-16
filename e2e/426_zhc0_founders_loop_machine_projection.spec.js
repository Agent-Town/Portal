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
}

test('M44.2 machine projection: first-worker gate exposes blocked, loading, and ready markers coherently', async ({ page }) => {
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const storePath = path.join(
    os.tmpdir(),
    `agent-town-zhc0-machine-projection-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  const launched = startPrivyTestServer({ port, storePath });

  try {
    await waitForServerHealth(baseUrl, launched.readLogs);
    await bootstrapFirstWorkerGate(page.request, baseUrl);

    let delayedSyncHandled = false;
    await page.route(`${baseUrl}/api/agent/lite/llm/config`, async (route) => {
      if (route.request().method() !== 'POST' || delayedSyncHandled) {
        await route.continue();
        return;
      }
      delayedSyncHandled = true;
      await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await page.goto(`${baseUrl}/app`);
    await page.getByRole('button', { name: 'Open Town Hall' }).click();

    const gateRoot = page.getByTestId('zhc-first-worker-gate');
    await expect(gateRoot).toBeVisible();
    await expect(gateRoot).toHaveAttribute('data-zhc-phase', 'first_worker_online');
    await expect(gateRoot).toHaveAttribute('data-zhc-progress-step', '2');
    await expect(gateRoot).toHaveAttribute('data-zhc-progress-total', '9');
    await expect(gateRoot).toHaveAttribute('data-zhc-overlay-state', 'blocked');
    await expect(gateRoot).toHaveAttribute('data-zhc-blocker-key', 'needs_brain');
    await expect(page.getByTestId('townhall-open-brain-btn')).toHaveAttribute('data-zhc-primary-action', 'true');

    await page.getByTestId('townhall-open-brain-btn').click();

    const brainRoot = page.getByTestId('zhc-first-worker-root');
    await expect(brainRoot).toBeVisible();
    await expect(brainRoot).toHaveAttribute('data-zhc-phase', 'first_worker_online');
    await expect(brainRoot).toHaveAttribute('data-zhc-progress-step', '2');
    await expect(brainRoot).toHaveAttribute('data-zhc-progress-total', '9');
    await expect(brainRoot).toHaveAttribute('data-zhc-overlay-state', 'blocked');
    await expect(brainRoot).toHaveAttribute('data-zhc-blocker-key', 'needs_brain');
    await expect(page.getByTestId('lite-llm-save')).toHaveAttribute('data-zhc-primary-action', 'true');

    await page.locator('#llmKeyInput').fill('sk-test-machine-projection');
    await page.getByTestId('lite-llm-save').click();

    await expect(brainRoot).toHaveAttribute('data-zhc-overlay-state', 'loading');
    await expect(page.getByTestId('lite-llm-save')).toHaveAttribute('data-zhc-primary-action', 'true');

    await expect(brainRoot).toHaveAttribute('data-zhc-overlay-state', 'ready');
    await expect(brainRoot).not.toHaveAttribute('data-zhc-blocker-key', 'needs_brain');

    const brainContinueBtn = page.locator('#brainContinueBtn');
    await expect(brainContinueBtn).toBeEnabled();
    await expect(brainContinueBtn).toHaveAttribute('data-zhc-primary-action', 'true');

    await brainContinueBtn.click();

    await expect(gateRoot).toBeVisible();
    await expect(gateRoot).toHaveAttribute('data-zhc-overlay-state', 'ready');
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
