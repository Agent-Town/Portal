const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  getJson,
  openFoundersPlotFrame,
  postJson,
  runLumberCycle,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Contract Board stays locked before HQ2 and then offers living-town SUPPLY, BUILD, and PREPARATION requests with requester context', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const before = await getPlotState(frame);
  expect(before?.contracts?.boardLocked).toBe(true);
  expect(Array.isArray(before?.contracts?.offers) ? before.contracts.offers : []).toHaveLength(0);

  const hq2State = await bootstrapToHq2(frame);
  expect(hq2State?.contracts?.boardLocked).toBe(false);
  expect(Array.isArray(hq2State?.contracts?.offers)).toBe(true);
  expect(hq2State.contracts.offers).toHaveLength(3);

  const kinds = hq2State.contracts.offers.map((offer) => offer?.kind).sort();
  expect(kinds).toEqual(['BUILD', 'PREPARATION', 'SUPPLY']);
  for (const offer of hq2State.contracts.offers) {
    expect(offer).toEqual(expect.objectContaining({
      contractId: expect.stringMatching(/^con_/),
      requesterId: expect.any(String),
      requesterSnapshot: expect.objectContaining({
        displayName: expect.any(String),
        institution: expect.any(String)
      }),
      whyNow: expect.any(String),
      townBenefit: expect.any(String),
      philosophyHint: expect.any(String)
    }));
  }
});

test('only one contract can be active, BUILD turn-in recognizes the Farm Plot, and SUPPLY turn-in is idempotent', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  let state = await bootstrapToHq2(frame);

  const buildOffer = state.contracts.offers.find((offer) => offer?.kind === 'BUILD');
  const supplyOffer = state.contracts.offers.find((offer) => offer?.kind === 'SUPPLY');
  expect(buildOffer?.contractId).toBeTruthy();
  expect(supplyOffer?.contractId).toBeTruthy();

  const acceptedBuild = await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: buildOffer.contractId,
    idempotencyKey: 'v11-contract-build:accept'
  });
  expect(acceptedBuild?.ok).toBe(true);
  expect(acceptedBuild?.contract?.status).toBe('ACTIVE');

  const blockedSecondAccept = await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: supplyOffer.contractId,
    idempotencyKey: 'v11-contract-supply:blocked-accept'
  });
  expect(blockedSecondAccept?.ok).toBe(false);
  expect(blockedSecondAccept?.error?.code).toBe('INVALID_STATE');

  const lumberBuildingId = String(
    (state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const extraQueue = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-contract-build:lumber-queue'
  });
  expect(extraQueue?.ok).toBe(true);
  await advancePlot(frame, 61_000);
  const extraCollect = await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-contract-build:lumber-collect'
  });
  expect(extraCollect?.ok).toBe(true);

  state = await getPlotState(frame);
  const firstOpenPad = state.pads.find((pad) => pad && pad.occupied === false);
  expect(firstOpenPad).toBeTruthy();

  const farmPlaced = await runPlotTool(frame, 'et.plot.place_building', {
    type: 'FARM_PLOT',
    x: firstOpenPad.x,
    y: firstOpenPad.y,
    idempotencyKey: 'v11-contract-build:place-farm'
  });
  expect(farmPlaced?.ok).toBe(true);
  await advancePlot(frame, 46_000);

  const buildState = await getPlotState(frame);
  expect(buildState?.contracts?.activeContract?.kind).toBe('BUILD');
  expect(buildState?.contracts?.activeContract?.status).toBe('READY_TO_TURN_IN');

  const turnedInBuild = await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: buildState.contracts.activeContract.contractId,
    idempotencyKey: 'v11-contract-build:turn-in'
  });
  expect(turnedInBuild?.ok).toBe(true);
  expect(turnedInBuild?.contract?.status).toBe('COMPLETED');

  const recap = await getJson(frame, '/api/founders-plot/recap');
  expect(recap?.ok).toBe(true);
  expect(recap?.recap?.lines?.some((line) => String(line?.line || '').includes(buildOffer.requesterSnapshot.displayName))).toBe(true);

  const refreshedSnapshot = await getJson(frame, '/api/founders-plot/state');
  const refreshedState = refreshedSnapshot?.state || null;
  const refreshedSupplyOffer = refreshedState?.contracts?.offers?.find((offer) => offer?.kind === 'SUPPLY');
  expect(refreshedSupplyOffer?.contractId).toBeTruthy();

  const acceptedSupply = await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: refreshedSupplyOffer.contractId,
    idempotencyKey: 'v11-contract-supply:accept'
  });
  expect(acceptedSupply?.ok).toBe(true);

  const supplySnapshot = await getJson(frame, '/api/founders-plot/state');
  const supplyState = supplySnapshot?.state || null;
  const activeSupply = supplyState?.contracts?.activeContract || null;
  expect(activeSupply?.kind).toBe('SUPPLY');

  for (let index = 0; index < 3; index += 1) {
    const cycle = await runLumberCycle(frame, lumberBuildingId, `v11-contract-supply:${index}`);
    expect(cycle?.ok).toBe(true);
    const readyState = await getPlotState(frame);
    if (readyState?.contracts?.activeContract?.status === 'READY_TO_TURN_IN') break;
  }
  expect((await getPlotState(frame))?.contracts?.activeContract?.status).toBe('READY_TO_TURN_IN');

  const firstTurnIn = await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: activeSupply.contractId,
    idempotencyKey: 'v11-contract-supply:turn-in'
  });
  expect(firstTurnIn?.ok).toBe(true);
  expect(firstTurnIn?.contract?.status).toBe('COMPLETED');

  const replayTurnIn = await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: activeSupply.contractId,
    idempotencyKey: 'v11-contract-supply:turn-in'
  });
  expect(replayTurnIn?.ok).toBe(true);
  expect(replayTurnIn?.contract?.contractId).toBe(firstTurnIn?.contract?.contractId);
  expect(replayTurnIn?.state?.stateHash).toBe(firstTurnIn?.state?.stateHash);
});
