const { test, expect } = require('@playwright/test');

const { invokeLiteTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.9: parent workers can delegate to helpers through real worker tools', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const smokeFixture = await getPlatformFixture(request, 'worker_spawn_smoke_seed');
  expect(installFixture?.ok).toBe(true);
  expect(smokeFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1&trainerNamespace=1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);
  const deploymentId = String(installResult.json?.data?.deployment?.deploymentId || '').trim();
  expect(deploymentId).toBeTruthy();

  const registry = await page.evaluate(async () => {
    return await window.__openclawLiteTest.getToolRegistryInfo();
  });
  const names = Array.isArray(registry?.names) ? registry.names : [];
  expect(names).toContain('agent_town_worker_list');
  expect(names).toContain('agent_town_worker_spawn');
  expect(names).toContain('agent_town_worker_message');
  expect(names).toContain('agent_town_worker_status');

  const listResult = await invokeLiteTool(page, 'agent_town_worker_list', {});
  expect(listResult?.ok).toBe(true);
  expect(Array.isArray(listResult?.data?.deployments)).toBe(true);
  expect(listResult.data.deployments).toHaveLength(1);

  const spawnResult = await invokeLiteTool(page, 'agent_town_worker_spawn', {
    deploymentId,
    task: String(smokeFixture.fixture.defaultTask || '').trim(),
    reason: 'delegated_house_summary',
  });
  expect(spawnResult?.ok).toBe(true);
  expect(spawnResult?.data).toMatchObject({
    deploymentId,
    spawnSource: 'parent_worker',
    status: expect.stringMatching(/^(starting|ready|idle|working)$/),
    session: expect.objectContaining({
      deploymentId,
      runtimeAgentId: expect.any(String),
    }),
  });
  const houseWorkerSessionId = String(
    spawnResult?.data?.houseWorkerSessionId
    || spawnResult?.data?.workerSessionId
    || ''
  ).trim();
  expect(houseWorkerSessionId).toBeTruthy();
  expect(String(spawnResult?.data?.reply || '').trim()).not.toBe('');

  const messageResult = await invokeLiteTool(page, 'agent_town_worker_message', {
    houseWorkerSessionId,
    message: 'Reply with one short status update about the current House task.',
  });
  expect(messageResult?.ok).toBe(true);
  expect(String(messageResult?.data?.reply || '').trim()).not.toBe('');

  const statusResult = await invokeLiteTool(page, 'agent_town_worker_status', {
    houseWorkerSessionId,
  });
  expect(statusResult?.ok).toBe(true);
  expect(String(statusResult?.data?.session?.latestReply || '').trim()).not.toBe('');
  expect(statusResult?.data?.session).toMatchObject({
    houseWorkerSessionId,
    deploymentId,
    status: expect.stringMatching(/^(ready|idle|working)$/),
    latestTask: expect.any(String),
    latestReply: expect.any(String),
  });
  const eventKinds = Array.isArray(statusResult?.data?.session?.recentEvents)
    ? statusResult.data.session.recentEvents.map((entry) => String(entry?.eventKind || '').trim())
    : [];
  expect(eventKinds).toEqual(expect.arrayContaining(['spawn_requested', 'task_message', 'assistant_reply']));

  const snapshot = await readHouseWorkerSupervisorSnapshot(page);
  expect(Number(snapshot?.activeWorkerCount || 0)).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(snapshot?.helpers)).toBe(true);
  expect(snapshot.helpers.some((entry) => String(entry?.houseWorkerSessionId || '').trim() === houseWorkerSessionId)).toBe(true);
  expect(Array.isArray(snapshot?.checkpoints)).toBe(true);
  expect(snapshot.checkpoints.some((entry) => String(entry || '').startsWith(`spawn:${houseWorkerSessionId}`))).toBe(true);
  expect(snapshot.checkpoints.some((entry) => String(entry || '').startsWith(`reply:${houseWorkerSessionId}`))).toBe(true);
});
