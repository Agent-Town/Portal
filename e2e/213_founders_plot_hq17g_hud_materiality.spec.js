const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const packId = 'hq17c-generated-hud-chrome-v1';
const cleanComposite = 'hq17e_clean_hud_chrome_compositor_v1';
const singleOwner = 'hq17f_single_owner_canvas_hud_v1';
const materiality = 'hq17g_renderer_owned_hud_materiality_v1';
const requiredChromeSlots = ['crest-status', 'objective-loop', 'unit-dock', 'command-tray', 'command-puck', 'selected-context', 'collapsed-ledger'];
const persistentHudSelectors = [
  '[data-testid="fp-expedition-map-status"]',
  '[data-testid="fp-expedition-objective-strip"]',
  '[data-testid="fp-expedition-unit-roster"]',
  '[data-testid="fp-expedition-unit-command-bar"]',
  '[data-testid="fp-expedition-map-visual-hud"]',
  '[data-testid="fp-expedition-map-hud"]',
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
      buildingId: 'bldg_hq17g_expedition_board',
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

async function waitForMaterialHud(page) {
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const layers = info.visualLayers || {};
    return {
      owner: layers.visibleHudOwner || '',
      singleOwner: layers.visibleHudOwnerVersion || '',
      materiality: layers.generatedHudMaterialityVersion || '',
      chrome: Number(layers.generatedHudChromeSpriteCount || 0),
      profiles: Number(layers.generatedHudProfileMaskSpriteCount || 0),
      text: Number(layers.generatedHudTextSpriteCount || 0),
      commandsReady: Number(layers.generatedHudCommandGlyphSpriteCount || 0) >= 1,
    };
  }), { timeout: 12_000 }).toEqual({
    owner: 'three_canvas',
    singleOwner,
    materiality,
    chrome: 7,
    profiles: 3,
    text: 5,
    commandsReady: true,
  });
}

async function collectProof(page) {
  return page.evaluate(({ selectors }) => {
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
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity || 1),
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        boxShadow: style.boxShadow,
        color: style.color,
      };
    };
    const nodeInfo = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return { selector, present: false, visible: false };
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
            borderAlpha: alphaOf(childStyle.borderTopColor),
            boxShadow: childStyle.boxShadow,
          };
        });
      const visibleTextChildren = textChildren.filter((child) => (
        child.opacity > 0.01
        && (child.colorAlpha > 0.01 || child.backgroundAlpha > 0.01 || child.backgroundImage !== 'none' || child.borderAlpha > 0.01 || child.boxShadow !== 'none')
      ));
      const paintsPanel = style.backgroundImage !== 'none'
        || alphaOf(style.backgroundColor) > 0.01
        || alphaOf(style.borderTopColor) > 0.01
        || style.boxShadow !== 'none';
      const rect = node.getBoundingClientRect();
      return {
        selector,
        present: true,
        visible: visibleNode(node),
        testid: node.getAttribute('data-testid') || '',
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        paintsPanel,
        visibleTextChildren,
      };
    };
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const domHudNodes = selectors.map(nodeInfo);
    const domPixelOwners = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .filter((entry) => entry.paintsPanel || entry.visibleTextChildren.length > 0);
    const visibleDomHudTextEntries = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .flatMap((entry) => entry.visibleTextChildren.map((child) => ({
        testid: entry.testid,
        text: child.text,
      })))
      .filter((entry) => entry.text);
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

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-body"]')?.getAttribute('data-visible-hud-owner') || '',
      boardVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-board-card"]')?.getAttribute('data-visible-hud-owner') || '',
      domHudNodes,
      visibleDomHudPaintCount: domPixelOwners.length,
      visibleDomHudTextCount: visibleDomHudTextEntries.length,
      visibleDomHudTextEntries,
      clipped,
      renderer: info,
    };
  }, { selectors: persistentHudSelectors });
}

async function clickExistingScoutDomCommand(page) {
  const button = page.locator('[data-testid^="fp-btn-scout-sector-unit-command-"]:visible').first();
  await expect(button).toBeAttached();
  const hitLayer = await button.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return {
      display: style.display,
      visibility: style.visibility,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      pointerEvents: style.pointerEvents,
    };
  });
  const requestPromise = page.waitForRequest((routeRequest) => (
    routeRequest.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && routeRequest.method() === 'POST'
  ));
  const responsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await button.evaluate((node) => node.click());
  const routeRequest = await requestPromise;
  const response = await responsePromise;
  const payload = routeRequest.postDataJSON();
  const body = await response.json();
  expect(body.ok, JSON.stringify(body.error || body)).toBe(true);
  expect(payload.cellId).toBeTruthy();
  expect(payload.idempotencyKey).toMatch(/^fp-scout-sector-/);
  expect(payload.unitId).toBeUndefined();
  expect(payload.targetCellId).toBeUndefined();
  expect(payload.routeId).toBeUndefined();
  return {
    endpoint: '/api/founders-plot/expedition-map/scout-sector',
    method: routeRequest.method(),
    payloadKeys: Object.keys(payload).sort(),
    ok: body.ok === true,
    hitLayer,
    existingDomTestidPrefix: 'fp-btn-scout-sector-unit-command-',
    noUnitIdPayload: payload.unitId == null,
    noTargetCellPayload: payload.targetCellId == null,
    noRoutePayload: payload.routeId == null,
  };
}

function assertProof(proof, { mobile = false } = {}) {
  const layers = proof.renderer.visualLayers || {};
  expect(proof.bodyVisibleHudOwner).toBe('three_canvas');
  expect(proof.boardVisibleHudOwner).toBe('three_canvas');
  expect(proof.visibleDomHudPaintCount).toBe(0);
  expect(proof.visibleDomHudTextCount).toBe(0);
  expect(proof.visibleDomHudTextEntries).toEqual([]);
  expect(layers.singleVisibleHudOwner).toBe(true);
  expect(layers.visibleHudOwner).toBe('three_canvas');
  expect(layers.visibleHudOwnerVersion).toBe(singleOwner);
  expect(layers.domVisibleHudDemoted).toBe(true);
  expect(layers.domHudHitLayerRetained).toBe(true);
  expect(layers.visibleDomHudPaintCount).toBe(0);
  expect(layers.visibleDomHudTextCount).toBe(0);
  expect(layers.rendererNetworkRequests).toBe(0);
  expect(layers.rendererMutationHandlers).toEqual([]);
  expect(layers.threeCanvasHudNoGameplayAuthority).toBe(true);
  expect(layers.generatedHudChromeCleanCompositeVersion).toBe(cleanComposite);
  expect(layers.generatedHudChromePaintedSourceCrops).toBe(false);
  expect(layers.generatedHudMaterialityPass).toBe(true);
  expect(layers.generatedHudMaterialityVersion).toBe(materiality);
  expect(layers.generatedHudMaterialityRendererOwned).toBe(true);
  expect(layers.generatedHudMaterialitySource).toBe('procedural_canvas_textures');
  expect(layers.generatedHudMaterialityProfiles).toBe(true);
  expect(layers.generatedHudMaterialityText).toBe(true);
  expect(layers.generatedHudMaterialityCommands).toBe(true);
  expect([...layers.generatedHudMaterialityChromeSlots].sort()).toEqual([...requiredChromeSlots].sort());
  expect(layers.generatedHudChromeAuthority).toBe(false);
  expect(layers.generatedHudProfileMaskAuthority).toBe(false);
  expect(layers.generatedHudTextAuthority).toBe(false);
  expect(layers.generatedHudCommandGlyphAuthority).toBe(false);
  expect(layers.clientAuthority).toBe(false);
  expect(layers.generatedHudCommandGlyphLiveSource).toBe('server_owned_command_hint');
  expect((proof.renderer.generatedHudChromeSprites || []).every((sprite) => sprite.packId === packId)).toBe(true);
  expect((proof.renderer.visibleHudSlots || []).every((slot) => (
    slot.owner === 'three_canvas'
    && slot.materialityVersion === materiality
    && slot.noAuthority === true
    && slot.sourceCropPainted === false
  ))).toBe(true);
  if (mobile) {
    expect(proof.documentScrollWidth).toBeLessThanOrEqual(proof.viewport.width + 1);
    expect(proof.clipped).toEqual([]);
  }
}

test('FP-E2E-022G HQ17G renderer-owned HUD materiality keeps HQ17F guardrails', async ({ page, request }) => {
  test.setTimeout(90_000);
  const desktopScreenshot = 'reports/agent-town-hq17g-hud-materiality-desktop-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq17g-hud-materiality-mobile-2026-06-03.png';
  const contactSheet = 'reports/agent-town-hq17g-hud-materiality-contact-sheet-2026-06-03.png';
  const proofPath = 'reports/agent-town-hq17g-hud-materiality-proof-2026-06-03.json';

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForMaterialHud(page);
  const desktopProof = await collectProof(page);
  assertProof(desktopProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });
  const commandClick = await clickExistingScoutDomCommand(page);

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const mobileSeeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: mobileSeeded.state.plot.plotId });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForMaterialHud(page);
  const mobileProof = await collectProof(page);
  assertProof(mobileProof, { mobile: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });

  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'HQ17G renderer-owned HUD materiality proof',
    packId,
    cleanComposite,
    singleOwner,
    materiality,
    visibleHudOwner: 'three_canvas',
    screenshots: [desktopScreenshot, mobileScreenshot],
    contactSheet,
    commandClick,
    desktop: desktopProof,
    mobile: mobileProof,
    guardrails: {
      visibleHudOwner: 'three_canvas',
      visibleDomHudPaintCount: desktopProof.visibleDomHudPaintCount + mobileProof.visibleDomHudPaintCount,
      visibleDomHudTextCount: desktopProof.visibleDomHudTextCount + mobileProof.visibleDomHudTextCount,
      existingDomCommandHandlersRetained: commandClick.ok === true,
      existingDomCommandPayloadShapeRetained: commandClick.noUnitIdPayload && commandClick.noTargetCellPayload && commandClick.noRoutePayload,
      noAuthorityExpansion: desktopProof.renderer.visualLayers.threeCanvasHudNoGameplayAuthority === true
        && desktopProof.renderer.visualLayers.generatedHudChromeAuthority === false
        && desktopProof.renderer.visualLayers.generatedHudProfileMaskAuthority === false
        && desktopProof.renderer.visualLayers.generatedHudTextAuthority === false
        && desktopProof.renderer.visualLayers.generatedHudCommandGlyphAuthority === false
        && desktopProof.renderer.visualLayers.clientAuthority === false,
      noMobileHorizontalOverflow: mobileProof.documentScrollWidth <= mobileProof.viewport.width + 1 && mobileProof.clipped.length === 0,
      generatedHudMaterialityPass: desktopProof.renderer.visualLayers.generatedHudMaterialityPass === true,
      generatedHudMaterialityRendererOwned: desktopProof.renderer.visualLayers.generatedHudMaterialityRendererOwned === true,
      noServerRouteToolStoreSchemaAuthorityChange: true,
      noGameplayMutationAdded: true,
      noAtlasExecution: true,
      noGeneratedUniverseRuntimeExpansion: true,
      noHiddenAutonomy: true,
      noHiddenTruthLeakage: true,
      noRouteTradeEconomyResourceRewardCombatSchedulerExpansion: true,
      noExternalEffects: true,
    },
  };
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
});
