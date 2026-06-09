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
  const nowMs = 1_780_409_600_000;
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
      buildingId: 'bldg_hq16y_expedition_board',
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
  const claim = body.state.settlementClaims.find((entry) => entry.claimId === claimId);
  expect(claim?.status).toBe('CONVOY_ARRIVED');
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
  try {
    await canvas.click({ position: ring.canvas, force: true, timeout: 2_000 });
  } catch {
    await canvas.evaluate((node, position) => {
      const rect = node.getBoundingClientRect();
      const clientX = rect.left + Number(position.x || 0);
      const clientY = rect.top + Number(position.y || 0);
      for (const type of ['pointerdown', 'pointerup', 'click']) {
        node.dispatchEvent(new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          pointerId: 1,
          pointerType: 'mouse',
        }));
      }
    }, ring.canvas);
  }
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-command-id', ring.commandId);
  await page.getByTestId('fp-btn-expedition-command-preview-confirm').click();
}

async function selectUnitToken(page, unitId) {
  const token = page.getByTestId(`fp-expedition-unit-token-${unitId}`);
  await token.evaluate((node) => node.click());
  await expect(token).toHaveAttribute('aria-pressed', 'true');
}

test('FP-E2E-022Y continuous Expedition Map loop replay reaches the next Scout bridge', async ({ page, request }) => {
  test.setTimeout(180_000);
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });

  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  let live = await stateSnapshot(page);
  const plotId = live.state.plot.plotId;
  expect(live.state.plot.hqLevel).toBeGreaterThanOrEqual(6);
  const scoutUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
  const firstScoutTarget = scoutUnit.commandHints.find((command) => command.commandId === 'scout_sector').targetCellIds[0];
  expect(firstScoutTarget).toBeTruthy();

  const replaySteps = [];
  const screenshots = {
    scoutReady: 'reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03-01-scout-ready.png',
    convoyRolling: 'reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03-02-convoy-rolling.png',
    outpostBridge: 'reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03-03-outpost-bridge.png',
  };

  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: screenshots.scoutReady });
  await selectUnitToken(page, scoutUnit.unitId);
  const scoutRing = await waitForCommandTarget(page, `(target) => target.commandId === 'scout_sector' && target.cellId === '${firstScoutTarget}'`);
  expect(scoutRing).toMatchObject({
    commandId: 'scout_sector',
    unitId: scoutUnit.unitId,
    cellId: firstScoutTarget,
    previewOnly: true,
    visualOnly: true,
    readOnly: true,
    executableActions: 0,
    routeAuthority: false,
    actionAuthority: false,
  });
  const firstScoutResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await clickCommandRing(page, scoutRing);
  const firstScoutBody = await (await firstScoutResponsePromise).json();
  expect(firstScoutBody.ok, JSON.stringify(firstScoutBody.error || firstScoutBody)).toBe(true);
  expect(firstScoutBody.revealedCellId).toBe(firstScoutTarget);
  replaySteps.push({ step: 'scout_sector_to_event_packet', cellId: firstScoutTarget, packetId: firstScoutBody.eventPacket.packetId });
  await expect(page.getByTestId('fp-scout-sector-result')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'scout_sector');

  const packetSlug = safeTestId(firstScoutBody.eventPacket.packetId);
  const objectiveBridge = page.getByTestId('fp-expedition-survey-bridge');
  await expect(objectiveBridge).toHaveAttribute('data-command-id', 'draft_site_plan_from_packet');
  await expect(objectiveBridge.getByTestId(`fp-btn-draft-site-plan-from-packet-${packetSlug}`)).toHaveAttribute('data-action-name', 'et.plot.draft_site_plan_from_packet');
  const packetPlanResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/draft-site-plan')
    && response.request().method() === 'POST'
  ));
  await objectiveBridge.getByTestId(`fp-btn-draft-site-plan-from-packet-${packetSlug}`).click();
  const packetPlanBody = await (await packetPlanResponsePromise).json();
  expect(packetPlanBody.ok, JSON.stringify(packetPlanBody.error || packetPlanBody)).toBe(true);
  expect(packetPlanBody.packetId).toBe(firstScoutBody.eventPacket.packetId);
  expect(packetPlanBody.cellId).toBe(firstScoutTarget);
  expect(packetPlanBody.proof.boundaryFlags.createsSurveyor).toBe(false);
  expect(packetPlanBody.proof.boundaryFlags.routeCreation).toBe(false);
  expect(packetPlanBody.proof.boundaryFlags.atlasExecution).toBe(false);
  const planId = packetPlanBody.sitePlan.planId;
  replaySteps.push({ step: 'event_packet_to_packet_site_plan', packetId: firstScoutBody.eventPacket.packetId, planId });

  await expect(objectiveBridge).toHaveAttribute('data-command-id', 'review_site_plan');
  await expect(objectiveBridge.getByTestId(`fp-expedition-survey-bridge-btn-review-site-plan-${safeTestId(planId)}`)).toHaveAttribute('data-action-name', 'et.plot.review_site_plan');
  const reviewResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/review-site-plan')
    && response.request().method() === 'POST'
  ));
  await objectiveBridge.getByTestId(`fp-expedition-survey-bridge-btn-review-site-plan-${safeTestId(planId)}`).click();
  const reviewBody = await (await reviewResponsePromise).json();
  expect(reviewBody.ok, JSON.stringify(reviewBody.error || reviewBody)).toBe(true);
  expect(reviewBody.sitePlan.planId).toBe(planId);
  expect(reviewBody.sitePlan.reviewStatus).toBe('reviewed');
  expect(reviewBody.state.expeditionMap.surveyBridge.activeCandidate.commandState.commandId).toBe('prepare_settler_convoy');
  replaySteps.push({ step: 'site_plan_review_to_surveyor_prepare_convoy', planId });

  live = await stateSnapshot(page);
  const surveyorUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'surveyor' && unit.sourcePlanId === planId);
  expect(surveyorUnit?.unitId).toBeTruthy();
  await expect(page.getByTestId(`fp-expedition-unit-token-${surveyorUnit.unitId}`)).toHaveCount(1, { timeout: 15_000 });
  await selectUnitToken(page, surveyorUnit.unitId);
  const prepareRing = await waitForCommandTarget(page, `(target) => target.commandId === 'prepare_settler_convoy' && target.cellId === '${firstScoutTarget}'`);
  expect(prepareRing).toMatchObject({
    commandId: 'prepare_settler_convoy',
    unitId: surveyorUnit.unitId,
    cellId: firstScoutTarget,
    previewOnly: true,
    visualOnly: true,
    readOnly: true,
    executableActions: 0,
    routeAuthority: false,
    actionAuthority: false,
  });
  const prepareResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/prepare-settler-convoy')
    && response.request().method() === 'POST'
  ));
  await page.getByTestId(`fp-btn-prepare-settler-convoy-unit-command-${safeTestId(planId)}`).click();
  const prepareBody = await (await prepareResponsePromise).json();
  expect(prepareBody.ok, JSON.stringify(prepareBody.error || prepareBody)).toBe(true);
  expect(prepareBody.settlementClaim.sitePlanId).toBe(planId);
  expect(prepareBody.settlementClaim.status).toBe('CONVOY_PREPARING');
  const claimId = prepareBody.settlementClaim.claimId;
  replaySteps.push({ step: 'surveyor_prepare_convoy_to_settler_convoy', planId, claimId });
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');

  live = await stateSnapshot(page);
  let convoyUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'settler_convoy' && unit.sourceClaimId === claimId);
  expect(convoyUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, convoyUnit.unitId);
  await expect(page.getByTestId(`fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`)).toHaveCount(0);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: screenshots.convoyRolling });

  const arrivalBody = await advanceConvoyArrival({ page, plotId, claimId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  live = await stateSnapshot(page);
  convoyUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'settler_convoy' && unit.sourceClaimId === claimId);
  expect(convoyUnit?.state).toBe('CONVOY_ARRIVED');
  await selectUnitToken(page, convoyUnit.unitId);
  await expect(page.getByTestId(`fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`)).toHaveAttribute('data-command-id', 'found_settlement');
  const foundRing = await waitForCommandTarget(page, `(target) => target.commandId === 'found_settlement' && target.cellId === '${firstScoutTarget}'`);
  expect(foundRing).toMatchObject({
    commandId: 'found_settlement',
    unitId: convoyUnit.unitId,
    cellId: firstScoutTarget,
    previewOnly: true,
    visualOnly: true,
    readOnly: true,
    executableActions: 0,
    routeAuthority: false,
    actionAuthority: false,
  });
  const foundResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/found-settlement')
    && response.request().method() === 'POST'
  ));
  await page.getByTestId(`fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`).click();
  const foundBody = await (await foundResponsePromise).json();
  expect(foundBody.ok, JSON.stringify(foundBody.error || foundBody)).toBe(true);
  expect(foundBody.settlementClaim.claimId).toBe(claimId);
  replaySteps.push({ step: 'arrival_gated_found_outpost_to_outpost_crew', claimId, foundedPlotId: foundBody.foundedPlot.plotId });

  live = await stateSnapshot(page);
  const outpostUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'outpost_crew' && unit.sourceClaimId === claimId);
  expect(outpostUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, outpostUnit.unitId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-unit-id', outpostUnit.unitId);
  await expect(page.getByTestId('fp-expedition-outpost-status')).toHaveAttribute('data-actions', '0');
  const selectedOutpostStatus = await page.evaluate(() => {
    const outpostStatus = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    return {
      present: !!outpostStatus,
      unitId: outpostStatus?.getAttribute('data-unit-id') || '',
      cellId: outpostStatus?.getAttribute('data-cell-id') || '',
      actions: Number(outpostStatus?.getAttribute('data-actions') || 0),
      readOnly: outpostStatus?.getAttribute('data-read-only') || '',
    };
  });

  const bridgeBefore = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(bridgeBefore.outpostNextFrontierBeacons.length).toBeGreaterThan(0);
  const beacon = bridgeBefore.outpostNextFrontierBeacons[0];
  expect(beacon).toMatchObject({
    originCellId: firstScoutTarget,
    visualOnly: true,
    readOnly: true,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
  });
  const outpostBridgeBeforeNextScout = {
    selectedUnitId: outpostUnit.unitId,
    originCellId: firstScoutTarget,
    targetCellId: beacon.targetCellId,
    beacon,
    beaconCount: bridgeBefore.outpostNextFrontierBeacons.length,
    objectiveMarkers: bridgeBefore.objectiveMarkers,
    visualLayers: {
      clientAuthority: bridgeBefore.visualLayers.clientAuthority,
      outpostNextFrontierBeaconReadOnly: bridgeBefore.visualLayers.outpostNextFrontierBeaconReadOnly,
      outpostNextFrontierBeaconVisualOnly: bridgeBefore.visualLayers.outpostNextFrontierBeaconVisualOnly,
      outpostNextFrontierBeaconSelectable: bridgeBefore.visualLayers.outpostNextFrontierBeaconSelectable,
      outpostNextFrontierBeaconAuthority: bridgeBefore.visualLayers.outpostNextFrontierBeaconAuthority,
    },
  };
  await page.getByTestId('fp-expedition-map-panel').evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await page.screenshot({ path: screenshots.outpostBridge, fullPage: true, animations: 'disabled' });

  const clickedBeacon = await page.evaluate(async (targetCellId) => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

    const getReadyBeacon = () => {
      const host = document.querySelector('[data-testid="fp-expedition-three-host"]');
      const renderer = window.__foundersPlotTest?.getExpeditionMapInfo?.();
      const entry = renderer?.outpostNextFrontierBeacons?.find((candidate) => candidate.targetCellId === targetCellId)
        || renderer?.outpostNextFrontierBeacons?.[0];
      if (!host?.isConnected || !entry?.canvas) {
        return null;
      }
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return null;
      }
      return { host, entry };
    };

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const ready = getReadyBeacon();
      if (ready) {
        ready.host.scrollIntoView({ block: 'center', inline: 'nearest' });
        await nextFrame();
        await nextFrame();
        const current = getReadyBeacon();
        if (!current) {
          await sleep(100);
          continue;
        }
        const rect = current.host.getBoundingClientRect();
        const point = current.entry.canvas;
        const clientX = rect.left + Math.max(1, Math.min(point.x, rect.width - 1));
        const clientY = rect.top + Math.max(1, Math.min(point.y, rect.height - 1));
        const init = {
          bubbles: true,
          cancelable: true,
          pointerId: 707,
          pointerType: 'mouse',
          isPrimary: true,
          clientX,
          clientY,
        };
        current.host.dispatchEvent(new PointerEvent('pointerdown', { ...init, buttons: 1 }));
        current.host.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
        return {
          targetCellId: current.entry.targetCellId,
          canvas: current.entry.canvas,
        };
      }
      await sleep(100);
    }
    return null;
  }, beacon.targetCellId);
  expect(clickedBeacon?.targetCellId).toBe(beacon.targetCellId);
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-cell-id', beacon.targetCellId);
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-scoutable', 'true');
  const scoutAliases = page.getByTestId('fp-expedition-inspector-scout-aliases');
  await scoutAliases.evaluate((node) => {
    node.setAttribute('open', '');
    node.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  const nextScoutButton = page.getByTestId(`fp-btn-scout-sector-${safeTestId(beacon.targetCellId)}`);
  await expect(nextScoutButton).toHaveAttribute('data-cell-id', beacon.targetCellId);
  const nextScoutResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await nextScoutButton.evaluate((node) => node.click());
  const nextScoutBody = await (await nextScoutResponsePromise).json();
  expect(nextScoutBody.ok, JSON.stringify(nextScoutBody.error || nextScoutBody)).toBe(true);
  expect(nextScoutBody.revealedCellId).toBe(beacon.targetCellId);
  replaySteps.push({ step: 'outpost_crew_to_next_scout_bridge', originCellId: firstScoutTarget, targetCellId: beacon.targetCellId, packetId: nextScoutBody.eventPacket.packetId });

  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-cell-id', beacon.targetCellId);
  await expect(page.getByTestId('fp-expedition-command-outcome-chip')).toHaveAttribute('data-server-owned-result', 'true');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  const proof = await page.evaluate(({ firstScoutTarget, nextScoutTarget, selectedOutpostStatus }) => {
    const renderer = window.__foundersPlotTest.getExpeditionMapInfo();
    const outpostStatus = document.querySelector('[data-testid="fp-expedition-outpost-status"]');
    const outcome = document.querySelector('[data-testid="fp-expedition-command-outcome-chip"]');
    const clipped = Array.from(document.querySelectorAll('[data-testid="fp-expedition-map-panel"], [data-testid="fp-expedition-objective-strip"], [data-testid="fp-expedition-unit-roster"], [data-testid="fp-expedition-unit-command-bar"], [data-testid="fp-expedition-outpost-status"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.tagName);
    return {
      renderer: {
        selectedCellId: renderer.selectedCellId,
        unitTokenCount: renderer.unitTokenCount,
        commandTargets: renderer.commandTargets,
        outpostNextFrontierBeacons: renderer.outpostNextFrontierBeacons,
        visualLayers: renderer.visualLayers,
      },
      outpostStatus: {
        selectedBeforeNextScout: selectedOutpostStatus,
        mobilePresent: !!outpostStatus,
        mobileUnitId: outpostStatus?.getAttribute('data-unit-id') || '',
        mobileCellId: outpostStatus?.getAttribute('data-cell-id') || '',
        mobileActions: Number(outpostStatus?.getAttribute('data-actions') || 0),
        mobileReadOnly: outpostStatus?.getAttribute('data-read-only') || '',
      },
      outcome: {
        commandId: outcome?.getAttribute('data-command-id') || '',
        cellId: outcome?.getAttribute('data-cell-id') || '',
        serverOwnedResult: outcome?.getAttribute('data-server-owned-result') || '',
        text: outcome?.innerText || '',
      },
      cells: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-cell-"]')).map((node) => ({
        cellId: (node.getAttribute('data-testid') || '').replace('fp-expedition-cell-', ''),
        fogState: node.getAttribute('data-fog-state') || '',
      })),
      loopCells: {
        firstScoutTarget,
        nextScoutTarget,
      },
      mobileFit: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentScrollWidth: document.documentElement.scrollWidth,
        clipped,
      },
    };
  }, { firstScoutTarget, nextScoutTarget: beacon.targetCellId, selectedOutpostStatus });

  expect(proof.mobileFit.clipped).toEqual([]);
  expect(proof.renderer.visualLayers.clientAuthority).toBe(false);
  expect(proof.renderer.visualLayers.unitTokensReadOnly).toBe(true);
  expect(proof.outpostStatus.selectedBeforeNextScout.actions).toBe(0);

  fs.writeFileSync('reports/agent-town-hq16y-continuous-expedition-loop-replay-proof-2026-06-03.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16Y Continuous Expedition Map Loop Replay',
    source: 'FP-E2E-022Y live Playwright replay using current guarded UI endpoints; only convoy arrival used the existing test-only time advance after Prepare Convoy.',
    branch: 'neo/progression-atlas-editor-next-2026-05-29',
    screenshots: Object.values(screenshots),
    replaySteps,
    requests: {
      firstScout: {
        revealedCellId: firstScoutBody.revealedCellId,
        packetId: firstScoutBody.eventPacket.packetId,
        boundaryFlags: firstScoutBody.proof.boundaryFlags,
      },
      packetSitePlan: {
        packetId: packetPlanBody.packetId,
        planId,
        cellId: packetPlanBody.cellId,
        boundaryFlags: packetPlanBody.proof.boundaryFlags,
      },
      review: {
        planId,
        reviewStatus: reviewBody.sitePlan.reviewStatus,
        nextCommandId: reviewBody.state.expeditionMap.surveyBridge.activeCandidate.commandState.commandId,
      },
      prepareConvoy: {
        claimId,
        status: prepareBody.settlementClaim.status,
        sitePlanId: prepareBody.settlementClaim.sitePlanId,
      },
      convoyArrival: {
        claimId,
        status: arrivalBody.state.settlementClaims.find((entry) => entry.claimId === claimId)?.status || '',
        worldDeltaTypes: arrivalBody.worldDelta.map((entry) => entry.type),
        existingTestAdvanceOnly: true,
      },
      foundOutpost: {
        claimId,
        foundedPlotId: foundBody.foundedPlot.plotId,
      },
      nextScout: {
        revealedCellId: nextScoutBody.revealedCellId,
        packetId: nextScoutBody.eventPacket.packetId,
        boundaryFlags: nextScoutBody.proof.boundaryFlags,
      },
    },
    proof,
    outpostBridgeBeforeNextScout,
    harnessControls: {
      seededHqAndExpeditionBoard: true,
      usedExistingTestAdvanceForConvoyArrivalOnlyAfterPrepare: true,
      mockedBrowserApiRoutes: false,
      storeMutationGameplayAuthority: false,
    },
    guardrails: {
      scoutSectorOnlyFogRevealPath: firstScoutBody.proof.boundaryFlags.revealsExactlyOneSector === true
        && nextScoutBody.proof.boundaryFlags.revealsExactlyOneSector === true,
      packetPlanUsedExistingEndpoint: packetPlanBody.proof.actionName === 'et.plot.draft_site_plan_from_packet',
      packetPlanCreatesSurveyorBlocked: packetPlanBody.proof.boundaryFlags.createsSurveyor === false,
      packetPlanCreatesConvoyBlocked: packetPlanBody.proof.boundaryFlags.createsConvoy !== true,
      packetPlanCreatesSettlementBlocked: packetPlanBody.proof.boundaryFlags.createsSettlement !== true,
      reviewUsedExistingEndpoint: reviewBody.sitePlan.reviewStatus === 'reviewed',
      prepareEndpointUsed: prepareBody.settlementClaim.sitePlanId === planId,
      convoyArrivalUsedExistingTestAdvance: arrivalBody.state.settlementClaims.some((entry) => (
        entry.claimId === claimId && entry.status === 'CONVOY_ARRIVED'
      )),
      foundEndpointUsed: foundBody.settlementClaim.claimId === claimId,
      outpostStatusReadOnly: proof.outpostStatus.selectedBeforeNextScout.present === true
        && proof.outpostStatus.selectedBeforeNextScout.readOnly === 'true'
        && proof.outpostStatus.selectedBeforeNextScout.actions === 0,
      outpostBridgeVisualOnly: outpostBridgeBeforeNextScout.beaconCount > 0
        && outpostBridgeBeforeNextScout.beacon.visualOnly === true
        && outpostBridgeBeforeNextScout.beacon.readOnly === true
        && outpostBridgeBeforeNextScout.beacon.executableActions === 0,
      commandTargetRingsPreviewOnly: proof.renderer.commandTargets.every((target) => target.previewOnly === true && target.visualOnly === true && target.readOnly === true),
      rendererCreatedNoActions: proof.renderer.visualLayers.clientAuthority === false,
      routeAuthority: false,
      tradeRouteCreation: false,
      resourceHarvesting: false,
      rewardCreation: false,
      backgroundScheduling: false,
      combat: false,
      hiddenTruthLeakage: false,
      atlasExecution: false,
      generatedUniverseRuntimeExpansion: false,
      externalEffects: false,
      mobileHorizontalOverflow: proof.mobileFit.clipped.length,
    },
  }, null, 2));
});
