const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getJson,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const FORBIDDEN_WORDS = ['provider', 'model', 'oauth', 'wallet', 'blockchain', 'runtime token', 'bearer', 'mcp', 'json', 'debug', 'schema', 'worker trace'];

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('V1.2 surfaces recap sections, signal and journal panels, and avoids forbidden jargon in the main loop', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String(state?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v12-ui-worker:queue'
  });
  expect(queued?.ok).toBe(true);
  await advancePlot(frame, 61_000);
  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);
  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.waitForFunction(() => {
    return !!window.__foundersPlotTest.getState()?.state?.foreman?.receipt?.receiptId;
  }, null, { timeout: 10_000 });
  await frame.locator('[data-close-drawer="foreman"]').click();

  await expect(frame.getByTestId('founders-current-goal')).toBeVisible();
  await expect(frame.getByTestId('founders-clover-avatar')).toBeVisible();
  await expect(frame.getByTestId('founders-drawer-tray')).toBeVisible();

  await frame.locator('[data-drawer-trigger="contracts"]').click();
  await expect(frame.getByTestId('founders-contract-board')).toBeVisible();
  await frame.locator('[data-close-drawer="contracts"]').click();
  await frame.locator('[data-drawer-trigger="signals"]').click();
  await expect(frame.getByTestId('founders-signals-panel')).toBeVisible();
  await frame.locator('[data-close-drawer="signals"]').click();
  await frame.locator('[data-drawer-trigger="journal"]').click();
  await expect(frame.getByTestId('founders-journal-panel')).toBeVisible();
  await frame.locator('[data-close-drawer="journal"]').click();
  await frame.locator('[data-drawer-trigger="foreman"]').click();
  await expect(frame.getByTestId('founders-foreman-panel')).toBeVisible();

  const bodyText = (await frame.locator('body').textContent()).toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    expect(bodyText).not.toContain(word);
  }

  const recap = await getJson(frame, '/api/founders-plot/recap');
  expect(recap?.ok).toBe(true);
  expect(recap?.recap?.sections).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: 'What you did' }),
    expect.objectContaining({ title: 'What the town produced' }),
    expect.objectContaining({ title: 'Who asked for help' }),
    expect.objectContaining({ title: 'What changed in town' }),
    expect.objectContaining({ title: 'What Clover did' }),
    expect.objectContaining({ title: 'What needs your decision now' })
  ]));
});

test('V1.2 mobile, tablet, and desktop layouts keep the new surfaces readable without overlap', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(frame.getByTestId('founders-current-goal')).toBeVisible();
    await expect(frame.getByTestId('founders-plot-stage')).toBeVisible();
    await expect(frame.getByTestId('founders-drawer-tray')).toBeVisible();

    const boxes = await frame.evaluate(() => {
      function rectOf(testId) {
        const node = document.querySelector(`[data-testid="${testId}"]`);
        if (!(node instanceof HTMLElement)) return null;
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      }
      return {
        status: rectOf('founders-status-strip'),
        goal: rectOf('founders-current-goal'),
        stage: rectOf('founders-plot-stage'),
        tray: rectOf('founders-drawer-tray')
      };
    });

    expect(boxes.status?.height).toBeGreaterThan(0);
    expect(boxes.goal?.height).toBeGreaterThan(0);
    expect(boxes.stage?.height).toBeGreaterThan(0);
    expect(boxes.tray?.height).toBeGreaterThan(0);
    expect(boxes.stage?.top).toBeGreaterThanOrEqual(boxes.status?.bottom - 4);
  }
});
