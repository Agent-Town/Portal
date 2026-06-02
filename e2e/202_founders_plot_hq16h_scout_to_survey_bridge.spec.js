const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('FP-E2E-022H Scout Packet to Site Plan bridge is map-first and read-only', async ({ page }) => {
  const plotId = 'plot_hq16h_scout_to_survey_bridge';
  const packetId = 'expedition_event_packet_hq16h_cell_q0_r1';
  const cellId = 'cell_q0_r1';
  const bridgeVersion = 'hq16h_scout_packet_to_site_plan_readiness_v1';
  const bridgeAuthority = 'server_owned_scout_packet_to_site_plan_readiness_v1';
  const eventPacket = {
    packetId,
    kind: 'expedition_event_packet',
    version: 'hq12g.v1',
    templateId: 'ridge_lantern_packet_v1',
    scoutId: 'expedition_scout_hq16h_packet',
    plotId,
    cellId,
    q: 0,
    r: 1,
    discoveryFlavor: 'Ridge Lantern packet',
    terrainExplanation: 'Receipt-bound survey color is visible; no harvestable claim or route is exposed here.',
    riskExplanation: 'Risk remains observational until a guarded planning contract exists.',
    operatorNote: 'Mira files the packet for Site Plan preflight.',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_expedition_event_packet_read_model_v1',
    partyId: 'expedition_party_current_plot_v1',
    partySnapshot: {
      partyId: 'expedition_party_current_plot_v1',
      kind: 'expedition_party_snapshot',
      version: 'hq12g.v1',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_read_only_expedition_party_manifest_v1',
      members: [
        { memberId: 'pathfinder-scout-v1', displayName: 'Mira Trailmark', role: 'scout' },
        { memberId: 'rook-signalpost-messenger-v1', displayName: 'Rook Signalpost', role: 'messenger' },
        { memberId: 'hq-civic-operator-vale-desk-7-v1', displayName: 'Vale-Desk 7', role: 'hq_civic_operator' },
      ],
      boundaryFlags: {
        autonomousMovement: false,
        operatorAssignment: false,
        resourceHarvesting: false,
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        combat: false,
        publicSharing: false,
        generatedUniverseRendering: false,
        crossPlotMutation: false,
        atlasExecution: false,
        externalEffects: false,
      },
    },
    receiptLink: {
      kind: 'scout_sector_receipt',
      actionName: 'et.plot.scout_sector',
      scoutId: 'expedition_scout_hq16h_packet',
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
    createdAt: 1700_000_400_000,
    packetHash: 'hq16hpacket',
  };
  const surveyBridge = {
    bridgeId: 'scout_packet_to_survey_bridge_current_plot_v1',
    kind: 'scout_packet_to_survey_bridge',
    version: bridgeVersion,
    plotId,
    status: 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT',
    readOnly: true,
    executableActions: [],
    authorityBoundary: bridgeAuthority,
    sourceProjectionHash: 'hq16h-expedition-map',
    activeCandidateId: 'survey_bridge_hq16hpacket',
    activePacketId: packetId,
    activeCellId: cellId,
    activeCandidate: {
      candidateId: 'survey_bridge_hq16hpacket',
      kind: 'scout_packet_to_survey_readiness',
      status: 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT',
      readOnly: true,
      executableActions: [],
      packetId,
      scoutId: 'expedition_scout_hq16h_packet',
      cellId,
      cellFogState: 'known',
      cellStatus: 'SCOUTED',
      sourceReceiptKind: 'scout_sector_receipt',
      sourceActionName: 'et.plot.scout_sector',
      sitePlan: null,
      surveyorUnit: null,
      commandState: {
        commandId: 'survey_site_plan_contract_required',
        actionName: null,
        label: 'Site Plan',
        enabled: false,
        sourcePlanId: null,
        targetCellIds: [cellId],
        serverMutationImplemented: false,
        executableThroughExistingEndpoint: false,
        reason: 'Event Packet to Site Plan requires an explicit future server contract.',
        readOnly: true,
        executableActions: [],
      },
      nextRequiredContract: 'explicit_packet_to_site_plan_server_contract',
      boundaryFlags: {
        readModelOnly: true,
        readinessOnly: true,
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
    ledgerText: 'Scout Sector Event Packet is server-recognized as Site Plan preflight readiness only. No survey/site-plan mutation is executable until an explicit guarded server contract exists.',
    boundaryFlags: {
      readModelOnly: true,
      readinessOnly: true,
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

  const expeditionMap = {
    status: 'FOG_READ_MODEL_READY',
    title: 'Expedition Map',
    implementation: 'hq12a_server_owned_expedition_map_read_model_v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_expedition_map_fog_of_war_projection_v1',
    fog: {
      states: ['discovered', 'known', 'hinted', 'locked_unknown'],
      counts: { discovered: 1, known: 1, hinted: 0, locked_unknown: 1 },
    },
    scope: {
      homePlotId: plotId,
      activePlotId: plotId,
      ownedPlotCount: 1,
      scoutReportCount: 0,
      scoutedSectorCount: 1,
      sitePlanCount: 0,
      settlementClaimCount: 0,
    },
    sourceSummary: {
      originPlotId: plotId,
      worldGridStatus: 'READ_MODEL_READY',
      scoutSectorIds: ['expedition_scout_hq16h_packet'],
      eventPacketIds: [packetId],
      surveyBridgeCandidatePacketIds: [packetId],
      reviewedSitePlanIds: [],
      foundedPlotIds: [],
    },
    expeditionParty: eventPacket.partySnapshot,
    units: {
      unitRosterId: 'expedition_unit_roster_current_plot_v1',
      kind: 'expedition_unit_roster',
      version: 'hq15a_server_owned_expedition_unit_roster_v1',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_read_only_expedition_unit_roster_v1',
      interactionModel: {
        selectable: true,
        mapTokens: true,
        commandBarReady: true,
        movementPreviewOnly: false,
        movementCommandReady: true,
        serverAuthoritativeMovementRequiredForMutation: true,
      },
      items: [{
        unitId: 'expedition_unit_pathfinder_scout_v1',
        kind: 'expedition_map_unit',
        unitType: 'scout',
        displayName: 'Mira Trailmark',
        role: 'scout',
        state: 'FIELD_READY',
        readOnly: true,
        selectable: true,
        executableActions: [],
        location: { cellId, q: 0, r: 1, fogState: 'known' },
        movement: { canMove: false, movementMutationImplemented: true, allowedTargetCellIds: [], allowedFogStates: ['discovered', 'known'], revealsFog: false, routeCreation: false, resourceDelta: {} },
        commandHints: [
          { commandId: 'move_unit', label: 'Move', actionName: 'et.plot.move_expedition_unit', enabled: false, targetCellIds: [], serverMutationImplemented: true, routeCreation: false },
          { commandId: 'scout_sector', label: 'Scout Sector', actionName: 'et.plot.scout_sector', enabled: false, targetCellIds: [], serverMutationImplemented: true },
        ],
        boundaryFlags: { movementMutation: true, movementRevealsFog: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
      }, {
        unitId: 'expedition_unit_rook_signalpost_messenger_v1',
        kind: 'expedition_map_unit',
        unitType: 'courier',
        displayName: 'Rook Signalpost',
        role: 'messenger',
        state: 'PACKET_LINKED',
        readOnly: true,
        selectable: true,
        executableActions: [],
        location: { cellId, q: 0, r: 1, fogState: 'known' },
        movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
        commandHints: [{ commandId: 'inspect_event_packet', label: 'Inspect packet', enabled: true, serverMutationImplemented: false }],
        boundaryFlags: { movementMutation: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
      }],
      byCellId: {
        [cellId]: ['expedition_unit_pathfinder_scout_v1', 'expedition_unit_rook_signalpost_messenger_v1'],
      },
      boundaryFlags: { movementMutation: true, movementRevealsFog: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
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
      kind: 'scouted_sector',
      title: 'Scouted Frontier Sector',
      status: 'SCOUTED',
      sourceTruth: 'expedition_scout_sector',
      sourceIds: { plotId, scoutId: 'expedition_scout_hq16h_packet', cellId, sourceCellId: 'cell_origin' },
      receipts: [{
        kind: 'scout_sector_known_cell',
        sourceIds: { scoutId: 'expedition_scout_hq16h_packet', cellId, eventPacketId: packetId },
        eventPacketId: packetId,
        readOnly: true,
      }],
      traits: ['scouted-frontier'],
      resourceHints: {},
      siteType: 'scouted_frontier',
      risk: 'unknown',
      summary: 'A Scout Sector receipt made this packet cell known map truth only.',
      recommendedNext: 'Bridge to Site Plan preflight only after explicit server contract.',
      eventPacket,
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
    receipt: {
      kind: 'expedition_map_read_model_projection',
      sourceIds: { plotId, worldGridProjectionHash: 'hq16h-world-grid' },
      readOnly: true,
      routeCreation: false,
      atlasExecution: false,
      projectionHash: 'hq16h-expedition-map',
    },
    projectionHash: 'hq16h-expedition-map',
  };

  const makeState = () => ({
    ok: true,
    plotId,
    stateHash: 'hq16h-state',
    recap: null,
    state: {
      plot: {
        plotId,
        pairId: 'pair:hq16h-scout-to-survey-bridge',
        hqLevel: 6,
        townXp: 240,
        inventory: { wood: 80, stone: 40, food: 60, coin: 20 },
        scoutReports: [],
        sitePlans: [],
      },
      buildings: [
        { buildingId: 'bldg_hq_hq16h', type: 'HQ', x: 1, y: 0, level: 6, state: 'READY' },
        { buildingId: 'bldg_expedition_hq16h', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: 'READY' },
      ],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'expedition-map', title: 'Read the Expedition Map', body: 'Fog of war is server-owned and read-only.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: [],
      ownedPlots: [{ plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 6, active: true }],
      activePlotId: plotId,
      homePlotId: plotId,
      worldGrid: { status: 'READ_MODEL_READY', readOnly: true, civicReadiness: { ready: false }, requirements: { items: [], satisfiedCount: 0, totalCount: 0 } },
      expeditionMap,
      publicSummary: {
        expeditionMapStatus: 'FOG_READ_MODEL_READY',
        expeditionMapDiscoveredCount: 1,
        expeditionMapKnownCount: 1,
        expeditionMapHintedCount: 0,
        expeditionMapLockedUnknownCount: 1,
      },
      visualActors: [],
      audit: { stateHash: 'hq16h-state' },
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
    body: JSON.stringify({
      ok: true,
      plotId,
      homePlotId: plotId,
      activePlotId: plotId,
      plots: makeState().state.ownedPlots,
      settlementClaims: [],
    }),
  }));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-actions', '0');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-status', 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT');
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-server-mutation-implemented', 'false');
  await expect(page.getByTestId('fp-expedition-survey-bridge-step-packet')).toContainText('PKT');
  await expect(page.getByTestId('fp-expedition-survey-bridge-step-site-plan')).toContainText('SVY');
  await expect(page.getByTestId('fp-expedition-survey-bridge-step-command')).toContainText('Wait');
  await expect(page.getByTestId('fp-expedition-survey-bridge').locator('button')).toHaveCount(0);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq16h-scout-to-survey-bridge-desktop-2026-06-02.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-survey-bridge')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-survey-bridge').locator('button')).toHaveCount(0);
  await expect(page.getByTestId('fp-expedition-survey-bridge-map-selected')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-survey-bridge-map-selected')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-survey-bridge-map-selected').locator('button')).toHaveCount(0);
  await page.waitForSelector('[data-testid="fp-expedition-survey-bridge-map-selected"]', { state: 'visible' });
  await page.evaluate(() => {
    document.querySelector('[data-testid="fp-expedition-survey-bridge-map-selected"]')?.scrollIntoView({ block: 'center', inline: 'center' });
  });
  await page.waitForTimeout(150);
  const mobileBridgeClip = await page.evaluate(() => {
    const bridge = document.querySelector('[data-testid="fp-expedition-survey-bridge-map-selected"]');
    const rect = bridge?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.max(0, Math.floor(rect.left - 8));
    const y = Math.max(0, Math.floor(rect.top - 8));
    return {
      x,
      y,
      width: Math.min(window.innerWidth - x, Math.ceil(rect.width + 16)),
      height: Math.min(window.innerHeight - y, Math.ceil(rect.height + 16)),
    };
  });
  await page.screenshot({
    path: 'reports/agent-town-hq16h-scout-to-survey-bridge-mobile-2026-06-02.png',
    ...(mobileBridgeClip ? { clip: mobileBridgeClip } : {}),
  });

  const proof = await page.evaluate(() => {
    const summarizeBridge = (bridge) => {
      const bridgeRect = bridge?.getBoundingClientRect();
      const bridgeCenterNode = bridgeRect
        ? document.elementFromPoint(bridgeRect.left + (bridgeRect.width / 2), bridgeRect.top + (bridgeRect.height / 2))
        : null;
      const steps = Array.from(bridge?.querySelectorAll('[data-testid$="-step-packet"], [data-testid$="-step-site-plan"], [data-testid$="-step-command"]') || [])
        .map((step) => ({
          testid: step.getAttribute('data-testid') || '',
          text: step.textContent || '',
          readOnly: step.getAttribute('data-read-only') || '',
          actions: Number(step.getAttribute('data-actions') || 0),
          cellId: step.getAttribute('data-cell-id') || '',
          packetId: step.getAttribute('data-packet-id') || '',
        }));
      return {
        visible: !!bridge,
        text: bridge?.textContent || '',
        label: bridge?.getAttribute('aria-label') || '',
        readOnly: bridge?.getAttribute('data-read-only') || '',
        actions: Number(bridge?.getAttribute('data-actions') || 0),
        status: bridge?.getAttribute('data-status') || '',
        serverMutationImplemented: bridge?.getAttribute('data-server-mutation-implemented') || '',
        packetId: bridge?.getAttribute('data-packet-id') || '',
        cellId: bridge?.getAttribute('data-cell-id') || '',
        buttons: bridge ? bridge.querySelectorAll('button').length : 0,
        rect: bridgeRect ? {
          x: Math.round(bridgeRect.x),
          y: Math.round(bridgeRect.y),
          width: Math.round(bridgeRect.width),
          height: Math.round(bridgeRect.height),
        } : null,
        elementAtCenter: bridgeCenterNode ? {
          testid: bridgeCenterNode.getAttribute('data-testid') || '',
          className: String(bridgeCenterNode.className || ''),
          text: String(bridgeCenterNode.textContent || '').slice(0, 80),
        } : null,
        steps,
      };
    };
    const bridge = document.querySelector('[data-testid="fp-expedition-survey-bridge"]');
    const mapBridge = document.querySelector('[data-testid="fp-expedition-survey-bridge-map-selected"]');
    const objective = document.querySelector('[data-testid="fp-expedition-objective-strip"]');
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-survey-bridge"], [data-testid^="fp-expedition-survey-bridge-step-"], [data-testid="fp-expedition-survey-bridge-map-selected"], [data-testid^="fp-expedition-survey-bridge-map-selected-step-"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.className || node.tagName);
    return {
      bridge: summarizeBridge(bridge),
      mapBridge: summarizeBridge(mapBridge),
      objective: {
        readOnly: objective?.getAttribute('data-read-only') || '',
        actions: Number(objective?.getAttribute('data-actions') || 0),
        buttons: objective ? objective.querySelectorAll('button').length : 0,
      },
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped,
      },
    };
  });

  fs.writeFileSync('reports/agent-town-hq16h-scout-to-survey-bridge-ui-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16H Scout Packet to Site Plan bridge UI',
    source: 'FP-E2E-022H mocked server-owned expeditionMap.surveyBridge read model',
    screenshots: [
      'reports/agent-town-hq16h-scout-to-survey-bridge-desktop-2026-06-02.png',
      'reports/agent-town-hq16h-scout-to-survey-bridge-mobile-2026-06-02.png',
    ],
    proof,
    guardrails: {
      serverOwnedReadModel: true,
      frontendButtonsAdded: proof.bridge.buttons + proof.mapBridge.buttons,
      objectiveButtons: proof.objective.buttons,
      bridgeReadOnly: proof.bridge.readOnly === 'true' && proof.mapBridge.readOnly === 'true',
      bridgeActions: proof.bridge.actions + proof.mapBridge.actions,
      stepActions: [...proof.bridge.steps, ...proof.mapBridge.steps].reduce((sum, step) => sum + step.actions, 0),
      surveyCommandFabricatedInFrontend: false,
      serverMutationImplemented: proof.bridge.serverMutationImplemented === 'true',
      createsSitePlan: false,
      createsSurveyor: false,
      resourceHarvesting: false,
      routeCreation: false,
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
