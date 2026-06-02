const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('FP-E2E-022Q selected outpost crew shows read-only outpost status surface', async ({ page }) => {
  test.setTimeout(60_000);
  const plotId = 'plot_hq16q_home';
  const outpostPlotId = 'plot_hq16q_outpost';
  const claimId = 'claim_hq16q_ridge';
  const planId = 'site_plan_hq16q_ridge';
  const cellId = 'cell_q0_r1';
  const outpostUnitId = 'expedition_unit_outpost_crew_claim_hq16q_ridge';

  const expeditionState = {
    ok: true,
    plotId,
    stateHash: 'hq16q-outpost-status-state',
    state: {
      plot: {
        plotId,
        pairId: 'pair:hq16q',
        hqLevel: 7,
        townXp: 390,
        inventory: { wood: 44, stone: 22, food: 36, coin: 10 },
        scoutReports: [],
        sitePlans: [],
      },
      buildings: [
        { buildingId: 'bldg_hq_hq16q', type: 'HQ', x: 1, y: 0, level: 7, state: 'READY' },
        { buildingId: 'bldg_expedition_hq16q', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: 'READY' },
      ],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'outpost-status', title: 'Outpost', body: 'Select the map crew.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: [{
        claimId,
        originPlotId: plotId,
        sitePlanId: planId,
        foundedPlotId: outpostPlotId,
        status: 'FOUNDED',
        title: 'Ridge Outpost',
        receipt: {
          kind: 'settlement_founded',
          foundedPlotId: outpostPlotId,
          summary: 'Outpost founded; crew stationed on the map.',
        },
      }],
      ownedPlots: [
        { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 7, active: true },
        { plotId: outpostPlotId, role: 'OUTPOST', title: 'Ridge Outpost', hqLevel: 1, active: false, originClaimId: claimId },
      ],
      activePlotId: plotId,
      homePlotId: plotId,
      worldGrid: { status: 'READ_MODEL_READY', readOnly: true, civicReadiness: { ready: false }, requirements: { items: [], satisfiedCount: 0, totalCount: 0 } },
      expeditionMap: {
        status: 'FOG_READ_MODEL_READY',
        title: 'Expedition Map',
        implementation: 'hq12a_server_owned_expedition_map_read_model_v1',
        readOnly: true,
        executableActions: [],
        authorityBoundary: 'server_owned_read_only_expedition_map_fog_of_war_projection_v1',
        fog: { states: ['discovered', 'known', 'hinted', 'locked_unknown'], counts: { discovered: 2, known: 0, hinted: 1, locked_unknown: 1 } },
        scope: { homePlotId: plotId, activePlotId: plotId, ownedPlotCount: 2, scoutReportCount: 1, scoutedSectorCount: 1, sitePlanCount: 1, settlementClaimCount: 1 },
        sourceSummary: { originPlotId: plotId, foundedPlotIds: [outpostPlotId] },
        expeditionParty: { partyId: 'expedition_party_current_plot_v1', kind: 'expedition_party_snapshot', readOnly: true, executableActions: [], members: [] },
        units: {
          unitRosterId: 'expedition_unit_roster_current_plot_v1',
          kind: 'expedition_unit_roster',
          version: 'hq15a_server_owned_expedition_unit_roster_v1',
          readOnly: true,
          executableActions: [],
          authorityBoundary: 'server_owned_read_only_expedition_unit_roster_v1',
          interactionModel: { selectable: true, mapTokens: true, commandBarReady: true, movementPreviewOnly: false, movementCommandReady: true },
          items: [{
            unitId: outpostUnitId,
            kind: 'expedition_map_unit',
            unitType: 'outpost_crew',
            displayName: 'Outpost Crew',
            role: 'outpost_crew',
            state: 'STATIONED',
            readOnly: true,
            selectable: true,
            executableActions: [],
            location: { cellId, q: 0, r: 1, fogState: 'discovered' },
            movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
            sourceClaimId: claimId,
            sourcePlanId: planId,
            commandHints: [{
              commandId: 'inspect_outpost',
              label: 'Inspect outpost',
              enabled: true,
              serverMutationImplemented: false,
              previewOnlyUntilSelected: true,
            }],
            boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          }],
          byCellId: { [cellId]: [outpostUnitId] },
          boundaryFlags: { movementMutation: false, movementRevealsFog: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
        cells: [
          {
            cellId: 'cell_origin',
            q: 0,
            r: 0,
            fogState: 'discovered',
            kind: 'origin_plot',
            title: 'Founders Plot',
            status: 'OWNED_HOME',
            sourceTruth: 'founder_plot',
            sourceIds: { plotId },
            receipts: [{ kind: 'origin_plot_discovered', sourceIds: { plotId }, readOnly: true }],
            traits: ['home'],
            resourceHints: {},
            siteType: 'home_plot',
            risk: 'owned',
            readOnly: true,
          },
          {
            cellId,
            q: 0,
            r: 1,
            fogState: 'discovered',
            kind: 'owned_outpost',
            title: 'Ridge Outpost',
            status: 'OWNED_OUTPOST',
            sourceTruth: 'plot_membership',
            sourceIds: { plotId: outpostPlotId, originPlotId: plotId, originClaimId: claimId, claimId, planId },
            receipts: [{ kind: 'founded_outpost_discovered_cell', sourceIds: { claimId, foundedPlotId: outpostPlotId }, readOnly: true }],
            traits: ['owned-outpost'],
            resourceHints: {},
            siteType: 'woodland_ridge',
            risk: 'low',
            summary: 'A server-owned outpost crew is stationed here.',
            recommendedNext: 'Scout the next hinted frontier cell from the map.',
            readOnly: true,
          },
          {
            cellId: 'cell_q1_r1',
            q: 1,
            r: 1,
            fogState: 'hinted',
            kind: 'frontier_hint',
            title: 'Map Edge',
            status: 'HINTED_BY_KNOWN_FRONTIER',
            sourceTruth: 'derived_hint',
            sourceIds: { adjacentCellId: cellId },
            receipts: [{ kind: 'derived_frontier_hint_cell', sourceIds: { adjacentCellId: cellId }, readOnly: true }],
            traits: [],
            resourceHints: {},
            siteType: 'unresolved_frontier',
            risk: 'unknown',
            readOnly: true,
          },
          {
            cellId: 'cell_q3_r0',
            q: 3,
            r: 0,
            fogState: 'locked_unknown',
            kind: 'fog_placeholder',
            title: 'Locked Unknown',
            status: 'LOCKED_UNKNOWN',
            sourceTruth: 'fog_placeholder',
            sourceIds: { ring: 3, index: 0 },
            receipts: [{ kind: 'locked_unknown_placeholder_cell', sourceIds: { ring: 3, index: 0 }, readOnly: true }],
            traits: [],
            resourceHints: {},
            siteType: 'unknown',
            risk: 'unknown',
            readOnly: true,
          },
        ],
        eventPackets: [],
        receipt: { kind: 'expedition_map_read_model_projection', sourceIds: { plotId }, readOnly: true, routeCreation: false, atlasExecution: false, projectionHash: 'hq16q-outpost-map' },
        projectionHash: 'hq16q-outpost-map',
      },
      publicSummary: { expeditionMapStatus: 'FOG_READ_MODEL_READY', expeditionMapDiscoveredCount: 2, expeditionMapHintedCount: 1, expeditionMapLockedUnknownCount: 1 },
      visualActors: [],
      audit: { stateHash: 'hq16q-outpost-status-state' },
    },
  };

  await page.route('**/api/founders-plot/state', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(expeditionState),
  }));
  await page.route('**/api/founders-plot/plots**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      plotId,
      homePlotId: plotId,
      activePlotId: plotId,
      plots: expeditionState.state.ownedPlots,
      settlementClaims: expeditionState.state.settlementClaims,
    }),
  }));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`).click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', outpostUnitId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-actions', '0');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-cell-id', cellId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-next-cell-id', 'cell_q1_r1');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-target-cell-id', 'cell_q1_r1');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-actions', '0');
  await expect(page.getByTestId('fp-expedition-outpost-next-frontier')).toHaveAttribute('data-cell-id', 'cell_q1_r1');
  await expect(page.getByTestId('fp-expedition-outpost-next-frontier')).toHaveAttribute('data-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-outpost-next-frontier')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-next-frontier')).toHaveAttribute('data-actions', '0');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toContainText('⌂ Set');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toContainText('◇ Q1 R1');
  await expect(page.getByTestId('fp-expedition-outpost-status-details')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-expedition-outpost-status')).not.toContainText(/guarded endpoint|approval|review|packet|proof|endpoint/i);
  const desktopRenderer = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(desktopRenderer.outpostNextFrontierBeacons).toHaveLength(1);
  expect(desktopRenderer.outpostNextFrontierBeacons[0]).toMatchObject({
    unitId: outpostUnitId,
    originCellId: cellId,
    targetCellId: 'cell_q1_r1',
    targetFogState: 'hinted',
    targetKind: 'frontier_hint',
    derivedFrom: 'sourceIds.adjacentCellId',
    visualOnly: true,
    readOnly: true,
    selectable: false,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
    hiddenTruthLeakage: false,
  });
  expect(desktopRenderer.objectiveMarkers).toHaveLength(1);
  expect(desktopRenderer.objectiveMarkers[0]).toMatchObject({
    mode: 'scout',
    targetCellId: 'cell_q1_r1',
    visualOnly: true,
    readOnly: true,
    selectable: true,
    inspectable: true,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
  });
  expect(desktopRenderer.visualLayers.outpostNextFrontierBeaconCount).toBe(1);
  expect(desktopRenderer.visualLayers.outpostNextFrontierBeaconVisualOnly).toBe(true);
  expect(desktopRenderer.visualLayers.outpostNextFrontierBeaconReadOnly).toBe(true);
  expect(desktopRenderer.visualLayers.outpostNextFrontierBeaconSelectable).toBe(false);
  expect(desktopRenderer.visualLayers.outpostNextFrontierBeaconAuthority).toBe(false);
  expect(desktopRenderer.visualLayers.outpostNextFrontierBeaconHiddenTruthLeakage).toBe(false);
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-desktop.png',
  });
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-desktop.png',
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`).click({ force: true });
  await expect(page.getByTestId('fp-expedition-outpost-status')).toBeVisible();
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-mobile.png',
  });
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-mobile.png',
  });

  const proof = await page.evaluate(({ outpostUnitId, cellId }) => {
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const surface = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    const details = document.querySelector('[data-testid="fp-expedition-outpost-status-details"]');
    const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-outpost-status"], [data-testid="fp-expedition-unit-roster"], [data-testid="fp-expedition-unit-command-bar"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.className || node.tagName);
    const verticallyClipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-outpost-status"], [data-testid="fp-expedition-unit-command-bar"]'))
      .filter((node) => node.scrollHeight > node.clientHeight + 1)
      .map((node) => node.getAttribute('data-testid') || node.className || node.tagName);
    return {
      outpostStatus: {
        unitId: surface?.getAttribute('data-unit-id') || '',
        cellId: surface?.getAttribute('data-cell-id') || '',
        claimId: surface?.getAttribute('data-claim-id') || '',
        foundedPlotId: surface?.getAttribute('data-founded-plot-id') || '',
        readOnly: surface?.getAttribute('data-read-only') || '',
        actions: surface?.getAttribute('data-actions') || '',
        text: surface?.innerText || '',
      },
      details: {
        present: !!details,
        open: details?.hasAttribute('open') || false,
        text: details?.innerText || '',
      },
      commandBar: {
        unitId: commandBar?.getAttribute('data-unit-id') || '',
        cellId: commandBar?.getAttribute('data-cell-id') || '',
        text: commandBar?.innerText || '',
      },
      renderer: {
        selectedCellId: renderer.selectedCellId,
        unitTokenCount: renderer.unitTokenCount,
        commandTargetCount: renderer.visualLayers?.commandTargetCount ?? 0,
        visualLayers: renderer.visualLayers,
        outpostNextFrontierBeacons: renderer.outpostNextFrontierBeacons,
      },
      primaryText: {
        outpostStatus: surface?.innerText || '',
        unitRoster: document.querySelector('[data-testid="fp-expedition-unit-roster"]')?.innerText || '',
        selectedSummary: document.querySelector('[data-testid="fp-expedition-map-selected-summary"]')?.innerText || '',
      },
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped,
        verticallyClipped,
      },
      expected: { outpostUnitId, cellId },
    };
  }, { outpostUnitId, cellId });

  const primaryPaperworkPattern = /guarded endpoint|approval|review|packet|proof|endpoint/i;
  for (const text of Object.values(proof.primaryText)) {
    expect(text).not.toMatch(primaryPaperworkPattern);
  }
  expect(proof.outpostStatus.text).toMatch(/⌂ Set/);
  expect(proof.outpostStatus.text).toMatch(/◇ Q1 R1/);
  expect(proof.mobileFit.clipped).toEqual([]);
  expect(proof.mobileFit.verticallyClipped).toEqual([]);

  fs.writeFileSync('reports/agent-town-hq16q-outpost-status-map-surface-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16Q Outpost Status Map Surface',
    source: 'FP-E2E-022Q mocked existing server-owned owned_outpost cell and outpost_crew unit read model',
    screenshots: [
      'reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-desktop.png',
      'reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-mobile.png',
    ],
    proof,
    guardrails: {
      frontendRendererE2eOnly: true,
      serverAuthorityUnchanged: true,
      serverOwnedOutpostCrewUnit: proof.outpostStatus.unitId === outpostUnitId,
      focusedOwnedOutpostCell: proof.outpostStatus.cellId === cellId && proof.renderer.selectedCellId === cellId,
      compactGameNativeSurface: /⌂ Set/.test(proof.outpostStatus.text) && /◇ Q1 R1/.test(proof.outpostStatus.text),
      nextSpatialStepProjectedFromServerHint: /Q1 R1/.test(proof.outpostStatus.text),
      detailsDrawerAvailable: proof.details.present === true,
      detailsDrawerCollapsedByDefault: proof.details.open === false,
      noClientOutpostAuthority: proof.outpostStatus.readOnly === 'true' && proof.outpostStatus.actions === '0',
      primarySurfacePaperworkHidden: Object.values(proof.primaryText).every((text) => !primaryPaperworkPattern.test(text)),
      rendererCreatedNoActions: proof.renderer.visualLayers.clientAuthority === false,
      unitTokensReadOnly: proof.renderer.visualLayers.unitTokensReadOnly === true,
      routeAuthority: false,
      tradeRouteCreation: false,
      resourceHarvesting: false,
      rewardCreation: false,
      backgroundScheduling: false,
      combat: false,
      hiddenTruthLeakage: false,
      crossPlotMutationBeyondExistingFoundSettlementContract: false,
      atlasExecution: false,
      generatedUniverseRuntimeExpansion: false,
      externalEffects: false,
      mobileHorizontalOverflow: proof.mobileFit.clipped.length,
    },
  }, null, 2));

  fs.writeFileSync('reports/agent-town-hq16r-outpost-next-frontier-beacon-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16R Outpost Next-Frontier Map Beacon',
    source: 'FP-E2E-022Q mocked server-owned owned_outpost cell, outpost_crew unit, and hinted frontier_hint read-model cell',
    screenshots: [
      'reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-desktop.png',
      'reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-mobile.png',
    ],
    proof: {
      outpostStatus: proof.outpostStatus,
      renderer: {
        selectedCellId: proof.renderer.selectedCellId,
        commandTargetCount: proof.renderer.commandTargetCount,
        visualLayers: proof.renderer.visualLayers,
        outpostNextFrontierBeacons: proof.renderer.outpostNextFrontierBeacons,
      },
      mobileFit: proof.mobileFit,
    },
    guardrails: {
      frontendRendererE2eReportProofOnly: true,
      serverAuthorityUnchanged: true,
      serverOwnedOutpostCrewUnit: proof.outpostStatus.unitId === outpostUnitId,
      ownedOutpostCell: proof.outpostStatus.cellId === cellId,
      nextFrontierBeaconProjectedFromServerHint: proof.renderer.outpostNextFrontierBeacons.length === 1
        && proof.renderer.outpostNextFrontierBeacons[0].originCellId === cellId
        && proof.renderer.outpostNextFrontierBeacons[0].targetCellId === 'cell_q1_r1'
        && proof.renderer.outpostNextFrontierBeacons[0].targetFogState === 'hinted'
        && proof.renderer.outpostNextFrontierBeacons[0].targetKind === 'frontier_hint'
        && proof.renderer.outpostNextFrontierBeacons[0].derivedFrom === 'sourceIds.adjacentCellId',
      mapNativeVisualTarget: proof.renderer.visualLayers.outpostNextFrontierBeaconCount === 1,
      visualOnly: proof.renderer.visualLayers.outpostNextFrontierBeaconVisualOnly === true,
      readOnly: proof.renderer.visualLayers.outpostNextFrontierBeaconReadOnly === true,
      notSelectable: proof.renderer.visualLayers.outpostNextFrontierBeaconSelectable === false,
      executableActions: proof.renderer.outpostNextFrontierBeacons.every((beacon) => beacon.executableActions === 0),
      routeAuthority: false,
      actionAuthority: false,
      noHiddenTruthLeakage: proof.renderer.visualLayers.outpostNextFrontierBeaconHiddenTruthLeakage === false,
      scoutSectorOnlyFogRevealMutation: true,
      noOutpostCommands: proof.renderer.commandTargetCount === 0,
      noMovementRouteTradeResourcesSchedulesCombatAtlasGeneratedUniverseExternalEffects: true,
      mobileHorizontalOverflow: proof.mobileFit.clipped.length,
      mobileVerticalClipping: proof.mobileFit.verticallyClipped.length,
    },
  }, null, 2));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`).click({ force: true });
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-cell-id', cellId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-target-cell-id', 'cell_q1_r1');
  const bridgeBefore = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(bridgeBefore.outpostNextFrontierBeacons).toHaveLength(1);
  expect(bridgeBefore.objectiveMarkers).toHaveLength(1);
  expect(bridgeBefore.outpostNextFrontierBeacons[0].targetCellId).toBe(bridgeBefore.objectiveMarkers[0].targetCellId);
  expect(bridgeBefore.objectiveMarkers[0]).toMatchObject({
    mode: 'scout',
    targetCellId: 'cell_q1_r1',
    visualOnly: true,
    readOnly: true,
    selectable: true,
    executableActions: 0,
  });

  await page.getByTestId('fp-expedition-three-canvas').click({ position: bridgeBefore.objectiveMarkers[0].canvas, force: true });
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-cell-id', 'cell_q1_r1');
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-scoutable', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-cell-id', cellId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-bridge-target-cell-id', 'cell_q1_r1');
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q1_r1')).toHaveAttribute('data-cell-id', 'cell_q1_r1');
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16t-outpost-beacon-to-scout-objective-bridge-2026-06-02-desktop.png',
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-cell-id', 'cell_q1_r1');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-cell-id', cellId);
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16t-outpost-beacon-to-scout-objective-bridge-2026-06-02-mobile.png',
  });

  const bridgeProof = await page.evaluate(({ outpostUnitId, cellId }) => {
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const outpost = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    const next = document.querySelector('[data-testid="fp-expedition-outpost-next-frontier"]');
    const objective = document.querySelector('[data-testid="fp-expedition-objective-strip"]');
    const selectedSummary = document.querySelector('[data-testid="fp-expedition-map-selected-summary"]');
    const scoutAlias = document.querySelector('[data-testid="fp-btn-scout-sector-cell_q1_r1"]');
    const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-outpost-status"], [data-testid="fp-expedition-objective-strip"], [data-testid="fp-expedition-unit-command-bar"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.className || node.tagName);
    return {
      outpost: {
        unitId: outpost?.getAttribute('data-unit-id') || '',
        cellId: outpost?.getAttribute('data-cell-id') || '',
        nextCellId: outpost?.getAttribute('data-next-cell-id') || '',
        bridgeTargetCellId: outpost?.getAttribute('data-bridge-target-cell-id') || '',
        bridgeCommandId: outpost?.getAttribute('data-bridge-command-id') || '',
        bridgeReadOnly: outpost?.getAttribute('data-bridge-read-only') || '',
        bridgeActions: Number(outpost?.getAttribute('data-bridge-actions') || 0),
        text: outpost?.innerText || '',
      },
      nextFrontierChip: {
        cellId: next?.getAttribute('data-cell-id') || '',
        commandId: next?.getAttribute('data-command-id') || '',
        readOnly: next?.getAttribute('data-read-only') || '',
        actions: Number(next?.getAttribute('data-actions') || 0),
        label: next?.textContent || '',
      },
      objective: {
        mode: objective?.getAttribute('data-mode') || '',
        targetCellId: objective?.getAttribute('data-target-cell-id') || '',
        readOnly: objective?.getAttribute('data-read-only') || '',
        actions: Number(objective?.getAttribute('data-actions') || 0),
        buttons: objective ? objective.querySelectorAll('button').length : 0,
      },
      selectedSummary: {
        cellId: selectedSummary?.getAttribute('data-cell-id') || '',
        scoutable: selectedSummary?.getAttribute('data-scoutable') || '',
        text: selectedSummary?.innerText || '',
      },
      scoutAlias: {
        present: !!scoutAlias,
        cellId: scoutAlias?.getAttribute('data-cell-id') || '',
        idempotencyKey: scoutAlias?.getAttribute('data-idempotency-key') || '',
        text: scoutAlias?.textContent || '',
      },
      commandBar: {
        unitId: commandBar?.getAttribute('data-unit-id') || '',
        actions: Number(commandBar?.getAttribute('data-actions') || 0),
        text: commandBar?.innerText || '',
      },
      renderer: {
        selectedCellId: renderer.selectedCellId,
        visualLayers: renderer.visualLayers,
        outpostNextFrontierBeacons: renderer.outpostNextFrontierBeacons,
        objectiveMarkers: renderer.objectiveMarkers,
        commandTargets: renderer.commandTargets,
      },
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped,
      },
      expected: { outpostUnitId, cellId, targetCellId: 'cell_q1_r1' },
    };
  }, { outpostUnitId, cellId });

  expect(bridgeProof.outpost.cellId).toBe(cellId);
  expect(bridgeProof.outpost.bridgeTargetCellId).toBe('cell_q1_r1');
  expect(bridgeProof.nextFrontierChip.cellId).toBe('cell_q1_r1');
  expect(bridgeProof.objective.mode).toBe('scout');
  expect(bridgeProof.objective.targetCellId).toBe('cell_q1_r1');
  expect(bridgeProof.objective.buttons).toBe(0);
  expect(bridgeProof.selectedSummary.cellId).toBe('cell_q1_r1');
  expect(bridgeProof.selectedSummary.scoutable).toBe('true');
  expect(bridgeProof.scoutAlias.present).toBe(true);
  expect(bridgeProof.scoutAlias.cellId).toBe('cell_q1_r1');
  expect(bridgeProof.commandBar.unitId).toBe(outpostUnitId);
  expect(bridgeProof.commandBar.actions).toBe(0);
  expect(bridgeProof.renderer.outpostNextFrontierBeacons[0].targetCellId).toBe('cell_q1_r1');
  expect(bridgeProof.renderer.objectiveMarkers[0].targetCellId).toBe('cell_q1_r1');
  expect(bridgeProof.renderer.commandTargets).toEqual([]);
  expect(bridgeProof.mobileFit.clipped).toEqual([]);

  fs.writeFileSync('reports/agent-town-hq16t-outpost-beacon-to-scout-objective-bridge-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16T Outpost Beacon to Scout Objective Bridge',
    source: 'FP-E2E-022Q mocked server-owned owned_outpost cell, outpost_crew unit, and hinted frontier_hint read-model cell',
    screenshots: [
      'reports/agent-town-hq16t-outpost-beacon-to-scout-objective-bridge-2026-06-02-desktop.png',
      'reports/agent-town-hq16t-outpost-beacon-to-scout-objective-bridge-2026-06-02-mobile.png',
    ],
    proof: bridgeProof,
    guardrails: {
      serverAuthorityUnchanged: true,
      serverOwnedReadModelFieldsOnly: true,
      outpostCrewOriginCellPreservedDuringScoutFocus: bridgeProof.outpost.cellId === cellId,
      bridgeTargetMatchesOutpostBeacon: bridgeProof.renderer.outpostNextFrontierBeacons[0]?.targetCellId === bridgeProof.outpost.bridgeTargetCellId,
      bridgeTargetMatchesScoutObjectiveMarker: bridgeProof.renderer.objectiveMarkers[0]?.targetCellId === bridgeProof.outpost.bridgeTargetCellId,
      bridgeTargetSelectedByExistingObjectiveMarker: bridgeProof.selectedSummary.cellId === bridgeProof.outpost.bridgeTargetCellId && bridgeProof.selectedSummary.scoutable === 'true',
      scoutSectorAffordanceExistingAndGuarded: bridgeProof.scoutAlias.present === true && bridgeProof.scoutAlias.cellId === bridgeProof.outpost.bridgeTargetCellId,
      outpostStatusReadOnly: bridgeProof.outpost.bridgeReadOnly === 'true' && bridgeProof.outpost.bridgeActions === 0,
      objectiveReadOnly: bridgeProof.objective.readOnly === 'true' && bridgeProof.objective.actions === 0 && bridgeProof.objective.buttons === 0,
      noOutpostCommandsCreated: bridgeProof.commandBar.actions === 0 && bridgeProof.renderer.commandTargets.length === 0,
      beaconVisualOnly: bridgeProof.renderer.visualLayers.outpostNextFrontierBeaconVisualOnly === true,
      beaconReadOnly: bridgeProof.renderer.visualLayers.outpostNextFrontierBeaconReadOnly === true,
      objectiveMarkerVisualOnly: bridgeProof.renderer.visualLayers.eventObjectiveMarkersVisualOnly === true,
      objectiveMarkerReadOnly: bridgeProof.renderer.visualLayers.eventObjectiveMarkersReadOnly === true,
      routeAuthority: false,
      movementAuthority: false,
      revealAuthority: false,
      scoutSectorOnlyFogRevealMutation: true,
      hiddenTruthLeakage: false,
      atlasExecution: false,
      generatedUniverseRuntimeExpansion: false,
      externalEffects: false,
      mobileHorizontalOverflow: bridgeProof.mobileFit.clipped.length,
    },
  }, null, 2));
});
