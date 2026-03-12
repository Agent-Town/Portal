const { test, expect } = require('@playwright/test');

const liveRequired = /^(1|true|yes|on)$/i.test(String(process.env.HOUSE_WORKER_LIVE_REQUIRED || '').trim());
const liveProvider = String(process.env.HOUSE_WORKER_LIVE_PROVIDER || '').trim();
const liveModel = String(process.env.HOUSE_WORKER_LIVE_MODEL || '').trim();
const liveApiKey = String(process.env.HOUSE_WORKER_LIVE_API_KEY || '').trim();

async function configureLiveBrainViaUi(page) {
  await page.goto('/app?district=brain');
  await expect(page.getByTestId('lite-llm-provider')).toBeVisible({ timeout: 30000 });
  await page.getByTestId('lite-llm-provider').selectOption(liveProvider);
  await page.getByTestId('lite-llm-model').evaluate((node, desired) => {
    if (!(node instanceof HTMLSelectElement)) return;
    const exists = Array.from(node.options).some((option) => String(option.value || '').trim() === String(desired || '').trim());
    if (!exists) {
      throw new Error(`HOUSE_WORKER_LIVE_MODEL_UNAVAILABLE:${String(desired || '').trim()}`);
    }
  }, liveModel);
  await page.getByTestId('lite-llm-model').selectOption(liveModel);
  await page.getByTestId('lite-llm-api-key').fill(liveApiKey);
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText(/configured|saved|ready|connected|brain/i, { timeout: 30000 });
}

test.describe('House worker operator live gate', () => {
  test.skip(!liveRequired, 'House worker live gate is optional unless HOUSE_WORKER_LIVE_REQUIRED=1.');

  test('T38.10: one honest operator-assisted live helper lane is scriptable with clear prerequisites', async ({ page }) => {
    test.slow();
    expect(
      String(process.env.HOUSE_WORKER_LIVE_STORAGE_STATE || '').trim(),
      'Set HOUSE_WORKER_LIVE_STORAGE_STATE to a Playwright storageState file captured from a real session with a house attached and an active team selected.'
    ).toBeTruthy();
    expect(liveProvider, 'Set HOUSE_WORKER_LIVE_PROVIDER so the live gate can configure a real browser brain through the product UI.').toBeTruthy();
    expect(liveModel, 'Set HOUSE_WORKER_LIVE_MODEL so the live gate can configure a real browser brain through the product UI.').toBeTruthy();
    expect(liveApiKey, 'Set HOUSE_WORKER_LIVE_API_KEY so the live gate can configure a real browser brain through the product UI.').toBeTruthy();

    await page.goto('/app?district=house');
    await expect(page.locator('#districtMap')).toBeVisible({ timeout: 30000 });

    const initialReadinessResponse = await page.request.get('/api/platform/house-workers/live-readiness');
    expect(initialReadinessResponse.ok()).toBe(true);
    const initialReadiness = await initialReadinessResponse.json();
    const initialChecks = Array.isArray(initialReadiness?.data?.checks) ? initialReadiness.data.checks : [];
    const localBrainCheck = initialChecks.find((entry) => String(entry?.checkId || '').trim() === 'browser_local_brain_ready');
    if (String(localBrainCheck?.status || '').trim() !== 'ready') {
      await configureLiveBrainViaUi(page);
      await page.goto('/app?district=house');
      await expect(page.locator('#districtMap')).toBeVisible({ timeout: 30000 });
    }

    const readinessResponse = await page.request.get('/api/platform/house-workers/live-readiness');
    expect(readinessResponse.ok()).toBe(true);
    const liveSnapshot = await page.evaluate(async () => {
      return await window.__agentTownHouseWorkerLiveReadiness.refresh();
    });
    const checks = Array.isArray(liveSnapshot?.checks) ? liveSnapshot.checks : [];
    const blocked = checks.filter((entry) => String(entry?.status || '').trim() === 'blocked');
    expect(blocked, `HOUSE_WORKER_LIVE_PREREQ:${blocked.map((entry) => `${entry.checkId}:${entry.summary}`).join(' | ')}`).toHaveLength(0);
    expect(String(liveSnapshot?.status || '').trim()).toBe('ready_for_operator_gate');

    const registryResponse = await page.request.get('/api/registry/search?family=workers');
    expect(registryResponse.ok()).toBe(true);
    const registryBody = await registryResponse.json();
    const firstWorker = Array.isArray(registryBody?.data?.items) ? registryBody.data.items[0] : null;
    const registryEntityId = String(firstWorker?.registryId || firstWorker?.registryEntityId || '').trim();
    expect(registryEntityId, 'The live helper gate needs at least one installable worker package in Registry.').toBeTruthy();

    const installResponse = await page.request.post('/api/platform/house-workers/install', {
      data: {
        registryEntityId,
      },
    });
    expect(installResponse.ok()).toBe(true);

    await page.getByTestId('house-open-office').click();
    const deploymentCard = page.getByTestId('house-office-deployment-item').first();
    await expect(deploymentCard).toBeVisible();
    await deploymentCard.getByTestId('house-office-helper-start').click();
    await expect(page.getByTestId('house-office-worker-session-item').first()).toBeVisible({ timeout: 30000 });

    await deploymentCard.getByTestId('house-office-helper-message-input').fill('Reply with one short live status update.');
    await deploymentCard.getByTestId('house-office-helper-ask').click();
    await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText(/replied|running|already running/i, { timeout: 30000 });

    await deploymentCard.getByTestId('house-office-helper-stop').click();
  });
});
