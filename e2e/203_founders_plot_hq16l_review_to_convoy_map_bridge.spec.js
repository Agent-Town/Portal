const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('FP-E2E-022L reviewed packet Site Plan points Surveyor to Prepare Convoy on the map', async ({ page }) => {
  const plotId = 'plot_hq16l_review_to_convoy_bridge';
  const packetId = 'expedition_event_packet_hq16l_cell_q0_r1';
  const planId = 'site_plan_hq16l_packet_ridge';
  const cellId = 'cell_q0_r1';
  const surveyorUnitId = 'expedition_unit_surveyor_site_plan_hq16l_packet_ridge';
  let capturedPrepare = null;

  const eventPacket = {
    packetId,
    kind: 'expedition_event_packet',
    version: 'hq12g.v1',
    templateId: 'ridge_lantern_packet_v1',
    scoutId: 'expedition_scout_hq16l_packet',
    plotId,
    cellId,
    q: 0,
    r: 1,
    discoveryFlavor: 'Reviewed ridge packet',
    terrainExplanation: 'Reviewed Site Plan evidence is visible as map truth only.',
    riskExplanation: 'Convoy remains guarded by the existing server endpoint.',
    operatorNote: 'Mira files the reviewed plan for convoy preparation.',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_expedition_event_packet_read_model_v1',
    partyId: 'expedition_party_current_plot_v1',
    receiptLink: {
      kind: 'scout_sector_receipt',
      actionName: 'et.plot.scout_sector',
      scoutId: 'expedition_scout_hq16l_packet',
      cellId,
      via: 'scoutSector.receipt',
    },
    boundaryFlags: {
      readModelOnly: true,
      receiptMetadataOnly: true,
      resourceHarvesting: false,
      resourceDelta: {},
      routeCreation: false,
      tradeRouteCreation: false,
      combat: false,
      backgroundScheduling: false,
      publicSharing: false,
      generatedUniverseRendering: false,
      atlasExecution: false,
      crossPlotMutation: false,
      externalEffects: false,
    },
    createdAt: 1700_000_500_000,
    packetHash: 'hq16lpacket',
  };

  const sitePlan = {
    planId,
    reportId: 'packet:expedition_scout_hq16l_packet',
    sourcePacketId: packetId,
    sourceCellId: cellId,
    title: 'Reviewed Ridge Packet Site Plan',
    summary: 'Packet-derived reviewed Site Plan for browser proof.',
    recommendedNext: 'Prepare a convoy.',
    targetCellId: cellId,
    reviewStatus: 'reviewed',
    promotionStatus: 'reviewed_claim_ready',
    reviewedAt: 1700_000_501_000,
    reviewNote: 'Reviewed through existing Site Plan contract.',
    readOnly: true,
  };

  const surveyBridge = {
    bridgeId: 'scout_packet_to_survey_bridge_current_plot_v1',
    kind: 'scout_packet_to_survey_bridge',
    version: 'hq16k_reviewed_packet_site_plan_to_surveyor_command_v1',
    plotId,
    status: 'SURVEYOR_COMMAND_READY',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_scout_packet_to_survey_read_model_v1',
    sourceProjectionHash: 'hq16l-expedition-map',
    activeCandidateId: 'survey_bridge_hq16l_packet',
    activePacketId: packetId,
    activeCellId: cellId,
    activeCandidate: {
      candidateId: 'survey_bridge_hq16l_packet',
      kind: 'scout_packet_to_survey_readiness',
      status: 'SURVEYOR_COMMAND_READY',
      readOnly: true,
      executableActions: [],
      packetId,
      scoutId: 'expedition_scout_hq16l_packet',
      cellId,
      cellFogState: 'known',
      cellStatus: 'SITE_PLAN_REVIEWED',
      sourceReceiptKind: 'scout_sector_receipt',
      sourceActionName: 'et.plot.scout_sector',
      sitePlan,
      surveyorUnit: {
        unitId: surveyorUnitId,
        unitType: 'surveyor',
        sourcePlanId: planId,
        cellId,
      },
      commandState: {
        commandId: 'prepare_settler_convoy',
        actionName: 'et.plot.prepare_settler_convoy',
        label: 'Prepare Convoy',
        enabled: true,
        sourcePlanId: planId,
        targetCellIds: [cellId],
        serverMutationImplemented: true,
        executableThroughExistingEndpoint: true,
        readOnly: true,
        executableActions: [],
      },
      nextRequiredContract: 'existing_prepare_settler_convoy_endpoint',
      boundaryFlags: {
        readModelOnly: true,
        readinessOnly: false,
        createsSitePlan: false,
        createsSurveyor: false,
        addsMutationAuthority: false,
        resourceHarvesting: false,
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        rewardCreation: false,
        backgroundScheduling: false,
        combat: false,
        publicSharing: false,
        generatedUniverseRendering: false,
        hiddenTruthLeakage: false,
        crossPlotMutation: false,
        atlasExecution: false,
        externalEffects: false,
      },
    },
    candidates: [],
    derivedFrom: ['expeditionMap.eventPackets', 'expeditionMap.cells', 'expeditionMap.units.items.commandHints', 'plot.sitePlans'],
    ledgerText: 'Reviewed packet-derived Site Plan exposes only the existing Prepare Convoy endpoint; the browser does not create Surveyors or new authority.',
    boundaryFlags: {
      readModelOnly: true,
      readinessOnly: false,
      createsSitePlan: false,
      createsSurveyor: false,
      addsMutationAuthority: false,
      resourceHarvesting: false,
      resourceDelta: {},
      routeCreation: false,
      tradeRouteCreation: false,
      rewardCreation: false,
      backgroundScheduling: false,
      combat: false,
      publicSharing: false,
      generatedUniverseRendering: false,
      hiddenTruthLeakage: false,
      crossPlotMutation: false,
      atlasExecution: false,
      externalEffects: false,
    },
  };
  surveyBridge.candidates = [surveyBridge.activeCandidate];

  const makeState = () => ({
    ok: true,
    plotId,
    stateHash: 'hq16l-state',
    recap: null,
    state: {
      plot: {
        plotId,
        pairId: 'pair:hq16l-review-to-convoy-bridge',
        hqLevel: 7,
        townXp: 320,
        inventory: { wood: 80, stone: 40, food: 60, coin: 20 },
        scoutReports: [],
        sitePlans: [sitePlan],
      },
      buildings: [
        { buildingId: 'bldg_hq_hq16l', type: 'HQ', x: 1, y: 0, level: 7, state: 'READY' },
        { buildingId: 'bldg_expedition_hq16l', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: 'READY' },
      ],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'prepare-settler-convoy', title: 'Prepare Convoy', body: 'Reviewed Site Plan can become one bounded convoy.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [sitePlan],
      settlementClaims: [],
      ownedPlots: [{ plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 7, active: true }],
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
        fog: { states: ['discovered', 'known', 'hinted', 'locked_unknown'], counts: { discovered: 1, known: 1, hinted: 0, locked_unknown: 1 } },
        scope: { homePlotId: plotId, activePlotId: plotId, ownedPlotCount: 1, scoutReportCount: 0, scoutedSectorCount: 1, sitePlanCount: 1, settlementClaimCount: 0 },
        sourceSummary: { originPlotId: plotId, worldGridStatus: 'READ_MODEL_READY', scoutSectorIds: ['expedition_scout_hq16l_packet'], eventPacketIds: [packetId], surveyBridgeCandidatePacketIds: [packetId], reviewedSitePlanIds: [planId], foundedPlotIds: [] },
        expeditionParty: { partyId: 'expedition_party_current_plot_v1', kind: 'expedition_party_snapshot', version: 'hq12g.v1', readOnly: true, executableActions: [], members: [] },
        units: {
          unitRosterId: 'expedition_unit_roster_current_plot_v1',
          kind: 'expedition_unit_roster',
          version: 'hq15a_server_owned_expedition_unit_roster_v1',
          readOnly: true,
          executableActions: [],
          authorityBoundary: 'server_owned_read_only_expedition_unit_roster_v1',
          interactionModel: { selectable: true, mapTokens: true, commandBarReady: true, movementPreviewOnly: false, movementCommandReady: true, serverAuthoritativeMovementRequiredForMutation: true },
          items: [{
            unitId: surveyorUnitId,
            kind: 'expedition_map_unit',
            unitType: 'surveyor',
            displayName: 'Surveyor Crew',
            role: 'surveyor',
            state: 'SURVEY_READY',
            readOnly: true,
            selectable: true,
            executableActions: [],
            location: { cellId, q: 0, r: 1, fogState: 'known' },
            movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
            sourcePlanId: planId,
            commandHints: [{
              commandId: 'prepare_settler_convoy',
              label: 'Prepare Convoy',
              actionName: 'et.plot.prepare_settler_convoy',
              enabled: true,
              sourcePlanId: planId,
              targetCellIds: [cellId],
              serverMutationImplemented: true,
              requiresHumanApprovalForAgent: true,
              routeCreation: false,
            }],
            boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          }],
          byCellId: { [cellId]: [surveyorUnitId] },
          boundaryFlags: { movementMutation: false, movementRevealsFog: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
        surveyBridge,
        cells: [{
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
        }, {
          cellId,
          q: 0,
          r: 1,
          fogState: 'known',
          kind: 'planned_site',
          title: 'Reviewed Ridge Packet Site Plan',
          status: 'SITE_PLAN_REVIEWED',
          sourceTruth: 'site_plan',
          sourceIds: { plotId, planId, eventPacketId: packetId, cellId },
          receipts: [{ kind: 'reviewed_site_plan_known_cell', sourceIds: { planId, eventPacketId: packetId }, eventPacketId: packetId, readOnly: true }],
          traits: ['scouted-frontier', 'reviewed-site-plan'],
          resourceHints: {},
          sitePlanObject: { planId, packetId, reviewStatus: 'reviewed', commandState: surveyBridge.activeCandidate.commandState, boundaryFlags: surveyBridge.activeCandidate.boundaryFlags },
          eventPacket,
          siteType: 'planned_site',
          risk: 'low',
          summary: 'Reviewed packet-derived Site Plan stays map-local planning truth.',
          recommendedNext: 'Prepare Convoy through the existing guarded endpoint.',
          readOnly: true,
        }, {
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
        }],
        eventPackets: [eventPacket],
        receipt: { kind: 'expedition_map_read_model_projection', sourceIds: { plotId, worldGridProjectionHash: 'hq16l-world-grid' }, readOnly: true, routeCreation: false, atlasExecution: false, projectionHash: 'hq16l-expedition-map' },
        projectionHash: 'hq16l-expedition-map',
      },
      publicSummary: { expeditionMapStatus: 'FOG_READ_MODEL_READY', expeditionMapDiscoveredCount: 1, expeditionMapKnownCount: 1, expeditionMapHintedCount: 0, expeditionMapLockedUnknownCount: 1 },
      visualActors: [],
      audit: { stateHash: 'hq16l-state' },
    },
  });

  await page.route('**/api/founders-plot/state', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(makeState()),
  }));
  await page.route('**/api/founders-plot/plots**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, plotId, homePlotId: plotId, activePlotId: plotId, plots: makeState().state.ownedPlots, settlementClaims: [] }),
  }));
  await page.route('**/api/founders-plot/prepare-settler-convoy', async (route) => {
    capturedPrepare = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        sitePlan,
        job: { jobId: 'job_hq16l_prepare_convoy', type: 'SETTLER_CONVOY', state: 'PREPARING', sitePlanId: planId },
        state: makeState().state,
      }),
    });
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('data-mode', 'convoy');
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('data-target-cell-id', cellId);
  await expect(page.getByTestId('fp-expedition-objective-strip')).toContainText('Convoy');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-status', 'SURVEYOR_COMMAND_READY');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-actions', '1');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-map-native-verb', 'Convoy');
  await expect(page.getByTestId(`fp-expedition-survey-bridge-btn-prepare-settler-convoy-${planId}`)).toHaveAttribute('data-action-name', 'et.plot.prepare_settler_convoy');
  await expect(page.getByTestId(`fp-expedition-unit-token-${surveyorUnitId}`)).toHaveAttribute('data-cell-id', cellId);

  await page.getByTestId(`fp-expedition-unit-token-${surveyorUnitId}`).click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', surveyorUnitId);
  await expect(page.getByTestId(`fp-btn-prepare-settler-convoy-unit-command-${planId}`)).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await expect.poll(async () => {
    const targets = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []);
    return targets.some((target) => target.commandId === 'prepare_settler_convoy' && target.cellId === 'cell_q0_r1');
  }).toBe(true);

  const prepareRing = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo()
    .commandTargets.find((target) => target.commandId === 'prepare_settler_convoy' && target.cellId === 'cell_q0_r1'));
  expect(prepareRing).toMatchObject({
    commandId: 'prepare_settler_convoy',
    unitId: surveyorUnitId,
    cellId,
    previewOnly: true,
    selectable: true,
    visualOnly: true,
    readOnly: true,
    executableActions: 0,
    routeAuthority: false,
    actionAuthority: false,
  });

  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-desktop.png' });
  await page.getByTestId('fp-expedition-three-canvas').click({ position: prepareRing.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-cell-id', cellId);
  await page.getByTestId('fp-btn-expedition-command-preview-confirm').click();
  await expect.poll(() => capturedPrepare?.sitePlanId || '').toBe(planId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-cell-id', cellId);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('data-mode', 'convoy');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-actions', '1');
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-mobile.png' });

  const proof = await page.evaluate(() => {
    const objective = document.querySelector('[data-testid="fp-expedition-objective-strip"]');
    const bridge = document.querySelector('[data-testid="fp-expedition-survey-bridge"]');
    const mapBridge = document.querySelector('[data-testid="fp-expedition-survey-bridge-map-selected"]');
    const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-objective-strip"], [data-testid="fp-expedition-survey-bridge"], [data-testid="fp-expedition-unit-command-bar"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.className || node.tagName);
    return {
      objective: {
        mode: objective?.getAttribute('data-mode') || '',
        targetCellId: objective?.getAttribute('data-target-cell-id') || '',
        text: objective?.textContent || '',
        buttons: objective ? objective.querySelectorAll('button').length : 0,
      },
      bridge: {
        status: bridge?.getAttribute('data-status') || '',
        actions: Number(bridge?.getAttribute('data-actions') || 0),
        commandId: bridge?.getAttribute('data-command-id') || '',
        actionName: bridge?.getAttribute('data-action-name') || '',
        mapNativeVerb: bridge?.getAttribute('data-map-native-verb') || '',
        readOnly: bridge?.getAttribute('data-read-only') || '',
        buttons: bridge ? bridge.querySelectorAll('button').length : 0,
      },
      mapBridge: {
        status: mapBridge?.getAttribute('data-status') || '',
        actions: Number(mapBridge?.getAttribute('data-actions') || 0),
        commandId: mapBridge?.getAttribute('data-command-id') || '',
      },
      commandBar: {
        unitId: commandBar?.getAttribute('data-unit-id') || '',
        text: commandBar?.textContent || '',
      },
      renderer: {
        unitTokenCount: renderer.unitTokenCount,
        commandTargetCount: renderer.commandTargetCount,
        commandTargets: renderer.commandTargets,
        visualLayers: renderer.visualLayers,
      },
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped,
      },
    };
  });

  fs.writeFileSync('reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-proof.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16L reviewed Site Plan to Surveyor Prepare Convoy map bridge',
    source: 'FP-E2E-022L mocked server-owned HQ16K/HQ16L expeditionMap.surveyBridge read model',
    screenshots: [
      'reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-desktop.png',
      'reports/agent-town-hq16l-review-to-convoy-map-bridge-2026-06-02-mobile.png',
    ],
    capturedPrepare,
    proof,
    guardrails: {
      serverOwnedReadModel: true,
      browserCreatedSurveyor: false,
      prepareEndpointUsed: capturedPrepare?.sitePlanId === planId,
      objectiveIsConvoyBridge: proof.objective.mode === 'convoy' && proof.objective.targetCellId === cellId,
      bridgeUsesExistingPrepareEndpoint: proof.bridge.commandId === 'prepare_settler_convoy' && proof.bridge.actionName === 'et.plot.prepare_settler_convoy',
      mapNativeConvoyVerb: proof.bridge.mapNativeVerb === 'Convoy',
      commandTargetPreviewOnly: proof.renderer.commandTargets.every((target) => target.previewOnly === true && target.visualOnly === true && target.readOnly === true),
      routeAuthority: false,
      resourceHarvesting: false,
      rewardCreation: false,
      backgroundScheduling: false,
      combat: false,
      hiddenTruthLeakage: false,
      crossPlotMutation: false,
      atlasExecution: false,
      externalEffects: false,
      mobileHorizontalOverflow: proof.mobileFit.clipped.length,
    },
  }, null, 2));
});
