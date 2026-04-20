const { test, expect } = require('@playwright/test');
const {
  acceptContractOffer,
  advancePlot,
  bootstrapToHq2,
  getOfferByKind,
  getPlotState,
  openFoundersPlotFrame,
  runLumberCycle,
  runPlotTool,
  turnInActiveContract
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('completing a living-town contract updates requester history, town signals, and journal entries', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const buildOffer = await getOfferByKind(frame, 'BUILD');
  expect(buildOffer?.requesterId).toBe('mara_market_host');
  const accepted = await acceptContractOffer(frame, buildOffer.contractId, 'v12-build-contract');
  expect(accepted?.ok).toBe(true);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String(state?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);
  const extraWood = await runLumberCycle(frame, lumberBuildingId, 'v12-farm-fund');
  expect(extraWood?.ok).toBe(true);

  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return Array.isArray(state?.buildings) && state.buildings.some((building) => building?.type === 'FARM_PLOT');
  }, null, { timeout: 5_000 });
  await advancePlot(frame, 46_000);

  const stateBeforeTurnIn = await getPlotState(frame);
  const activeContractId = String(stateBeforeTurnIn?.contracts?.activeContract?.contractId || '');
  expect(activeContractId).toBe(buildOffer.contractId);

  const turnedIn = await turnInActiveContract(frame, activeContractId, 'v12-build-turn-in');
  expect(turnedIn?.ok).toBe(true);

  const stateAfterTurnIn = await getPlotState(frame);
  expect(stateAfterTurnIn?.townSignals?.marketConfidence).toBeGreaterThan(50);
  expect(stateAfterTurnIn?.requesters?.find((requester) => requester.requesterId === 'mara_market_host')).toEqual(expect.objectContaining({
    completedContracts: 1,
    lastContractId: activeContractId
  }));

  const journal = await runPlotTool(frame, 'et.plot.journal.get_entries', {});
  expect(journal?.ok).toBe(true);
  expect(Array.isArray(journal?.data?.entries)).toBe(true);
  expect(journal.data.entries.some((entry) => entry?.category === 'SIGNAL' && entry?.eventId)).toBe(true);
  expect(journal.data.entries.some((entry) => /Mara/i.test(String(entry?.body || '')))).toBe(true);
});

test('PREPARATION contracts can miss softly and produce a small journaled signal change', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String(state?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  const extraWood = await runLumberCycle(frame, lumberBuildingId, 'v12-prep-fund');
  expect(extraWood?.ok).toBe(true);

  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return Array.isArray(state?.buildings) && state.buildings.some((building) => building?.type === 'FARM_PLOT');
  }, null, { timeout: 5_000 });
  await advancePlot(frame, 46_000);

  const prepOffer = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return Array.isArray(state?.contracts?.offers)
      ? state.contracts.offers.find((contract) => contract?.kind === 'PREPARATION') || null
      : null;
  });
  expect(prepOffer?.requesterId).toBe('nell_neighbor_lead');

  const accepted = await acceptContractOffer(frame, prepOffer.contractId, 'v12-prep-accept');
  expect(accepted?.ok).toBe(true);

  const before = await getPlotState(frame);
  const beforeGoodwill = Number(before?.townSignals?.neighborGoodwill || 0);

  await advancePlot(frame, 10 * 60 * 1000 + 1_000);
  const after = await getPlotState(frame);
  expect(after?.contracts?.activeContract).toBe(null);
  expect(after?.requesters?.find((requester) => requester.requesterId === 'nell_neighbor_lead')).toEqual(expect.objectContaining({
    missedContracts: 1,
    lastContractId: prepOffer.contractId
  }));
  expect(Number(after?.townSignals?.neighborGoodwill || 0)).toBeLessThan(beforeGoodwill);

  const journal = await runPlotTool(frame, 'et.plot.journal.get_entries', {});
  expect(journal?.ok).toBe(true);
  expect(journal.data.entries.some((entry) => entry?.category === 'REQUEST' && /Nell/i.test(String(entry?.body || '')))).toBe(true);
});
