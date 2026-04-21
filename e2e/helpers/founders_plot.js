const { expect } = require('@playwright/test');
const { hatchAndConnectLite, pressOpenViaAgentApi, unlockGateWithSigil } = require('./phase2');

async function openFoundersPlotFrame(page) {
  await openFoundersPlotRoute(page);
  return await getOpenFoundersPlotFrame(page);
}

async function openFoundersPlotRoute(page, { debug = false, route = '/app' } = {}) {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');
  await page.getByTestId('open-btn').click();
  await pressOpenViaAgentApi(page);
  const params = new URLSearchParams();
  params.set('district', 'founders-plot');
  if (debug) params.set('debug', '1');
  await page.goto(`${route}?${params.toString()}`);
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');
  return page;
}

async function getOpenFoundersPlotFrame(page) {
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');

  const iframe = page.locator('#districtModalBody iframe.districtFrame');
  await expect(iframe).toHaveCount(1, { timeout: 5000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame).toBeTruthy();
  await frame.waitForFunction(() => {
    return !!window.__foundersPlotTest?.getState?.()?.state?.stateHash;
  }, null, { timeout: 5000 });
  return frame;
}

async function getPlotState(frame) {
  return frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
}

async function runPlotTool(frame, toolName, args = {}) {
  return frame.evaluate(async ({ name, params }) => {
    return await window.__foundersPlotTest.runTool(name, params || {});
  }, { name: toolName, params: args || {} });
}

async function postJson(frame, url, body = {}) {
  return frame.evaluate(async ({ targetUrl, targetBody }) => {
    const response = await fetch(targetUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(targetBody || {})
    });
    return await response.json().catch(() => ({}));
  }, { targetUrl: url, targetBody: body || {} });
}

async function getJson(frame, url) {
  return frame.evaluate(async (targetUrl) => {
    const response = await fetch(targetUrl, { credentials: 'include' });
    return await response.json().catch(() => ({}));
  }, url);
}

async function advancePlot(frame, ms) {
  return frame.evaluate(async (targetMs) => {
    return await window.__foundersPlotTest.advance(targetMs);
  }, ms);
}

async function placeFirstLumberCamp(frame, keyPrefix = 'v11-place-lumber') {
  const pads = await getPlotState(frame);
  const firstPad = Array.isArray(pads?.pads) ? pads.pads.find((pad) => pad && pad.occupied === false) : null;
  if (!firstPad) throw new Error('NO_OPEN_PAD');
  return runPlotTool(frame, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: firstPad.x,
    y: firstPad.y,
    idempotencyKey: `${keyPrefix}:${Date.now()}`
  });
}

async function bootstrapToHq2(frame) {
  const placed = await placeFirstLumberCamp(frame, 'bootstrap-lumber');
  if (!placed?.ok) {
    throw new Error(`BOOTSTRAP_PLACE_FAILED:${placed?.error?.code || 'UNKNOWN'}`);
  }

  await advancePlot(frame, 31_000);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return String(lumber?.buildingId || '');
  });
  if (!lumberBuildingId) throw new Error('NO_LUMBER_CAMP');

  for (let index = 0; index < 4; index += 1) {
    const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
      buildingId: lumberBuildingId,
      idempotencyKey: `bootstrap-hq2:queue:${index}`
    });
    if (!queueResp?.ok) throw new Error(`BOOTSTRAP_QUEUE_FAILED:${queueResp?.error?.code || 'UNKNOWN'}`);
    await advancePlot(frame, 61_000);
    const collectResp = await runPlotTool(frame, 'et.plot.collect_outputs', {
      buildingId: lumberBuildingId,
      idempotencyKey: `bootstrap-hq2:collect:${index}`
    });
    if (!collectResp?.ok) throw new Error(`BOOTSTRAP_COLLECT_FAILED:${collectResp?.error?.code || 'UNKNOWN'}`);
  }

  const upgradeResp = await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'bootstrap-hq2:upgrade'
  });
  if (!upgradeResp?.ok) {
    throw new Error(`BOOTSTRAP_UPGRADE_FAILED:${upgradeResp?.error?.code || 'UNKNOWN'}`);
  }
  await advancePlot(frame, 121_000);
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 2, null, { timeout: 5000 });
  return getPlotState(frame);
}

async function startForemanRuntime(frame) {
  const started = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.startForemanRuntime();
  });
  await frame.waitForFunction(() => {
    const runtime = window.__foundersPlotTest.getState()?.state?.foreman?.runtime;
    return runtime?.status === 'OBSERVING' && typeof runtime?.runtimeId === 'string' && runtime.runtimeId.length > 0;
  }, null, { timeout: 10_000 });
  return started;
}

async function runProductionCycle(frame, buildingId, keyPrefix = 'plot-cycle') {
  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId,
    idempotencyKey: `${keyPrefix}:queue:${Date.now()}`
  });
  if (!queueResp?.ok) return queueResp;
  await advancePlot(frame, 91_000);
  return await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId,
    idempotencyKey: `${keyPrefix}:collect:${Date.now()}`
  });
}

async function runLumberCycle(frame, buildingId, keyPrefix = 'plot-lumber-cycle') {
  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId,
    idempotencyKey: `${keyPrefix}:queue:${Date.now()}`
  });
  if (!queueResp?.ok) return queueResp;
  await advancePlot(frame, 61_000);
  return await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId,
    idempotencyKey: `${keyPrefix}:collect:${Date.now()}`
  });
}

async function getOfferByKind(frame, kind) {
  const state = await getPlotState(frame);
  return Array.isArray(state?.contracts?.offers)
    ? state.contracts.offers.find((contract) => String(contract?.kind || '').toUpperCase() === String(kind || '').toUpperCase()) || null
    : null;
}

async function acceptContractOffer(frame, contractId, keyPrefix = 'contract-accept') {
  const response = await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId,
    idempotencyKey: `${keyPrefix}:${Date.now()}`
  });
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
  });
  return response;
}

async function turnInActiveContract(frame, contractId, keyPrefix = 'contract-turn-in') {
  const response = await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId,
    idempotencyKey: `${keyPrefix}:${Date.now()}`
  });
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
  });
  return response;
}

module.exports = {
  advancePlot,
  acceptContractOffer,
  bootstrapToHq2,
  getOpenFoundersPlotFrame,
  getJson,
  getOfferByKind,
  getPlotState,
  openFoundersPlotFrame,
  openFoundersPlotRoute,
  placeFirstLumberCamp,
  postJson,
  runLumberCycle,
  runPlotTool,
  runProductionCycle,
  startForemanRuntime,
  turnInActiveContract
};
