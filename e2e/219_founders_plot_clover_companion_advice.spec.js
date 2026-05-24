const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function clickSceneAction(frame, testId) {
  const action = frame.getByTestId(testId);
  await expect(action).toBeVisible({ timeout: 5000 });
  await action.click();
}

async function waitForAdvice(frame, criteria = {}) {
  await frame.waitForFunction((expected) => {
    const advice = window.__foundersPlotTest.getState()?.state?.foreman?.companionAdvice || null;
    if (!advice) return false;
    if (expected.mode && advice.mode !== expected.mode) return false;
    if (expected.bottleneck && advice.bottleneck !== expected.bottleneck) return false;
    if (expected.targetObjectId && advice.targetObjectId !== expected.targetObjectId) return false;
    if (expected.targetPrefix && !String(advice.targetObjectId || '').startsWith(expected.targetPrefix)) return false;
    if (expected.sceneIncludes && !String(advice.sceneLine || '').includes(expected.sceneIncludes)) return false;
    return true;
  }, criteria, { timeout: 5000 });
  const state = await getPlotState(frame);
  return state?.foreman?.companionAdvice || null;
}

async function cloverBubbleTexts(frame) {
  await frame.waitForFunction(() => {
    const bubbles = window.__foundersPlotTest.getThreeSceneInfo()?.parity?.cloverBubbles || [];
    return bubbles.length > 0 && bubbles.some((entry) => String(entry?.text || '').trim());
  }, null, { timeout: 5000 });
  return await frame.evaluate(() => (
    window.__foundersPlotTest.getThreeSceneInfo()?.parity?.cloverBubbles || []
  ).map((entry) => String(entry?.text || '')));
}

test('Clover companion advice tracks bottlenecks and Public Square tradeoffs in the Three.js scene', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  let advice = await waitForAdvice(frame, { bottleneck: 'wood' });
  expect(advice).toEqual(expect.objectContaining({
    mode: 'bottleneck',
    targetObjectId: expect.stringMatching(/^PAD:/)
  }));
  expect(await cloverBubbleTexts(frame)).toEqual(expect.arrayContaining([
    expect.stringContaining('start with wood')
  ]));

  await clickSceneAction(frame, 'founders-scene-action-place-LUMBER_CAMP');
  advice = await waitForAdvice(frame, { bottleneck: 'construction_timer' });
  expect(advice.sceneLine).toContain('queue work when it opens');

  await advancePlot(frame, 31_000);
  advice = await waitForAdvice(frame, { bottleneck: 'idle_producer' });
  expect(advice.sceneLine).toContain('queue lumber camp now');

  await clickSceneAction(frame, 'founders-scene-action-queue');
  advice = await waitForAdvice(frame, { bottleneck: 'production_timer' });
  expect(advice.sceneLine).toContain('lumber camp is working');

  await advancePlot(frame, 61_000);
  advice = await waitForAdvice(frame, { bottleneck: 'ready_output' });
  expect(advice.sceneLine).toContain('collect lumber camp output');

  await clickSceneAction(frame, 'founders-scene-action-collect');
  advice = await waitForAdvice(frame, { mode: 'town_choice_tradeoff' });
  expect(advice).toEqual(expect.objectContaining({
    targetObjectId: 'PUBLIC_SQUARE',
    bottleneck: 'town_choice'
  }));
  expect(advice.tradeoffs).toEqual(expect.arrayContaining([
    expect.objectContaining({
      optionId: 'raise_waymarkers',
      pro: 'Depot reach.',
      con: 'Costs early wood and coin.'
    }),
    expect.objectContaining({
      optionId: 'host_neighbor_supper',
      pro: 'Goodwill.',
      con: 'Uses the food cushion.'
    })
  ]));
  await expect(frame.getByTestId('founders-scene-action-town-option-host_neighbor_supper')).toContainText('Clover: Goodwill.');
  await expect(frame.getByTestId('founders-scene-action-town-option-host_neighbor_supper')).toContainText('Tradeoff: Uses the food cushion.');
  expect(await cloverBubbleTexts(frame)).toEqual(expect.arrayContaining([
    expect.stringContaining('supper grows goodwill')
  ]));

  await startForemanRuntime(frame);
  const observation = await frame.evaluate(async () => window.__foundersPlotTest.getForemanObservation());
  expect(observation?.ok).toBe(true);
  expect(observation?.observation?.companionAdvice).toEqual(expect.objectContaining({
    mode: 'town_choice_tradeoff',
    targetObjectId: 'PUBLIC_SQUARE'
  }));
  expect(observation?.observation?.companionAdvice?.tradeoffs).toEqual(expect.arrayContaining([
    expect.objectContaining({ optionId: 'host_neighbor_supper', con: 'Uses the food cushion.' })
  ]));

  await clickSceneAction(frame, 'founders-scene-action-town-option-host_neighbor_supper');
  advice = await waitForAdvice(frame, { mode: 'town_choice_tradeoff', sceneIncludes: 'haulers are faster' });
  expect(advice.tradeoffs).toEqual(expect.arrayContaining([
    expect.objectContaining({ optionId: 'host_work_bee', pro: 'Saves coin; goodwill.', con: 'Slightly less wood.' })
  ]));
  await expect(frame.getByTestId('founders-scene-action-town-option-host_work_bee')).toContainText('Clover: Saves coin; goodwill.');
  await expect(frame.getByTestId('founders-scene-action-town-option-host_work_bee')).toContainText('Tradeoff: Slightly less wood.');
});
