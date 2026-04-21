const { test, expect } = require('@playwright/test');
const { REQUESTERS_V12, generateContractBoardOffers } = require('../server/founders_plot/contract_deck');
const {
  acceptContractOffer,
  bootstrapToHq2,
  getOfferByKind,
  getPlotState,
  openFoundersPlotFrame
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('default requester cast exists and the deck avoids immediate duplicates when alternatives exist', async () => {
  expect(Array.isArray(REQUESTERS_V12)).toBe(true);
  expect(REQUESTERS_V12).toHaveLength(4);
  expect(REQUESTERS_V12.map((requester) => requester.requesterId)).toEqual([
    'jasper_depot_clerk',
    'mara_market_host',
    'nell_neighbor_lead',
    'clara_town_scribe'
  ]);
  for (const requester of REQUESTERS_V12) {
    expect(requester).toEqual(expect.objectContaining({
      displayName: expect.any(String),
      institution: expect.any(String),
      roleTitle: expect.any(String),
      portraitEmoji: expect.any(String),
      signalAffinity: expect.any(String)
    }));
  }

  const simulatedState = {
    plot: { plotId: 'plot_v12', hqLevel: 2, inventory: { wood: 20, stone: 0, food: 12, coin: 20 } },
    buildings: [
      { type: 'HQ', state: 'READY' },
      { type: 'LUMBER_CAMP', state: 'READY' },
      { type: 'FARM_PLOT', state: 'READY' }
    ]
  };
  const recentContractKeys = [];
  const seenDeckKeys = [];
  for (let refreshCount = 0; refreshCount < 4; refreshCount += 1) {
    const offers = generateContractBoardOffers({
      state: simulatedState,
      nowMs: 1_000 + refreshCount,
      refreshCount,
      recentContractKeys
    });
    expect(offers.length).toBeGreaterThanOrEqual(2);
    expect(offers.length).toBeLessThanOrEqual(3);
    for (const offer of offers) {
      expect(offer.requesterId).toMatch(/_/);
      expect(offer.requesterSnapshot).toEqual(expect.objectContaining({
        displayName: expect.any(String),
        institution: expect.any(String),
        roleTitle: expect.any(String),
        portraitEmoji: expect.any(String)
      }));
      seenDeckKeys.push(offer.deckKey);
      recentContractKeys.push(offer.deckKey);
      while (recentContractKeys.length > 6) recentContractKeys.shift();
    }
  }
  const repeatedWithinAdjacentBoard = seenDeckKeys.some((key, index) => index > 0 && seenDeckKeys[index - 1] === key);
  expect(repeatedWithinAdjacentBoard).toBe(false);
});

test('the HQ2 board shows recurring requesters, snapshots requester identity, and still allows only one active contract', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const state = await bootstrapToHq2(frame);
  expect(state?.compatibility?.schemaVersion).toBe(3);

  const offers = Array.isArray(state?.contracts?.offers) ? state.contracts.offers : [];
  const kinds = offers.map((contract) => String(contract?.kind || ''));
  expect(kinds).toEqual(expect.arrayContaining(['SUPPLY', 'BUILD']));
  expect(offers.every((contract) => contract?.requesterId && contract?.requesterSnapshot?.displayName)).toBe(true);

  await frame.locator('[data-drawer-trigger="contracts"]').click();
  const boardText = await frame.getByTestId('founders-contract-board').textContent();
  expect(boardText).toMatch(/Atlas Depot|Market Circle|Neighbor Row|Town Hall/);

  const supplyOffer = await getOfferByKind(frame, 'SUPPLY');
  expect(supplyOffer?.requesterId).toBeTruthy();
  const accepted = await acceptContractOffer(frame, supplyOffer.contractId, 'v12-active-one');
  expect(accepted?.ok).toBe(true);

  const secondOffer = offers.find((contract) => contract.contractId !== supplyOffer.contractId);
  const blocked = await acceptContractOffer(frame, secondOffer.contractId, 'v12-active-two');
  expect(blocked?.ok).toBe(false);
  expect(blocked?.error?.code).toBe('INVALID_STATE');

  const after = await getPlotState(frame);
  expect(after?.contracts?.activeContract).toEqual(expect.objectContaining({
    contractId: supplyOffer.contractId,
    requesterId: expect.any(String),
    requesterSnapshot: expect.objectContaining({
      displayName: expect.any(String),
      institution: expect.any(String)
    })
  }));
});
