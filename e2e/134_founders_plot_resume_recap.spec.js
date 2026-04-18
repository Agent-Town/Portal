const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, pressOpenViaAgentApi, unlockGateWithSigil } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openFoundersPlotFrame(page) {
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

test('Founders Plot survives reload, exposes recap from event logs, and keeps public summary routes read-only', async ({ page }) => {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');
  await page.getByTestId('open-btn').click();
  await pressOpenViaAgentApi(page);

  await page.goto('/app?district=founders-plot');
  let frame = await openFoundersPlotFrame(page);

  await frame.evaluate(async () => {
    await fetch('/api/founders-plot/recap/read', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    await window.__foundersPlotTest.loadState();
  });

  const placed = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.runTool('et.plot.place_building', {
      type: 'LUMBER_CAMP',
      x: 0,
      y: 0,
      idempotencyKey: 'resume-place-lumber'
    });
  });
  expect(placed?.ok).toBe(true);

  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(61_000);
  });

  const buildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumberCamp = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return typeof lumberCamp?.buildingId === 'string' ? lumberCamp.buildingId : '';
  });
  expect(buildingId).toMatch(/^bld_/);

  const queued = await frame.evaluate(async (targetBuildingId) => {
    return await window.__foundersPlotTest.runTool('et.plot.queue_job', {
      buildingId: targetBuildingId,
      idempotencyKey: 'resume-queue-lumber'
    });
  }, buildingId);
  expect(queued?.ok).toBe(true);

  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(61_000);
  });

  const collected = await frame.evaluate(async (targetBuildingId) => {
    return await window.__foundersPlotTest.runTool('et.plot.collect_outputs', {
      buildingId: targetBuildingId,
      idempotencyKey: 'resume-collect-lumber'
    });
  }, buildingId);
  expect(collected?.ok).toBe(true);

  const stateHashBeforeReload = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state?.stateHash || '');
  expect(stateHashBeforeReload).toMatch(/^[a-f0-9]{64}$/);

  await page.reload();
  frame = await openFoundersPlotFrame(page);

  const stateHashAfterReload = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state?.stateHash || '');
  expect(stateHashAfterReload).toBe(stateHashBeforeReload);

  await frame.locator('[data-testid="founders-recap-drawer"] summary').click();
  await expect(frame.locator('#recapList')).toContainText('Lumber Camp', { timeout: 5000 });

  const replayPayload = await page.evaluate(async () => {
    const resp = await fetch('/api/founders-plot/replay', { credentials: 'include' });
    return await resp.json().catch(() => ({}));
  });
  expect(replayPayload?.ok).toBe(true);
  expect(replayPayload?.replay?.finalHash).toBe(replayPayload?.currentHash);

  const summaryPayload = await page.evaluate(async () => {
    const resp = await fetch('/api/founders-plot/summary', { credentials: 'include' });
    return await resp.json().catch(() => ({}));
  });
  expect(summaryPayload?.ok).toBe(true);
  expect(summaryPayload?.summary?.progressScore).toBeGreaterThan(0);
  expect(summaryPayload?.summary?.scoreKind).toBe('founders_progress_v1');
  expect(summaryPayload?.summary?.plotId).toMatch(/^plot_/);
  expect(summaryPayload?.summary).not.toHaveProperty('pairId');
  expect(summaryPayload?.summary).not.toHaveProperty('productivityScore');

  const publicPayload = await page.evaluate(async (plotId) => {
    const resp = await fetch(`/api/founders-plot/public/${encodeURIComponent(plotId)}`, { credentials: 'include' });
    return await resp.json().catch(() => ({}));
  }, summaryPayload.summary.plotId);
  expect(publicPayload?.ok).toBe(true);
  expect(publicPayload?.plot?.plotId).toBe(summaryPayload.summary.plotId);
  expect(publicPayload?.plot?.progressScore).toBe(summaryPayload.summary.progressScore);
  expect(publicPayload?.plot?.scoreKind).toBe(summaryPayload.summary.scoreKind);
  expect(publicPayload?.plot).not.toHaveProperty('pairId');
});
