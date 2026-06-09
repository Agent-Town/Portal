const { test, expect } = require('@playwright/test');
const fs = require('fs');

const frontierLedgerSystem = 'hq18a_frontier_ledger_map_system_v1';
const frontierLedgerPresentation = 'hq18b_frontier_ledger_visual_parity_pass_v1';
const frontierLedgerSourceChrome = 'hq18d_frontier_ledger_outer_source_chrome_cutout_v1';
const screenshotPath = 'reports/agent-town-frontier-ledger-map-system-scalability-desktop-2026-06-05.png';
const proofPath = 'reports/agent-town-frontier-ledger-map-system-scalability-proof-2026-06-05.json';
const requiredNorthStarHudAtlasSlots = [
  'frontier-ledger-top-tabs-shadow',
  'frontier-ledger-right-tab-shadow',
  'frontier-ledger-bottom-medallion-rail',
  'frontier-ledger-parcel-rangefinder-backplate',
];

function terrainFor(q, r, fogState) {
  if (!['discovered', 'known'].includes(fogState)) return null;
  if (q === 0 && r === 0) return 'settled';
  if ((Math.abs(q) + Math.abs(r)) % 3 === 0) return 'ridge';
  if ((q + r + 12) % 3 === 1) return 'forest';
  return 'field';
}

function syntheticLargeFrontierLedgerModel() {
  const cells = [];
  const radius = 3;
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      const cellId = `cell_q${q}_r${r}`;
      const isOrigin = q === 0 && r === 0;
      const isScoutTarget = q === 1 && r === 0;
      const isMoveTarget = q === 0 && r === 1;
      const fogState = isOrigin || distance <= 1
        ? 'discovered'
        : distance === 2 || isScoutTarget || isMoveTarget
          ? 'known'
          : distance === 3
            ? 'hinted'
            : 'locked_unknown';
      const terrain = terrainFor(q, r, fogState);
      const hidden = !['discovered', 'known'].includes(fogState);
      cells.push({
        cellId,
        q,
        r,
        fogState,
        kind: isOrigin
          ? 'origin_plot'
          : hidden
            ? 'frontier_hint'
            : 'frontier_sector',
        title: isOrigin ? 'Founders Plot' : `Frontier ${q}, ${r}`,
        status: isOrigin ? 'OWNED_HOME' : hidden ? 'HINTED_BY_KNOWN_FRONTIER' : 'SCOUTED_SECTOR',
        siteType: isOrigin ? 'home_plot' : hidden ? 'unresolved_frontier' : terrain,
        risk: hidden ? 'unknown' : 'low',
        summary: hidden ? '' : 'Synthetic public read-model sector for scalability proof.',
        readOnly: true,
        receipts: hidden ? [] : [{ kind: 'synthetic_public_frontier_cell', readOnly: true }],
        publicTerrainAssetSlot: terrain,
        publicTerrainAssetSlotSource: terrain ? 'server_read_model_v1' : null,
        publicTerrainAssetSlotReason: terrain ? 'synthetic public terrain exposed by server read model' : 'hidden cell exposes only fog slots',
        fogAssetSlot: hidden ? 'hinted_frontier_fog' : null,
        terrainAssetContractVersion: 'agenttown_public_terrain_asset_slots_v1',
      });
    }
  }

  return {
    status: 'FOG_READ_MODEL_READY',
    title: 'Synthetic Frontier Ledger System',
    implementation: 'frontier_ledger_large_map_scalability_fixture_v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_expedition_map_fog_of_war_projection_v1',
    projectionHash: 'synthetic_frontier_ledger_large_map_q3_v1',
    cells,
    objective: {
      mode: 'scout',
      targetCellId: 'cell_q3_r0',
    },
    generatedHudChrome: {
      packId: 'hq17c-generated-hud-chrome-v1',
    },
    units: {
      readOnly: true,
      selectable: true,
      mapTokens: true,
      commandBarReady: true,
      items: [{
        unitId: 'expedition_unit_scalable_scout',
        kind: 'expedition_map_unit',
        unitType: 'scout',
        displayName: 'Mira Trailmark',
        state: 'AT_ORIGIN',
        readOnly: true,
        selectable: true,
        executableActions: [],
        location: { cellId: 'cell_q0_r0', q: 0, r: 0, fogState: 'discovered' },
        movement: {
          canMove: true,
          movementMutationImplemented: true,
          allowedTargetCellIds: ['cell_q0_r1', 'cell_q1_r0'],
          authority: 'server_owned_scout_unit_move_receipt_v1',
          allowedFogStates: ['discovered', 'known'],
          revealsFog: false,
          routeCreation: false,
          resourceDelta: {},
        },
        commandHints: [{
          commandId: 'scout_sector',
          label: 'Scout Sector',
          actionName: 'et.plot.scout_sector',
          enabled: true,
          targetCellIds: ['cell_q3_r0', 'cell_q2_r1'],
          serverMutationImplemented: true,
          requiresHumanApprovalForAgent: true,
        }, {
          commandId: 'move_unit',
          label: 'Move',
          actionName: 'et.plot.move_expedition_unit',
          enabled: true,
          targetCellIds: ['cell_q0_r1', 'cell_q1_r0'],
          serverMutationImplemented: true,
          requiresHumanApprovalForAgent: true,
        }],
        boundaryFlags: {
          movementMutation: true,
          movementRevealsFog: false,
          autonomousMovement: false,
          routeCreation: false,
          combat: false,
          atlasExecution: false,
          externalEffects: false,
        },
      }, {
        unitId: 'expedition_unit_scalable_courier',
        kind: 'expedition_map_unit',
        unitType: 'courier',
        displayName: 'Rook Signalpost',
        state: 'READ_ONLY_MARKER',
        readOnly: true,
        selectable: true,
        executableActions: [],
        location: { cellId: 'cell_q-1_r1', q: -1, r: 1, fogState: 'discovered' },
        movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
        commandHints: [],
      }, {
        unitId: 'expedition_unit_scalable_surveyor',
        kind: 'expedition_map_unit',
        unitType: 'surveyor',
        displayName: 'Ira Surveyline',
        state: 'READ_ONLY_MARKER',
        readOnly: true,
        selectable: true,
        executableActions: [],
        location: { cellId: 'cell_q1_r-1', q: 1, r: -1, fogState: 'discovered' },
        movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
        commandHints: [],
      }],
    },
  };
}

function assertSystemLayers(info) {
  const layers = info.visualLayers || {};
  expect(info.cellCount).toBeGreaterThanOrEqual(37);
  expect(info.units.length).toBeGreaterThanOrEqual(3);
  expect(info.commandTargets.length).toBeGreaterThanOrEqual(3);
  expect(layers.frontierLedgerMapSystem).toBe(true);
  expect(layers.frontierLedgerMapSystemVersion).toBe(frontierLedgerSystem);
  expect(layers.frontierLedgerVisualParityPass).toBe(true);
  expect(layers.frontierLedgerVisualParityVersion).toBe(frontierLedgerPresentation);
  expect(layers.frontierLedgerVisualParityBaseMap).toBe('warm_parchment_cartographic_map');
  expect(layers.frontierLedgerVisualParityNorthStarHudAtlas).toBe(true);
  expect(layers.frontierLedgerVisualParityNorthStarHudAtlasPackId).toBe('frontier-ledger-north-star-hud-v1');
  expect(layers.frontierLedgerVisualParityNorthStarChromeMode).toBe('source_cutout_static_viewport_chrome_dynamic_map');
  expect(layers.frontierLedgerVisualParityNorthStarHudAtlasSlots).toEqual(expect.arrayContaining(requiredNorthStarHudAtlasSlots));
  expect(layers.frontierLedgerVisualParityNorthStarHudAtlasLoaded).toBe(true);
  expect(layers.frontierLedgerVisualParityNorthStarHudAtlasFallback).toBe(false);
  expect(layers.frontierLedgerVisualParitySourceChromeCompositionVersion).toBe(frontierLedgerSourceChrome);
  expect(layers.frontierLedgerVisualParitySourceChromeResponsiveAspectPass).toBe(true);
  expect(layers.frontierLedgerVisualParitySourceChromeUnitDockMode).toBe('dynamic_unit_portraits_projected_into_north_star_bottom_rail');
  expect(layers.frontierLedgerVisualParitySourceChromeLegacyUnitDockSuppressed).toBe(true);
  expect(layers.frontierLedgerVisualParitySourceChromeLegacyUnitTextSuppressed).toBe(true);
  expect(layers.generatedHudProfileSourceChromeCompositionVersion).toBe(frontierLedgerSourceChrome);
  expect(layers.generatedHudProfileSource).toBe('north_star_source_rail_portrait_insert');
  expect(layers.generatedHudProfileSourceRailProjection).toBe(true);
  expect(layers.generatedHudProfileSourceRailProjectedCount).toBe(layers.generatedHudProfileMaskSpriteCount);
  expect(layers.generatedHudProfileSourceRailProjectedSlotIndexes).toEqual(expect.arrayContaining([0, 1, 2]));
  expect(info.generatedHudProfileSprites.every((sprite) => (
    sprite.profileSource === 'north_star_source_rail_portrait_insert'
    && sprite.sourceChromeCompositionVersion === frontierLedgerSourceChrome
    && sprite.sourceChromeDockSlotMode === 'north_star_bottom_rail_aperture'
  ))).toBe(true);
  expect(layers.frontierLedgerVisualParityTileLegibilityPass).toBe(true);
  expect(layers.frontierLedgerVisualParityUnderlayOpacity).toBe(0.44);
  expect(layers.frontierLedgerVisualParityMapDepthVeilOpacity).toBe(0.10);
  expect(layers.frontierLedgerVisualParityBottomBridgeOpacity).toBe(0.12);
  expect(layers.frontierLedgerVisualParityBottomBridgeDemotedBySourceChrome).toBe(true);
  expect(layers.frontierLedgerVisualParitySelectedAuraOpacity).toBe(0.64);
  expect(layers.frontierLedgerVisualParityBoardFrameOpacity).toBe(0.28);
  expect(layers.frontierLedgerVisualParityBoardFrameOuterChromeCutout).toBe(true);
  expect(layers.frontierLedgerVisualParityBoardFrameCenterWash).toBe('transparent_center_outer_hud_cutout');
  expect(layers.frontierLedgerVisualParityTargetOverlayMode).toBe('ring_first_tile_legible');
  expect(layers.frontierLedgerVisualParityCommandTargetInteriorFillAlpha).toBe(0);
  expect(layers.frontierLedgerVisualParityGenericCellMarkerMode).toBe('hidden_until_hover_or_selection');
  expect(layers.frontierLedgerVisualParityPublicCellMarkerMode).toBe('normal_map_and_site_hidden_until_hover_or_selection');
  expect(layers.frontierLedgerVisualParityPublicBorderTone).toBe('sepia_non_selected_teal_reserved_for_active');
  expect(layers.frontierLedgerVisualParityLegacyChromeSuppression).toBe(true);
  expect(layers.frontierLedgerVisualParitySuppressedChromeSlots).toEqual(expect.arrayContaining([
    'unit-dock',
    'command-tray',
    'command-puck',
    'selected-context',
  ]));
  expect(layers.frontierLedgerVisualParityLegacyChromeConflict).toBe(false);
  expect(layers.frontierLedgerVisualParityLegacyContentConflict).toBe(false);
  expect(layers.frontierLedgerVisualParityRetainsLegacyTelemetry).toBe(true);
  expect(layers.frontierLedgerMapSystemNotOneScreen).toBe(true);
  expect(layers.frontierLedgerMapSystemScalableWorld).toBe(true);
  expect(layers.frontierLedgerMapSystemLargeMapCellCount).toBeGreaterThanOrEqual(37);
  expect(layers.frontierLedgerMapSystemHudLayer).toBe(true);
  expect(layers.frontierLedgerMapSystemWorldLayer).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeLayer).toBe(true);
  expect(layers.frontierLedgerMapSystemPanZoomReady).toBe(true);
  expect(layers.frontierLedgerMapSystemSelectionReady).toBe(true);
  expect(layers.frontierLedgerMapSystemUnitReady).toBe(true);
  expect(layers.frontierLedgerMapSystemActionTargetReady).toBe(true);
  expect(layers.frontierLedgerMapSystemCoreHudSlotsComplete).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeTargetCallout).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeRouteArc).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeTrailPips).toBeGreaterThanOrEqual(4);
  expect(layers.frontierLedgerMapSystemSlotManifestSlots).toEqual(expect.arrayContaining([
    'frontier-ledger-board-frame',
    'frontier-ledger-bottom-medallion-rail',
    'frontier-ledger-parcel-rangefinder-backplate',
    'frontier-ledger-dotted-target-trail',
    'frontier-ledger-route-arc',
    'frontier-ledger-target-callout',
    'frontier-ledger-selected-ring',
    'frontier-ledger-unit-token',
  ]));
  expect(layers.frontierLedgerMapSystemRenderedBridgeSlots).toEqual(expect.arrayContaining([
    'frontier-ledger-dotted-target-trail',
    'frontier-ledger-route-arc',
    'frontier-ledger-target-callout',
  ]));
  expect(layers.frontierLedgerMapSystemVisualOnly).toBe(true);
  expect(layers.frontierLedgerMapSystemReadOnly).toBe(true);
  expect(layers.frontierLedgerMapSystemAuthority).toBe(false);
  expect(layers.frontierLedgerMapSystemHiddenTruthLeakage).toBe(false);
  expect(layers.commandTargetRingsRingFirstOverlay).toBe(true);
  expect(layers.commandTargetRingsTileLegibleOverlay).toBe(true);
  expect(layers.commandTargetRingInteriorFillAlpha).toBe(0);
  expect(layers.rendererNetworkRequests).toBe(0);
  expect(layers.rendererMutationHandlers).toEqual([]);
  expect(layers.clientAuthority).toBe(false);
  expect(info.frontierLedgerSystemLines.every((line) => (
    line.systemVersion === frontierLedgerSystem
    && line.systemLayer === 'bridge'
    && line.systemAnchor === 'world'
    && line.systemSource === 'server_owned_command_target'
    && line.previewOnly === true
    && line.visualOnly === true
    && line.readOnly === true
    && line.routeAuthority === false
    && line.actionAuthority === false
    && line.executableActions === 0
    && line.hiddenTruthLeakage === false
  ))).toBe(true);
}

async function waitForNorthStarHudAtlas(page) {
  await expect.poll(async () => page.evaluate((requiredSlots) => {
    const host = document.querySelector('[data-testid="frontier-ledger-system-testbed"]');
    const info = window.FoundersPlotThreeRenderer?.getExpeditionMapInfo?.(host) || {};
    const layers = info.visualLayers || {};
    const slots = Array.isArray(layers.frontierLedgerVisualParityNorthStarHudAtlasSlots)
      ? layers.frontierLedgerVisualParityNorthStarHudAtlasSlots
      : [];
    return layers.frontierLedgerVisualParityNorthStarHudAtlasLoaded === true
      && layers.frontierLedgerVisualParityNorthStarHudAtlasFallback === false
      && requiredSlots.every((slot) => slots.includes(slot));
  }, requiredNorthStarHudAtlasSlots), { timeout: 12_000 }).toBe(true);
}

test('FP-E2E-022H19 Frontier Ledger map system scales beyond one screen and stays playable', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  await page.waitForFunction(() => !!window.FoundersPlotThreeRenderer?.renderExpeditionMap);

  const model = syntheticLargeFrontierLedgerModel();
  let initialInfo = await page.evaluate((fixture) => {
    const host = document.createElement('div');
    host.dataset.testid = 'frontier-ledger-system-testbed';
    host.style.position = 'fixed';
    host.style.left = '24px';
    host.style.top = '24px';
    host.style.width = '1280px';
    host.style.height = '720px';
    host.style.zIndex = '10000';
    host.style.background = '#120b06';
    host.style.overflow = 'hidden';
    document.body.appendChild(host);
    return window.FoundersPlotThreeRenderer.renderExpeditionMap(host, fixture, {
      selectedCellId: 'cell_q0_r0',
      selectedUnitId: 'expedition_unit_scalable_scout',
    });
  }, model);
  await waitForNorthStarHudAtlas(page);
  initialInfo = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="frontier-ledger-system-testbed"]');
    return window.FoundersPlotThreeRenderer.getExpeditionMapInfo(host);
  });
  assertSystemLayers(initialInfo);
  expect(initialInfo.selectedCellId).toBe('cell_q0_r0');

  const zoomInfo = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="frontier-ledger-system-testbed"]');
    return window.FoundersPlotThreeRenderer.zoomExpeditionMap(host, 1.42);
  });
  assertSystemLayers(zoomInfo);
  expect(zoomInfo.camera.zoom).toBeGreaterThan(initialInfo.camera.zoom);

  const hostBox = await page.getByTestId('frontier-ledger-system-testbed').boundingBox();
  expect(hostBox).toBeTruthy();
  await page.mouse.move(hostBox.x + hostBox.width / 2, hostBox.y + hostBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(hostBox.x + hostBox.width / 2 - 190, hostBox.y + hostBox.height / 2 + 70, { steps: 8 });
  await page.mouse.up();
  const panInfo = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="frontier-ledger-system-testbed"]');
    return window.FoundersPlotThreeRenderer.getExpeditionMapInfo(host);
  });
  assertSystemLayers(panInfo);
  expect(Math.abs(panInfo.camera.x - zoomInfo.camera.x) + Math.abs(panInfo.camera.y - zoomInfo.camera.y)).toBeGreaterThan(0.05);

  const scoutTarget = panInfo.commandTargets.find((target) => target.commandId === 'scout_sector');
  expect(scoutTarget?.canvas).toBeTruthy();
  await page.mouse.click(hostBox.x + scoutTarget.canvas.x, hostBox.y + scoutTarget.canvas.y);
  const targetPreviewInfo = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="frontier-ledger-system-testbed"]');
    return window.FoundersPlotThreeRenderer.getExpeditionMapInfo(host);
  });
  assertSystemLayers(targetPreviewInfo);
  expect(targetPreviewInfo.selectedCellId).toBe(scoutTarget.cellId);
  expect(targetPreviewInfo.hoverCellId).toBe(scoutTarget.cellId);

  await page.getByTestId('frontier-ledger-system-testbed').screenshot({ path: screenshotPath });
  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'Frontier Ledger reusable map system scalability proof',
    frontierLedgerSystem,
    frontierLedgerPresentation,
    frontierLedgerSourceChrome,
    screenshotPath,
    cellCount: targetPreviewInfo.cellCount,
    unitCount: targetPreviewInfo.units.length,
    commandTargetCount: targetPreviewInfo.commandTargets.length,
    initial: initialInfo,
    zoom: zoomInfo,
    pan: panInfo,
    targetPreview: targetPreviewInfo,
    guardrails: {
      largeMapCellCount: targetPreviewInfo.cellCount >= 37,
      visualParityPass: targetPreviewInfo.visualLayers.frontierLedgerVisualParityPass === true
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityVersion === frontierLedgerPresentation,
      northStarHudAtlasPass: targetPreviewInfo.visualLayers.frontierLedgerVisualParityNorthStarHudAtlas === true
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasPackId === 'frontier-ledger-north-star-hud-v1'
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasLoaded === true
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasFallback === false
        && requiredNorthStarHudAtlasSlots.every((slot) => targetPreviewInfo.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasSlots.includes(slot)),
      sourceChromeCompositionPass: targetPreviewInfo.visualLayers.frontierLedgerVisualParitySourceChromeCompositionVersion === frontierLedgerSourceChrome
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParitySourceChromeLegacyUnitDockSuppressed === true
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParitySourceChromeLegacyUnitTextSuppressed === true
        && targetPreviewInfo.visualLayers.generatedHudProfileSourceRailProjection === true,
      tileLegibilityPass: targetPreviewInfo.visualLayers.frontierLedgerVisualParityTileLegibilityPass === true
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityMapDepthVeilOpacity === 0.10
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParitySelectedAuraOpacity === 0.64
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityTargetOverlayMode === 'ring_first_tile_legible'
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityCommandTargetInteriorFillAlpha === 0
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityGenericCellMarkerMode === 'hidden_until_hover_or_selection'
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityPublicCellMarkerMode === 'normal_map_and_site_hidden_until_hover_or_selection'
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityPublicBorderTone === 'sepia_non_selected_teal_reserved_for_active',
      legacyChromeConflictSuppressed: targetPreviewInfo.visualLayers.frontierLedgerVisualParityLegacyChromeConflict === false
        && targetPreviewInfo.visualLayers.frontierLedgerVisualParityLegacyContentConflict === false,
      viewportHudLayer: targetPreviewInfo.visualLayers.frontierLedgerMapSystemHudLayer === true,
      scalableWorldLayer: targetPreviewInfo.visualLayers.frontierLedgerMapSystemWorldLayer === true,
      worldToHudBridgeLayer: targetPreviewInfo.visualLayers.frontierLedgerMapSystemBridgeLayer === true,
      commandPreviewPlayable: targetPreviewInfo.selectedCellId === scoutTarget.cellId,
      zoomChanged: zoomInfo.camera.zoom > initialInfo.camera.zoom,
      panChanged: Math.abs(panInfo.camera.x - zoomInfo.camera.x) + Math.abs(panInfo.camera.y - zoomInfo.camera.y) > 0.05,
      noRendererNetworkRequests: targetPreviewInfo.visualLayers.rendererNetworkRequests === 0,
      noRendererMutationHandlers: targetPreviewInfo.visualLayers.rendererMutationHandlers.length === 0,
      noAuthorityExpansion: targetPreviewInfo.visualLayers.frontierLedgerMapSystemAuthority === false
        && targetPreviewInfo.visualLayers.clientAuthority === false,
      noHiddenTruthLeakage: targetPreviewInfo.visualLayers.frontierLedgerMapSystemHiddenTruthLeakage === false,
    },
  };
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
});
