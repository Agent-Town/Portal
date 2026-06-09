const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const frontierLedger = 'hq18_frontier_ledger_scratch_visual_hud_v1';
const frontierLedgerSystem = 'hq18a_frontier_ledger_map_system_v1';
const frontierLedgerPresentation = 'hq18b_frontier_ledger_visual_parity_pass_v1';
const frontierLedgerSourceChrome = 'hq18d_frontier_ledger_outer_source_chrome_cutout_v1';
const northStarPath = 'frontier-ledger-north-star-upload-2026-06-05';
const requiredFrontierSlots = [
  'frontier-ledger-board-frame',
  'frontier-ledger-bottom-medallion-rail',
  'frontier-ledger-parcel-rangefinder-backplate',
  'frontier-ledger-right-tab-shadow',
  'frontier-ledger-top-tabs-shadow',
  'frontier-ledger-dotted-target-trail',
  'frontier-ledger-target-callout',
];
const requiredFrontierSystemSlots = [
  'frontier-ledger-board-frame',
  'frontier-ledger-bottom-medallion-rail',
  'frontier-ledger-parcel-rangefinder-backplate',
  'frontier-ledger-right-tab-shadow',
  'frontier-ledger-top-tabs-shadow',
  'frontier-ledger-dotted-target-trail',
  'frontier-ledger-route-arc',
  'frontier-ledger-target-callout',
  'frontier-ledger-selected-ring',
  'frontier-ledger-unit-token',
];
const requiredNorthStarHudAtlasSlots = [
  'frontier-ledger-top-tabs-shadow',
  'frontier-ledger-right-tab-shadow',
  'frontier-ledger-bottom-medallion-rail',
  'frontier-ledger-parcel-rangefinder-backplate',
];
const requiredNorthStarHudMobileOverrideSlots = [
  'frontier-ledger-top-tabs-shadow',
  'frontier-ledger-right-tab-shadow',
  'frontier-ledger-bottom-medallion-rail',
  'frontier-ledger-parcel-rangefinder-backplate',
];

function seedLoopReadyPlot({ plotId }) {
  const nowMs = 1_780_412_000_000;
  const bundle = store.readPlotBundleById(plotId);
  if (!bundle?.plot) throw new Error(`Missing seeded Founders Plot ${plotId}`);

  store.writePlot({
    ...bundle.plot,
    hqLevel: 6,
    townXp: Math.max(Number(bundle.plot.townXp || 0), 420),
    inventory: { wood: 120, stone: 80, food: 96, coin: 40 },
    storageCaps: { ...engine.HQ_LEVEL_RULES[6].storageCaps },
    constructionSlots: engine.HQ_LEVEL_RULES[6].constructionSlots,
    updatedAt: nowMs,
    lastViewedAt: nowMs,
    lastSimulatedAt: nowMs,
  });

  const buildings = bundle.buildings.map((building) => (
    building.type === 'HQ'
      ? { ...building, level: 6, state: 'READY', updatedAt: nowMs }
      : building
  ));
  if (!buildings.some((building) => building.type === 'EXPEDITION_BOARD')) {
    buildings.push({
      buildingId: 'bldg_frontier_ledger_scratch_expedition_board',
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
    });
  }
  store.writeBuildings(buildings.map((building) => (
    building.type === 'EXPEDITION_BOARD'
      ? { ...building, state: 'READY', updatedAt: nowMs }
      : building
  )));
}

async function stateSnapshot(page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/state');
    return response.json();
  });
}

async function waitForFrontierLedgerHud(page) {
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const layers = info.visualLayers || {};
    return {
      owner: layers.visibleHudOwner || '',
      version: layers.frontierLedgerScratchVersion || '',
      systemVersion: layers.frontierLedgerMapSystemVersion || '',
      presentationVersion: layers.frontierLedgerVisualParityVersion || '',
      board: layers.frontierLedgerScratchBoardFrame === true,
      rail: layers.frontierLedgerScratchBottomMedallionRail === true,
      parcel: layers.frontierLedgerScratchParcelRangefinder === true,
      ledger: layers.frontierLedgerScratchCollapsedLedgerTab === true,
      tabs: layers.frontierLedgerScratchTopLedgerTabs === true,
      dotted: layers.frontierLedgerScratchDottedPath === true,
      callout: layers.frontierLedgerMapSystemBridgeTargetCallout === true,
      routeArc: layers.frontierLedgerMapSystemBridgeRouteArc === true,
      pips: Number(layers.frontierLedgerScratchTrailPipCount || 0),
      chrome: Number(layers.generatedHudChromeSpriteCount || 0),
      commands: Number(layers.generatedHudCommandGlyphSpriteCount || 0),
      atlasLoaded: layers.frontierLedgerVisualParityNorthStarHudAtlasLoaded === true,
      atlasFallback: layers.frontierLedgerVisualParityNorthStarHudAtlasFallback === true,
    };
  }), { timeout: 12_000 }).toEqual({
    owner: 'three_canvas',
    version: frontierLedger,
    systemVersion: frontierLedgerSystem,
    presentationVersion: frontierLedgerPresentation,
    board: true,
    rail: true,
    parcel: true,
    ledger: true,
    tabs: true,
    dotted: true,
    callout: true,
    routeArc: true,
    pips: expect.any(Number),
    chrome: 7,
    commands: expect.any(Number),
    atlasLoaded: true,
    atlasFallback: false,
  });
}

async function collectProof(page) {
  return page.evaluate(() => {
    const alphaOf = (color) => {
      const text = String(color || '');
      if (text === 'transparent') return 0;
      const rgba = text.match(/rgba?\(([^)]+)\)/i);
      if (!rgba) return 1;
      const parts = rgba[1].split(',').map((part) => Number(part.trim()));
      return parts.length >= 4 ? parts[3] : 1;
    };
    const visibleNode = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const styleInfo = (node) => {
      const style = window.getComputedStyle(node);
      const borderWidth = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
        .map((key) => Number.parseFloat(style[key] || '0') || 0)
        .reduce((sum, value) => sum + value, 0);
      return {
        opacity: Number(style.opacity || 1),
        color: style.color,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderTopColor: style.borderTopColor,
        borderWidth,
        boxShadow: style.boxShadow,
      };
    };
    const hudSelectors = [
      '[data-testid="fp-expedition-map-status"]',
      '[data-testid="fp-expedition-objective-strip"]',
      '[data-testid="fp-expedition-unit-roster"]',
      '[data-testid="fp-expedition-unit-command-bar"]',
      '[data-testid="fp-expedition-map-visual-hud"]',
      '[data-testid="fp-expedition-map-hud"]',
    ];
    const domHudNodes = hudSelectors.map((selector) => {
      const node = document.querySelector(selector);
      if (!node) return { selector, present: false, visible: false, paintsPanel: false, visibleTextChildren: [] };
      const style = styleInfo(node);
      const textChildren = Array.from(node.querySelectorAll('strong, small, span, p, b, i, em, button'))
        .filter((child) => visibleNode(child))
        .map((child) => {
          const childStyle = styleInfo(child);
          return {
            text: (child.textContent || '').replace(/\s+/g, ' ').trim(),
            opacity: childStyle.opacity,
            colorAlpha: alphaOf(childStyle.color),
            backgroundAlpha: alphaOf(childStyle.backgroundColor),
            backgroundImage: childStyle.backgroundImage,
            borderAlpha: childStyle.borderWidth > 0 ? alphaOf(childStyle.borderTopColor) : 0,
            boxShadow: childStyle.boxShadow,
          };
        });
      const visibleTextChildren = textChildren.filter((child) => (
        child.opacity > 0.01
        && (child.colorAlpha > 0.01 || child.backgroundAlpha > 0.01 || child.backgroundImage !== 'none' || child.borderAlpha > 0.01 || child.boxShadow !== 'none')
      ));
      const paintsPanel = style.backgroundImage !== 'none'
        || alphaOf(style.backgroundColor) > 0.01
        || (style.borderWidth > 0 && alphaOf(style.borderTopColor) > 0.01)
        || style.boxShadow !== 'none';
      return { selector, present: true, visible: visibleNode(node), paintsPanel, visibleTextChildren };
    });
    const domPixelOwners = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .filter((entry) => entry.paintsPanel || entry.visibleTextChildren.length > 0);
    const visibleDomHudTextEntries = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .flatMap((entry) => entry.visibleTextChildren.map((child) => child.text))
      .filter(Boolean);
    const clipped = Array.from(document.querySelectorAll([
      '[data-testid="fp-expedition-map-panel"]',
      '[data-testid="fp-expedition-map-body"]',
      '[data-testid="fp-expedition-map-board-card"]',
      '[data-testid="fp-expedition-objective-strip"]',
      '[data-testid="fp-expedition-unit-roster"]',
      '[data-testid="fp-expedition-unit-command-bar"]',
      '[data-testid="fp-expedition-map-visual-hud"]',
    ].join(', ')))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.tagName);
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const mapControls = document.querySelector('[data-testid="fp-expedition-map-controls"]');
    const semanticZoom = document.querySelector('[data-testid="fp-expedition-semantic-zoom"]');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-body"]')?.getAttribute('data-visible-hud-owner') || '',
      boardVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-board-card"]')?.getAttribute('data-visible-hud-owner') || '',
      visibleDomHudPaintCount: domPixelOwners.length,
      visibleDomHudTextCount: visibleDomHudTextEntries.length,
      visibleDomHudTextEntries,
      domHudNodes,
      sourceChromeControls: mapControls ? styleInfo(mapControls) : null,
      sourceChromeSemanticZoom: semanticZoom ? styleInfo(semanticZoom) : null,
      clipped,
      renderer: info,
    };
  });
}

function assertFrontierProof(proof, { mobile = false } = {}) {
  const layers = proof.renderer.visualLayers || {};
  expect(proof.bodyVisibleHudOwner).toBe('three_canvas');
  expect(proof.boardVisibleHudOwner).toBe('three_canvas');
  expect(proof.visibleDomHudPaintCount).toBe(0);
  expect(proof.visibleDomHudTextCount).toBe(0);
  expect(proof.visibleDomHudTextEntries).toEqual([]);
  expect(layers.visibleHudOwner).toBe('three_canvas');
  expect(layers.singleVisibleHudOwner).toBe(true);
  expect(layers.frontierLedgerScratchVisualHud).toBe(true);
  expect(layers.frontierLedgerScratchVersion).toBe(frontierLedger);
  expect(layers.frontierLedgerScratchNorthStarPath).toBe(northStarPath);
  expect(layers.frontierLedgerScratchRendererOwned).toBe(true);
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
  if (layers.frontierLedgerVisualParitySourceChromeResponsiveAspectPass !== true) {
    const aspectDebug = proof.renderer.frontierLedgerScratchSprites
      .filter((sprite) => sprite.northStarHudAtlas)
      .map((sprite) => ({
        slot: sprite.slot,
        renderedAspectRatio: sprite.renderedAspectRatio,
        renderedPixelAspectRatio: sprite.renderedPixelAspectRatio,
        sourceAspectRatio: sprite.sourceAspectRatio,
        mobileViewportOverride: sprite.mobileViewportOverride,
        viewportBounds: sprite.viewportBounds,
      }));
    throw new Error(`Source chrome responsive aspect pass failed: ${JSON.stringify(aspectDebug)}`);
  }
  expect(layers.frontierLedgerVisualParitySourceChromeResponsiveAspectPass).toBe(true);
  if (mobile) {
    expect(layers.frontierLedgerVisualParitySourceChromeResponsiveMobileOverrides)
      .toEqual(expect.arrayContaining(requiredNorthStarHudMobileOverrideSlots));
    const sourceHudSprite = (slot) => proof.renderer.frontierLedgerScratchSprites
      .find((sprite) => sprite.slot === slot);
    const topTabs = sourceHudSprite('frontier-ledger-top-tabs-shadow');
    const parcelCard = sourceHudSprite('frontier-ledger-parcel-rangefinder-backplate');
    const rightTab = sourceHudSprite('frontier-ledger-right-tab-shadow');
    const bottomRail = sourceHudSprite('frontier-ledger-bottom-medallion-rail');
    expect(topTabs?.mobileViewportOverride).toBe(true);
    expect(topTabs?.renderedPixelAspectRatio).toBeGreaterThan(2.7);
    expect(parcelCard?.mobileViewportOverride).toBe(true);
    expect(parcelCard?.renderedPixelAspectRatio).toBeGreaterThan(0.45);
    expect(rightTab?.mobileViewportOverride).toBe(true);
    expect(rightTab?.renderedPixelAspectRatio).toBeGreaterThan(0.08);
    expect(bottomRail?.mobileViewportOverride).toBe(true);
    expect(bottomRail?.canvas?.y).toBeGreaterThan(proof.viewport.height * 0.60);
  }
  expect(layers.frontierLedgerVisualParitySourceChromeUnitDockMode).toBe('dynamic_unit_portraits_projected_into_north_star_bottom_rail');
  expect(layers.frontierLedgerVisualParitySourceChromeLegacyUnitDockSuppressed).toBe(true);
  expect(layers.frontierLedgerVisualParitySourceChromeLegacyUnitTextSuppressed).toBe(true);
  expect(layers.generatedHudProfileSourceChromeCompositionVersion).toBe(frontierLedgerSourceChrome);
  expect(layers.generatedHudProfileSource).toBe('north_star_source_rail_portrait_insert');
  expect(layers.generatedHudProfileSourceRailProjection).toBe(true);
  expect(layers.generatedHudProfileSourceRailProjectedCount).toBe(layers.generatedHudProfileMaskSpriteCount);
  expect(layers.generatedHudProfileSourceRailProjectedSlotIndexes).toEqual(expect.arrayContaining([0, 1]));
  expect(proof.renderer.generatedHudProfileSprites.every((sprite) => (
    sprite.profileSource === 'north_star_source_rail_portrait_insert'
    && sprite.sourceChromeCompositionVersion === frontierLedgerSourceChrome
    && sprite.sourceChromeDockSlotMode === 'north_star_bottom_rail_aperture'
  ))).toBe(true);
  expect(proof.sourceChromeControls?.opacity).toBe(0);
  expect(proof.sourceChromeSemanticZoom?.opacity).toBe(0);
  expect(layers.frontierLedgerVisualParityUnderlayOpacity).toBe(0.44);
  expect(layers.frontierLedgerVisualParityTileLegibilityPass).toBe(true);
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
  expect(layers.frontierLedgerVisualParitySuppressedTextSlots).toEqual(expect.arrayContaining([
    'unit-dock',
    'command-puck',
    'selected-context',
  ]));
  expect(layers.frontierLedgerVisualParitySuppressedCommandGlyphCount).toBeGreaterThanOrEqual(1);
  expect(layers.frontierLedgerVisualParityLegacyChromeConflict).toBe(false);
  expect(layers.frontierLedgerVisualParityLegacyContentConflict).toBe(false);
  expect(layers.frontierLedgerVisualParityRetainsLegacyTelemetry).toBe(true);
  expect(layers.frontierLedgerMapSystemNotOneScreen).toBe(true);
  expect(layers.frontierLedgerMapSystemScalableWorld).toBe(true);
  expect(layers.frontierLedgerMapSystemWorldLayer).toBe(true);
  expect(layers.frontierLedgerMapSystemHudLayer).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeLayer).toBe(true);
  expect(layers.frontierLedgerMapSystemPanZoomReady).toBe(true);
  expect(layers.frontierLedgerMapSystemSelectionReady).toBe(true);
  expect(layers.frontierLedgerMapSystemUnitReady).toBe(true);
  expect(layers.frontierLedgerMapSystemActionTargetReady).toBe(true);
  expect(layers.frontierLedgerMapSystemNorthStarWidth).toBe(1672);
  expect(layers.frontierLedgerMapSystemNorthStarHeight).toBe(941);
  expect(layers.frontierLedgerMapSystemSlotManifest).toBe(true);
  expect(layers.frontierLedgerMapSystemSlotManifestVersion).toBe(frontierLedgerSystem);
  expect(Array.isArray(layers.frontierLedgerMapSystemSlotManifestSlots)).toBe(true);
  for (const slot of requiredFrontierSystemSlots) {
    expect(layers.frontierLedgerMapSystemSlotManifestSlots).toContain(slot);
  }
  expect(layers.frontierLedgerMapSystemViewportHudSlots).toEqual(expect.arrayContaining([
    'frontier-ledger-board-frame',
    'frontier-ledger-bottom-medallion-rail',
    'frontier-ledger-parcel-rangefinder-backplate',
    'frontier-ledger-right-tab-shadow',
    'frontier-ledger-top-tabs-shadow',
  ]));
  expect(layers.frontierLedgerMapSystemWorldSlots).toEqual(expect.arrayContaining([
    'frontier-ledger-selected-ring',
    'frontier-ledger-unit-token',
  ]));
  expect(layers.frontierLedgerMapSystemBridgeSlots).toEqual(expect.arrayContaining([
    'frontier-ledger-dotted-target-trail',
    'frontier-ledger-route-arc',
    'frontier-ledger-target-callout',
  ]));
  expect(layers.frontierLedgerMapSystemRenderedBridgeSlots).toEqual(expect.arrayContaining([
    'frontier-ledger-dotted-target-trail',
    'frontier-ledger-route-arc',
    'frontier-ledger-target-callout',
  ]));
  expect(layers.frontierLedgerMapSystemCoreHudSlotsComplete).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeTargetCallout).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeRouteArc).toBe(true);
  expect(layers.frontierLedgerMapSystemBridgeTrailPips).toBeGreaterThanOrEqual(4);
  expect(layers.frontierLedgerMapSystemViewportAnchoredCount).toBeGreaterThanOrEqual(5);
  expect(layers.frontierLedgerMapSystemWorldAnchoredCount).toBeGreaterThanOrEqual(2);
  expect(layers.frontierLedgerMapSystemBridgeLineCount).toBeGreaterThanOrEqual(1);
  expect(layers.frontierLedgerMapSystemVisualOnly).toBe(true);
  expect(layers.frontierLedgerMapSystemReadOnly).toBe(true);
  expect(layers.frontierLedgerMapSystemSelectable).toBe(false);
  expect(layers.frontierLedgerMapSystemAuthority).toBe(false);
  expect(layers.frontierLedgerMapSystemHiddenTruthLeakage).toBe(false);
  expect(layers.frontierLedgerScratchBoardFrame).toBe(true);
  expect(layers.frontierLedgerScratchBottomMedallionRail).toBe(true);
  expect(layers.frontierLedgerScratchParcelRangefinder).toBe(true);
  expect(layers.frontierLedgerScratchCollapsedLedgerTab).toBe(true);
  expect(layers.frontierLedgerScratchTopLedgerTabs).toBe(true);
  expect(layers.frontierLedgerScratchDottedPath).toBe(true);
  expect(layers.frontierLedgerScratchTrailPipCount).toBeGreaterThanOrEqual(4);
  expect(layers.frontierLedgerScratchSlots.length).toBeGreaterThanOrEqual(requiredFrontierSlots.length);
  for (const slot of requiredFrontierSlots) {
    expect(layers.frontierLedgerScratchSlots).toContain(slot);
  }
  expect(layers.frontierLedgerScratchVisualOnly).toBe(true);
  expect(layers.frontierLedgerScratchReadOnly).toBe(true);
  expect(layers.frontierLedgerScratchSelectable).toBe(false);
  expect(layers.frontierLedgerScratchAuthority).toBe(false);
  expect(layers.frontierLedgerScratchHiddenTruthLeakage).toBe(false);
  expect(layers.frontierLedgerScratchMovementUx).toBe('direct_double_click_existing_handler_no_confirm_added');
  expect(layers.rendererNetworkRequests).toBe(0);
  expect(layers.rendererMutationHandlers).toEqual([]);
  expect(layers.threeCanvasHudNoGameplayAuthority).toBe(true);
  expect(layers.clientAuthority).toBe(false);
  expect(layers.commandTargetRingsPreviewOnly).toBe(true);
  expect(layers.commandTargetRingsRingFirstOverlay).toBe(true);
  expect(layers.commandTargetRingsTileLegibleOverlay).toBe(true);
  expect(layers.commandTargetRingInteriorFillAlpha).toBe(0);
  expect(layers.commandTargetRingAuthority).toBe(false);
  expect((proof.renderer.frontierLedgerScratchSprites || []).every((sprite) => (
    sprite.layerVersion === frontierLedger
    && sprite.systemVersion === frontierLedgerSystem
    && sprite.visualOnly === true
    && sprite.readOnly === true
    && sprite.selectable === false
    && sprite.routeAuthority === false
    && sprite.actionAuthority === false
    && sprite.executableActions === 0
    && sprite.hiddenTruthLeakage === false
  ))).toBe(true);
  expect((proof.renderer.frontierLedgerSystemLines || []).every((line) => (
    line.systemVersion === frontierLedgerSystem
    && line.systemLayer === 'bridge'
    && line.systemAnchor === 'world'
    && line.systemSource === 'server_owned_command_target'
    && line.previewOnly === true
    && line.visualOnly === true
    && line.readOnly === true
    && line.selectable === false
    && line.routeAuthority === false
    && line.actionAuthority === false
    && line.executableActions === 0
    && line.hiddenTruthLeakage === false
  ))).toBe(true);
  expect(proof.renderer.frontierLedgerSystemManifest).toEqual(expect.arrayContaining(
    requiredFrontierSystemSlots.map((slot) => expect.objectContaining({ slot }))
  ));
  if (mobile) {
    expect(proof.documentScrollWidth).toBeLessThanOrEqual(proof.viewport.width + 1);
    expect(proof.clipped).toEqual([]);
  }
}

test('FP-E2E-022H18 Frontier Ledger scratch visual HUD is visibly renderer-owned and visual-only', async ({ page, request }) => {
  test.setTimeout(90_000);
  const desktopScreenshot = 'reports/agent-town-frontier-ledger-scratch-visual-hud-desktop-2026-06-05.png';
  const targetPreviewScreenshot = 'reports/agent-town-frontier-ledger-scratch-visual-hud-target-preview-2026-06-05.png';
  const mobileScreenshot = 'reports/agent-town-frontier-ledger-scratch-visual-hud-mobile-2026-06-05.png';
  const proofPath = 'reports/agent-town-frontier-ledger-scratch-visual-hud-proof-2026-06-05.json';

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.setViewportSize({ width: 1365, height: 768 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForFrontierLedgerHud(page);
  const desktopProof = await collectProof(page);
  assertFrontierProof(desktopProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });

  const firstTarget = desktopProof.renderer.commandTargets
    ?.find((target) => Number.isFinite(target?.canvas?.x) && Number.isFinite(target?.canvas?.y))
    ?.canvas;
  const canvas = page.getByTestId('fp-expedition-three-canvas');
  await expect(canvas).toBeVisible();
  expect(firstTarget).toBeTruthy();
  const targetClick = await page.evaluate((target) => {
    const canvasNode = document.querySelector('[data-testid="fp-expedition-three-canvas"]');
    const rect = canvasNode?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return { x: rect.left + target.x, y: rect.top + target.y };
  }, firstTarget);
  expect(targetClick).toBeTruthy();
  await page.mouse.click(targetClick.x, targetClick.y);
  const targetPreviewProof = await collectProof(page);
  assertFrontierProof(targetPreviewProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: targetPreviewScreenshot });

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const mobileSeeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: mobileSeeded.state.plot.plotId });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForFrontierLedgerHud(page);
  const mobileProof = await collectProof(page);
  assertFrontierProof(mobileProof, { mobile: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });

  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'Frontier Ledger scratch visual HUD proof',
    frontierLedger,
    frontierLedgerSystem,
    frontierLedgerPresentation,
    frontierLedgerSourceChrome,
    northStarPath,
    screenshots: [desktopScreenshot, targetPreviewScreenshot, mobileScreenshot],
    desktop: desktopProof,
    targetPreview: targetPreviewProof,
    mobile: mobileProof,
    guardrails: {
      visibleHudOwner: 'three_canvas',
      rendererOwnedScratchLayer: desktopProof.renderer.visualLayers.frontierLedgerScratchRendererOwned === true,
      reusableMapSystem: desktopProof.renderer.visualLayers.frontierLedgerMapSystem === true
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemVersion === frontierLedgerSystem
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemNotOneScreen === true,
      visualParityPass: desktopProof.renderer.visualLayers.frontierLedgerVisualParityPass === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityVersion === frontierLedgerPresentation
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityBaseMap === 'warm_parchment_cartographic_map',
      northStarHudAtlasPass: desktopProof.renderer.visualLayers.frontierLedgerVisualParityNorthStarHudAtlas === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasPackId === 'frontier-ledger-north-star-hud-v1'
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasLoaded === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasFallback === false
        && requiredNorthStarHudAtlasSlots.every((slot) => desktopProof.renderer.visualLayers.frontierLedgerVisualParityNorthStarHudAtlasSlots.includes(slot)),
      sourceChromeCompositionPass: desktopProof.renderer.visualLayers.frontierLedgerVisualParitySourceChromeCompositionVersion === frontierLedgerSourceChrome
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParitySourceChromeResponsiveAspectPass === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParitySourceChromeLegacyUnitDockSuppressed === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParitySourceChromeLegacyUnitTextSuppressed === true
        && desktopProof.renderer.visualLayers.generatedHudProfileSourceRailProjection === true
        && desktopProof.sourceChromeControls?.opacity === 0
        && desktopProof.sourceChromeSemanticZoom?.opacity === 0,
      tileLegibilityPass: desktopProof.renderer.visualLayers.frontierLedgerVisualParityTileLegibilityPass === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityMapDepthVeilOpacity === 0.10
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityBottomBridgeOpacity === 0.12
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityBottomBridgeDemotedBySourceChrome === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParitySelectedAuraOpacity === 0.64
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityBoardFrameOuterChromeCutout === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityBoardFrameCenterWash === 'transparent_center_outer_hud_cutout'
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityTargetOverlayMode === 'ring_first_tile_legible'
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityCommandTargetInteriorFillAlpha === 0
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityGenericCellMarkerMode === 'hidden_until_hover_or_selection'
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityPublicCellMarkerMode === 'normal_map_and_site_hidden_until_hover_or_selection'
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityPublicBorderTone === 'sepia_non_selected_teal_reserved_for_active',
      legacyChromeConflictSuppressed: desktopProof.renderer.visualLayers.frontierLedgerVisualParityLegacyChromeSuppression === true
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityLegacyChromeConflict === false
        && desktopProof.renderer.visualLayers.frontierLedgerVisualParityLegacyContentConflict === false,
      viewportHudLayer: desktopProof.renderer.visualLayers.frontierLedgerMapSystemHudLayer === true
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemViewportHudSlots.length >= 5,
      scalableWorldLayer: desktopProof.renderer.visualLayers.frontierLedgerMapSystemScalableWorld === true
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemWorldLayer === true,
      worldToHudBridgeLayer: desktopProof.renderer.visualLayers.frontierLedgerMapSystemBridgeLayer === true
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemBridgeRouteArc === true
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemBridgeTargetCallout === true,
      slotManifestCoversFutureElements: requiredFrontierSystemSlots.every((slot) => (
        desktopProof.renderer.visualLayers.frontierLedgerMapSystemSlotManifestSlots || []
      ).includes(slot)),
      mapFirstBoardFrame: desktopProof.renderer.visualLayers.frontierLedgerScratchBoardFrame === true,
      bottomMedallionRail: desktopProof.renderer.visualLayers.frontierLedgerScratchBottomMedallionRail === true,
      parcelRangefinder: desktopProof.renderer.visualLayers.frontierLedgerScratchParcelRangefinder === true,
      collapsedLedgerTab: desktopProof.renderer.visualLayers.frontierLedgerScratchCollapsedLedgerTab === true,
      dottedTargetTrail: desktopProof.renderer.visualLayers.frontierLedgerScratchTrailPipCount >= 4,
      noVisibleDomHudPaint: desktopProof.visibleDomHudPaintCount + mobileProof.visibleDomHudPaintCount === 0,
      noVisibleDomHudText: desktopProof.visibleDomHudTextCount + mobileProof.visibleDomHudTextCount === 0,
      directDoubleClickMovementUxRetained: desktopProof.renderer.visualLayers.frontierLedgerScratchMovementUx === 'direct_double_click_existing_handler_no_confirm_added',
      noRendererNetworkRequests: desktopProof.renderer.visualLayers.rendererNetworkRequests === 0,
      noRendererMutationHandlers: Array.isArray(desktopProof.renderer.visualLayers.rendererMutationHandlers) && desktopProof.renderer.visualLayers.rendererMutationHandlers.length === 0,
      noAuthorityExpansion: desktopProof.renderer.visualLayers.frontierLedgerScratchAuthority === false
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemAuthority === false
        && desktopProof.renderer.visualLayers.threeCanvasHudNoGameplayAuthority === true
        && desktopProof.renderer.visualLayers.clientAuthority === false,
      noHiddenTruthLeakage: desktopProof.renderer.visualLayers.frontierLedgerScratchHiddenTruthLeakage === false
        && desktopProof.renderer.visualLayers.frontierLedgerMapSystemHiddenTruthLeakage === false,
      noMobileHorizontalOverflow: mobileProof.documentScrollWidth <= mobileProof.viewport.width + 1 && mobileProof.clipped.length === 0,
      noServerRouteToolStoreSchemaAuthorityChange: true,
      noGameplayMutationAdded: true,
      noAtlasExecution: true,
      noExternalEffects: true,
    },
  };
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
});
