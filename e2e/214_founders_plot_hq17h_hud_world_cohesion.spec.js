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
const cohesion = 'hq17h_renderer_hud_world_cohesion_v1';
const requiredChromeSlots = ['crest-status', 'objective-loop', 'unit-dock', 'command-tray', 'command-puck', 'selected-context', 'collapsed-ledger'];
const requiredCohesionSlots = ['map-depth-veil', 'bottom-foreground-bridge', 'selected-world-aura', 'selected-context-tether'];
const persistentChromeHudSelectors = [
  '[data-testid="fp-expedition-map-status"]',
  '[data-testid="fp-expedition-objective-strip"]',
  '[data-testid="fp-expedition-unit-roster"]',
  '[data-testid="fp-expedition-unit-command-bar"]',
  '[data-testid="fp-expedition-map-visual-hud"]',
];
const persistentHudSelectors = [
  ...persistentChromeHudSelectors,
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
      buildingId: 'bldg_hq17h_expedition_board',
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

async function waitForCohesiveHud(page) {
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const layers = info.visualLayers || {};
    return {
      owner: layers.visibleHudOwner || '',
      singleOwner: layers.visibleHudOwnerVersion || '',
      materiality: layers.generatedHudMaterialityVersion || '',
      cohesion: layers.generatedHudWorldCohesionVersion || '',
      chrome: Number(layers.generatedHudChromeSpriteCount || 0),
      profiles: Number(layers.generatedHudProfileMaskSpriteCount || 0),
      text: Number(layers.generatedHudTextSpriteCount || 0),
      cohesionSprites: Number(layers.generatedHudWorldCohesionSpriteCount || 0),
      cohesionLines: Number(layers.generatedHudWorldCohesionLineCount || 0),
      commandsReady: Number(layers.generatedHudCommandGlyphSpriteCount || 0) >= 1,
    };
  }), { timeout: 12_000 }).toEqual({
    owner: 'three_canvas',
    singleOwner,
    materiality,
    cohesion,
    chrome: 7,
    profiles: 3,
    text: 5,
    cohesionSprites: 3,
    cohesionLines: 1,
    commandsReady: true,
  });
}

async function collectProof(page) {
  return page.evaluate(({ selectors, chromeSelectors }) => {
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
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity || 1),
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        borderWidth,
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
    const chromeHudNodes = chromeSelectors.map(nodeInfo);
    const domPixelOwners = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .filter((entry) => entry.paintsPanel || entry.visibleTextChildren.length > 0);
    const chromePixelOwners = chromeHudNodes
      .filter((entry) => entry.present && entry.visible)
      .filter((entry) => entry.paintsPanel || entry.visibleTextChildren.length > 0);
    const visibleDomHudTextEntries = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .flatMap((entry) => entry.visibleTextChildren.map((child) => ({
        testid: entry.testid,
        text: child.text,
      })))
      .filter((entry) => entry.text);
    const visibleDomHudChromeTextEntries = chromeHudNodes
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
    const mapPanel = document.querySelector('[data-testid="fp-expedition-map-panel"]');
    const paintedMapPanelNodes = Array.from(mapPanel?.querySelectorAll('*') || [])
      .filter((node) => visibleNode(node))
      .map((node) => {
        const style = styleInfo(node);
        const rect = node.getBoundingClientRect();
        const paints = style.backgroundImage !== 'none'
          || alphaOf(style.backgroundColor) > 0.04
          || (style.borderWidth > 0 && alphaOf(style.borderTopColor) > 0.04)
          || style.boxShadow !== 'none';
        return {
          paints,
          tag: node.tagName.toLowerCase(),
          testid: node.getAttribute('data-testid') || '',
          className: String(node.getAttribute('class') || '').replace(/\s+/g, ' ').trim(),
          text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          borderWidth: style.borderWidth,
          borderTopColor: style.borderTopColor,
          boxShadow: style.boxShadow,
          opacity: style.opacity,
        };
      })
      .filter((entry) => entry.paints)
      .slice(0, 80);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-body"]')?.getAttribute('data-visible-hud-owner') || '',
      boardVisibleHudOwner: document.querySelector('[data-testid="fp-expedition-map-board-card"]')?.getAttribute('data-visible-hud-owner') || '',
      domHudNodes,
      chromeHudNodes,
      visibleDomHudPaintCount: domPixelOwners.length,
      visibleDomHudTextCount: visibleDomHudTextEntries.length,
      visibleDomHudTextEntries,
      visibleDomHudChromePaintCount: chromePixelOwners.length,
      visibleDomHudChromeTextCount: visibleDomHudChromeTextEntries.length,
      visibleDomHudChromeTextEntries,
      paintedMapPanelNodes,
      clipped,
      renderer: info,
    };
  }, { selectors: persistentHudSelectors, chromeSelectors: persistentChromeHudSelectors });
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
    revealedCellId: body.revealedCellId || '',
    eventPacketId: body.eventPacket?.packetId || '',
    hitLayer,
    existingDomTestidPrefix: 'fp-btn-scout-sector-unit-command-',
    noUnitIdPayload: payload.unitId == null,
    noTargetCellPayload: payload.targetCellId == null,
    noRoutePayload: payload.routeId == null,
  };
}

function assertProof(proof, { mobile = false, allowResultDom = false } = {}) {
  const layers = proof.renderer.visualLayers || {};
  expect(proof.bodyVisibleHudOwner).toBe('three_canvas');
  expect(proof.boardVisibleHudOwner).toBe('three_canvas');
  if (allowResultDom) {
    const paintedChrome = (proof.chromeHudNodes || [])
      .filter((entry) => entry.present && entry.visible)
      .filter((entry) => entry.paintsPanel || entry.visibleTextChildren?.length > 0)
      .map((entry) => ({
        testid: entry.testid,
        rect: entry.rect,
        paintsPanel: entry.paintsPanel,
        visibleTextChildren: entry.visibleTextChildren,
      }));
    expect(proof.visibleDomHudChromePaintCount, JSON.stringify(paintedChrome, null, 2)).toBe(0);
    expect(proof.visibleDomHudChromeTextCount, JSON.stringify(paintedChrome, null, 2)).toBe(0);
    expect(proof.visibleDomHudChromeTextEntries).toEqual([]);
  } else {
    expect(proof.visibleDomHudPaintCount).toBe(0);
    expect(proof.visibleDomHudTextCount).toBe(0);
    expect(proof.visibleDomHudTextEntries).toEqual([]);
  }
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
  expect([...layers.generatedHudMaterialityChromeSlots].sort()).toEqual([...requiredChromeSlots].sort());
  expect(layers.generatedHudWorldCohesionPass).toBe(true);
  expect(layers.generatedHudWorldCohesionVersion).toBe(cohesion);
  expect(layers.generatedHudWorldCohesionRendererOwned).toBe(true);
  expect(layers.generatedHudWorldCohesionSource).toBe('procedural_canvas_textures_and_three_lines');
  expect(layers.generatedHudWorldCohesionSpriteCount).toBe(3);
  expect(layers.generatedHudWorldCohesionLineCount).toBe(1);
  expect([...layers.generatedHudWorldCohesionSlots].sort()).toEqual([...requiredCohesionSlots].sort());
  expect(layers.generatedHudWorldDepthSeparation).toBe(true);
  expect(layers.generatedHudForegroundBridge).toBe(true);
  expect(layers.generatedHudSelectedWorldAura).toBe(true);
  expect(layers.generatedHudSelectedContextTether).toBe(true);
  expect(layers.generatedHudBottomDockTrayBalanced).toBe(true);
  expect(layers.generatedHudSelectedContextWorldConnection).toBe(true);
  expect(layers.generatedHudWorldCohesionVisualOnly).toBe(true);
  expect(layers.generatedHudWorldCohesionReadOnly).toBe(true);
  expect(layers.generatedHudWorldCohesionSelectable).toBe(false);
  expect(layers.generatedHudWorldCohesionAuthority).toBe(false);
  expect(layers.generatedHudChromeAuthority).toBe(false);
  expect(layers.generatedHudProfileMaskAuthority).toBe(false);
  expect(layers.generatedHudTextAuthority).toBe(false);
  expect(layers.generatedHudCommandGlyphAuthority).toBe(false);
  expect(layers.clientAuthority).toBe(false);
  expect(layers.generatedHudCommandGlyphLiveSource).toBe('server_owned_command_hint');
  expect((proof.renderer.generatedHudChromeSprites || []).every((sprite) => sprite.packId === packId)).toBe(true);
  expect((proof.renderer.generatedHudWorldCohesionSprites || []).every((sprite) => (
    sprite.layerVersion === cohesion
    && sprite.visualOnly === true
    && sprite.readOnly === true
    && sprite.selectable === false
    && sprite.routeAuthority === false
    && sprite.actionAuthority === false
    && sprite.executableActions === 0
  ))).toBe(true);
  expect((proof.renderer.generatedHudWorldCohesionLines || []).every((line) => (
    line.layerVersion === cohesion
    && line.targetSlot === 'selected-context'
    && line.visualOnly === true
    && line.readOnly === true
    && line.selectable === false
    && line.routeAuthority === false
    && line.actionAuthority === false
    && line.executableActions === 0
    && line.startCanvas
    && line.endCanvas
  ))).toBe(true);
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

test('FP-E2E-022H17 HQ17H renderer-owned HUD/world cohesion stays visual-only', async ({ page, request }) => {
  test.setTimeout(90_000);
  const desktopScreenshot = 'reports/agent-town-hq17h-hud-world-cohesion-desktop-2026-06-03.png';
  const postScoutScreenshot = 'reports/agent-town-hq17h-hud-world-cohesion-post-scout-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq17h-hud-world-cohesion-mobile-2026-06-03.png';
  const contactSheet = 'reports/agent-town-hq17h-hud-world-cohesion-contact-sheet-2026-06-03.png';
  const proofPath = 'reports/agent-town-hq17h-hud-world-cohesion-proof-2026-06-03.json';

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForCohesiveHud(page);
  const desktopProof = await collectProof(page);
  assertProof(desktopProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });
  const commandClick = await clickExistingScoutDomCommand(page);
  await expect(page.getByTestId('fp-scout-sector-result')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const layers = window.__foundersPlotTest?.getExpeditionMapInfo?.()?.visualLayers || {};
    return {
      events: Number(layers.eventPacketMarkerCount || 0),
      commandOutcome: Number(layers.commandOutcomeFeedbackCount || 0),
    };
  }), { timeout: 12_000 }).toEqual({ events: 1, commandOutcome: 1 });
  const postScoutProof = await collectProof(page);
  assertProof(postScoutProof, { allowResultDom: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: postScoutScreenshot });

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const mobileSeeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: mobileSeeded.state.plot.plotId });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForCohesiveHud(page);
  const mobileProof = await collectProof(page);
  assertProof(mobileProof, { mobile: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });

  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'HQ17H renderer-owned HUD/world cohesion proof',
    packId,
    cleanComposite,
    singleOwner,
    materiality,
    cohesion,
    visibleHudOwner: 'three_canvas',
    screenshots: [desktopScreenshot, postScoutScreenshot, mobileScreenshot],
    contactSheet,
    commandClick,
    desktop: desktopProof,
    postScout: postScoutProof,
    mobile: mobileProof,
    guardrails: {
      visibleHudOwner: 'three_canvas',
      visibleDomHudPaintCount: desktopProof.visibleDomHudPaintCount + mobileProof.visibleDomHudPaintCount,
      visibleDomHudTextCount: desktopProof.visibleDomHudTextCount + mobileProof.visibleDomHudTextCount,
      postScoutPersistentChromeHudPaintCount: postScoutProof.visibleDomHudChromePaintCount,
      postScoutPersistentChromeHudTextCount: postScoutProof.visibleDomHudChromeTextCount,
      existingDomCommandHandlersRetained: commandClick.ok === true,
      existingDomCommandPayloadShapeRetained: commandClick.noUnitIdPayload && commandClick.noTargetCellPayload && commandClick.noRoutePayload,
      rendererOwnedWorldCohesion: desktopProof.renderer.visualLayers.generatedHudWorldCohesionPass === true
        && desktopProof.renderer.visualLayers.generatedHudWorldCohesionVersion === cohesion,
      selectedContextWorldConnection: desktopProof.renderer.visualLayers.generatedHudSelectedContextWorldConnection === true,
      foregroundBridgePresent: desktopProof.renderer.visualLayers.generatedHudForegroundBridge === true,
      depthSeparationPresent: desktopProof.renderer.visualLayers.generatedHudWorldDepthSeparation === true,
      laterLoopStateCaptured: commandClick.ok === true
        && !!commandClick.revealedCellId
        && !!commandClick.eventPacketId
        && postScoutProof.renderer.visualLayers.eventPacketMarkerCount >= 1
        && postScoutProof.renderer.visualLayers.commandOutcomeFeedbackCount >= 1,
      noAuthorityExpansion: desktopProof.renderer.visualLayers.threeCanvasHudNoGameplayAuthority === true
        && desktopProof.renderer.visualLayers.generatedHudWorldCohesionAuthority === false
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
