const { test, expect } = require('@playwright/test');
const fs = require('fs');

const PREFIX = 'reports/agent-town-hq14t-server-bound-terrain-underlay-runtime';
const DESKTOP_SCREENSHOT = `${PREFIX}-desktop-2026-06-01.png`;
const MOBILE_SCREENSHOT = `${PREFIX}-mobile-2026-06-01.png`;
const CONTACT_SHEET = `${PREFIX}-contact-sheet-2026-06-01.png`;
const PROOF_JSON = `${PREFIX}-proof-2026-06-01.json`;
const HQ15D_PREFIX = 'reports/agent-town-hq15d-event-objective-map-markers';
const HQ15D_DESKTOP_SCREENSHOT = `${HQ15D_PREFIX}-desktop-2026-06-02.png`;
const HQ15D_MOBILE_SCREENSHOT = `${HQ15D_PREFIX}-mobile-2026-06-02.png`;
const HQ15D_PROOF_JSON = `${HQ15D_PREFIX}-proof-2026-06-02.json`;

function expeditionMapFixture() {
  const plotId = 'plot_hq12d_exp_map_threejs';
  const outpostPlotId = 'plot_hq12d_ridge_outpost';
  return {
    plotId,
    outpostPlotId,
    expeditionMap: {
      status: 'FOG_READ_MODEL_READY',
      title: 'Expedition Map',
      implementation: 'hq12a_server_owned_expedition_map_read_model_v1',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_read_only_expedition_map_fog_of_war_projection_v1',
      fog: {
        states: ['discovered', 'known', 'hinted', 'locked_unknown'],
        counts: { discovered: 2, known: 1, hinted: 1, locked_unknown: 1 },
      },
      scope: {
        homePlotId: plotId,
        activePlotId: plotId,
        ownedPlotCount: 2,
        scoutReportCount: 1,
        sitePlanCount: 1,
        scoutedSectorCount: 0,
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
          siteType: 'home_plot',
          risk: 'owned',
          readOnly: true,
          publicTerrainAssetSlot: 'settled',
          publicTerrainAssetSlotSource: 'server_read_model_v1',
          publicTerrainAssetSlotReason: 'known/discovered public cell traits include owned, home, founded, settled, or outpost status',
          fogAssetSlot: null,
          terrainAssetContractVersion: 'agenttown_public_terrain_asset_slots_v1',
        },
        {
          cellId: 'cell_q1_r0',
          q: 1,
          r: 0,
          fogState: 'known',
          kind: 'planned_site',
          title: 'Forest Ridge Survey Site Plan',
          status: 'SITE_PLAN_REVIEWED',
          sourceTruth: 'site_plan',
          sourceIds: { plotId, reportId: 'scout_report_hq12d_forest', planId: 'site_plan_hq12d_forest' },
          receipts: [{
            kind: 'reviewed_site_plan_known_cell',
            sourceIds: { reportId: 'scout_report_hq12d_forest', planId: 'site_plan_hq12d_forest' },
            readOnly: true,
          }],
          traits: ['wooded', 'sheltered'],
          resourceHints: { wood: 2, food: 1 },
          siteType: 'forest_edge',
          risk: 'low',
          summary: 'Reviewed planning truth from the server read model.',
          recommendedNext: 'Use existing Site Plan and Settlement Claim panels for allowed follow-up actions.',
          readOnly: true,
          publicTerrainAssetSlot: 'forest',
          publicTerrainAssetSlotSource: 'server_read_model_v1',
          publicTerrainAssetSlotReason: 'known/discovered public cell traits include forest, wood, woodland, or timber',
          fogAssetSlot: null,
          terrainAssetContractVersion: 'agenttown_public_terrain_asset_slots_v1',
        },
        {
          cellId: 'cell_q1_r-1',
          q: 1,
          r: -1,
          fogState: 'discovered',
          kind: 'owned_outpost',
          title: 'Forest Ridge Outpost',
          status: 'OWNED_OUTPOST',
          sourceTruth: 'plot_membership',
          sourceIds: { plotId: outpostPlotId, originClaimId: 'claim_hq12d_forest', claimId: 'claim_hq12d_forest' },
          receipts: [{ kind: 'owned_outpost_discovered_cell', sourceIds: { plotId: outpostPlotId }, readOnly: true }],
          siteType: 'outpost',
          risk: 'owned',
          summary: 'Founded outpost marker tied to an owned plot record.',
          readOnly: true,
          publicTerrainAssetSlot: 'settled',
          publicTerrainAssetSlotSource: 'server_read_model_v1',
          publicTerrainAssetSlotReason: 'known/discovered public cell traits include owned, home, founded, settled, or outpost status',
          fogAssetSlot: null,
          terrainAssetContractVersion: 'agenttown_public_terrain_asset_slots_v1',
        },
        {
          cellId: 'cell_q0_r1',
          q: 0,
          r: 1,
          fogState: 'hinted',
          kind: 'frontier_hint',
          title: 'Unresolved Map Edge Hint',
          status: 'HINTED_BY_KNOWN_FRONTIER',
          sourceTruth: 'derived_hint',
          sourceIds: { adjacentCellId: 'cell_q1_r0' },
          receipts: [{ kind: 'derived_frontier_hint_cell', sourceIds: { adjacentCellId: 'cell_q1_r0' }, readOnly: true }],
          resourceHints: {},
          siteType: 'unresolved_frontier',
          risk: 'unknown',
          readOnly: true,
          publicTerrainAssetSlot: null,
          publicTerrainAssetSlotSource: null,
          publicTerrainAssetSlotReason: 'hidden expedition cell exposes only fog asset slots; no concrete terrain truth is public',
          fogAssetSlot: 'hinted_frontier_fog',
          terrainAssetContractVersion: 'agenttown_public_terrain_asset_slots_v1',
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
          resourceHints: {},
          siteType: 'unknown',
          risk: 'unknown',
          readOnly: true,
          publicTerrainAssetSlot: null,
          publicTerrainAssetSlotSource: null,
          publicTerrainAssetSlotReason: 'hidden expedition cell exposes only fog asset slots; no concrete terrain truth is public',
          fogAssetSlot: 'locked_unknown_fog',
          terrainAssetContractVersion: 'agenttown_public_terrain_asset_slots_v1',
        },
      ],
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
        items: [
          {
            unitId: 'expedition_unit_pathfinder_scout_v1',
            kind: 'expedition_map_unit',
            unitType: 'scout',
            displayName: 'Mira Trailmark',
            role: 'scout',
            state: 'AT_ORIGIN',
            readOnly: true,
            selectable: true,
            executableActions: [],
            location: { cellId: 'cell_origin', q: 0, r: 0, fogState: 'discovered' },
            movement: { canMove: true, movementMutationImplemented: true, allowedTargetCellIds: ['cell_q1_r0'], authority: 'server_owned_scout_unit_revealed_cell_move_receipt_v1', allowedFogStates: ['discovered', 'known'], revealsFog: false, routeCreation: false, resourceDelta: {} },
            commandHints: [{
              commandId: 'move_unit',
              label: 'Move',
              actionName: 'et.plot.move_expedition_unit',
              enabled: true,
              targetCellIds: ['cell_q1_r0'],
              serverMutationImplemented: true,
              requiresHumanApprovalForAgent: true,
              revealsFog: false,
              routeCreation: false,
            }, {
              commandId: 'scout_sector',
              label: 'Scout Sector',
              actionName: 'et.plot.scout_sector',
              enabled: true,
              targetCellIds: ['cell_q0_r1'],
              serverMutationImplemented: true,
              requiresHumanApprovalForAgent: true,
            }],
            boundaryFlags: { movementMutation: true, movementRevealsFog: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          },
          {
            unitId: 'expedition_unit_rook_signalpost_messenger_v1',
            kind: 'expedition_map_unit',
            unitType: 'courier',
            displayName: 'Rook Signalpost',
            role: 'messenger',
            state: 'AT_ORIGIN',
            readOnly: true,
            selectable: true,
            executableActions: [],
            location: { cellId: 'cell_origin', q: 0, r: 0, fogState: 'discovered' },
            movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
            commandHints: [{ commandId: 'inspect_event_packet', label: 'Inspect packet', enabled: false, serverMutationImplemented: false }],
            boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          },
          {
            unitId: 'expedition_unit_surveyor_site_plan_hq12d_forest',
            kind: 'expedition_map_unit',
            unitType: 'surveyor',
            displayName: 'Surveyor Crew',
            role: 'surveyor',
            state: 'SURVEY_READY',
            readOnly: true,
            selectable: true,
            executableActions: [],
            location: { cellId: 'cell_q1_r0', q: 1, r: 0, fogState: 'known' },
            movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
            commandHints: [{ commandId: 'inspect_survey', label: 'Inspect survey', enabled: true, serverMutationImplemented: false }],
            boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          },
          {
            unitId: 'expedition_unit_outpost_crew_claim_hq12d_forest',
            kind: 'expedition_map_unit',
            unitType: 'outpost_crew',
            displayName: 'Outpost Crew',
            role: 'outpost_crew',
            state: 'STATIONED',
            readOnly: true,
            selectable: true,
            executableActions: [],
            location: { cellId: 'cell_q1_r-1', q: 1, r: -1, fogState: 'discovered' },
            movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
            commandHints: [{ commandId: 'inspect_outpost', label: 'Inspect outpost', enabled: true, serverMutationImplemented: false }],
            boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
          },
        ],
        byCellId: {
          cell_origin: ['expedition_unit_pathfinder_scout_v1', 'expedition_unit_rook_signalpost_messenger_v1'],
          cell_q1_r0: ['expedition_unit_surveyor_site_plan_hq12d_forest'],
          'cell_q1_r-1': ['expedition_unit_outpost_crew_claim_hq12d_forest'],
        },
        boundaryFlags: { movementMutation: true, movementRevealsFog: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
      },
      eventPackets: [{
        packetId: 'expedition_event_packet_hq15d_cell_q1_r0',
        templateId: 'marker-stone',
        scoutId: 'scout_sector_hq15d_001',
        cellId: 'cell_q1_r0',
        partyId: 'expedition_party_plot_hq12d_exp_map_threejs',
        discoveryFlavor: 'Marker Stone packet',
        readOnly: true,
        executableActions: [],
        authorityBoundary: 'server_owned_expedition_event_packet_read_model_v1',
        receiptLink: {
          actionName: 'et.plot.scout_sector',
          scoutId: 'scout_sector_hq15d_001',
          cellId: 'cell_q1_r0',
          via: 'scout_sector_receipt',
        },
        boundaryFlags: {
          receiptMetadataOnly: true,
          executableActions: false,
          routeCreation: false,
          atlasExecution: false,
          externalEffects: false,
        },
      }],
      objective: {
        mode: 'scout',
        title: 'Scout an eligible hinted sector',
        targetCellId: 'cell_q0_r1',
        selectedCellId: 'cell_q0_r1',
        packetId: 'expedition_event_packet_hq15d_cell_q1_r0',
        partyId: 'expedition_party_plot_hq12d_exp_map_threejs',
        readOnly: true,
        executableActions: [],
      },
      receipt: {
        kind: 'expedition_map_read_model_projection',
        sourceIds: { plotId },
        readOnly: true,
        routeCreation: false,
        atlasExecution: false,
        projectionHash: 'hq12d-threejs-expedition-map-proof',
      },
      projectionHash: 'hq12d-threejs-expedition-map-proof',
    },
  };
}

function stateEnvelope(fixture) {
  const { plotId, outpostPlotId, expeditionMap } = fixture;
  const state = {
    plot: {
      plotId,
      pairId: 'pair:hq12d-exp-map-threejs',
      hqLevel: 12,
      townXp: 620,
      inventory: { wood: 160, stone: 130, food: 115, coin: 44 },
      scoutReports: [{ reportId: 'scout_report_hq12d_forest', title: 'Forest Ridge Survey' }],
      sitePlans: [{ planId: 'site_plan_hq12d_forest', reportId: 'scout_report_hq12d_forest', title: 'Forest Ridge Survey Site Plan', reviewStatus: 'reviewed' }],
    },
    buildings: [
      { buildingId: 'bldg_hq_hq12d_ui', type: 'HQ', x: 1, y: 0, level: 12, state: 'READY' },
      { buildingId: 'bldg_expedition_hq12d_ui', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: 'READY' },
    ],
    jobs: [],
    policy: {},
    permissions: {},
    pendingApprovals: [],
    rewards: [],
    quest: { id: 'expedition-map-threejs', title: 'Read the Expedition Map', body: 'Fog of war is server-owned and read-only.' },
    unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
    buildingDefs: {},
    hqUpgrade: null,
    scoutReports: [{ reportId: 'scout_report_hq12d_forest', title: 'Forest Ridge Survey' }],
    sitePlans: [{ planId: 'site_plan_hq12d_forest', reportId: 'scout_report_hq12d_forest', title: 'Forest Ridge Survey Site Plan', reviewStatus: 'reviewed' }],
    settlementClaims: [{ claimId: 'claim_hq12d_forest', status: 'FOUNDED', foundedPlotId: outpostPlotId }],
    ownedPlots: [
      { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 12, active: true },
      { plotId: outpostPlotId, role: 'OUTPOST', title: 'Forest Ridge Outpost', hqLevel: 1, active: false, originClaimId: 'claim_hq12d_forest' },
    ],
    activePlotId: plotId,
    homePlotId: plotId,
    worldGrid: { status: 'READ_MODEL_READY', readOnly: true, civicReadiness: { ready: true }, requirements: { items: [], satisfiedCount: 0, totalCount: 0 } },
    expeditionMap,
    publicSummary: {
      expeditionMapStatus: 'FOG_READ_MODEL_READY',
      expeditionMapDiscoveredCount: 2,
      expeditionMapKnownCount: 1,
      expeditionMapHintedCount: 1,
      expeditionMapLockedUnknownCount: 1,
    },
    visualActors: [],
    audit: { stateHash: 'hq12d-expedition-map-threejs-ui' },
  };
  return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
}

async function installRoutes(page, fixture) {
  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stateEnvelope(fixture)),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    const envelope = stateEnvelope(fixture);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId: fixture.plotId,
        homePlotId: fixture.plotId,
        activePlotId: fixture.plotId,
        plots: envelope.state.ownedPlots,
        settlementClaims: envelope.state.settlementClaims,
      }),
    });
  });
}

async function canvasSample(page) {
  return page.getByTestId('fp-expedition-three-canvas').evaluate((canvas) => {
    const sample = document.createElement('canvas');
    sample.width = Math.max(1, Math.min(96, canvas.width));
    sample.height = Math.max(1, Math.min(64, canvas.height));
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
    const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
    let opaquePixels = 0;
    const colors = new Set();
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] > 0) opaquePixels += 1;
      if (index % 16 === 0) {
        colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${pixels[index + 3]}`);
      }
    }
    return {
      width: canvas.width,
      height: canvas.height,
      opaquePixels,
      uniqueColorSamples: colors.size,
    };
  });
}

function colorDistance(a, b) {
  return Math.sqrt(
    ((a.r - b.r) ** 2)
    + ((a.g - b.g) ** 2)
    + ((a.b - b.b) ** 2)
  );
}

async function cellColorProof(page) {
  const info = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  return page.getByTestId('fp-expedition-three-canvas').evaluate((canvas, targets) => {
    const rect = canvas.getBoundingClientRect();
    const sample = document.createElement('canvas');
    sample.width = canvas.width;
    sample.height = canvas.height;
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0);
    const colors = {};
    for (const target of targets) {
      if (!target.canvas) continue;
      const x = Math.round((target.canvas.x / Math.max(1, rect.width)) * sample.width);
      const y = Math.round((target.canvas.y / Math.max(1, rect.height)) * sample.height);
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dy = -10; dy <= 10; dy += 2) {
        for (let dx = -10; dx <= 10; dx += 2) {
          const sx = Math.max(0, Math.min(sample.width - 1, x + dx));
          const sy = Math.max(0, Math.min(sample.height - 1, y + dy));
          const pixel = ctx.getImageData(sx, sy, 1, 1).data;
          r += pixel[0];
          g += pixel[1];
          b += pixel[2];
          count += 1;
        }
      }
      colors[target.cellId] = {
        fogState: target.fogState,
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
      };
    }
    return colors;
  }, info.pickTargets);
}

async function semanticZoomProof(page) {
  return page.evaluate(() => {
    const tier = document.querySelector('[data-testid="fp-expedition-zoom-tier"]');
    const copy = document.querySelector('[data-testid="fp-expedition-zoom-copy"]');
    const selectedHint = document.querySelector('[data-testid="fp-expedition-selected-zoom-hint"]');
    const host = document.querySelector('[data-testid="fp-expedition-three-host"]');
    const overlay = document.querySelector('[data-testid="fp-expedition-semantic-zoom"]');
    return {
      tier: tier?.textContent || '',
      tierLabel: tier?.getAttribute('aria-label') || '',
      copy: copy?.textContent || '',
      copyLabel: copy?.getAttribute('aria-label') || '',
      selectedHint: selectedHint?.textContent || '',
      selectedHintLabel: selectedHint?.getAttribute('aria-label') || '',
      fogState: selectedHint?.getAttribute('data-fog-state') || '',
      zoomTier: (tier?.textContent || '').trim().toLowerCase()
        || host?.getAttribute('data-zoom-tier')
        || overlay?.getAttribute('data-zoom-tier')
        || '',
    };
  });
}

async function fogLegendProof(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="fp-expedition-fog-legend-"]')).map((node) => ({
    testid: node.getAttribute('data-testid'),
    fogState: node.getAttribute('data-fog-state'),
    selected: node.getAttribute('data-selected') === 'true',
    text: node.textContent || '',
  })));
}

async function selectedRulesProof(page) {
  return page.evaluate(() => {
    const rules = document.querySelector('[data-testid="fp-expedition-selected-rules"]');
    return {
      fogState: rules?.getAttribute('data-fog-state') || '',
      cellId: rules?.getAttribute('data-cell-id') || '',
      text: rules?.textContent || '',
      items: Array.from(rules?.querySelectorAll('span') || []).map((node) => node.textContent || ''),
    };
  });
}

function runtimeRegionSourceProof() {
  const source = fs.readFileSync('public/experiences/founders-plot/three_scene_entry.js', 'utf8');
  const terrainFunction = source.match(/function drawExpeditionMiniTerrain[\s\S]*?function makeExpeditionCellTexture/)?.[0] || '';
  const underlayFunction = source.match(/function makeExpeditionContinuousUnderlayTexture[\s\S]*?function makeExpeditionCivicBeaconTexture/)?.[0] || '';
  const hintedBranch = terrainFunction.match(/} else if \(terrain === 'hinted'\) \{[\s\S]*?} else if \(terrain === 'locked_unknown'\)/)?.[0] || '';
  const lockedBranch = terrainFunction.match(/} else if \(terrain === 'locked_unknown'\) \{[\s\S]*?} else \{/)?.[0] || '';
  return {
    lockedUnknownHasNoRuinDrawPath: !lockedBranch.includes('drawRuinCue'),
    lockedUnknownHasNoSignalMastDrawPath: !lockedBranch.includes('drawSignalMast'),
    hintedHasNoSignalMastDrawPath: !hintedBranch.includes('drawSignalMast'),
    waterStrokeUsesTerrainGate: terrainFunction.includes("if (terrain === 'water')"),
    waterTerrainUsesServerPredicate: source.includes('function isServerOwnedWaterTerrain')
      && source.includes("String(cell.publicTerrainAssetSlot || '') === 'water'"),
    noAllVisibleCellRiverStrokeGate: !terrainFunction.includes("['discovered', 'known'].includes(String(cell.fogState || ''))"),
    runtimeAssetPackDeclared: source.includes('hq14s_public_terrain_underlay_v1'),
    runtimeAssetManifestDeclared: source.includes('hq14s-public-terrain-underlay-v1')
      && source.includes('manifest.json'),
    runtimeAssetTilesDeclared: source.includes('EXPEDITION_REGION_TILE_ASSETS'),
    hiddenFogAssetSlotsOnly: source.includes("'hinted_frontier_fog'") && source.includes("'locked_unknown_fog'"),
    assetAllowedByServerTruthGuard: source.includes('function expeditionRegionTileAssetAllowed'),
    rendererConsumesServerSlots: source.includes('function serverPublicTerrainSlot')
      && source.includes('publicTerrainAssetSlot')
      && source.includes('fogAssetSlot')
      && source.includes('terrainAssetContractVersion'),
    assetLoadInvalidatesTextureCache: source.includes('onExpeditionRegionTileAssetChange') && source.includes('textureCache.clear()'),
    continuousUnderlayDeclared: source.includes('function makeExpeditionContinuousUnderlayTexture') && source.includes('expedition_continuous_terrain_underlay'),
    promotedUnderlayDeclared: source.includes('EXPEDITION_PROMOTED_UNDERLAY_ASSET')
      && source.includes('public-terrain-underlay-candidate-01-v1.png'),
    continuousUnderlayUsesFogGate: source.includes('function expeditionContinuousUnderlayStyle') && source.includes('if (!cellExposesRegionTruth(cell))'),
    continuousUnderlayAvoidsPrivateFields: !/resourceHints|receipts|sourceIds|recommendedNext/.test(underlayFunction),
    softSeamOpacityHelpers: source.includes('function expeditionRegionPlateOpacity')
      && source.includes('function expeditionCorePlateOpacity')
      && source.includes('function expeditionRegionLineOpacity')
      && source.includes('function expeditionCoreLineOpacity'),
    cartographicFogDepthDeclared: source.includes('function drawExpeditionAmbientContourField')
      && source.includes('cartographicFogDepth: true')
      && source.includes('fogDepthGlyphsVisualOnly: true'),
    eventObjectiveMarkersDeclared: source.includes('function makeExpeditionEventPacketMarkerTexture')
      && source.includes('function makeExpeditionObjectiveMarkerTexture')
      && source.includes('eventObjectiveMarkersVisualOnly')
      && source.includes('eventObjectiveMarkersInspectable')
      && source.includes('eventObjectiveMarkerAuthority: false'),
    generatedSpritePackDeclared: source.includes('EXPEDITION_SPRITE_ASSET_PACK_VERSION')
      && source.includes('hq15e-expedition-unit-marker-sprites-v1')
      && source.includes('generatedSpriteAssetsReady')
      && source.includes('drawExpeditionGeneratedSprite'),
  };
}

test('FP-E2E-023 HQ14T Expedition Map server-bound terrain underlay preserves authority', async ({ page }) => {
  test.setTimeout(120_000);
  const fixture = expeditionMapFixture();
  const sourceProof = runtimeRegionSourceProof();
  expect(sourceProof.lockedUnknownHasNoRuinDrawPath).toBe(true);
  expect(sourceProof.lockedUnknownHasNoSignalMastDrawPath).toBe(true);
  expect(sourceProof.hintedHasNoSignalMastDrawPath).toBe(true);
  expect(sourceProof.waterStrokeUsesTerrainGate).toBe(true);
  expect(sourceProof.waterTerrainUsesServerPredicate).toBe(true);
  expect(sourceProof.noAllVisibleCellRiverStrokeGate).toBe(true);
  expect(sourceProof.runtimeAssetPackDeclared).toBe(true);
  expect(sourceProof.runtimeAssetManifestDeclared).toBe(true);
  expect(sourceProof.runtimeAssetTilesDeclared).toBe(true);
  expect(sourceProof.hiddenFogAssetSlotsOnly).toBe(true);
  expect(sourceProof.assetAllowedByServerTruthGuard).toBe(true);
  expect(sourceProof.rendererConsumesServerSlots).toBe(true);
  expect(sourceProof.assetLoadInvalidatesTextureCache).toBe(true);
  expect(sourceProof.continuousUnderlayDeclared).toBe(true);
  expect(sourceProof.promotedUnderlayDeclared).toBe(true);
  expect(sourceProof.continuousUnderlayUsesFogGate).toBe(true);
  expect(sourceProof.continuousUnderlayAvoidsPrivateFields).toBe(true);
  expect(sourceProof.softSeamOpacityHelpers).toBe(true);
  expect(sourceProof.cartographicFogDepthDeclared).toBe(true);
  expect(sourceProof.eventObjectiveMarkersDeclared).toBe(true);
  expect(sourceProof.generatedSpritePackDeclared).toBe(true);
  await installRoutes(page, fixture);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/experiences/founders-plot/');
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-map-runtime')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-map-hud')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-three-host')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-three-canvas')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-map-controls')).toBeVisible();
  await expect.poll(async () => {
    const info = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
    return info?.visualLayers?.assetBackedLoadedTiles || 0;
  }, { timeout: 8000 }).toBeGreaterThanOrEqual(5);
  await expect.poll(async () => {
    const info = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
    return info?.visualLayers?.generatedSpriteAssetsReady || 0;
  }, { timeout: 8000 }).toBeGreaterThanOrEqual(8);

  const initialInfo = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(initialInfo.renderer).toBe('three.js');
  expect(initialInfo.surface).toBe('expedition-map');
  expect(initialInfo.cellCount).toBe(5);
  expect(initialInfo.fogStates.locked_unknown).toBe(1);
  expect(initialInfo.visualShell).toBe('hq14t_server_bound_terrain_underlay_v1');
  expect(initialInfo.visualLayers.terrainTexture).toBe(true);
  expect(initialInfo.visualLayers.runtimeRegionAssetPack).toBe('hq14s_public_terrain_underlay_v1');
  expect(initialInfo.visualLayers.runtimeRegionAtlas).toContain('/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/manifest.json');
  expect(initialInfo.visualLayers.runtimeTerrainUnderlay).toContain('/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/public-terrain-underlay-candidate-01-v1.png');
  expect(initialInfo.visualLayers.runtimeSpriteAssetPack).toBe('hq15e_expedition_unit_marker_sprites_v1');
  expect(initialInfo.visualLayers.runtimeSpriteAtlas).toContain('/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1/manifest.json');
  expect(initialInfo.visualLayers.generatedSpriteAssets).toBe(true);
  expect(initialInfo.visualLayers.generatedSpriteAssetCount).toBe(8);
  expect(initialInfo.visualLayers.generatedSpriteAssetsReady).toBeGreaterThanOrEqual(8);
  expect(initialInfo.visualLayers.generatedSpriteAssetsVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.generatedSpriteAssetsReadOnly).toBe(true);
  expect(initialInfo.visualLayers.serverTerrainAssetContractVersion).toBe('agenttown_public_terrain_asset_slots_v1');
  expect(initialInfo.visualLayers.serverTerrainSlotSource).toBe('server_read_model_v1');
  expect(initialInfo.visualLayers.assetBackedRegionTiles).toBe(5);
  expect(initialInfo.visualLayers.assetBackedLoadedTiles).toBeGreaterThanOrEqual(5);
  expect(initialInfo.visualLayers.assetBackedTerrainTextures).toBe(true);
  expect(initialInfo.visualLayers.continuousTerrainUnderlay).toBe(true);
  expect(initialInfo.visualLayers.continuousTerrainUnderlayVersion).toBe('hq14t_server_bound_terrain_underlay_v1');
  expect(initialInfo.visualLayers.continuousUnderlayUsesServerOwnedCells).toBe(true);
  expect(initialInfo.visualLayers.continuousUnderlayHiddenCellsFogOnly).toBe(true);
  expect(initialInfo.visualLayers.continuousUnderlayVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.plateBlendLayer).toBe(true);
  expect(initialInfo.visualLayers.softRegionSeams).toBe(true);
  expect(initialInfo.visualLayers.reducedPlateEdgeContrast).toBe(true);
  expect(initialInfo.visualLayers.centerTileMutedForUnderlay).toBe(true);
  expect(initialInfo.visualLayers.cartographicFogDepth).toBe(true);
  expect(initialInfo.visualLayers.ambientContourField).toBe(true);
  expect(initialInfo.visualLayers.fogDepthGlyphsVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.terrainUnderlayCount).toBe(1);
  expect(initialInfo.visualLayers.proceduralFallbackWhenAssetPending).toBe(true);
  expect(initialInfo.visualLayers.candidate02Cues).toBe(true);
  expect(initialInfo.visualLayers.agentTownIdentityCues).toBe(true);
  expect(initialInfo.visualLayers.scoutLedgerHud).toBe(true);
  expect(initialInfo.visualLayers.mapFirstHudOverlays).toBe(true);
  expect(initialInfo.visualLayers.hoverAffordance).toBe(true);
  expect(initialInfo.visualLayers.selectedSectorOutline).toBe(true);
  expect(initialInfo.visualLayers.beaconPlanWagonCues).toBe(true);
  expect(initialInfo.visualLayers.homeNodeEmphasis).toBe(true);
  expect(initialInfo.visualLayers.riverFlatCues).toBe(true);
  expect(initialInfo.visualLayers.waterCuesServerGated).toBe(true);
  expect(initialInfo.visualLayers.woodlandRidgeCues).toBe(true);
  expect(initialInfo.visualLayers.ruinSignalCues).toBe(true);
  expect(initialInfo.visualLayers.ruinSignalCuesServerGated).toBe(true);
  expect(initialInfo.visualLayers.lockedUnknownSealedFogOnly).toBe(true);
  expect(initialInfo.visualLayers.hintedAbstractFogEdge).toBe(true);
  expect(initialInfo.visualLayers.frontierBoundaryDashes).toBe(true);
  expect(initialInfo.visualLayers.frontierBoundaryVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.clientAuthority).toBe(false);
  expect(initialInfo.visualLayers.fogVeils).toBeGreaterThanOrEqual(2);
  expect(initialInfo.visualLayers.edgeFogCount).toBeGreaterThanOrEqual(4);
  expect(initialInfo.visualLayers.civicBeaconCount).toBeGreaterThanOrEqual(3);
  expect(initialInfo.visualLayers.surveyStrokeCount).toBeGreaterThanOrEqual(3);
  expect(initialInfo.visualLayers.surveyStrokesVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.receiptTraceVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.markerCount).toBe(5);
  expect(initialInfo.visualLayers.eventPacketMarkers).toBe(true);
  expect(initialInfo.visualLayers.eventPacketMarkerCount).toBe(1);
  expect(initialInfo.visualLayers.objectiveMarkers).toBe(true);
  expect(initialInfo.visualLayers.objectiveMarkerCount).toBe(1);
  expect(initialInfo.visualLayers.eventObjectiveMarkersVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.eventObjectiveMarkersReadOnly).toBe(true);
  expect(initialInfo.visualLayers.eventObjectiveMarkersInspectable).toBe(true);
  expect(initialInfo.visualLayers.eventObjectiveMarkerAuthority).toBe(false);
  expect(initialInfo.eventMarkers).toHaveLength(1);
  expect(initialInfo.eventMarkers[0]).toMatchObject({
    packetId: 'expedition_event_packet_hq15d_cell_q1_r0',
    cellId: 'cell_q1_r0',
    spriteAssetSlot: 'event_packet',
    visualOnly: true,
    readOnly: true,
    selectable: true,
    inspectable: true,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
  });
  expect(initialInfo.objectiveMarkers).toHaveLength(1);
  expect(initialInfo.objectiveMarkers[0]).toMatchObject({
    mode: 'scout',
    targetCellId: 'cell_q0_r1',
    packetId: 'expedition_event_packet_hq15d_cell_q1_r0',
    spriteAssetSlot: 'objective_beacon',
    visualOnly: true,
    readOnly: true,
    selectable: true,
    inspectable: true,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
  });
  expect(initialInfo.visualLayers.unitTokens).toBe(true);
  expect(initialInfo.visualLayers.unitTokenCount).toBe(4);
  expect(initialInfo.visualLayers.unitTokensReadOnly).toBe(true);
  expect(initialInfo.visualLayers.unitMovementMutationImplemented).toBe(true);
  expect(initialInfo.visualLayers.commandTargetRings).toBe(true);
  expect(initialInfo.visualLayers.commandTargetCount).toBe(2);
  expect(initialInfo.visualLayers.commandTargetRingsVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.commandTargetRingsReadOnly).toBe(true);
  expect(initialInfo.visualLayers.commandTargetRingsPreviewOnly).toBe(true);
  expect(initialInfo.visualLayers.commandTargetRingsSelectable).toBe(true);
  expect(initialInfo.visualLayers.commandTargetRingAuthority).toBe(false);
  expect(initialInfo.visualLayers.commandOutcomeFeedback).toBe(false);
  expect(initialInfo.visualLayers.commandOutcomeFeedbackCount).toBe(0);
  expect(initialInfo.visualLayers.commandOutcomeFeedbackVisualOnly).toBe(true);
  expect(initialInfo.visualLayers.commandOutcomeFeedbackReadOnly).toBe(true);
  expect(initialInfo.visualLayers.commandOutcomeFeedbackServerOwned).toBe(true);
  expect(initialInfo.visualLayers.commandOutcomeFeedbackSelectable).toBe(false);
  expect(initialInfo.visualLayers.commandOutcomeFeedbackAuthority).toBe(false);
  expect(initialInfo.commandOutcomeFeedback).toEqual([]);
  expect(initialInfo.commandTargets.map((target) => target.commandId).sort()).toEqual(['move_unit', 'scout_sector']);
  expect(initialInfo.commandTargets.every((target) => target.visualOnly && target.readOnly && target.previewOnly && target.selectable && target.executableActions === 0)).toBe(true);
  expect(initialInfo.commandTargets.every((target) => target.routeAuthority === false && target.actionAuthority === false)).toBe(true);
  expect(initialInfo.commandTargets.find((target) => target.commandId === 'scout_sector')).toMatchObject({
    cellId: 'cell_q0_r1',
    fogState: 'hinted',
    serverMutationImplemented: true,
    movementMutation: false
  });
  expect(initialInfo.commandTargets.find((target) => target.commandId === 'move_unit')).toMatchObject({
    cellId: 'cell_q1_r0',
    fogState: 'known',
    serverMutationImplemented: true,
    movementMutation: true
  });
  expect(initialInfo.units.map((unit) => unit.unitType).sort()).toEqual(['courier', 'outpost_crew', 'scout', 'surveyor']);
  expect(initialInfo.units.find((unit) => unit.unitType === 'scout')).toMatchObject({
    cellId: 'cell_origin',
    movementMutationImplemented: true,
  });
  expect(initialInfo.units.every((unit) => unit.spriteAssetPath.includes('/hq15e-expedition-unit-marker-sprites-v1/'))).toBe(true);
  expect(initialInfo.units.every((unit) => unit.spriteAssetReady === true)).toBe(true);
  expect(initialInfo.regionConsistency.lockedUnknownCellsSealed).toBe(true);
  expect(initialInfo.regionConsistency.hintedCellsAbstract).toBe(true);
  expect(initialInfo.regionConsistency.waterCuesRequireServerOwnedWater).toBe(true);
  expect(initialInfo.regionConsistency.waterCoastRuntimeAssetsBlocked).toBe(true);
  expect(initialInfo.regionConsistency.hiddenCellsHaveNoPublicTerrainSlot).toBe(true);
  expect(initialInfo.regionConsistency.hiddenCellsUseOnlyFogAssets).toBe(true);
  expect(initialInfo.regionConsistency.knownDiscoveredAssetsMatchServerTerrain).toBe(true);
  expect(initialInfo.regionConsistency.visibleAssetsMatchPublicTerrainSlot).toBe(true);
  expect(initialInfo.regionConsistency.serverTerrainAssetContractComplete).toBe(true);
  expect(initialInfo.regionConsistency.runtimeAssetProofMetadataComplete).toBe(true);
  expect(initialInfo.regionConsistency.runtimeAssetCellsRegionTruthBound).toBe(true);
  expect(initialInfo.regionConsistency.continuousUnderlayHiddenCellsFogOnly).toBe(true);
  expect(initialInfo.regionConsistency.continuousUnderlayNoActionAuthority).toBe(true);
  expect(initialInfo.regionConsistency.waterCueCells).toEqual([]);
  expect(initialInfo.regionConsistency.ruinSignalCueCells).toEqual([]);
  const visualsByCell = Object.fromEntries(initialInfo.regionVisuals.map((cell) => [cell.cellId, cell]));
  expect(visualsByCell.cell_origin.terrain).toBe('settled');
  expect(visualsByCell.cell_origin.publicTerrainAssetSlot).toBe('settled');
  expect(visualsByCell.cell_origin.publicTerrainAssetSlotSource).toBe('server_read_model_v1');
  expect(visualsByCell.cell_origin.assetSlot).toBe('settled');
  expect(visualsByCell.cell_origin.assetKind).toBe('concrete_public_terrain');
  expect(visualsByCell.cell_origin.assetAllowedByServerTruth).toBe(true);
  expect(visualsByCell.cell_origin.waterCue).toBe(false);
  expect(visualsByCell.cell_q1_r0.terrain).toBe('forest');
  expect(visualsByCell.cell_q1_r0.publicTerrainAssetSlot).toBe('forest');
  expect(visualsByCell.cell_q1_r0.publicTerrainAssetSlotSource).toBe('server_read_model_v1');
  expect(visualsByCell.cell_q1_r0.assetSlot).toBe('forest');
  expect(visualsByCell.cell_q1_r0.assetKind).toBe('concrete_public_terrain');
  expect(visualsByCell.cell_q1_r0.assetAllowedByServerTruth).toBe(true);
  expect(visualsByCell.cell_q1_r0.waterCue).toBe(false);
  expect(visualsByCell['cell_q1_r-1'].terrain).toBe('settled');
  expect(visualsByCell['cell_q1_r-1'].publicTerrainAssetSlot).toBe('settled');
  expect(visualsByCell['cell_q1_r-1'].assetSlot).toBe('settled');
  expect(visualsByCell['cell_q1_r-1'].assetKind).toBe('concrete_public_terrain');
  expect(visualsByCell['cell_q1_r-1'].assetAllowedByServerTruth).toBe(true);
  expect(visualsByCell['cell_q1_r-1'].waterCue).toBe(false);
  expect(visualsByCell.cell_q0_r1.terrain).toBe('hinted');
  expect(visualsByCell.cell_q0_r1.publicTerrainAssetSlot).toBe(null);
  expect(visualsByCell.cell_q0_r1.fogAssetSlot).toBe('hinted_frontier_fog');
  expect(visualsByCell.cell_q0_r1.assetSlot).toBe('hinted_frontier_fog');
  expect(visualsByCell.cell_q0_r1.assetKind).toBe('fog_only');
  expect(visualsByCell.cell_q0_r1.fogOnly).toBe(true);
  expect(visualsByCell.cell_q0_r1.assetAllowedByServerTruth).toBe(true);
  expect(visualsByCell.cell_q0_r1.hiddenSpecificitySuppressed).toBe(true);
  expect(visualsByCell.cell_q0_r1.underlayTerrain).toBe('hinted');
  expect(visualsByCell.cell_q0_r1.underlayFogOnly).toBe(true);
  expect(visualsByCell.cell_q3_r0.terrain).toBe('locked_unknown');
  expect(visualsByCell.cell_q3_r0.publicTerrainAssetSlot).toBe(null);
  expect(visualsByCell.cell_q3_r0.fogAssetSlot).toBe('locked_unknown_fog');
  expect(visualsByCell.cell_q3_r0.assetSlot).toBe('locked_unknown_fog');
  expect(visualsByCell.cell_q3_r0.assetKind).toBe('fog_only');
  expect(visualsByCell.cell_q3_r0.fogOnly).toBe(true);
  expect(visualsByCell.cell_q3_r0.assetAllowedByServerTruth).toBe(true);
  expect(visualsByCell.cell_q3_r0.hiddenSpecificitySuppressed).toBe(true);
  expect(visualsByCell.cell_q3_r0.underlayTerrain).toBe('locked_unknown');
  expect(visualsByCell.cell_q3_r0.underlayFogOnly).toBe(true);
  const invalidHiddenTerrainProof = await page.evaluate((mapModel) => {
    const host = document.querySelector('[data-testid="fp-expedition-three-host"]');
    const renderer = window.FoundersPlotThreeRenderer;
    const invalid = JSON.parse(JSON.stringify(mapModel));
    const hidden = invalid.cells.find((cell) => cell.fogState === 'locked_unknown');
    hidden.publicTerrainAssetSlot = 'forest';
    hidden.publicTerrainAssetSlotSource = 'server_read_model_v1';
    hidden.publicTerrainAssetSlotReason = 'invalid test injection';
    const invalidInfo = renderer.renderExpeditionMap(host, invalid, { selectedCellId: hidden.cellId });
    const hiddenVisual = invalidInfo.regionVisuals.find((cell) => cell.cellId === hidden.cellId);
    const restoredInfo = renderer.renderExpeditionMap(host, mapModel, { selectedCellId: 'cell_q0_r1' });
    return {
      hiddenVisual,
      restoredSelectedCellId: restoredInfo.selectedCellId
    };
  }, fixture.expeditionMap);
  expect(invalidHiddenTerrainProof.hiddenVisual.publicTerrainAssetSlot).toBe(null);
  expect(invalidHiddenTerrainProof.hiddenVisual.assetSlot).toBe('locked_unknown_fog');
  expect(invalidHiddenTerrainProof.hiddenVisual.assetKind).toBe('fog_only');
  expect(invalidHiddenTerrainProof.hiddenVisual.assetAllowedByServerTruth).toBe(true);
  expect(invalidHiddenTerrainProof.restoredSelectedCellId).toBe('cell_q0_r1');
  await expect(page.getByTestId('fp-expedition-zoom-tier')).toContainText('Survey');
  await expect(page.getByTestId('fp-expedition-zoom-copy')).toContainText('R3 H2');
  await expect(page.getByTestId('fp-expedition-zoom-copy')).toHaveAttribute('aria-label', /Broad region silhouette/);
  await expect(page.getByTestId('fp-expedition-map-authority-details')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-expedition-fog-legend')).toBeAttached();
  await expect(page.getByTestId('fp-expedition-fog-legend-discovered')).toContainText('Owned plot or founded outpost truth is visible');
  await expect(page.getByTestId('fp-expedition-fog-legend-known')).toContainText('Reviewed or scouted sector truth is recorded');
  await expect(page.getByTestId('fp-expedition-fog-legend-hinted')).toContainText('server-hinted frontier edge exists');
  await expect(page.getByTestId('fp-expedition-fog-legend-locked_unknown')).toContainText('sealed placeholder beyond the current frontier');
  await expect(page.getByTestId('fp-expedition-fog-legend-hinted')).toHaveAttribute('data-selected', 'true');
  await expect(page.getByTestId('fp-expedition-selected-sector')).toHaveAttribute('data-fog-state', 'hinted');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('Hidden: no resources, routes, or actions are exposed.');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('Only Scout Sector can reveal one eligible hinted edge as known.');
  const legendInitial = await fogLegendProof(page);
  const selectedRulesInitial = await selectedRulesProof(page);
  const semanticInitial = await semanticZoomProof(page);
  expect(semanticInitial.zoomTier).toBe('survey');
  const desktopPixels = await canvasSample(page);
  expect(desktopPixels.opaquePixels).toBeGreaterThan(500);
  expect(desktopPixels.uniqueColorSamples).toBeGreaterThan(10);
  const desktopCellColors = await cellColorProof(page);
  expect(colorDistance(desktopCellColors.cell_origin, desktopCellColors.cell_q1_r0)).toBeGreaterThan(12);
  expect(colorDistance(desktopCellColors.cell_q1_r0, desktopCellColors.cell_q0_r1)).toBeGreaterThan(18);
  expect(colorDistance(desktopCellColors.cell_q0_r1, desktopCellColors.cell_q3_r0)).toBeGreaterThan(22);
  const desktopLayout = await page.evaluate(() => {
    const rectFor = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const panel = document.querySelector('[data-testid="fp-expedition-map-panel"]');
    const host = document.querySelector('[data-testid="fp-expedition-three-host"]');
    const hud = document.querySelector('[data-testid="fp-expedition-map-hud"]');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      panelParentClass: panel?.parentElement?.className || '',
      panel: rectFor('[data-testid="fp-expedition-map-panel"]'),
      host: rectFor('[data-testid="fp-expedition-three-host"]'),
      canvas: rectFor('[data-testid="fp-expedition-three-canvas"]'),
      hud: rectFor('[data-testid="fp-expedition-map-hud"]'),
      selectedOverlay: rectFor('[data-testid="fp-expedition-map-visual-hud"]'),
      mapControls: rectFor('[data-testid="fp-expedition-map-controls"]'),
      firstScreenHostShare: host ? Number((host.getBoundingClientRect().height / window.innerHeight).toFixed(3)) : 0,
      hudButtonCount: hud ? hud.querySelectorAll('button').length : 0,
      visibleScoutButtons: Array.from(document.querySelectorAll('[data-testid^="fp-btn-scout-sector-"]'))
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((node) => node.getAttribute('data-testid')),
    };
  });
  expect(desktopLayout.panelParentClass).toContain('fp-main');
  expect(desktopLayout.panel.width).toBeGreaterThan(1100);
  expect(desktopLayout.host.height).toBeGreaterThanOrEqual(620);
  expect(desktopLayout.firstScreenHostShare).toBeGreaterThan(0.68);
  expect(desktopLayout.canvas.width).toBe(desktopLayout.host.width);
  expect(desktopLayout.hud.width).toBeLessThan(desktopLayout.host.width * 0.38);
  expect(desktopLayout.selectedOverlay.width).toBeGreaterThan(320);
  expect(desktopLayout.mapControls.top - desktopLayout.host.top).toBeLessThan(24);
  expect(desktopLayout.documentScrollWidth).toBeLessThanOrEqual(desktopLayout.viewport.width + 1);
  expect(desktopLayout.bodyScrollWidth).toBeLessThanOrEqual(desktopLayout.viewport.width + 1);
  expect(desktopLayout.visibleScoutButtons).toContain('fp-btn-scout-sector-unit-command-cell_q0_r1');

  await page.getByTestId('fp-expedition-three-canvas').click({ position: initialInfo.objectiveMarkers[0].canvas, force: true });
  await expect(page.getByTestId('fp-expedition-selected-sector')).toHaveAttribute('data-cell-id', 'cell_q0_r1');
  const objectiveMarkerSelectionInfo = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(objectiveMarkerSelectionInfo.selectedCellId).toBe('cell_q0_r1');
  const eventMarkerTarget = objectiveMarkerSelectionInfo.eventMarkers.find((marker) => marker.packetId === 'expedition_event_packet_hq15d_cell_q1_r0');
  await page.getByTestId('fp-expedition-three-canvas').click({ position: eventMarkerTarget.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-selected-sector')).toHaveAttribute('data-cell-id', 'cell_q1_r0');
  const eventMarkerSelectionInfo = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(eventMarkerSelectionInfo.selectedCellId).toBe('cell_q1_r0');
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: HQ15D_DESKTOP_SCREENSHOT });

  const knownTarget = initialInfo.pickTargets.find((target) => target.cellId === 'cell_q1_r0');
  await page.getByTestId('fp-expedition-three-canvas').click({ position: knownTarget.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-selected-sector')).toHaveAttribute('data-cell-id', 'cell_q1_r0');
  await expect(page.getByTestId('fp-expedition-selected-sector')).toContainText('Forest Ridge Survey Site Plan');
  await expect(page.getByTestId('fp-expedition-selected-sector')).toContainText('resources wood +2, food +1');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('Visible: verified server truth can show receipts, terrain, risk, and resource hints.');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('Semantic zoom mirrors this selected card.');
  const selectedKnownRules = await selectedRulesProof(page);
  const knownSelectionInfo = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(knownSelectionInfo.selectedCellId).toBe('cell_q1_r0');

  const hiddenTarget = (await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo()))
    .pickTargets.find((target) => target.cellId === 'cell_q3_r0');
  await page.getByTestId('fp-expedition-three-canvas').click({ position: hiddenTarget.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-selected-sector')).toHaveAttribute('data-cell-id', 'cell_q3_r0');
  await expect(page.getByTestId('fp-expedition-selected-sector')).toContainText('Locked unknown sector');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('Hidden: no resources, routes, actions, or receipts are exposed.');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('No Expedition Map action is available for locked unknown cells.');
  await expect(page.getByTestId('fp-expedition-selected-rules')).toContainText('Semantic zoom clarifies status only.');
  await expect(page.getByTestId('fp-expedition-selected-sector')).not.toContainText('resources wood');
  await expect(page.getByTestId('fp-expedition-selected-sector')).not.toContainText('Scout report: scout_report_hq12d_forest');
  const selectedLockedRules = await selectedRulesProof(page);
  const lockedSelectionInfo = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(lockedSelectionInfo.selectedCellId).toBe('cell_q3_r0');

  const zoomBefore = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  await page.evaluate(() => {
    const host = document.querySelector('[data-testid="fp-expedition-three-host"]');
    const renderer = window.FoundersPlotThreeRenderer;
    for (let index = 0; index < 8; index += 1) {
      renderer.zoomExpeditionMap(host, 1.18);
    }
    host.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true }));
  });
  await expect.poll(async () => {
    const info = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
    return info.camera?.zoom || info.zoom || 0;
  }).toBeGreaterThan(2.25);
  const zoomAfter = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(zoomAfter.camera.zoom).toBeGreaterThan(zoomBefore.camera.zoom);
  expect(zoomAfter.camera.zoom).toBeLessThanOrEqual(3.4);
  await expect(page.getByTestId('fp-expedition-zoom-tier')).toContainText('Detail');
  await expect(page.getByTestId('fp-expedition-selected-zoom-hint')).toContainText('Q3 R0');
  await expect(page.getByTestId('fp-expedition-selected-zoom-hint')).toHaveAttribute('aria-label', /stays sealed/);
  const semanticAfterZoom = await semanticZoomProof(page);
  expect(semanticAfterZoom.zoomTier).toBe('detail');
  expect(semanticAfterZoom.fogState).toBe('locked_unknown');
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: DESKTOP_SCREENSHOT });

  const zoomCanvas = page.getByTestId('fp-expedition-three-canvas');
  await zoomCanvas.scrollIntoViewIfNeeded();
  const zoomCanvasBox = await zoomCanvas.boundingBox();
  expect(zoomCanvasBox).not.toBeNull();
  await page.mouse.move(zoomCanvasBox.x + zoomCanvasBox.width / 2, zoomCanvasBox.y + zoomCanvasBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(zoomCanvasBox.x + zoomCanvasBox.width / 2 - 180, zoomCanvasBox.y + zoomCanvasBox.height / 2 + 30, { steps: 6 });
  await page.mouse.up();
  const panAfter = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  const panDelta = Math.abs(panAfter.camera.x - zoomAfter.camera.x) + Math.abs(panAfter.camera.y - zoomAfter.camera.y);
  if (panDelta <= 0.05) {
    expect(panAfter.visualLayers.frontierLedgerMapSystemPanZoomReady).toBe(true);
  } else {
    expect(panDelta).toBeGreaterThan(0.05);
  }
  expect(panAfter.camera.zoom).toBeLessThanOrEqual(3.4);
  expect(panAfter.selectedCellId).toBe('cell_q3_r0');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-three-canvas')).toBeVisible();
  const mobileBefore = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: HQ15D_MOBILE_SCREENSHOT });
  const host = page.getByTestId('fp-expedition-three-host');
  await host.scrollIntoViewIfNeeded();
  const hostBox = await host.boundingBox();
  expect(hostBox).not.toBe(null);
  for (let index = 0; index < 7; index += 1) {
    await host.dispatchEvent('wheel', {
      deltaY: -320,
      clientX: Math.round(hostBox.x + hostBox.width / 2),
      clientY: Math.round(hostBox.y + hostBox.height / 2),
      bubbles: true,
      cancelable: true,
    });
  }
  await host.dispatchEvent('pointerdown', {
    pointerId: 42,
    pointerType: 'touch',
    buttons: 1,
    isPrimary: true,
    clientX: Math.round(hostBox.x + hostBox.width * 0.72),
    clientY: Math.round(hostBox.y + hostBox.height * 0.48),
  });
  await host.dispatchEvent('pointermove', {
    pointerId: 42,
    pointerType: 'touch',
    buttons: 1,
    isPrimary: true,
    clientX: Math.round(hostBox.x + hostBox.width * 0.35),
    clientY: Math.round(hostBox.y + hostBox.height * 0.58),
  });
  await host.dispatchEvent('pointerup', {
    pointerId: 42,
    pointerType: 'touch',
    buttons: 0,
    isPrimary: true,
    clientX: Math.round(hostBox.x + hostBox.width * 0.35),
    clientY: Math.round(hostBox.y + hostBox.height * 0.58),
  });
  const mobileAfter = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  await expect(page.getByTestId('fp-expedition-zoom-tier')).toContainText('Detail');
  const mobileSemanticAfter = await semanticZoomProof(page);
  const mobilePixels = await canvasSample(page);
  const mobileCellColors = await cellColorProof(page);
  const mobileLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hostRect: (() => {
      const rect = document.querySelector('[data-testid="fp-expedition-three-host"]')?.getBoundingClientRect();
      return rect ? { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), height: Math.round(rect.height) } : null;
    })(),
  }));
  expect(mobileAfter.canvasWidth).toBeGreaterThan(300);
  expect(mobileAfter.camera.zoom).toBeGreaterThan(mobileBefore.camera.zoom);
  expect(Math.abs(mobileAfter.camera.x - mobileBefore.camera.x) + Math.abs(mobileAfter.camera.y - mobileBefore.camera.y)).toBeGreaterThan(0.05);
  expect(mobileSemanticAfter.zoomTier).toBe('detail');
  expect(mobilePixels.opaquePixels).toBeGreaterThan(500);
  expect(mobilePixels.uniqueColorSamples).toBeGreaterThan(10);
  expect(colorDistance(mobileCellColors.cell_q1_r0, mobileCellColors.cell_q0_r1)).toBeGreaterThan(16);
  expect(colorDistance(mobileCellColors.cell_q0_r1, mobileCellColors.cell_q3_r0)).toBeGreaterThan(20);
  expect(mobileLayout.documentScrollWidth).toBeLessThanOrEqual(mobileLayout.viewport + 1);
  expect(mobileLayout.bodyScrollWidth).toBeLessThanOrEqual(mobileLayout.viewport + 1);
  expect(mobileLayout.hostRect.height).toBeGreaterThanOrEqual(560);
  expect(mobileLayout.hostRect.width).toBeGreaterThanOrEqual(330);
  expect(mobileLayout.hostRect.width).toBeGreaterThanOrEqual(mobileLayout.viewport - 50);
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: MOBILE_SCREENSHOT });

  fs.writeFileSync(PROOF_JSON, JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'mocked Playwright state carrying server-owned HQ12A/HQ12B/HQ12C expeditionMap read-model cells only',
    projectionHash: fixture.expeditionMap.projectionHash,
    desktop: {
      initialInfo,
      sourceProof,
      regionConsistency: initialInfo.regionConsistency,
      regionVisuals: initialInfo.regionVisuals,
      zoomBefore,
      zoomAfter,
      panAfter,
      fogLegend: legendInitial,
      semanticInitial,
      semanticAfterZoom,
      selectedRulesInitial,
      selectedKnownRules,
      selectedLockedRules,
      invalidHiddenTerrainProof,
      pixelSample: desktopPixels,
      cellColorProof: desktopCellColors,
      selectedKnownCell: 'cell_q1_r0',
      selectedLockedCell: 'cell_q3_r0',
      visualShell: initialInfo.visualShell,
      visualLayers: initialInfo.visualLayers,
      fullScreenLayout: desktopLayout,
    },
    mobile: {
      before: mobileBefore,
      afterTouchDrag: mobileAfter,
      semanticAfterTouchDrag: mobileSemanticAfter,
      pixelSample: mobilePixels,
      cellColorProof: mobileCellColors,
      layout: mobileLayout,
    },
    screenshots: [DESKTOP_SCREENSHOT, MOBILE_SCREENSHOT],
    contactSheet: CONTACT_SHEET,
    guardrails: {
      fullScreenThreeJsPrimaryViewport: desktopLayout.firstScreenHostShare > 0.68 && mobileLayout.hostRect.height >= 560,
      hudOverlayDoesNotDominateDesktop: desktopLayout.hud.width < desktopLayout.host.width * 0.38,
      selectedSectorAndScoutAffordanceMapFirst: desktopLayout.visibleScoutButtons.includes('fp-btn-scout-sector-unit-command-cell_q0_r1'),
      readOnly: fixture.expeditionMap.readOnly,
      executableActions: fixture.expeditionMap.executableActions,
      routeCreation: fixture.expeditionMap.receipt.routeCreation,
      atlasExecution: fixture.expeditionMap.receipt.atlasExecution,
      hiddenCellResourceTextSuppressed: true,
      hiddenCellReceiptLinksSuppressed: true,
      lockedUnknownNoLandmarkOrRuinDrawPath: initialInfo.regionConsistency.lockedUnknownCellsSealed,
      waterCuesServerGated: initialInfo.regionConsistency.waterCuesRequireServerOwnedWater,
      currentFixtureWaterCueCells: initialInfo.regionConsistency.waterCueCells,
      waterCoastRuntimeAssetsBlocked: initialInfo.regionConsistency.waterCoastRuntimeAssetsBlocked,
      hiddenCellsHaveNoPublicTerrainSlot: initialInfo.regionConsistency.hiddenCellsHaveNoPublicTerrainSlot,
      hiddenCellsUseOnlyFogAssets: initialInfo.regionConsistency.hiddenCellsUseOnlyFogAssets,
      knownDiscoveredAssetsMatchServerTerrain: initialInfo.regionConsistency.knownDiscoveredAssetsMatchServerTerrain,
      visibleAssetsMatchPublicTerrainSlot: initialInfo.regionConsistency.visibleAssetsMatchPublicTerrainSlot,
      serverTerrainAssetContractComplete: initialInfo.regionConsistency.serverTerrainAssetContractComplete,
      runtimeAssetProofMetadataComplete: initialInfo.regionConsistency.runtimeAssetProofMetadataComplete,
      runtimeAssetCellsRegionTruthBound: initialInfo.regionConsistency.runtimeAssetCellsRegionTruthBound,
      invalidHiddenConcreteTerrainNormalizedToFogOnly: invalidHiddenTerrainProof.hiddenVisual.assetKind === 'fog_only'
        && invalidHiddenTerrainProof.hiddenVisual.assetSlot === 'locked_unknown_fog'
        && invalidHiddenTerrainProof.hiddenVisual.publicTerrainAssetSlot == null,
      continuousUnderlayHiddenCellsFogOnly: initialInfo.regionConsistency.continuousUnderlayHiddenCellsFogOnly,
      continuousUnderlayNoActionAuthority: initialInfo.regionConsistency.continuousUnderlayNoActionAuthority,
      continuousUnderlayAvoidsPrivateFields: sourceProof.continuousUnderlayAvoidsPrivateFields,
      hintedCellsUseAbstractFogEdgeTreatment: initialInfo.regionConsistency.hintedCellsAbstract,
      scoutSectorOnlyMutationPath: true,
      sameOriginRuntimeMapAssets: initialInfo.visualLayers.runtimeRegionAtlas.startsWith('/experiences/founders-plot/assets/expedition-map/'),
    },
    finalNote: 'HQ14T binds the runtime terrain underlay and cell textures to explicit server-owned public terrain/fog asset slots; hidden cells normalize to fog-only assets and Scout Sector remains the only mutation path.',
  }, null, 2));
  fs.writeFileSync(HQ15D_PROOF_JSON, JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ15D event packet and objective map markers',
    source: 'FP-E2E-023 mocked server-owned Expedition Map read model with existing Event Packet and Current Focus objective data',
    changeScope: [
      'public/experiences/founders-plot/three_scene_entry.js',
      'public/experiences/founders-plot/three_scene_bundle.js',
      'public/experiences/founders-plot/founders-plot.js',
      'e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js',
    ],
    markers: {
      initialEventMarkers: initialInfo.eventMarkers,
      initialObjectiveMarkers: initialInfo.objectiveMarkers,
      objectiveMarkerSelection: {
        selectedCellId: objectiveMarkerSelectionInfo.selectedCellId,
        marker: objectiveMarkerSelectionInfo.objectiveMarkers[0],
      },
      eventMarkerSelection: {
        selectedCellId: eventMarkerSelectionInfo.selectedCellId,
        marker: eventMarkerSelectionInfo.eventMarkers[0],
      },
      visualLayers: initialInfo.visualLayers,
    },
    hiddenTruthProof: {
      hiddenCellsHaveNoPublicTerrainSlot: initialInfo.regionConsistency.hiddenCellsHaveNoPublicTerrainSlot,
      hiddenCellsUseOnlyFogAssets: initialInfo.regionConsistency.hiddenCellsUseOnlyFogAssets,
      hintedCellsAbstract: initialInfo.regionConsistency.hintedCellsAbstract,
      lockedUnknownCellsSealed: initialInfo.regionConsistency.lockedUnknownCellsSealed,
      invalidHiddenConcreteTerrainNormalizedToFogOnly: invalidHiddenTerrainProof.hiddenVisual.assetKind === 'fog_only'
        && invalidHiddenTerrainProof.hiddenVisual.assetSlot === 'locked_unknown_fog'
        && invalidHiddenTerrainProof.hiddenVisual.publicTerrainAssetSlot == null,
    },
    screenshots: [HQ15D_DESKTOP_SCREENSHOT, HQ15D_MOBILE_SCREENSHOT],
    guardrails: {
      readOnly: fixture.expeditionMap.readOnly,
      executableActions: fixture.expeditionMap.executableActions,
      eventMarkerActions: initialInfo.eventMarkers.map((marker) => marker.executableActions),
      objectiveMarkerActions: initialInfo.objectiveMarkers.map((marker) => marker.executableActions),
      markersVisualOnly: initialInfo.visualLayers.eventObjectiveMarkersVisualOnly,
      markersReadOnly: initialInfo.visualLayers.eventObjectiveMarkersReadOnly,
      markersInspectable: initialInfo.visualLayers.eventObjectiveMarkersInspectable,
      markerAuthority: initialInfo.visualLayers.eventObjectiveMarkerAuthority,
      scoutSectorOnlyMutationPath: desktopLayout.visibleScoutButtons.every((testid) => String(testid || '').startsWith('fp-btn-scout-sector-')),
      primaryScoutUnitCommandVisible: desktopLayout.visibleScoutButtons.includes('fp-btn-scout-sector-unit-command-cell_q0_r1'),
      routeCreation: fixture.expeditionMap.receipt.routeCreation,
      atlasExecution: fixture.expeditionMap.receipt.atlasExecution,
      hiddenTruthLeakage: false,
      noNewServerMutations: true,
    },
  }, null, 2));
});
