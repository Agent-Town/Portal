const { test, expect } = require('@playwright/test');
const {
  bootstrapToHq2,
  getJson,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runLumberCycle,
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function hasResourceDelta(event) {
  return !!event?.data?.resourceDelta;
}

test('replay exposes resource deltas for economy events and returns an action-log fixture for deterministic rebuilds', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  let state = await bootstrapToHq2(frame);

  const supplyOffer = state?.contracts?.offers?.find((offer) => offer?.kind === 'SUPPLY');
  expect(supplyOffer?.contractId).toBeTruthy();

  const accepted = await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: supplyOffer.contractId,
    idempotencyKey: 'v11-ledger-supply:accept'
  });
  expect(accepted?.ok).toBe(true);

  const lumberBuildingId = String(
    (state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  for (let index = 0; index < 3; index += 1) {
    const cycle = await runLumberCycle(frame, lumberBuildingId, `v11-ledger-supply:${index}`);
    expect(cycle?.ok).toBe(true);
    const supplyState = await getPlotState(frame);
    if (supplyState?.contracts?.activeContract?.status === 'READY_TO_TURN_IN') break;
  }
  expect((await getPlotState(frame))?.contracts?.activeContract?.status).toBe('READY_TO_TURN_IN');

  const turnIn = await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: supplyOffer.contractId,
    idempotencyKey: 'v11-ledger-supply:turn-in'
  });
  expect(turnIn?.ok).toBe(true);

  const replay = await getJson(frame, '/api/founders-plot/replay');
  expect(replay?.ok).toBe(true);
  expect(replay?.replay?.finalHash).toBe(replay?.currentHash);
  expect(replay?.replay?.actionLogFixture).toEqual(expect.objectContaining({
    initialState: expect.any(Object),
    actions: expect.any(Array),
    finalHash: expect.any(String)
  }));
  expect(replay.replay.actionLogFixture.actions.length).toBeGreaterThan(0);
  expect(replay.replay.actionLogFixture.finalHash).toBe(replay.replay.finalHash);

  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  const economyEvents = events.filter((event) => [
    'BUILDING_PLACED',
    'JOB_QUEUED',
    'JOB_COMPLETED',
    'OUTPUT_COLLECTED',
    'HQ_UPGRADED',
    'CONTRACT_COMPLETED'
  ].includes(String(event?.type || '')));
  expect(economyEvents.length).toBeGreaterThan(0);
  expect(economyEvents.every(hasResourceDelta)).toBe(true);

  for (const event of economyEvents) {
    const delta = event.data.resourceDelta;
    expect(delta).toEqual(expect.objectContaining({
      before: expect.any(Object),
      consumed: expect.any(Object),
      produced: expect.any(Object),
      collected: expect.any(Object),
      rewarded: expect.any(Object),
      cappedLost: expect.any(Object),
      after: expect.any(Object)
    }));
  }
});
