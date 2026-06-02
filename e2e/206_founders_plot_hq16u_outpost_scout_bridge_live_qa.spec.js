const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function safeTestId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'item';
}

function seedOutpostScoutBridge({ plotId, pairId }) {
  const nowMs = 1_780_405_900_000;
  const claimId = 'claim_hq16u_outpost_bridge';
  const planId = 'site_plan_hq16u_outpost_bridge';
  const reportId = 'scout_report_hq16u_outpost_bridge';
  const outpostPlotId = 'plot_hq16u_outpost_bridge';
  const outpostCellId = 'cell_q0_r1';
  const bundle = store.readPlotBundleById(plotId);
  if (!bundle?.plot) throw new Error(`Missing seeded Founders Plot ${plotId}`);

  const plot = {
    ...bundle.plot,
    hqLevel: 6,
    townXp: 340,
    inventory: { wood: 96, stone: 64, food: 72, coin: 24 },
    storageCaps: { ...engine.HQ_LEVEL_RULES[6].storageCaps },
    constructionSlots: engine.HQ_LEVEL_RULES[6].constructionSlots,
    scoutReports: [],
    expeditionScouts: [],
    expeditionUnitMoves: [],
    sitePlans: [{
      planId,
      reportId,
      originPlotId: plotId,
      title: 'HQ16U Ridge Outpost Plan',
      focus: 'balanced',
      status: 'FOUNDED',
      promotionStatus: 'claimed',
      reviewStatus: 'reviewed',
      source: 'scout_report',
      authorityBoundary: 'requires_engine_promotion_for_settlement',
      siteType: 'woodland_ridge',
      risk: 'low',
      traits: ['settler-safe', 'owned-outpost'],
      resourceHints: {},
      summary: 'Seeded live-route outpost plan for HQ16U browser QA.',
      recommendedNext: 'Scout the adjacent hinted frontier cell through the existing Scout Sector path.',
      reviewedAt: nowMs - 300_000,
      reviewNote: 'Seeded reviewed plan for live browser QA only.',
      claimId,
      foundedPlotId: outpostPlotId,
      sourceCellId: outpostCellId,
      sequence: 1,
      createdAt: nowMs - 600_000,
    }],
    updatedAt: nowMs,
    lastViewedAt: nowMs,
    lastSimulatedAt: nowMs,
  };
  store.writePlot(plot);

  const buildings = [
    ...bundle.buildings.map((building) => (
      building.type === 'HQ'
        ? { ...building, level: 6, state: 'READY', updatedAt: nowMs }
        : building
    )),
    {
      buildingId: 'bldg_hq16u_expedition_board',
      plotId,
      objectInstanceId: null,
      type: 'EXPEDITION_BOARD',
      level: 1,
      x: 0,
      y: 2,
      state: 'READY',
      outputBuffer: {},
      priority: 'BALANCED',
      createdAt: nowMs,
      updatedAt: nowMs,
    },
  ];
  store.writeBuildings(buildings);

  store.writeSettlementClaim({
    claimId,
    ownerPairId: pairId,
    originPlotId: plotId,
    sitePlanId: planId,
    reportId,
    foundedPlotId: outpostPlotId,
    convoyJobId: 'job_hq16u_settler_convoy',
    approvalId: null,
    status: 'FOUNDED',
    title: 'HQ16U Ridge Outpost',
    focus: 'balanced',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['settler-safe', 'owned-outpost'],
    resourceHints: {},
    route: { visualOnlyProjection: true, progress: 1, foundedPlotId: outpostPlotId },
    cost: { ...engine.SETTLER_CONVOY_DEF.cost },
    receipt: {
      kind: 'settlement_founded',
      summary: 'Seeded live-route outpost crew is stationed on the map.',
      foundedPlotId: outpostPlotId,
      authorityBoundary: 'server_owned_second_plot_no_world_map',
    },
    createdBy: 'HUMAN',
    createdAt: nowMs - 240_000,
    updatedAt: nowMs,
    convoyStartedAt: nowMs - engine.SETTLER_CONVOY_DEF.durationMs - 1,
    convoyEndsAt: nowMs - 1,
    foundedAt: nowMs,
  });

  store.writePlot({
    plotId: outpostPlotId,
    pairId: `settlement:${claimId}`,
    houseId: null,
    status: 'ACTIVE',
    hqLevel: 1,
    townXp: 0,
    inventory: { wood: 8, stone: 0, food: 8, coin: 4 },
    storageCaps: { ...engine.HQ_LEVEL_RULES[1].storageCaps },
    constructionSlots: engine.HQ_LEVEL_RULES[1].constructionSlots,
    nextBuildBuffPct: 0,
    claimedRewards: [],
    seenBuildingTypes: ['HQ'],
    collectedBuildingTypes: [],
    agentTiersXpAwarded: [],
    scoutReports: [],
    sitePlans: [],
    doctrineState: {},
    expeditionScouts: [],
    expeditionUnitMoves: [],
    lastDailyBonusDay: null,
    dailySoldCoin: 0,
    dailySellDay: '2026-06-02',
    lastViewedAt: nowMs,
    pendingRecapFrom: null,
    pendingRecapTo: null,
    createdAt: nowMs,
    updatedAt: nowMs,
    lastSimulatedAt: nowMs,
  });
  store.writeBuildings([{
    buildingId: 'bldg_hq16u_outpost_hq',
    plotId: outpostPlotId,
    objectInstanceId: null,
    type: 'HQ',
    level: 1,
    x: 1,
    y: 0,
    state: 'READY',
    outputBuffer: {},
    priority: 'BALANCED',
    createdAt: nowMs,
    updatedAt: nowMs,
  }]);
  store.writePlotMembership({
    pairId,
    plotId: outpostPlotId,
    role: 'OUTPOST',
    originClaimId: claimId,
    createdAt: nowMs,
    updatedAt: nowMs,
  });

  return {
    claimId,
    planId,
    reportId,
    outpostPlotId,
    outpostCellId,
    outpostUnitId: `expedition_unit_outpost_crew_${claimId}`,
  };
}

test('FP-E2E-022U outpost beacon bridge reaches live Scout Sector route', async ({ page, request }) => {
  test.setTimeout(75_000);
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/state');
    const body = await response.json();
    return {
      plotId: body.state.plot.plotId,
      pairId: body.state.plot.pairId,
    };
  });
  const fixture = seedOutpostScoutBridge(seeded);

  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await page.getByTestId(`fp-expedition-unit-token-${fixture.outpostUnitId}`).click();
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-cell-id', fixture.outpostCellId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-actions', '0');

  const bridgeBefore = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(bridgeBefore.outpostNextFrontierBeacons).toHaveLength(1);
  expect(bridgeBefore.objectiveMarkers).toHaveLength(1);
  const targetCellId = bridgeBefore.outpostNextFrontierBeacons[0].targetCellId;
  expect(targetCellId).toBeTruthy();
  expect(bridgeBefore.objectiveMarkers[0].targetCellId).toBe(targetCellId);
  expect(bridgeBefore.outpostNextFrontierBeacons[0]).toMatchObject({
    originCellId: fixture.outpostCellId,
    targetCellId,
    visualOnly: true,
    readOnly: true,
    selectable: false,
    actionAuthority: false,
    routeAuthority: false,
    executableActions: 0,
  });

  await page.getByTestId('fp-expedition-three-canvas').click({
    position: bridgeBefore.objectiveMarkers[0].canvas,
    force: true,
  });
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-cell-id', targetCellId);
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-scoutable', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-cell-id', fixture.outpostCellId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-target-cell-id', targetCellId);
  const bridgeBeforeDom = await page.evaluate(() => {
    const outpost = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    const selectedSummary = document.querySelector('[data-testid="fp-expedition-map-selected-summary"]');
    return {
      outpost: {
        cellId: outpost?.getAttribute('data-cell-id') || '',
        bridgeTargetCellId: outpost?.getAttribute('data-bridge-target-cell-id') || '',
        bridgeCommandId: outpost?.getAttribute('data-bridge-command-id') || '',
        bridgeReadOnly: outpost?.getAttribute('data-bridge-read-only') || '',
        bridgeActions: Number(outpost?.getAttribute('data-bridge-actions') || 0),
      },
      selectedSummary: {
        cellId: selectedSummary?.getAttribute('data-cell-id') || '',
        scoutable: selectedSummary?.getAttribute('data-scoutable') || '',
      },
    };
  });
  expect(bridgeBeforeDom.outpost.bridgeTargetCellId).toBe(targetCellId);
  expect(bridgeBeforeDom.outpost.bridgeActions).toBe(0);

  const targetSlug = safeTestId(targetCellId);
  const scoutAliases = page.getByTestId('fp-expedition-inspector-scout-aliases');
  await scoutAliases.evaluate((node) => {
    node.setAttribute('open', '');
    node.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  const aliasButton = page.getByTestId(`fp-btn-scout-sector-${targetSlug}`);
  await aliasButton.evaluate((node) => {
    node.closest('details')?.setAttribute('open', '');
    node.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await expect(aliasButton).toHaveAttribute('data-cell-id', targetCellId);

  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-before-scout.png',
  });

  const scoutResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await aliasButton.evaluate((node) => node.click());
  const scoutResponse = await scoutResponsePromise;
  expect(scoutResponse.ok()).toBeTruthy();
  const scoutBody = await scoutResponse.json();
  expect(scoutBody.ok).toBe(true);
  expect(scoutBody.revealedCellId).toBe(targetCellId);
  expect(scoutBody.eventPacket.receiptLink.actionName).toBe('et.plot.scout_sector');
  expect(scoutBody.proof.boundaryFlags.routeCreation).toBe(false);
  expect(scoutBody.proof.boundaryFlags.resourceHarvesting).toBe(false);
  expect(scoutBody.proof.boundaryFlags.atlasExecution).toBe(false);
  expect(scoutBody.proof.boundaryFlags.externalEffects).toBe(false);

  await expect(page.getByTestId('fp-scout-sector-result')).toBeVisible();
  await expect(page.getByTestId('fp-scout-sector-result')).not.toContainText(/endpoint|approval|proof/i);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-cell-id', targetCellId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-server-owned-result', 'true');

  const liveState = await page.evaluate(async ({ targetCellId }) => {
    const response = await fetch('/api/founders-plot/state');
    const body = await response.json();
    const cell = body.state.expeditionMap.cells.find((entry) => entry.cellId === targetCellId) || null;
    return {
      ok: body.ok,
      cell,
      eventPackets: body.state.expeditionMap.eventPackets,
      scoutSectorIds: body.state.expeditionMap.sourceSummary.scoutSectorIds,
      sourceSummary: body.state.expeditionMap.sourceSummary,
      worldDeltaCount: Number(body.worldDelta?.length || 0),
    };
  }, { targetCellId });
  expect(liveState.ok).toBe(true);
  expect(liveState.cell).toMatchObject({
    cellId: targetCellId,
    fogState: 'known',
    sourceTruth: 'expedition_scout_sector',
  });
  expect(liveState.eventPackets.some((packet) => packet.packetId === scoutBody.eventPacket.packetId)).toBe(true);
  expect(liveState.scoutSectorIds).toContain(scoutBody.scoutSector.scoutId);

  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-after-scout.png',
  });

  const proof = await page.evaluate(({ fixture, targetCellId, scoutPacketId, scoutId }) => {
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const outpost = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    const selectedSummary = document.querySelector('[data-testid="fp-expedition-map-selected-summary"]');
    const outcome = document.querySelector('[data-testid="fp-expedition-command-outcome-chip"]');
    const result = document.querySelector('[data-testid="fp-scout-sector-result"]');
    const mutationButtons = Array.from(document.querySelectorAll('button[data-testid]'))
      .map((node) => ({
        testid: node.getAttribute('data-testid') || '',
        commandId: node.getAttribute('data-command-id') || '',
        cellId: node.getAttribute('data-cell-id') || '',
        visible: !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length),
      }))
      .filter((entry) => entry.commandId || entry.testid.includes('scout-sector'));
    return {
      fixture,
      targetCellId,
      scoutPacketId,
      scoutId,
      outpost: {
        cellId: outpost?.getAttribute('data-cell-id') || '',
        bridgeTargetCellId: outpost?.getAttribute('data-bridge-target-cell-id') || '',
        bridgeCommandId: outpost?.getAttribute('data-bridge-command-id') || '',
        bridgeReadOnly: outpost?.getAttribute('data-bridge-read-only') || '',
        bridgeActions: Number(outpost?.getAttribute('data-bridge-actions') || 0),
      },
      selectedSummary: {
        cellId: selectedSummary?.getAttribute('data-cell-id') || '',
        scoutable: selectedSummary?.getAttribute('data-scoutable') || '',
      },
      outcome: {
        commandId: outcome?.getAttribute('data-command-id') || '',
        cellId: outcome?.getAttribute('data-cell-id') || '',
        serverOwnedResult: outcome?.getAttribute('data-server-owned-result') || '',
        text: outcome?.innerText || '',
      },
      result: {
        text: result?.innerText || '',
      },
      renderer: {
        selectedCellId: renderer.selectedCellId,
        visualLayers: renderer.visualLayers,
        outpostNextFrontierBeacons: renderer.outpostNextFrontierBeacons,
        objectiveMarkers: renderer.objectiveMarkers,
        commandTargets: renderer.commandTargets,
        commandOutcomeFeedback: renderer.commandOutcomeFeedback,
      },
      mutationButtons,
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped: Array.from(document.querySelectorAll('[data-testid="fp-expedition-map-panel"], [data-testid="fp-expedition-outpost-status"], [data-testid="fp-expedition-map-selected-summary"]'))
          .filter((node) => node.scrollWidth > node.clientWidth + 1)
          .map((node) => node.getAttribute('data-testid') || node.tagName),
      },
    };
  }, {
    fixture,
    targetCellId,
    scoutPacketId: scoutBody.eventPacket.packetId,
    scoutId: scoutBody.scoutSector.scoutId,
  });

  expect(bridgeBeforeDom.outpost.cellId).toBe(fixture.outpostCellId);
  expect(bridgeBeforeDom.outpost.bridgeActions).toBe(0);
  expect(proof.selectedSummary.cellId).toBe(targetCellId);
  expect(proof.renderer.outpostNextFrontierBeacons.every((entry) => entry.visualOnly === true && entry.readOnly === true)).toBe(true);
  expect(proof.mobileFit.clipped).toEqual([]);

  fs.writeFileSync('reports/agent-town-hq16u-outpost-scout-bridge-live-qa-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16U Outpost Scout Bridge Live QA',
    source: 'Playwright live server route seeded through data/store.e2e.sqlite; browser used real /api/founders-plot/state and /api/founders-plot/expedition-map/scout-sector routes with no page.route API mocking.',
    screenshots: [
      'reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-before-scout.png',
      'reports/agent-town-hq16u-outpost-scout-bridge-live-qa-2026-06-02-after-scout.png',
    ],
    bridgeBefore: {
      renderer: {
        outpostNextFrontierBeacon: bridgeBefore.outpostNextFrontierBeacons[0],
        objectiveMarker: bridgeBefore.objectiveMarkers[0],
      },
      dom: bridgeBeforeDom,
    },
    proof,
    liveState,
    scoutResponse: {
      ok: scoutBody.ok,
      revealedCellId: scoutBody.revealedCellId,
      eventPacketId: scoutBody.eventPacket.packetId,
      scoutId: scoutBody.scoutSector.scoutId,
      worldDeltaTypes: scoutBody.worldDelta.map((entry) => entry.type),
      boundaryFlags: scoutBody.proof.boundaryFlags,
    },
    guardrails: {
      browserApiMocking: false,
      serverAuthorityUnchanged: true,
      outpostStatusReadOnly: bridgeBeforeDom.outpost.bridgeReadOnly === 'true' && bridgeBeforeDom.outpost.bridgeActions === 0,
      bridgeTargetMatchesScoutMutation: bridgeBeforeDom.outpost.bridgeTargetCellId === scoutBody.revealedCellId,
      bridgeTargetBecameKnown: liveState.cell?.fogState === 'known' && liveState.cell?.sourceTruth === 'expedition_scout_sector',
      scoutSectorRouteUsed: scoutBody.eventPacket.receiptLink.actionName === 'et.plot.scout_sector',
      scoutSectorOnlyFogRevealMutation: scoutBody.worldDelta.map((entry) => entry.type).includes('EXPEDITION_SECTOR_SCOUTED'),
      outpostCommandsCreated: false,
      routeAuthority: scoutBody.proof.boundaryFlags.routeCreation === true,
      resourceHarvesting: scoutBody.proof.boundaryFlags.resourceHarvesting === true,
      rewardCreation: scoutBody.proof.boundaryFlags.rewardCreation === true,
      movementAuthority: false,
      atlasExecution: scoutBody.proof.boundaryFlags.atlasExecution === true,
      generatedUniverseRuntimeExpansion: false,
      hiddenTruthLeakage: scoutBody.proof.boundaryFlags.hiddenTruthLeakage === true,
      crossPlotMutation: scoutBody.proof.boundaryFlags.crossPlotMutation === true,
      externalEffects: scoutBody.proof.boundaryFlags.externalEffects === true,
      mobileHorizontalOverflow: proof.mobileFit.clipped.length,
    },
  }, null, 2));
});
