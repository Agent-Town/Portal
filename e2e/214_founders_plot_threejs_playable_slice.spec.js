const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function eventCount(request) {
  const response = await request.get('/api/founders-plot/state');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return Number(body.state?.audit?.eventCount || 0);
}

async function plotIds(page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/state');
    const body = await response.json();
    return {
      pairId: body.state.plot.pairId,
      plotId: body.state.plot.plotId
    };
  });
}

async function advancePlot(page, advanceMs) {
  const ids = await plotIds(page);
  await page.evaluate(async ({ pairId, plotId, ms }) => {
    await fetch('/__test__/founders-plot/advance', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-reset': 'test-reset' },
      body: JSON.stringify({ pairId, plotId, advanceMs: ms })
    });
  }, { ...ids, ms: advanceMs });
}

async function waitForRole(page, role) {
  await page.waitForFunction((expectedRole) => {
    const actors = window.__foundersPlotTest?.getVisualActors?.() || [];
    return actors.some((actor) => actor.canonicalRoleId === expectedRole);
  }, role);
}

async function clickActorOnCanvas(page, role) {
  const target = await page.waitForFunction((expectedRole) => {
    const info = window.__foundersPlotTest?.getThreeSceneInfo?.() || {};
    return (info.pickTargets || []).find((entry) => entry.canonicalRoleId === expectedRole && entry.canvas) || null;
  }, role);
  const value = await target.jsonValue();
  const box = await page.getByTestId('founders-three-canvas').boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.click(
    box.x + Math.max(1, Math.min(value.canvas.x, box.width - 1)),
    box.y + Math.max(1, Math.min(value.canvas.y, box.height - 1))
  );
}

async function canvasStats(page) {
  return page.getByTestId('founders-three-canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { ok: false };
    const pixel = new Uint8Array(4);
    const samples = [];
    for (const [x, y] of [[0.25, 0.30], [0.50, 0.50], [0.72, 0.70]]) {
      gl.readPixels(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      samples.push(Array.from(pixel));
    }
    return {
      ok: true,
      width: canvas.width,
      height: canvas.height,
      unique: new Set(samples.map((sample) => sample.join(','))).size,
      visible: samples.filter((sample) => sample[3] > 0 && sample[0] + sample[1] + sample[2] > 0).length
    };
  });
}

test('Three.js Founders Plot renders Clover plus builder, worker, and hauler from server visualActors', async ({ page, request }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  await expect(page.getByTestId('founders-three-scene')).toBeVisible();
  await expect(page.getByTestId('founders-three-canvas')).toBeVisible();

  await waitForRole(page, 'clover');
  await expect(page.getByTestId('fp-visual-actor-clover')).toHaveAttribute('data-visual-only', 'true');
  await waitForRole(page, 'messenger');
  await expect(page.getByTestId('fp-visual-actor-messenger')).toHaveAttribute('data-action-cue', 'attention_marker');

  const pixels = await canvasStats(page);
  expect(pixels.ok).toBe(true);
  expect(pixels.width).toBeGreaterThan(100);
  expect(pixels.height).toBeGreaterThan(100);
  expect(pixels.visible).toBeGreaterThan(0);
  expect(pixels.unique).toBeGreaterThan(1);

  await page.getByTestId('fp-tile-0-1').click();
  await page.getByTestId('fp-palette-LUMBER_CAMP').click();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Building');
  await waitForRole(page, 'builder');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-source-domain', 'job');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-action-kind', 'CONSTRUCT');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-action-cue', 'construction_progress');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-accessory', 'hammer');
  const builderInfo = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(builderInfo.actors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'builder',
      assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png',
      assetSprite: expect.objectContaining({
        id: 'rigger-slate-builder-v2',
        action: 'build',
        row: 1,
        columns: 4,
        rows: 4
      }),
      actionAnimation: expect.objectContaining({ mode: 'work_swing', hasWalkOffset: true })
    })
  ]));
  expect(builderInfo.renderedActors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'builder',
      spriteSheet: true,
      spriteSheetId: 'rigger-slate-builder-v2',
      spriteSheetAction: 'build',
      assetFallback: false
    })
  ]));
  expect(builderInfo.actionCues).toEqual(expect.arrayContaining([
    expect.objectContaining({ canonicalRoleId: 'builder', cueType: 'construction_progress', accessory: 'hammer' })
  ]));
  const builderActor = builderInfo.actors.find((actor) => actor.canonicalRoleId === 'builder');
  expect(builderActor.route).toEqual(expect.objectContaining({
    visualOnly: true,
    mode: 'work',
    targetId: builderActor.target.id
  }));
  expect(builderActor.route.points).toHaveLength(3);
  expect(builderInfo.ways).toEqual(expect.arrayContaining([
    expect.objectContaining({ wayId: builderActor.route.wayId, targetId: builderActor.target.id, visualOnly: true })
  ]));
  expect(builderInfo.renderedWays).toEqual(expect.arrayContaining([
    expect.objectContaining({ wayId: builderActor.route.wayId, visualOnly: true })
  ]));
  expect(builderInfo.encounters).toEqual(expect.arrayContaining([
    expect.objectContaining({ targetId: 'HQ', cueType: 'crossing_greeting', visualOnly: true })
  ]));
  expect(builderInfo.renderedEncounters).toEqual(expect.arrayContaining([
    expect.objectContaining({ targetId: 'HQ', cueType: 'crossing_greeting', visualOnly: true })
  ]));

  const beforePickEvents = await eventCount(request);
  await clickActorOnCanvas(page, 'builder');
  await expect(page.locator('#fp-bld-title')).toContainText('Lumber Camp');
  expect(await eventCount(request)).toBe(beforePickEvents);

  await advancePlot(page, 2 * 60 * 1000);
  await page.reload();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Idle');
  await page.getByTestId('fp-tile-0-1').click();
  await page.getByTestId('fp-btn-queue').click();
  await waitForRole(page, 'lumber_worker');
  const lumberJobActorHook = page.locator('[data-testid="fp-visual-actor-lumber_worker"][data-source-domain="job"]').first();
  await expect(lumberJobActorHook).toHaveAttribute('data-source-domain', 'job');
  await expect(lumberJobActorHook).toHaveAttribute('data-action-kind', 'PRODUCE');
  await expect(lumberJobActorHook).toHaveAttribute('data-action-cue', 'lumber_milling');
  await expect(lumberJobActorHook).toHaveAttribute('data-accessory', 'wood_bundle');
  const workerInfo = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(workerInfo.actors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'lumber_worker',
      assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png',
      assetSprite: expect.objectContaining({
        id: 'lumber-worker-jun-timberline-v1',
        action: 'mill',
        columns: 4,
        rows: 4
      }),
      actionAnimation: expect.objectContaining({ mode: 'lumber_mill' })
    })
  ]));
  expect(workerInfo.renderedActors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'lumber_worker',
      spriteSheet: true,
      spriteSheetId: 'lumber-worker-jun-timberline-v1',
      spriteSheetAction: 'mill',
      assetFallback: false
    })
  ]));
  expect(workerInfo.actionCues).toEqual(expect.arrayContaining([
    expect.objectContaining({ canonicalRoleId: 'lumber_worker', cueType: 'lumber_milling', accessory: 'wood_bundle' })
  ]));
  const workerActor = workerInfo.actors.find((actor) => actor.canonicalRoleId === 'lumber_worker');
  expect(workerActor.route).toEqual(expect.objectContaining({
    visualOnly: true,
    mode: 'mill',
    targetId: workerActor.target.id
  }));
  expect(workerInfo.renderedWays).toEqual(expect.arrayContaining([
    expect.objectContaining({ wayId: workerActor.route.wayId, visualOnly: true })
  ]));

  await advancePlot(page, 2 * 60 * 1000);
  await page.reload();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Ready to collect');
  await waitForRole(page, 'lumber_worker');
  const lumberReadyActorHook = page.locator('[data-testid="fp-visual-actor-lumber_worker"][data-source-domain="building"]').first();
  await expect(lumberReadyActorHook).toHaveAttribute('data-source-domain', 'building');
  await expect(lumberReadyActorHook).toHaveAttribute('data-action-kind', 'OUTPUT_READY');
  await expect(lumberReadyActorHook).toHaveAttribute('data-action-cue', 'lumber_output_ready');
  await expect(lumberReadyActorHook).toHaveAttribute('data-accessory', 'wood_bundle');

  const beforeMessengerPickEvents = await eventCount(request);
  await clickActorOnCanvas(page, 'messenger');
  await expect(page.getByTestId('fp-quest-step')).toBeVisible();
  expect(await eventCount(request)).toBe(beforeMessengerPickEvents);

  const info = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(info.renderer).toBe('three.js');
  expect(info.roles).toEqual(expect.arrayContaining(['clover', 'lumber_worker']));
  expect(info.actors.every((actor) => actor.visualOnly === true)).toBe(true);
  expect(info.actionCues).toEqual(expect.arrayContaining([
    expect.objectContaining({ canonicalRoleId: 'lumber_worker', cueType: 'lumber_output_ready', accessory: 'wood_bundle' }),
    expect.objectContaining({ canonicalRoleId: 'messenger', cueType: 'attention_marker' })
  ]));
  expect(info.ways.length).toBeGreaterThan(0);
  expect(info.renderedWays.length).toBeGreaterThan(0);
  expect(info.renderedWays.every((way) => way.visualOnly === true)).toBe(true);
  expect(info.encounters.every((encounter) => encounter.visualOnly === true)).toBe(true);
  expect(info.actors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'lumber_worker',
      assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png',
      assetSprite: expect.objectContaining({
        id: 'lumber-worker-jun-timberline-v1',
        action: 'ready',
        columns: 4,
        rows: 4
      }),
      actionAnimation: expect.objectContaining({ mode: 'lumber_mill', stepStyle: 'walk' })
    }),
    expect.objectContaining({
      canonicalRoleId: 'messenger',
      assetSrc: '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png',
      assetSprite: expect.objectContaining({
        id: 'rook-signalpost-messenger-v1',
        metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json',
        action: 'ready',
        row: 3,
        columns: 4,
        rows: 4
      }),
      actionAnimation: expect.objectContaining({ mode: 'attention_wave', stepStyle: 'skip' })
    })
  ]));
  expect(info.renderedActors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'lumber_worker',
      spriteSheet: true,
      spriteSheetId: 'lumber-worker-jun-timberline-v1',
      spriteSheetAction: 'ready',
      assetFallback: false
    }),
    expect.objectContaining({
      canonicalRoleId: 'messenger',
      spriteSheet: true,
      spriteSheetId: 'rook-signalpost-messenger-v1',
      spriteSheetAction: 'ready',
      assetFallback: false
    })
  ]));

  const screenshotPath = testInfo.outputPath('founders-plot-animated-inhabitant-characters.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach('founders-plot-animated-inhabitant-characters', {
    path: screenshotPath,
    contentType: 'image/png'
  });
});
