const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('FP-E2E-022M Prepare Convoy lands as selected Settler Convoy map unit', async ({ page }) => {
  const plotId = 'plot_hq16m_prepare_to_settler_bridge';
  const planId = 'site_plan_hq16m_ridge';
  const claimId = 'claim_hq16m_ridge';
  const cellId = 'cell_q0_r1';
  const surveyorUnitId = 'expedition_unit_surveyor_site_plan_hq16m_ridge';
  const convoyUnitId = 'expedition_unit_settler_convoy_claim_hq16m_ridge';
  const outpostUnitId = 'expedition_unit_outpost_crew_claim_hq16m_ridge';
  const outpostPlotId = 'plot_hq16m_outpost';
  let prepared = false;
  let arrived = false;
  let founded = false;
  let capturedPrepare = null;
  let capturedFound = null;
  let foundBeforeArrivalCount = -1;

  const eventPacket = {
    packetId: 'expedition_event_packet_hq16m_cell_q0_r1',
    kind: 'expedition_event_packet',
    version: 'hq12g.v1',
    scoutId: 'expedition_scout_hq16m_packet',
    plotId,
    cellId,
    q: 0,
    r: 1,
    discoveryFlavor: 'Convoy-ready ridge packet',
    terrainExplanation: 'The known ridge cell is public map truth only.',
    riskExplanation: 'Founding waits for the server-owned convoy arrival state.',
    operatorNote: 'Mira points the convoy crew toward the ridge.',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_expedition_event_packet_read_model_v1',
    partyId: 'expedition_party_current_plot_v1',
    receiptLink: {
      kind: 'scout_sector_receipt',
      actionName: 'et.plot.scout_sector',
      scoutId: 'expedition_scout_hq16m_packet',
      cellId,
    },
    boundaryFlags: {
      readModelOnly: true,
      routeCreation: false,
      tradeRouteCreation: false,
      combat: false,
      backgroundScheduling: false,
      publicSharing: false,
      generatedUniverseRendering: false,
      atlasExecution: false,
      hiddenTruthLeakage: false,
      crossPlotMutation: false,
      externalEffects: false,
    },
    createdAt: 1700_000_600_000,
    packetHash: 'hq16mpacket',
  };

  const sitePlan = (isPrepared = false) => ({
    planId,
    reportId: 'packet:expedition_scout_hq16m_packet',
    source: 'scout_sector_event_packet',
    sourcePacketId: eventPacket.packetId,
    sourceCellId: cellId,
    title: 'Ridge Outpost Plan',
    summary: 'A reviewed map site ready for one convoy.',
    recommendedNext: isPrepared ? 'Convoy rolling toward the ridge.' : 'Prepare a convoy.',
    targetCellId: cellId,
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['settler-safe'],
    resourceHints: {},
    status: isPrepared ? 'CONVOY_PREPARING' : 'REVIEWED',
    promotionStatus: isPrepared ? 'convoy_preparing' : 'reviewed_claim_ready',
    reviewStatus: 'reviewed',
    claimId: isPrepared ? claimId : null,
    convoyJobId: isPrepared ? 'job_hq16m_prepare_convoy' : null,
    reviewedAt: 1700_000_601_000,
    reviewNote: 'Reviewed through existing Site Plan contract.',
    readOnly: true,
  });

  const settlementClaim = {
    claimId,
    ownerPairId: 'pair:hq16m',
    originPlotId: plotId,
    sitePlanId: planId,
    reportId: 'packet:expedition_scout_hq16m_packet',
    foundedPlotId: null,
    convoyJobId: 'job_hq16m_prepare_convoy',
    status: 'CONVOY_PREPARING',
    title: 'Ridge Outpost Plan',
    focus: 'balanced',
    siteType: 'woodland_ridge',
    risk: 'low',
    traits: ['settler-safe'],
    resourceHints: {},
    route: { visualOnly: true, routeCreation: false },
    cost: { wood: 32, food: 20, stone: 12, coin: 8 },
    receipt: {
      kind: 'settler_convoy_prepared',
      summary: 'Settler Convoy rolling toward Ridge Outpost Plan.',
      durationMs: 180000,
      createsSecondPlot: false,
      authorityBoundary: 'server_owned_settler_convoy_claim_v1',
    },
    createdBy: 'HUMAN',
    createdAt: 1700_000_602_000,
    updatedAt: 1700_000_602_000,
    convoyStartedAt: 1700_000_602_000,
    convoyEndsAt: 1700_000_782_000,
  };

  const currentSettlementClaim = () => ({
    ...settlementClaim,
    status: founded ? 'FOUNDED' : (arrived ? 'CONVOY_ARRIVED' : 'CONVOY_PREPARING'),
    foundedPlotId: founded ? outpostPlotId : null,
    route: {
      ...(settlementClaim.route || {}),
      progress: arrived || founded ? 1 : 0.45,
      foundedPlotId: founded ? outpostPlotId : undefined,
      visualOnly: true,
      routeCreation: false,
    },
    receipt: {
      ...(settlementClaim.receipt || {}),
      kind: founded ? 'settlement_founded' : (arrived ? 'settler_convoy_arrived' : 'settler_convoy_prepared'),
      foundedPlotId: founded ? outpostPlotId : undefined,
      summary: arrived
        ? (founded ? 'Outpost founded; crew stationed on the map.' : 'Settler Convoy arrived; Found Outpost is now available from the map target.')
        : settlementClaim.receipt.summary,
    },
  });

  const surveyBridge = (isPrepared = false) => ({
    bridgeId: 'scout_packet_to_survey_bridge_current_plot_v1',
    kind: 'scout_packet_to_survey_bridge',
    version: 'hq16k_reviewed_packet_site_plan_to_surveyor_command_v1',
    plotId,
    status: isPrepared ? 'SITE_PLAN_PRESENT' : 'SURVEYOR_COMMAND_READY',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_scout_packet_to_survey_read_model_v1',
    sourceProjectionHash: isPrepared ? 'hq16m-prepared-map' : 'hq16m-ready-map',
    activeCandidateId: 'survey_bridge_hq16m_packet',
    activePacketId: eventPacket.packetId,
    activeCellId: cellId,
    activeCandidate: {
      candidateId: 'survey_bridge_hq16m_packet',
      kind: 'scout_packet_to_survey_readiness',
      status: isPrepared ? 'SITE_PLAN_PRESENT' : 'SURVEYOR_COMMAND_READY',
      readOnly: true,
      executableActions: [],
      packetId: eventPacket.packetId,
      scoutId: eventPacket.scoutId,
      cellId,
      cellFogState: 'known',
      cellStatus: isPrepared ? 'CONVOY_PREPARING' : 'SITE_PLAN_REVIEWED',
      sourceReceiptKind: 'scout_sector_receipt',
      sourceActionName: 'et.plot.scout_sector',
      sitePlan: sitePlan(isPrepared),
      surveyorUnit: {
        unitId: surveyorUnitId,
        unitType: 'surveyor',
        sourcePlanId: planId,
        cellId,
      },
      commandState: isPrepared ? {
        commandId: 'inspect_convoy',
        label: 'Convoy rolling',
        enabled: true,
        serverMutationImplemented: false,
        readOnly: true,
        executableActions: [],
      } : {
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
      nextRequiredContract: isPrepared ? 'existing_settler_convoy_arrival_then_found_settlement_endpoint' : 'existing_prepare_settler_convoy_endpoint',
      boundaryFlags: {
        readModelOnly: true,
        addsMutationAuthority: false,
        resourceHarvesting: false,
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
    derivedFrom: ['expeditionMap.units.items', 'settlementClaims', 'plot.sitePlans'],
    ledgerText: 'Prepare Convoy result is server-owned: a timed claim and map unit, not a browser-created settler.',
    boundaryFlags: {
      readModelOnly: true,
      addsMutationAuthority: false,
      resourceHarvesting: false,
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
  });

  const makeUnits = (isPrepared = false) => {
    const surveyor = {
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
      commandHints: isPrepared ? [{
        commandId: 'inspect_survey',
        label: 'Inspect survey',
        enabled: true,
        serverMutationImplemented: false,
        previewOnlyUntilSelected: true,
      }] : [{
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
    };
    const claimStatus = founded ? 'FOUNDED' : (arrived ? 'CONVOY_ARRIVED' : 'CONVOY_PREPARING');
    const convoy = {
      unitId: convoyUnitId,
      kind: 'expedition_map_unit',
      unitType: 'settler_convoy',
      displayName: 'Settler Convoy',
      role: 'settler',
      state: claimStatus,
      readOnly: true,
      selectable: true,
      executableActions: [],
      location: { cellId, q: 0, r: 1, fogState: 'known' },
      movement: {
        canMove: false,
        movementMutationImplemented: false,
        allowedTargetCellIds: [],
        pathPreview: { visualOnly: true, routeCreation: false },
      },
      sourceClaimId: claimId,
      sourcePlanId: planId,
      sourceReportId: 'packet:expedition_scout_hq16m_packet',
      commandHints: arrived ? [{
        commandId: 'found_settlement',
        label: 'Found Outpost',
        actionName: 'et.plot.found_settlement',
        enabled: true,
        claimId,
        targetCellIds: [cellId],
        serverMutationImplemented: true,
        requiresHumanApprovalForAgent: true,
        routeCreation: false,
      }] : [{
        commandId: 'inspect_convoy',
        label: 'Inspect convoy',
        enabled: true,
        serverMutationImplemented: false,
        previewOnlyUntilSelected: true,
      }],
      boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
    };
    const outpostCrew = {
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
      sourceReportId: 'packet:expedition_scout_hq16m_packet',
      commandHints: [{
        commandId: 'inspect_outpost',
        label: 'Inspect outpost',
        enabled: true,
        serverMutationImplemented: false,
        previewOnlyUntilSelected: true,
      }],
      boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
    };
    return isPrepared ? [surveyor, founded ? outpostCrew : convoy] : [surveyor];
  };

  const makeState = (isPrepared = false) => {
    const bridge = surveyBridge(isPrepared);
    bridge.candidates = [bridge.activeCandidate];
    const plan = sitePlan(isPrepared);
    const units = makeUnits(isPrepared);
    return {
      ok: true,
      plotId,
      stateHash: isPrepared ? 'hq16m-prepared-state' : 'hq16m-ready-state',
      state: {
        plot: {
          plotId,
          pairId: 'pair:hq16m',
          hqLevel: 7,
          townXp: 360,
          inventory: isPrepared ? { wood: 48, stone: 28, food: 40, coin: 12 } : { wood: 80, stone: 40, food: 60, coin: 20 },
          scoutReports: [],
          sitePlans: [plan],
        },
        buildings: [
          { buildingId: 'bldg_hq_hq16m', type: 'HQ', x: 1, y: 0, level: 7, state: 'READY' },
          { buildingId: 'bldg_expedition_hq16m', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: isPrepared ? 'PRODUCING' : 'READY' },
        ],
        jobs: isPrepared && !arrived ? [{ jobId: 'job_hq16m_prepare_convoy', kind: 'SETTLER_CONVOY', status: 'RUNNING', endsAt: settlementClaim.convoyEndsAt }] : [],
        policy: {},
        permissions: {},
        pendingApprovals: [],
        rewards: [],
        quest: { id: 'prepare-settler-convoy', title: 'Convoy', body: 'Select the map unit.' },
        unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
        buildingDefs: {},
        hqUpgrade: null,
        scoutReports: [],
        sitePlans: [plan],
        settlementClaims: isPrepared ? [currentSettlementClaim()] : [],
        ownedPlots: [
          { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 7, active: true },
          ...(founded ? [{ plotId: outpostPlotId, role: 'OUTPOST', title: 'Ridge Outpost', hqLevel: 1, active: false, originClaimId: claimId }] : []),
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
          fog: { states: ['discovered', 'known', 'hinted', 'locked_unknown'], counts: { discovered: 1, known: 1, hinted: 1, locked_unknown: 1 } },
          scope: { homePlotId: plotId, activePlotId: plotId, ownedPlotCount: 1, scoutReportCount: 0, scoutedSectorCount: 1, sitePlanCount: 1, settlementClaimCount: isPrepared ? 1 : 0 },
          sourceSummary: { originPlotId: plotId, eventPacketIds: [eventPacket.packetId], surveyBridgeCandidatePacketIds: [eventPacket.packetId], reviewedSitePlanIds: [planId], foundedPlotIds: founded ? [outpostPlotId] : [] },
          expeditionParty: { partyId: 'expedition_party_current_plot_v1', kind: 'expedition_party_snapshot', readOnly: true, executableActions: [], members: [] },
          units: {
            unitRosterId: 'expedition_unit_roster_current_plot_v1',
            kind: 'expedition_unit_roster',
            version: 'hq15a_server_owned_expedition_unit_roster_v1',
            readOnly: true,
            executableActions: [],
            authorityBoundary: 'server_owned_read_only_expedition_unit_roster_v1',
            interactionModel: { selectable: true, mapTokens: true, commandBarReady: true, movementPreviewOnly: false, movementCommandReady: true },
            items: units,
            byCellId: { [cellId]: units.map((unit) => unit.unitId) },
            boundaryFlags: { movementMutation: false, movementRevealsFog: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          },
          surveyBridge: bridge,
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
              fogState: founded ? 'discovered' : 'known',
              kind: founded ? 'owned_outpost' : (isPrepared ? 'settlement_claim' : 'planned_site'),
              title: founded ? 'Ridge Outpost' : (isPrepared ? 'Settler Convoy' : 'Ridge Outpost Plan'),
              status: founded ? 'OWNED_OUTPOST' : (isPrepared ? (arrived ? 'CONVOY_ARRIVED' : 'CONVOY_PREPARING') : 'SITE_PLAN_REVIEWED'),
              sourceTruth: founded ? 'plot_membership' : (isPrepared ? 'settlement_claim' : 'site_plan'),
              sourceIds: isPrepared
                ? { plotId: founded ? outpostPlotId : plotId, originPlotId: plotId, originClaimId: founded ? claimId : undefined, planId, claimId, sourcePacketId: eventPacket.packetId }
                : { plotId, planId, eventPacketId: eventPacket.packetId, cellId },
              receipts: [{ kind: founded ? 'founded_outpost_discovered_cell' : (isPrepared ? 'settlement_claim_known_cell' : 'reviewed_site_plan_known_cell'), sourceIds: isPrepared ? { claimId, foundedPlotId: founded ? outpostPlotId : undefined } : { planId }, readOnly: true }],
              traits: founded ? ['owned-outpost'] : ['settler-safe'],
              resourceHints: {},
              sitePlanObject: { planId, packetId: eventPacket.packetId, reviewStatus: 'reviewed', commandState: bridge.activeCandidate.commandState, readOnly: true },
              eventPacket,
              siteType: 'woodland_ridge',
              risk: 'low',
              summary: isPrepared
                ? (founded ? 'A server-owned outpost crew is stationed here.' : (arrived ? 'A server-owned Settler Convoy has arrived here.' : 'A server-owned Settler Convoy is rolling here.'))
                : 'Reviewed Site Plan stays map-local.',
              recommendedNext: isPrepared
                ? (founded ? 'Select the outpost crew on the map.' : (arrived ? 'Found Outpost from the map target.' : 'Wait for arrival, then Found Outpost.'))
                : 'Send a convoy from the map target.',
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
          eventPackets: [eventPacket],
          receipt: { kind: 'expedition_map_read_model_projection', sourceIds: { plotId }, readOnly: true, routeCreation: false, atlasExecution: false, projectionHash: isPrepared ? 'hq16m-prepared-map' : 'hq16m-ready-map' },
          projectionHash: isPrepared ? 'hq16m-prepared-map' : 'hq16m-ready-map',
        },
        publicSummary: { expeditionMapStatus: 'FOG_READ_MODEL_READY', expeditionMapDiscoveredCount: 1, expeditionMapKnownCount: 1, expeditionMapHintedCount: 1, expeditionMapLockedUnknownCount: 1 },
        visualActors: [],
        audit: { stateHash: isPrepared ? 'hq16m-prepared-state' : 'hq16m-ready-state' },
      },
    };
  };

  await page.route('**/api/founders-plot/state', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(makeState(prepared)),
  }));
  await page.route('**/api/founders-plot/plots**', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      plotId,
      homePlotId: plotId,
      activePlotId: plotId,
      plots: makeState(prepared).state.ownedPlots,
      settlementClaims: prepared ? [currentSettlementClaim()] : [],
    }),
  }));
  await page.route('**/api/founders-plot/prepare-settler-convoy', async (route) => {
    capturedPrepare = route.request().postDataJSON();
    prepared = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        settlementClaim: currentSettlementClaim(),
        job: { jobId: 'job_hq16m_prepare_convoy', kind: 'SETTLER_CONVOY', status: 'RUNNING', sitePlanId: planId },
        state: makeState(true).state,
      }),
    });
  });
  await page.route('**/api/founders-plot/found-settlement', async (route) => {
    capturedFound = route.request().postDataJSON();
    founded = true;
    arrived = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        settlementClaim: currentSettlementClaim(),
        foundedPlot: { plotId: outpostPlotId, role: 'OUTPOST' },
        ownedPlots: makeState(true).state.ownedPlots,
        existing: false,
        state: makeState(true).state,
      }),
    });
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect(page.getByTestId(`fp-expedition-unit-token-${surveyorUnitId}`)).toBeVisible();

  await page.getByTestId(`fp-expedition-unit-token-${surveyorUnitId}`).click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', surveyorUnitId);
  await expect(page.getByTestId(`fp-btn-prepare-settler-convoy-unit-command-${planId}`)).toHaveAttribute('data-command-id', 'prepare_settler_convoy');

  await expect.poll(async () => {
    const targets = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []);
    return targets.some((target) => target.commandId === 'prepare_settler_convoy' && target.cellId === 'cell_q0_r1');
  }).toBe(true);
  const prepareRing = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo()
    .commandTargets.find((target) => target.commandId === 'prepare_settler_convoy' && target.cellId === 'cell_q0_r1'));
  await page.getByTestId('fp-expedition-three-canvas').click({ position: prepareRing.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await page.getByTestId('fp-btn-expedition-command-preview-confirm').click();

  await expect.poll(() => capturedPrepare?.sitePlanId || '').toBe(planId);
  await expect(page.getByTestId(`fp-expedition-unit-token-${convoyUnitId}`)).toBeVisible();
  await expect(page.getByTestId(`fp-expedition-unit-token-${convoyUnitId}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', convoyUnitId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-unit-id', convoyUnitId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toContainText('Rolling');
  await expect(page.getByTestId('fp-expedition-objective-strip')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  foundBeforeArrivalCount = await page.getByTestId(`fp-btn-found-settlement-unit-command-${claimId}`).count();
  expect(foundBeforeArrivalCount).toBe(0);

  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-desktop.png',
  });

  const preArrivalProof = await page.evaluate(({ convoyUnitId }) => {
    const convoyToken = document.querySelector(`[data-testid="fp-expedition-unit-token-${convoyUnitId}"]`);
    const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
    const outcome = document.querySelector('[data-testid="fp-expedition-command-outcome-chip"]');
    return {
      convoyToken: {
        unitId: convoyToken?.getAttribute('data-unit-id') || '',
        unitType: convoyToken?.getAttribute('data-unit-type') || '',
        cellId: convoyToken?.getAttribute('data-cell-id') || '',
        selected: convoyToken?.getAttribute('aria-pressed') || '',
        text: convoyToken?.textContent || '',
      },
      commandBar: {
        unitId: commandBar?.getAttribute('data-unit-id') || '',
        cellId: commandBar?.getAttribute('data-cell-id') || '',
        actions: Number(commandBar?.getAttribute('data-actions') || 0),
        text: commandBar?.textContent || '',
      },
      outcome: {
        commandId: outcome?.getAttribute('data-command-id') || '',
        unitId: outcome?.getAttribute('data-unit-id') || '',
        cellId: outcome?.getAttribute('data-cell-id') || '',
        text: outcome?.textContent || '',
      },
      primarySurfaceText: {
        objective: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.innerText || '',
        commandBar: commandBar?.innerText || '',
        outcome: outcome?.innerText || '',
      },
    };
  }, { convoyUnitId });

  arrived = true;
  await page.reload();
  await page.getByTestId(`fp-expedition-unit-token-${convoyUnitId}`).click();
  await expect(page.getByTestId('fp-expedition-objective-copy')).toContainText('Pick Found to place the outpost');
  await expect(page.getByTestId('fp-expedition-objective-strip')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await expect(page.getByTestId(`fp-btn-found-settlement-unit-command-${claimId}`)).toHaveAttribute('data-command-id', 'found_settlement');
  await expect(page.getByTestId(`fp-btn-found-settlement-unit-command-${claimId}`)).toHaveAttribute('data-server-mutation-implemented', 'true');
  await expect(page.getByTestId('fp-expedition-guided-loop')).toHaveAttribute('data-next-command-id', 'found_settlement');
  await expect.poll(async () => {
    const targets = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []);
    return targets.some((target) => target.commandId === 'found_settlement' && target.unitId === convoyUnitId && target.cellId === cellId);
  }).toBe(true);
  const foundRing = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo()
    .commandTargets.find((target) => target.commandId === 'found_settlement' && target.unitId === 'expedition_unit_settler_convoy_claim_hq16m_ridge'));
  expect(foundRing).toMatchObject({
    commandId: 'found_settlement',
    unitId: convoyUnitId,
    cellId,
    previewOnly: true,
    selectable: true,
    visualOnly: true,
    readOnly: true,
    executableActions: 0,
    routeAuthority: false,
    actionAuthority: false,
  });
  await page.getByTestId('fp-expedition-three-canvas').click({ position: foundRing.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-command-id', 'found_settlement');
  await page.getByTestId('fp-btn-expedition-command-preview-confirm').click();
  await expect.poll(() => capturedFound?.claimId || '').toBe(claimId);
  await expect(page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`)).toBeVisible();
  await expect(page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', outpostUnitId);
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-cell-id', cellId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'found_settlement');
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-unit-id', outpostUnitId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toContainText('Founded');
  await expect(page.getByTestId('fp-expedition-objective-strip')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).not.toContainText(/guarded endpoint|approval|review|packet|proof/i);
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16o-found-outpost-map-result-2026-06-02-desktop.png',
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`)).toBeVisible();
  await page.getByTestId(`fp-expedition-unit-token-${outpostUnitId}`).click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', outpostUnitId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-unit-id', outpostUnitId);
  await expect(page.getByTestId(`fp-btn-found-settlement-unit-command-${claimId}`)).toHaveCount(0);
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-mobile.png',
  });
  await page.getByTestId('fp-expedition-map-panel').screenshot({
    path: 'reports/agent-town-hq16o-found-outpost-map-result-2026-06-02-mobile.png',
  });

  const proof = await page.evaluate(({ convoyUnitId, outpostUnitId, cellId }) => {
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const convoyToken = document.querySelector(`[data-testid="fp-expedition-unit-token-${convoyUnitId}"]`);
    const outpostToken = document.querySelector(`[data-testid="fp-expedition-unit-token-${outpostUnitId}"]`);
    const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
    const outcome = document.querySelector('[data-testid="fp-expedition-command-outcome-chip"]');
    const foundButton = document.querySelector('[data-testid="fp-btn-found-settlement-unit-command-claim_hq16m_ridge"]');
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-unit-roster"], [data-testid="fp-expedition-unit-command-bar"], [data-testid="fp-expedition-objective-strip"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.className || node.tagName);
    return {
      convoyToken: {
        unitId: convoyToken?.getAttribute('data-unit-id') || '',
        unitType: convoyToken?.getAttribute('data-unit-type') || '',
        cellId: convoyToken?.getAttribute('data-cell-id') || '',
        selected: convoyToken?.getAttribute('aria-pressed') || '',
        text: convoyToken?.textContent || '',
      },
      outpostToken: {
        unitId: outpostToken?.getAttribute('data-unit-id') || '',
        unitType: outpostToken?.getAttribute('data-unit-type') || '',
        cellId: outpostToken?.getAttribute('data-cell-id') || '',
        selected: outpostToken?.getAttribute('aria-pressed') || '',
        text: outpostToken?.textContent || '',
      },
      commandBar: {
        unitId: commandBar?.getAttribute('data-unit-id') || '',
        cellId: commandBar?.getAttribute('data-cell-id') || '',
        actions: Number(commandBar?.getAttribute('data-actions') || 0),
        text: commandBar?.textContent || '',
      },
      outcome: {
        commandId: outcome?.getAttribute('data-command-id') || '',
        unitId: outcome?.getAttribute('data-unit-id') || '',
        cellId: outcome?.getAttribute('data-cell-id') || '',
        text: outcome?.textContent || '',
      },
      foundButton: {
        present: !!foundButton,
        commandId: foundButton?.getAttribute('data-command-id') || '',
        serverMutationImplemented: foundButton?.getAttribute('data-server-mutation-implemented') || '',
      },
      renderer: {
        selectedCellId: renderer.selectedCellId,
        unitTokenCount: renderer.unitTokenCount,
        commandTargetCount: renderer.commandTargetCount,
        units: renderer.units,
        commandTargets: renderer.commandTargets,
        commandOutcomeFeedback: renderer.commandOutcomeFeedback,
        visualLayers: renderer.visualLayers,
      },
      mapNative: {
        primaryTokenVisible: !!outpostToken,
        selectedConvoyUnit: commandBar?.getAttribute('data-unit-id') === convoyUnitId,
        selectedOutpostCrewUnit: commandBar?.getAttribute('data-unit-id') === outpostUnitId,
        targetCellId: cellId,
        primaryOutcomeText: outcome?.textContent || '',
      },
      primarySurfaceText: {
        objective: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.innerText || '',
        commandBar: commandBar?.innerText || '',
        outcome: outcome?.innerText || '',
        preview: document.querySelector('[data-testid="fp-expedition-command-preview"]')?.innerText || '',
      },
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped,
      },
    };
  }, { convoyUnitId, outpostUnitId, cellId });

  const primaryPaperworkPattern = /guarded endpoint|approval|review|packet|proof/i;
  for (const text of Object.values(preArrivalProof.primarySurfaceText)) {
    expect(text).not.toMatch(primaryPaperworkPattern);
  }
  for (const text of Object.values(proof.primarySurfaceText)) {
    expect(text).not.toMatch(primaryPaperworkPattern);
  }

  fs.writeFileSync('reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16M Prepare Convoy to Settler Convoy map bridge',
    source: 'FP-E2E-022M mocked server-owned Prepare Convoy response and reloaded expeditionMap.units.items',
    screenshots: [
      'reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-desktop.png',
      'reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-mobile.png',
    ],
    capturedPrepare,
    capturedFound,
    foundBeforeArrivalCount,
    preArrivalProof,
    proof,
    guardrails: {
      prepareEndpointUsed: capturedPrepare?.sitePlanId === planId,
      foundEndpointUsed: capturedFound?.claimId === claimId,
      serverOwnedSettlerConvoyUnit: preArrivalProof.convoyToken.unitId === convoyUnitId && preArrivalProof.convoyToken.unitType === 'settler_convoy',
      selectedConvoyAfterPrepare: preArrivalProof.commandBar.unitId === convoyUnitId,
      mapNativePrimaryResult: preArrivalProof.convoyToken.unitId === convoyUnitId && /Rolling/.test(preArrivalProof.outcome.text),
      immediateFoundOutpostBlockedUntilArrival: foundBeforeArrivalCount === 0,
      foundOutpostAvailableWhenArrived: capturedFound?.claimId === claimId && foundRing.commandId === 'found_settlement',
      serverOwnedOutpostCrewUnit: proof.outpostToken.unitId === outpostUnitId && proof.outpostToken.unitType === 'outpost_crew',
      selectedOutpostAfterFound: proof.commandBar.unitId === outpostUnitId && proof.commandBar.cellId === cellId,
      mapNativeFoundOutpostResult: proof.outpostToken.unitId === outpostUnitId && /Founded/.test(proof.outcome.text),
      primarySurfacePaperworkHidden: [...Object.values(preArrivalProof.primarySurfaceText), ...Object.values(proof.primarySurfaceText)]
        .every((text) => !primaryPaperworkPattern.test(text)),
      rendererCreatedNoActions: proof.renderer.visualLayers.clientAuthority === false,
      commandTargetRingsPreviewOnly: proof.renderer.commandTargets.every((target) => target.previewOnly === true && target.visualOnly === true && target.readOnly === true),
      unitTokensReadOnly: proof.renderer.visualLayers.unitTokensReadOnly === true,
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

  fs.writeFileSync('reports/agent-town-hq16o-found-outpost-map-result-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16O Found Outpost to Outpost Map Result bridge',
    source: 'FP-E2E-022M extended Found Outpost result proof using mocked server-owned founded outpost read model',
    screenshots: [
      'reports/agent-town-hq16o-found-outpost-map-result-2026-06-02-desktop.png',
      'reports/agent-town-hq16o-found-outpost-map-result-2026-06-02-mobile.png',
    ],
    capturedFound,
    result: {
      claimId,
      outpostPlotId,
      cellId,
      outpostUnitId,
      outpostToken: proof.outpostToken,
      commandBar: proof.commandBar,
      outcome: proof.outcome,
      renderer: proof.renderer,
      mapNative: proof.mapNative,
      primarySurfaceText: proof.primarySurfaceText,
      mobileFit: proof.mobileFit,
    },
    guardrails: {
      foundEndpointUsed: capturedFound?.claimId === claimId,
      reloadSelectedServerOwnedOutpostCrew: proof.commandBar.unitId === outpostUnitId && proof.outpostToken.unitType === 'outpost_crew',
      focusedOwnedOutpostCell: proof.renderer.selectedCellId === cellId && proof.outpostToken.cellId === cellId,
      outcomePulseServerOwnedOutpostResult: proof.outcome.commandId === 'found_settlement' && proof.outcome.unitId === outpostUnitId && /Founded/.test(proof.outcome.text),
      oldConvoyCommandGoneAfterFounding: proof.foundButton.present === false,
      primarySurfacePaperworkHidden: Object.values(proof.primarySurfaceText).every((text) => !primaryPaperworkPattern.test(text)),
      rendererCreatedNoActions: proof.renderer.visualLayers.clientAuthority === false,
      unitTokensReadOnly: proof.renderer.visualLayers.unitTokensReadOnly === true,
      routeAuthority: false,
      tradeRouteCreation: false,
      resourceHarvesting: false,
      rewardCreation: false,
      backgroundScheduling: false,
      combat: false,
      hiddenTruthLeakage: false,
      crossPlotMutationBeyondFoundSettlementContract: false,
      atlasExecution: false,
      generatedUniverseRuntimeExpansion: false,
      externalEffects: false,
      mobileHorizontalOverflow: proof.mobileFit.clipped.length,
    },
  }, null, 2));
});
