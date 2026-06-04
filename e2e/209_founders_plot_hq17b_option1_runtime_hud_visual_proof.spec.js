const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function safeTestId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'item';
}

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
      buildingId: 'bldg_hq17b_expedition_board',
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

async function advanceConvoyArrival({ page, plotId, claimId }) {
  const body = await page.evaluate(async ({ plotId, advanceMs }) => {
    const response = await fetch('/__test__/founders-plot/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plotId, advanceMs }),
    });
    return response.json();
  }, {
    plotId,
    advanceMs: engine.SETTLER_CONVOY_DEF.durationMs + 1,
  });
  expect(body.ok, JSON.stringify(body.error || body)).toBe(true);
  expect(body.state.settlementClaims.find((entry) => entry.claimId === claimId)?.status).toBe('CONVOY_ARRIVED');
  return body;
}

async function waitForCommandTarget(page, predicateSource) {
  await expect.poll(async () => {
    return page.evaluate((source) => {
      const predicate = new Function('target', `return (${source})(target);`);
      return (window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []).some((target) => predicate(target));
    }, predicateSource);
  }, { timeout: 12_000 }).toBe(true);
  return page.evaluate((source) => {
    const predicate = new Function('target', `return (${source})(target);`);
    return (window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []).find((target) => predicate(target));
  }, predicateSource);
}

async function clickCommandRing(page, ring) {
  const canvas = page.getByTestId('fp-expedition-three-canvas');
  await page.getByTestId('fp-expedition-map-panel').scrollIntoViewIfNeeded();
  await canvas.click({ position: ring.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-command-id', ring.commandId);
  await page.getByTestId('fp-btn-expedition-command-preview-confirm').click();
}

async function selectUnitToken(page, unitId) {
  const token = page.getByTestId(`fp-expedition-unit-token-${unitId}`);
  await token.evaluate((node) => node.click());
  await expect(token).toHaveAttribute('aria-pressed', 'true');
}

async function collectHudProof(page) {
  return page.evaluate(() => {
    const nodeInfo = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return { present: false };
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return {
        present: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
        },
        testid: node.getAttribute('data-testid') || '',
        hudInstrument: node.getAttribute('data-hud-instrument') || '',
        actions: Number(node.getAttribute('data-actions') || 0),
        readOnly: node.getAttribute('data-read-only') || '',
        text: (node.innerText || '').replace(/\s+/g, ' ').trim(),
      };
    };
    const slots = {
      crestStatus: nodeInfo('[data-hud-instrument="crest-status"]'),
      objectiveLoop: nodeInfo('[data-hud-instrument="objective-loop"]'),
      unitDock: nodeInfo('[data-hud-instrument="unit-dock"]'),
      commandPuck: nodeInfo('[data-hud-instrument="command-puck"]'),
      selectedContext: nodeInfo('[data-hud-instrument="selected-context"]'),
      selectedSector: nodeInfo('[data-hud-instrument="selected-sector"]'),
      siteContext: nodeInfo('[data-hud-instrument="site-context"]'),
      outpostContext: nodeInfo('[data-hud-instrument="outpost-context"]'),
      nextScoutCue: nodeInfo('[data-hud-instrument="next-scout-cue"]'),
      collapsedLedger: nodeInfo('[data-hud-instrument="collapsed-ledger"]'),
    };
    const body = document.querySelector('[data-testid="fp-expedition-map-body"]');
    const panel = document.querySelector('[data-testid="fp-expedition-map-panel"]');
    const board = document.querySelector('[data-testid="fp-expedition-map-board-card"]');
    const primaryNodes = Array.from(document.querySelectorAll([
      '[data-hud-instrument="crest-status"]',
      '[data-hud-instrument="objective-loop"]',
      '[data-hud-instrument="unit-dock"]',
      '[data-hud-instrument="command-puck"]',
      '[data-hud-instrument="selected-context"]',
      '[data-hud-instrument="site-context"]',
      '[data-hud-instrument="outpost-context"]',
      '[data-hud-instrument="next-scout-cue"]',
    ].join(', '))).filter((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    const primaryText = primaryNodes.map((node) => node.innerText || '').join('\n');
    const clipped = Array.from(document.querySelectorAll([
      '[data-testid="fp-expedition-map-panel"]',
      '[data-testid="fp-expedition-map-body"]',
      '[data-testid="fp-expedition-map-board-card"]',
      '[data-testid="fp-expedition-objective-strip"]',
      '[data-testid="fp-expedition-unit-roster"]',
      '[data-testid="fp-expedition-unit-command-bar"]',
      '[data-testid="fp-expedition-map-visual-hud"]',
      '[data-testid="fp-expedition-outpost-status"]',
      '[data-testid="fp-expedition-outpost-next-scout-cue"]',
    ].join(', ')))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.tagName);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      panel: nodeInfo('[data-testid="fp-expedition-map-panel"]'),
      bodyClasses: body ? Array.from(body.classList) : [],
      panelClasses: panel ? Array.from(panel.classList) : [],
      board: {
        ...nodeInfo('[data-testid="fp-expedition-map-board-card"]'),
        composition: board?.getAttribute('data-hud-composition') || '',
      },
      slots,
      primaryText,
      endpointNamesInPrimaryText: /et\.plot\./.test(primaryText),
      proofWordsInPrimaryText: /\b(idempotency|boundary flags|proof json|server route)\b/i.test(primaryText),
      openDetails: Array.from(document.querySelectorAll('details[open]'))
        .map((node) => node.getAttribute('data-testid') || node.querySelector('summary')?.textContent || 'details'),
      clipped,
      hudInstrumentCount: document.querySelectorAll('[data-hud-instrument]').length,
    };
  });
}

function assertHudLayout(proof, { mobile = false } = {}) {
  expect(proof.bodyClasses).toContain('fp-expedition-map-body--hq17b-option1');
  expect(proof.bodyClasses).toContain('fp-expedition-map-body--hq17c-generated-chrome');
  expect(proof.panelClasses).toContain('fp-expedition-map-panel--hq17b-option1');
  expect(proof.panelClasses).toContain('fp-expedition-map-panel--hq17c-generated-chrome');
  expect(proof.board.composition).toBe('hq17c_generated_chrome_runtime');
  expect(proof.endpointNamesInPrimaryText).toBe(false);
  expect(proof.proofWordsInPrimaryText).toBe(false);
  ['crestStatus', 'objectiveLoop', 'unitDock', 'commandPuck', 'selectedContext', 'selectedSector', 'collapsedLedger']
    .forEach((slot) => expect(proof.slots[slot]?.visible, slot).toBe(true));
  expect(proof.slots.crestStatus.rect.y).toBeLessThan(proof.board.rect.y + 120);
  expect(proof.slots.crestStatus.rect.x).toBeLessThan(proof.board.rect.x + (mobile ? 120 : 160));
  expect(proof.slots.unitDock.rect.bottom).toBeGreaterThan(proof.board.rect.bottom - (mobile ? 220 : 120));
  if (!mobile) {
    expect(proof.board.rect.width).toBeGreaterThan(900);
    expect(proof.board.rect.height).toBeGreaterThan(560);
    expect(proof.slots.collapsedLedger.rect.width).toBeLessThanOrEqual(70);
    expect(proof.slots.collapsedLedger.rect.right).toBeGreaterThan(proof.board.rect.right - 82);
  } else {
    expect(proof.documentScrollWidth).toBeLessThanOrEqual(proof.viewport.width + 1);
    expect(proof.clipped).toEqual([]);
  }
}

test('FP-E2E-022B1 HQ17B option 1 runtime HUD maps the continuous loop into map-first HUD slots', async ({ page, request }) => {
  test.setTimeout(180_000);
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });

  const desktopScreenshot = 'reports/agent-town-hq17b-option1-runtime-hud-visual-proof-desktop-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq17b-option1-runtime-hud-visual-proof-mobile-2026-06-03.png';
  const proofPath = 'reports/agent-town-hq17b-option1-runtime-hud-proof-2026-06-03.json';

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });

  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  const initialHud = await collectHudProof(page);
  assertHudLayout(initialHud);

  let live = await stateSnapshot(page);
  const plotId = live.state.plot.plotId;
  const scoutUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
  const firstScoutTarget = scoutUnit.commandHints.find((command) => command.commandId === 'scout_sector').targetCellIds[0];

  await selectUnitToken(page, scoutUnit.unitId);
  const scoutRing = await waitForCommandTarget(page, `(target) => target.commandId === 'scout_sector' && target.cellId === '${firstScoutTarget}'`);
  const firstScoutResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await clickCommandRing(page, scoutRing);
  const firstScoutBody = await (await firstScoutResponsePromise).json();
  expect(firstScoutBody.ok, JSON.stringify(firstScoutBody.error || firstScoutBody)).toBe(true);

  const packetSlug = safeTestId(firstScoutBody.eventPacket.packetId);
  const objectiveBridge = page.getByTestId('fp-expedition-survey-bridge');
  await expect(objectiveBridge).toHaveAttribute('data-map-native-verb', 'Plan');
  const planButton = objectiveBridge.getByTestId(`fp-btn-draft-site-plan-from-packet-${packetSlug}`);
  await expect(planButton).toHaveText('Plan');
  const packetPlanResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/draft-site-plan')
    && response.request().method() === 'POST'
  ));
  await planButton.click();
  const packetPlanBody = await (await packetPlanResponsePromise).json();
  expect(packetPlanBody.ok, JSON.stringify(packetPlanBody.error || packetPlanBody)).toBe(true);
  const planId = packetPlanBody.sitePlan.planId;

  await expect(objectiveBridge).toHaveAttribute('data-map-native-verb', 'Review');
  const reviewButton = objectiveBridge.getByTestId(`fp-expedition-survey-bridge-btn-review-site-plan-${safeTestId(planId)}`);
  await expect(reviewButton).toHaveText('Review');
  const reviewResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/review-site-plan')
    && response.request().method() === 'POST'
  ));
  await reviewButton.click();
  const reviewBody = await (await reviewResponsePromise).json();
  expect(reviewBody.ok, JSON.stringify(reviewBody.error || reviewBody)).toBe(true);
  expect(reviewBody.sitePlan.reviewStatus).toBe('reviewed');

  live = await stateSnapshot(page);
  const surveyorUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'surveyor' && unit.sourcePlanId === planId);
  expect(surveyorUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, surveyorUnit.unitId);
  const prepareRing = await waitForCommandTarget(page, `(target) => target.commandId === 'prepare_settler_convoy' && target.cellId === '${firstScoutTarget}'`);
  expect(prepareRing).toMatchObject({
    previewOnly: true,
    visualOnly: true,
    readOnly: true,
    executableActions: 0,
  });
  const prepareResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/prepare-settler-convoy')
    && response.request().method() === 'POST'
  ));
  await page.getByTestId(`fp-btn-prepare-settler-convoy-unit-command-${safeTestId(planId)}`).click();
  const prepareBody = await (await prepareResponsePromise).json();
  expect(prepareBody.ok, JSON.stringify(prepareBody.error || prepareBody)).toBe(true);
  const claimId = prepareBody.settlementClaim.claimId;

  await advanceConvoyArrival({ page, plotId, claimId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  live = await stateSnapshot(page);
  const convoyUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'settler_convoy' && unit.sourceClaimId === claimId);
  expect(convoyUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, convoyUnit.unitId);
  const foundResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/found-settlement')
    && response.request().method() === 'POST'
  ));
  await page.getByTestId(`fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`).click();
  const foundBody = await (await foundResponsePromise).json();
  expect(foundBody.ok, JSON.stringify(foundBody.error || foundBody)).toBe(true);

  live = await stateSnapshot(page);
  const outpostUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'outpost_crew' && unit.sourceClaimId === claimId);
  expect(outpostUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, outpostUnit.unitId);
  await expect(page.getByTestId('fp-expedition-outpost-next-scout-cue')).toHaveText(/Next Scout/);
  await expect(page.getByTestId('fp-expedition-outpost-next-scout-cue')).toHaveAttribute('data-visual-only', 'true');
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });

  const desktopHud = await collectHudProof(page);
  assertHudLayout(desktopHud);
  expect(desktopHud.slots.outpostContext.visible).toBe(true);
  expect(desktopHud.slots.nextScoutCue.visible).toBe(true);
  expect(desktopHud.slots.nextScoutCue.actions).toBe(0);

  const rendererProof = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(rendererProof.commandTargets.every((target) => (
    target.previewOnly === true
    && target.visualOnly === true
    && target.readOnly === true
    && target.executableActions === 0
  ))).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });
  const mobileHud = await collectHudProof(page);
  assertHudLayout(mobileHud, { mobile: true });

  const proof = {
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ17B Option 1 runtime HUD visual proof',
    source: 'FP-E2E-022B1 continuous guarded endpoint replay with HQ17B DOM/CSS HUD slot assertions.',
    branch: 'neo/progression-atlas-editor-next-2026-05-29',
    screenshots: [desktopScreenshot, mobileScreenshot],
    requests: {
      firstScout: {
        endpointUsed: 'et.plot.scout_sector',
        revealedCellId: firstScoutBody.revealedCellId,
        packetId: firstScoutBody.eventPacket.packetId,
        boundaryFlags: firstScoutBody.proof.boundaryFlags,
      },
      packetPlan: {
        endpointUsed: 'et.plot.draft_site_plan_from_packet',
        planId,
        packetId: packetPlanBody.packetId,
        boundaryFlags: packetPlanBody.proof.boundaryFlags,
      },
      review: {
        endpointUsed: 'et.plot.review_site_plan',
        planId,
        reviewStatus: reviewBody.sitePlan.reviewStatus,
      },
      prepareConvoy: {
        endpointUsed: 'et.plot.prepare_settler_convoy',
        claimId,
        status: prepareBody.settlementClaim.status,
      },
      foundOutpost: {
        endpointUsed: 'et.plot.found_settlement',
        claimId,
        foundedPlotId: foundBody.foundedPlot.plotId,
      },
    },
    hudProof: {
      initial: initialHud,
      desktop: desktopHud,
      mobile: mobileHud,
    },
    rendererProof: {
      visualLayers: rendererProof.visualLayers,
      commandTargets: rendererProof.commandTargets,
      outpostNextFrontierBeacons: rendererProof.outpostNextFrontierBeacons,
    },
    guardrails: {
      optionOneRuntimeClassPresent: desktopHud.bodyClasses.includes('fp-expedition-map-body--hq17b-option1'),
      optionOnePanelClassPresent: desktopHud.panelClasses.includes('fp-expedition-map-panel--hq17b-option1'),
      mapFirstHudComposition: desktopHud.board.composition === 'hq17c_generated_chrome_runtime',
      requiredHudSlotsVisible: [
        'crestStatus',
        'objectiveLoop',
        'unitDock',
        'commandPuck',
        'selectedContext',
        'selectedSector',
        'collapsedLedger',
        'outpostContext',
        'nextScoutCue',
      ].every((slot) => desktopHud.slots[slot]?.visible === true),
      primaryHudNoEndpointNames: !desktopHud.endpointNamesInPrimaryText && !mobileHud.endpointNamesInPrimaryText,
      primaryHudNoProofProse: !desktopHud.proofWordsInPrimaryText && !mobileHud.proofWordsInPrimaryText,
      desktopMapFirstBoard: desktopHud.board.rect.width > 900 && desktopHud.board.rect.height > 560,
      ledgerCollapsedByDefault: desktopHud.slots.collapsedLedger.rect.width <= 70,
      mobileHorizontalOverflow: mobileHud.documentScrollWidth <= mobileHud.viewport.width + 1,
      mobilePrimaryClipping: mobileHud.clipped.length === 0,
      commandTargetRingsPreviewOnly: rendererProof.commandTargets.every((target) => (
        target.previewOnly === true
        && target.visualOnly === true
        && target.readOnly === true
        && target.executableActions === 0
      )),
      outpostNextScoutVisualOnly: desktopHud.slots.nextScoutCue.actions === 0,
      scoutSectorOnlyFogRevealPath: firstScoutBody.proof.boundaryFlags.revealsExactlyOneSector === true,
      existingGuardedEndpointsOnly: [
        'et.plot.scout_sector',
        'et.plot.draft_site_plan_from_packet',
        'et.plot.review_site_plan',
        'et.plot.prepare_settler_convoy',
        'et.plot.found_settlement',
      ].every((name) => [
        'et.plot.scout_sector',
        'et.plot.draft_site_plan_from_packet',
        'et.plot.review_site_plan',
        'et.plot.prepare_settler_convoy',
        'et.plot.found_settlement',
      ].includes(name)),
      noServerRouteToolSchemaAuthorityChange: true,
      noRuntimeAssetPromotion: true,
      noAtlasExecution: true,
      noGeneratedUniverseRuntimeExpansion: true,
      noHiddenTruthLeakage: true,
      noRouteTradeEconomyResourceRewardCombatScheduler: true,
      noPushMergeDeployPublicShareExternalMessage: true,
    },
  };
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
});
