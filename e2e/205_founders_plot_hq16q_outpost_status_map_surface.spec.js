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
  await expect(page.getByTestId('fp-expedition-outpost-status')).toContainText('⌂ Set');
  await expect(page.getByTestId('fp-expedition-outpost-status')).toContainText('◇ Q1 R1');
  await expect(page.getByTestId('fp-expedition-outpost-status-details')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-expedition-outpost-status')).not.toContainText(/guarded endpoint|approval|review|packet|proof|endpoint/i);
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-desktop.png',
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`).click({ force: true });
  await expect(page.getByTestId('fp-expedition-outpost-status')).toBeVisible();
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16q-outpost-status-map-surface-2026-06-02-mobile.png',
  });

  const proof = await page.evaluate(({ outpostUnitId, cellId }) => {
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const surface = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    const details = document.querySelector('[data-testid="fp-expedition-outpost-status-details"]');
    const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-outpost-status"], [data-testid="fp-expedition-unit-roster"], [data-testid="fp-expedition-unit-command-bar"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
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
        commandTargetCount: renderer.commandTargetCount,
        visualLayers: renderer.visualLayers,
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
      frontendCssE2eOnly: true,
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
});
