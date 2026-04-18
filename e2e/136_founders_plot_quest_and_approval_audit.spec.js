const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, pressOpenViaAgentApi, unlockGateWithSigil } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openFoundersPlotFrame(page) {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');
  await page.getByTestId('open-btn').click();
  await pressOpenViaAgentApi(page);

  await page.goto('/app?district=founders-plot');
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');

  const iframe = page.locator('#districtModalBody iframe.districtFrame');
  await expect(iframe).toHaveCount(1, { timeout: 5000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame).toBeTruthy();
  await frame.waitForSelector('[data-testid="founders-hero"]', { timeout: 5000 });
  await frame.waitForFunction(() => {
    return !!window.__foundersPlotTest?.getState?.()?.state?.stateHash;
  }, null, { timeout: 5000 });
  return frame;
}

async function readQuestStep(frame) {
  return frame.evaluate(() => window.__foundersPlotTest.getState()?.state?.quest?.step || '');
}

test('first loop stays on first wood until collection and keeps the camp actionable in the browser', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await expect(frame.locator('#questTitle')).toContainText('Raise your first work camp');
  await frame.getByTestId('founders-quest-cta').click();

  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });

  expect(await readQuestStep(frame)).toBe('collect_first_wood');
  await expect(frame.locator('#questTitle')).toContainText('Collect');

  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(61_000);
  });
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumberCamp = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return lumberCamp?.state === 'READY';
  }, null, { timeout: 5000 });

  expect(await readQuestStep(frame)).toBe('collect_first_wood');

  await frame.getByTestId('board-tile-0-0').click();
  await expect(frame.getByTestId('selection-queue')).toBeVisible({ timeout: 5000 });
  await frame.getByTestId('selection-queue').click();

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumberCamp = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return lumberCamp?.runningJob?.status === 'RUNNING';
  }, null, { timeout: 5000 });

  expect(await readQuestStep(frame)).toBe('collect_first_wood');

  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(61_000);
  });
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumberCamp = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return Array.isArray(lumberCamp?.completedJobs) && lumberCamp.completedJobs.length > 0;
  }, null, { timeout: 5000 });

  expect(await readQuestStep(frame)).toBe('collect_first_wood');

  await frame.getByTestId('board-tile-0-0').click();
  await expect(frame.getByTestId('selection-collect')).toBeVisible({ timeout: 5000 });
  await frame.getByTestId('selection-collect').click();

  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.quest?.step === 'upgrade_hq_2';
  }, null, { timeout: 5000 });
});

test('approval request and resolution appear in recap and replay audit events', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await frame.evaluate(async () => {
    await fetch('/api/founders-plot/recap/read', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    await window.__foundersPlotTest.loadState();
  });

  const approvalId = await frame.evaluate(async () => {
    const response = await window.__foundersPlotTest.runTool('et.plot.request_user_approval', {
      tool: 'et.plot.upgrade_building',
      title: 'Approve the HQ upgrade',
      body: 'This should appear in recap and replay.',
      payload: { buildingId: 'hq' },
      idempotencyKey: 'approval-audit-upgrade'
    });
    return String(response?.data?.approvalId || '');
  });
  expect(approvalId).toMatch(/^apr_/);

  await expect(frame.getByTestId('founders-approvals-panel')).toContainText('Approve the HQ upgrade');
  await frame.getByTestId('founders-approvals-panel').getByRole('button', { name: 'Approve' }).click();

  await frame.waitForFunction(() => {
    return (window.__foundersPlotTest.getState()?.state?.foreman?.pendingApprovals || []).length === 0;
  }, null, { timeout: 5000 });

  const recapPayload = await page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/recap', { credentials: 'include' });
    return await response.json().catch(() => ({}));
  });
  expect(recapPayload?.ok).toBe(true);
  expect(Array.isArray(recapPayload?.recap?.lines)).toBe(true);
  expect(recapPayload.recap.lines.some((line) => /approval/i.test(String(line?.line || '')))).toBe(true);

  const replayPayload = await page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/replay', { credentials: 'include' });
    return await response.json().catch(() => ({}));
  });
  expect(replayPayload?.ok).toBe(true);
  expect(Array.isArray(replayPayload?.replay?.events)).toBe(true);
  expect(replayPayload?.replay?.events?.some((event) => event?.type === 'APPROVAL_REQUESTED')).toBe(true);
  expect(replayPayload?.replay?.events?.some((event) => event?.type === 'APPROVAL_APPROVED')).toBe(true);
  expect(replayPayload?.replay?.events?.some((event) => event?.data?.approval?.approvalId === approvalId)).toBe(true);
  expect(replayPayload?.replay?.finalHash).toBe(replayPayload?.currentHash);
});
