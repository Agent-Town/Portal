const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function getThreeInfo(frame) {
  return frame.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
}

async function clickThreeTarget(page, frame, targetId) {
  const target = await frame.waitForFunction((id) => {
    const info = window.__foundersPlotTest.getThreeSceneInfo();
    const targets = Array.isArray(info?.pickTargets) ? info.pickTargets : [];
    if (String(id).startsWith('GRID:')) {
      return targets.find((entry) => entry.gridCellId === id) || null;
    }
    const objectTargets = targets.filter((entry) => entry.objectId === id);
    return objectTargets.find((entry) => entry.worldObjectId !== 'grid_cell') || objectTargets[0] || null;
  }, targetId, { timeout: 5000 });
  const value = await target.jsonValue();
  if (!value?.canvas) throw new Error(`NO_THREE_TARGET:${targetId}`);
  const iframeBox = await page.locator('#districtModalBody iframe.districtFrame').boundingBox();
  if (!iframeBox) throw new Error('NO_FOUNDERS_IFRAME_BOX');
  const canvasBox = await frame.getByTestId('founders-three-canvas').evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
  const x = Math.max(1, Math.min(Number(value.canvas.x || 0), canvasBox.width - 1));
  const y = Math.max(1, Math.min(Number(value.canvas.y || 0), canvasBox.height - 1));
  await page.mouse.click(iframeBox.x + canvasBox.left + x, iframeBox.y + canvasBox.top + y);
}

async function sceneActionMetrics(frame) {
  return frame.getByTestId('founders-scene-actions').evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const stage = document.querySelector('[data-testid="founders-plot-stage"]')?.getBoundingClientRect();
    const buttons = Array.from(node.querySelectorAll('button')).map((button) => {
      const buttonRect = button.getBoundingClientRect();
      return {
        text: button.textContent.trim(),
        clientWidth: button.clientWidth,
        scrollWidth: button.scrollWidth,
        clientHeight: button.clientHeight,
        scrollHeight: button.scrollHeight,
        width: buttonRect.width,
        height: buttonRect.height
      };
    });
    return {
      rect: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      },
      stage: stage ? {
        left: stage.left,
        right: stage.right,
        top: stage.top,
        bottom: stage.bottom,
        width: stage.width,
        height: stage.height
      } : null,
      buttons
    };
  });
}

function expectSceneActionsReadable(metrics) {
  expect(metrics.stage).toBeTruthy();
  expect(metrics.rect.width).toBeGreaterThan(120);
  expect(metrics.rect.left).toBeGreaterThanOrEqual(metrics.stage.left - 1);
  expect(metrics.rect.right).toBeLessThanOrEqual(metrics.stage.right + 1);
  for (const button of metrics.buttons) {
    expect(button.clientWidth).toBeGreaterThan(80);
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
    expect(button.scrollHeight).toBeLessThanOrEqual(button.clientHeight + 1);
  }
}

test('Three.js scene controls drive build, queue, collect, and town choice without the top CTA', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-scene-actions')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('founders-scene-action-place-LUMBER_CAMP')).toBeVisible({ timeout: 5000 });
  expectSceneActionsReadable(await sceneActionMetrics(frame));

  await clickThreeTarget(page, frame, 'PAD:0,0');
  await frame.waitForFunction(() => {
    const lastPick = window.__foundersPlotTest.getThreeSceneInfo()?.lastPick;
    return lastPick?.objectId === 'PAD:0,0' && lastPick?.source === 'three-raycast';
  }, null, { timeout: 5000 });

  await frame.getByTestId('founders-scene-action-place-LUMBER_CAMP').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });

  await advancePlot(frame, 31_000);
  await clickThreeTarget(page, frame, 'LUMBER_CAMP');
  await expect(frame.getByTestId('founders-scene-action-queue')).toBeVisible({ timeout: 5000 });
  expectSceneActionsReadable(await sceneActionMetrics(frame));

  await frame.getByTestId('founders-scene-action-queue').click();
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return lumber?.runningJob?.status === 'RUNNING';
  }, null, { timeout: 5000 });

  await advancePlot(frame, 61_000);
  await clickThreeTarget(page, frame, 'LUMBER_CAMP');
  await expect(frame.getByTestId('founders-scene-action-collect')).toBeVisible({ timeout: 5000 });
  expectSceneActionsReadable(await sceneActionMetrics(frame));

  await frame.getByTestId('founders-scene-action-collect').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_campfire_choice';
  }, null, { timeout: 5000 });

  await expect(frame.getByTestId('founders-scene-actions')).toHaveAttribute('data-anchor-object-id', 'PUBLIC_SQUARE');
  await expect(frame.getByTestId('founders-scene-action-town-option-host_neighbor_supper')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('founders-quest-cta')).toContainText(/Choose town play/i);
  expectSceneActionsReadable(await sceneActionMetrics(frame));

  const opportunityInfo = await getThreeInfo(frame);
  expect(opportunityInfo.parity.badges).toEqual(expect.arrayContaining([
    expect.objectContaining({ objectId: 'PUBLIC_SQUARE', type: 'opportunity', label: 'Choice' })
  ]));

  await frame.getByTestId('founders-scene-action-town-option-host_neighbor_supper').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_supply_council_choice';
  }, null, { timeout: 5000 });

  const after = await getPlotState(frame);
  expect(after?.townOpportunity?.completed?.[0]).toEqual(expect.objectContaining({
    opportunityId: 'first_campfire_choice',
    optionId: 'host_neighbor_supper'
  }));
  expect(after?.plot?.inventory).toEqual(expect.objectContaining({
    wood: 6,
    food: 6,
    coin: 18
  }));
  expect(after?.plot?.townXp).toBe(31);
  expect(after?.townSignals?.neighborGoodwill).toBe(60);
  expect(after?.townOpportunity?.active?.opportunityId).toBe('first_supply_council_choice');
  expect(after?.currentGoal?.owner).toBe('opportunity');
  await expect(frame.getByTestId('founders-scene-actions')).toHaveAttribute('data-anchor-object-id', 'PUBLIC_SQUARE');
  await expect(frame.getByTestId('founders-scene-action-town-option-host_work_bee')).toBeVisible({ timeout: 5000 });
});
