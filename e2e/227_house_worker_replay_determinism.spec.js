const { test, expect } = require('@playwright/test');

const { invokeLiteTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

function normalizeSupervisorCheckpoints(entries = []) {
  return (Array.isArray(entries) ? entries : []).map((entry) =>
    String(entry || '')
      .replace(/hws_[A-Za-z0-9]+/g, '<session>')
      .replace(/helper_[A-Za-z0-9]+/g, '<helper>')
  );
}

async function runReplayScenario(page, request, { registryEntityId, defaultTask, defaultReason }) {
  await resetPortalWebState(request);
  const seededHouse = await seedRecoverableTokenHouse(request);
  await page.goto('/app?district=house&liteDriver=phase1&trainerNamespace=1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId,
  });
  expect(installResult.status).toBe(200);
  const deploymentId = String(installResult.json?.data?.deployment?.deploymentId || '').trim();
  expect(deploymentId).toBeTruthy();

  const spawnResult = await invokeLiteTool(page, 'agent_town_worker_spawn', {
    deploymentId,
    task: defaultTask,
    reason: defaultReason,
  });
  expect(spawnResult?.ok).toBe(true);
  const houseWorkerSessionId = String(
    spawnResult?.data?.houseWorkerSessionId
    || spawnResult?.data?.workerSessionId
    || ''
  ).trim();
  expect(houseWorkerSessionId).toBeTruthy();

  const messageResult = await invokeLiteTool(page, 'agent_town_worker_message', {
    houseWorkerSessionId,
    message: 'Reply with one short deterministic status update.',
  });
  expect(messageResult?.ok).toBe(true);

  const statusResult = await invokeLiteTool(page, 'agent_town_worker_status', {
    houseWorkerSessionId,
  });
  expect(statusResult?.ok).toBe(true);

  const snapshot = await readHouseWorkerSupervisorSnapshot(page);
  return {
    checkpoints: normalizeSupervisorCheckpoints(snapshot?.checkpoints),
    eventKinds: Array.isArray(statusResult?.data?.session?.recentEvents)
      ? statusResult.data.session.recentEvents.map((entry) => String(entry?.eventKind || '').trim())
      : [],
  };
}

test('M35.12: install plus spawn replay stays deterministic for the same seed', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const smokeFixture = await getPlatformFixture(request, 'worker_spawn_smoke_seed');
  expect(installFixture?.ok).toBe(true);
  expect(smokeFixture?.ok).toBe(true);

  const firstRun = await runReplayScenario(page, request, {
    registryEntityId: installFixture.fixture.registryEntityId,
    defaultTask: String(smokeFixture.fixture.defaultTask || '').trim(),
    defaultReason: 'worker_spawn_replay',
  });
  const secondRun = await runReplayScenario(page, request, {
    registryEntityId: installFixture.fixture.registryEntityId,
    defaultTask: String(smokeFixture.fixture.defaultTask || '').trim(),
    defaultReason: 'worker_spawn_replay',
  });

  expect(firstRun.checkpoints.length).toBeGreaterThanOrEqual(4);
  expect(firstRun.checkpoints).toEqual(secondRun.checkpoints);
  expect(firstRun.eventKinds).toEqual(secondRun.eventKinds);
});
