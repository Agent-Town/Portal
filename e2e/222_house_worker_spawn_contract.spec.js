const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { installHouseWorker, readHouseWorkerSessionsFromPage, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.7: spawning a deployed helper creates one real child worker session inside the current House scope', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const smokeFixture = await getPlatformFixture(request, 'worker_spawn_smoke_seed');
  expect(installFixture?.ok).toBe(true);
  expect(smokeFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
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

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const sessions = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
    return Array.isArray(sessions?.json?.data?.sessions) ? sessions.json.data.sessions.length : 0;
  }).toBe(1);

  let session = null;
  await expect.poll(async () => {
    const sessionsPayload = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
    if (sessionsPayload.status !== 200) return false;
    const currentSession = sessionsPayload.json?.data?.sessions?.[0] || null;
    session = currentSession;
    const latestReply = String(currentSession?.latestReply || '').trim();
    const eventCount = Number(currentSession?.eventCount || 0);
    return Boolean(currentSession && latestReply && eventCount >= 3);
  }, {
    message: 'expected spawned helper session to publish its first reply and event log',
  }).toBe(true);

  expect(session).toMatchObject({
    deploymentId,
    status: expect.stringMatching(/^(starting|ready|idle|working)$/),
    deploymentLabel: expect.any(String),
    runtimeAgentId: expect.any(String),
    runtimeProfile: expect.objectContaining({
      brainProfileId: expect.any(String),
    }),
  });
  expect(String(session?.spawnSource || '').trim()).toBe('house_ui');
  expect(String(session?.latestTask || '').trim()).toContain('Introduce yourself');
  expect(String(session?.latestReply || '').trim()).not.toBe('');
  expect(Number(session?.eventCount || 0)).toBeGreaterThanOrEqual(3);

  const eventKinds = Array.isArray(session?.recentEvents) ? session.recentEvents.map((entry) => String(entry?.eventKind || '').trim()) : [];
  expect(eventKinds).toEqual(expect.arrayContaining(['spawn_requested', 'task_message', 'assistant_reply']));

  const snapshot = await readHouseWorkerSupervisorSnapshot(page);
  expect(Number(snapshot?.activeWorkerCount || 0)).toBeGreaterThanOrEqual(2);
  expect(String(snapshot?.helpers?.[0]?.deploymentId || '').trim()).toBe(deploymentId);
});
