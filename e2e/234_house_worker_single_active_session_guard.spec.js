const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { installHouseWorker, readHouseWorkerSessionsFromPage, spawnHouseWorker } = require('./helpers/house_workers');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.3g: one helper deployment keeps one active session and a second start reuses it instead of spawning a duplicate', async ({ page, request }) => {
  test.slow();
  test.setTimeout(120_000);
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(installFixture?.ok).toBe(true);

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
  const deploymentCard = page.getByTestId('house-office-deployment-item').first();
  const startButton = deploymentCard.getByTestId('house-office-helper-start');
  await startButton.click();

  let activeSessionId = '';
  await expect.poll(async () => {
    const sessionsPayload = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
    const sessions = Array.isArray(sessionsPayload?.json?.data?.sessions) ? sessionsPayload.json.data.sessions : [];
    activeSessionId = String(sessions[0]?.houseWorkerSessionId || '').trim();
    return sessions.length;
  }).toBe(1);

  await expect(startButton).toBeDisabled();
  await expect(startButton).toHaveText('Running in this tab');
  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText('already running in this tab');

  const duplicateStart = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Start a second copy of this helper.',
    reason: 'duplicate_start_probe',
  });
  expect(duplicateStart.status).toBe(200);
  expect(duplicateStart.json?.ok).toBe(true);
  expect(duplicateStart.json?.data?.reused).toBe(true);
  expect(String(duplicateStart.json?.data?.houseWorkerSessionId || '').trim()).toBe(activeSessionId);
  expect(String(duplicateStart.json?.data?.nextStep || '').trim()).toContain('already running');

  const sessionsAfterReuse = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
  const activeSessions = Array.isArray(sessionsAfterReuse?.json?.data?.sessions) ? sessionsAfterReuse.json.data.sessions : [];
  expect(activeSessions).toHaveLength(1);
  expect(String(activeSessions[0]?.houseWorkerSessionId || '').trim()).toBe(activeSessionId);
});
