const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function prepareSpecialistReadyState(frame) {
  const runtime = await startForemanRuntime(frame);
  expect(runtime?.ok).toBe(true);

  await bootstrapToHq2(frame);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v31-specialist-lumber:queue'
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  await frame.evaluate(() => window.__foundersPlotTest.loadState());

  const persistent = await frame.evaluate(async () => window.__foundersPlotTest.startPersistentForeman(120));
  expect(persistent?.persistent?.active).toBe(true);

  const tick = await postJson(frame, '/__test__/founders-plot/persistent-tick', {});
  expect(tick?.persistent?.ran).toBe(true);
  await frame.evaluate(() => window.__foundersPlotTest.loadState());

  const launch = await runPlotTool(frame, 'et.plot.settlements.launch_expedition', {
    idempotencyKey: 'v31-specialist:launch-expedition'
  });
  expect(launch?.ok).toBe(true);
  const founding = await runPlotTool(frame, 'et.plot.settlements.complete_founding_task', {
    settlementId: 'town_2',
    taskId: 'raise_outpost_camp',
    idempotencyKey: 'v31-specialist:complete-outpost'
  });
  expect(founding?.ok).toBe(true);

  const charter = await runPlotTool(frame, 'et.plot.operating_model.choose_charter', {
    charterId: 'STEADY_COMMONS',
    idempotencyKey: 'v31-specialist:charter'
  });
  expect(charter?.ok).toBe(true);
}

test('V3.1 specialist staffing can assign, pause, reassign, and escalate conflicts in Three.js state', async ({ page }) => {
  test.setTimeout(90_000);
  const frame = await openFoundersPlotFrame(page);

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('foreman-specialists-card')).toBeVisible();
  await expect(frame.getByTestId('foreman-specialists-card')).toContainText('Locked');

  await prepareSpecialistReadyState(frame);
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
    window.__foundersPlotTest.openDrawer('foreman');
  });

  await expect(frame.getByTestId('specialist-assign-builder_foreman-construction')).toBeEnabled();
  await frame.getByTestId('specialist-assign-builder_foreman-construction').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.foreman?.specialists?.roles?.find((role) => role.roleId === 'BUILDER_FOREMAN')?.domainId;
  }).toBe('construction');

  await expect(frame.getByTestId('specialist-assign-quartermaster-supplies')).toBeEnabled();
  await frame.getByTestId('specialist-assign-quartermaster-supplies').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.foreman?.specialists?.activeAssignments?.length || 0;
  }).toBe(2);

  await frame.getByTestId('specialist-pause-builder_foreman').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.foreman?.specialists?.roles?.find((role) => role.roleId === 'BUILDER_FOREMAN')?.status;
  }).toBe('PAUSED');

  await frame.getByTestId('specialist-assign-builder_foreman-public_works').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.foreman?.specialists?.roles?.find((role) => role.roleId === 'BUILDER_FOREMAN')?.domainId;
  }).toBe('public_works');

  const denied = await postJson(frame, '/api/founders-plot/tool/et.foreman.specialists.review_recommendation', {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'public_works',
    toolName: 'et.plot.upgrade_building',
    targetObjectId: 'HQ',
    summary: 'Try to upgrade outside the assigned public works lane.',
    idempotencyKey: 'v31-specialist:domain-denied'
  });
  expect(denied?.ok).toBe(false);
  expect(denied?.error?.code).toBe('SPECIALIST_DOMAIN_VIOLATION');

  const builderReview = await runPlotTool(frame, 'et.foreman.specialists.review_recommendation', {
    roleId: 'BUILDER_FOREMAN',
    domainId: 'public_works',
    toolName: 'et.plot.scenarios.contribute',
    targetObjectId: 'PUBLIC_SQUARE',
    summary: 'Builder Foreman wants to spend on public works first.',
    idempotencyKey: 'v31-specialist:builder-review'
  });
  expect(builderReview?.ok).toBe(true);

  const quartermasterReview = await runPlotTool(frame, 'et.foreman.specialists.review_recommendation', {
    roleId: 'QUARTERMASTER',
    domainId: 'supplies',
    toolName: 'et.plot.collect_outputs',
    targetObjectId: 'PUBLIC_SQUARE',
    summary: 'Quartermaster wants to collect reserves first.',
    idempotencyKey: 'v31-specialist:quartermaster-review'
  });
  expect(quartermasterReview?.ok).toBe(true);
  expect(quartermasterReview?.data?.conflict?.title).toBe('Specialists need your decision');

  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
    window.__foundersPlotTest.openDrawer('foreman');
  });
  await expect(frame.getByTestId('foreman-exception-inbox')).toContainText('Specialists need your decision');

  const state = await getPlotState(frame);
  expect(state?.foreman?.specialists?.conflicts?.length).toBe(1);
  expect(state?.recap?.morningBrief?.specialists || '').toContain('specialist');

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toContain('foreman-specialists');
  const specialistAnchor = scene?.anchors?.find((entry) => entry.id === 'STATE:specialists');
  expect(specialistAnchor?.objectId).toBe('FOREMAN_HUT');
  expect(specialistAnchor?.status).toBe('STAFFED');
});
