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
  const iframe = page.locator('#districtModalBody iframe.districtFrame');
  await expect(iframe).toHaveCount(1, { timeout: 5000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame).toBeTruthy();
  await frame.waitForFunction(() => !!window.__foundersPlotTest?.getState?.()?.state?.stateHash, null, { timeout: 5000 });
  return frame;
}

async function runLumberCycle(frame, buildingId, keyPrefix) {
  await frame.evaluate(async ({ targetBuildingId, prefix }) => {
    await window.__foundersPlotTest.runTool('et.plot.queue_job', {
      buildingId: targetBuildingId,
      idempotencyKey: `${prefix}:queue`
    });
  }, { targetBuildingId: buildingId, prefix: keyPrefix });
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(61_000);
  });
  await frame.evaluate(async ({ targetBuildingId, prefix }) => {
    await window.__foundersPlotTest.runTool('et.plot.collect_outputs', {
      buildingId: targetBuildingId,
      idempotencyKey: `${prefix}:collect`
    });
  }, { targetBuildingId: buildingId, prefix: keyPrefix });
}

test('later progression costs only require already-unlocked resources and HQ2 leads directly into the first Farm Plot', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });

  const initialProgress = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state?.progress?.next || null);
  expect(initialProgress?.cost?.wood || 0).toBeGreaterThan(0);
  expect(initialProgress?.cost?.food || 0).toBeGreaterThan(0);
  expect(initialProgress?.cost?.stone || 0).toBe(0);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumberCamp = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return String(lumberCamp?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

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

  for (let index = 0; index < 4; index += 1) {
    await runLumberCycle(frame, lumberBuildingId, `hq2-lumber-${index}`);
  }

  await frame.waitForFunction(() => {
    return (window.__foundersPlotTest.getState()?.state?.plot?.inventory?.wood || 0) >= 20;
  }, null, { timeout: 5000 });

  await frame.getByTestId('founders-stage-object-HQ').click();
  await expect(frame.getByTestId('selection-upgrade')).toBeVisible({ timeout: 5000 });
  await frame.getByTestId('selection-upgrade').click();
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(121_000);
  });
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 2;
  }, null, { timeout: 5000 });

  const afterHq2 = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return {
      questStep: state?.quest?.step || '',
      permissions: state?.unlocks?.permissions || [],
      nextCost: state?.progress?.next?.cost || {}
    };
  });
  expect(afterHq2.questStep).toBe('place_farm_plot');
  expect(afterHq2.permissions).toContain('collectOutputs');
  expect(afterHq2.nextCost.food || 0).toBe(0);
  expect(afterHq2.nextCost.stone || 0).toBeGreaterThan(0);

  await runLumberCycle(frame, lumberBuildingId, 'hq2-farm-funding');
  await frame.waitForFunction(() => {
    return (window.__foundersPlotTest.getState()?.state?.plot?.inventory?.wood || 0) >= 10;
  }, null, { timeout: 5000 });

  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return Array.isArray(state?.buildings) && state.buildings.some((building) => building?.type === 'FARM_PLOT');
  }, null, { timeout: 5000 });
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(46_000);
  });

  const afterFarmPlot = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state?.quest?.step || '');
  expect(afterFarmPlot).toBe('choose_first_contract');
});

test('public summary uses explicit progress score semantics instead of a vague productivity score', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });

  const summaryPayload = await page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/summary', { credentials: 'include' });
    return await response.json().catch(() => ({}));
  });
  expect(summaryPayload?.ok).toBe(true);
  expect(summaryPayload?.summary?.progressScore).toBeGreaterThan(0);
  expect(summaryPayload?.summary?.scoreKind).toBe('founders_progress_v1');
  expect(summaryPayload?.summary?.scoreLabel).toBe('Founders progress');
  expect(summaryPayload?.summary?.scoreBreakdown?.hqLevel).toBeGreaterThan(0);
  expect(summaryPayload?.summary).not.toHaveProperty('productivityScore');
});
