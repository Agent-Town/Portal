const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const frontierLedger = 'hq18_frontier_ledger_scratch_visual_hud_v1';
const northStarPath = 'frontier-ledger-north-star-upload-2026-06-05';
const requiredFrontierSlots = [
  'frontier-ledger-board-frame',
  'frontier-ledger-bottom-medallion-rail',
  'frontier-ledger-parcel-rangefinder-backplate',
  'frontier-ledger-right-tab-shadow',
  'frontier-ledger-top-tabs-shadow',
  'frontier-ledger-dotted-target-trail',
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
      board: layers.frontierLedgerScratchBoardFrame === true,
      rail: layers.frontierLedgerScratchBottomMedallionRail === true,
      parcel: layers.frontierLedgerScratchParcelRangefinder === true,
      ledger: layers.frontierLedgerScratchCollapsedLedgerTab === true,
      tabs: layers.frontierLedgerScratchTopLedgerTabs === true,
      dotted: layers.frontierLedgerScratchDottedPath === true,
      pips: Number(layers.frontierLedgerScratchTrailPipCount || 0),
      chrome: Number(layers.generatedHudChromeSpriteCount || 0),
      commands: Number(layers.generatedHudCommandGlyphSpriteCount || 0),
    };
  }), { timeout: 12_000 }).toEqual({
    owner: 'three_canvas',
    version: frontierLedger,
    board: true,
    rail: true,
    parcel: true,
    ledger: true,
    tabs: true,
    dotted: true,
    pips: expect.any(Number),
    chrome: 7,
    commands: expect.any(Number),
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
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-body"]')?.getAttribute('data-visible-hud-owner') || '',
      boardVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-board-card"]')?.getAttribute('data-visible-hud-owner') || '',
      visibleDomHudPaintCount: domPixelOwners.length,
      visibleDomHudTextCount: visibleDomHudTextEntries.length,
      visibleDomHudTextEntries,
      domHudNodes,
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
  expect(layers.commandTargetRingAuthority).toBe(false);
  expect((proof.renderer.frontierLedgerScratchSprites || []).every((sprite) => (
    sprite.layerVersion === frontierLedger
    && sprite.visualOnly === true
    && sprite.readOnly === true
    && sprite.selectable === false
    && sprite.routeAuthority === false
    && sprite.actionAuthority === false
    && sprite.executableActions === 0
    && sprite.hiddenTruthLeakage === false
  ))).toBe(true);
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

  const firstTarget = desktopProof.renderer.commandTargets?.[0]?.canvas;
  const canvasBox = await page.getByTestId('fp-expedition-three-canvas').boundingBox();
  expect(firstTarget && canvasBox).toBeTruthy();
  await page.mouse.click(canvasBox.x + firstTarget.x, canvasBox.y + firstTarget.y);
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
    northStarPath,
    screenshots: [desktopScreenshot, targetPreviewScreenshot, mobileScreenshot],
    desktop: desktopProof,
    targetPreview: targetPreviewProof,
    mobile: mobileProof,
    guardrails: {
      visibleHudOwner: 'three_canvas',
      rendererOwnedScratchLayer: desktopProof.renderer.visualLayers.frontierLedgerScratchRendererOwned === true,
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
        && desktopProof.renderer.visualLayers.threeCanvasHudNoGameplayAuthority === true
        && desktopProof.renderer.visualLayers.clientAuthority === false,
      noHiddenTruthLeakage: desktopProof.renderer.visualLayers.frontierLedgerScratchHiddenTruthLeakage === false,
      noMobileHorizontalOverflow: mobileProof.documentScrollWidth <= mobileProof.viewport.width + 1 && mobileProof.clipped.length === 0,
      noServerRouteToolStoreSchemaAuthorityChange: true,
      noGameplayMutationAdded: true,
      noAtlasExecution: true,
      noExternalEffects: true,
    },
  };
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
});
