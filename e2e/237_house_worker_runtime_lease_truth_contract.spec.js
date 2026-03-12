const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSessionsFromPage } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.1: helper lease truth degrades to stale after runtime loss and restart copy stays honest', async ({ page, request, context }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const leaseFixture = await getPlatformFixture(request, 'worker_runtime_lease_seed');
  expect(installFixture?.ok).toBe(true);
  expect(leaseFixture?.ok).toBe(true);

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

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const sessionsPayload = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
    return Array.isArray(sessionsPayload?.json?.data?.sessions) ? sessionsPayload.json.data.sessions.length : 0;
  }).toBe(1);

  const secondPage = await context.newPage();
  await secondPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(secondPage);
  await setDeterministicLlm(secondPage);
  await attachHouseToPageSession(secondPage, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  await secondPage.getByTestId('house-open-office').click();

  await page.close();

  const waitMs = Number(leaseFixture.fixture.leaseTtlMs || 9000) + 2000;
  await expect.poll(async () => {
    const sessionsPayload = await readHouseWorkerSessionsFromPage(secondPage, { teamId: 'team_main' });
    const session = sessionsPayload?.json?.data?.sessions?.[0] || null;
    return {
      status: String(session?.status || '').trim(),
      leaseStatus: String(session?.leaseStatus || '').trim(),
      lastHeartbeatAt: String(session?.lastHeartbeatAt || '').trim(),
      leaseExpiresAt: String(session?.leaseExpiresAt || '').trim(),
    };
  }, { timeout: waitMs + 5000, intervals: [1000] }).toEqual({
    status: 'stale',
    leaseStatus: 'stale',
    lastHeartbeatAt: expect.any(String),
    leaseExpiresAt: expect.any(String),
  });

  const deploymentCard = secondPage.getByTestId('house-office-deployment-item').first();
  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText(String(leaseFixture.fixture.expectedStaleActionLabel || '').trim());
  await expect(deploymentCard.getByTestId('house-office-helper-start')).toHaveText('Restart Here');
  await expect(deploymentCard.getByTestId('house-office-helper-stop')).toHaveText('Clear Session');

  const sessionCard = secondPage.getByTestId('house-office-worker-session-item').first();
  await expect(sessionCard.getByTestId('house-office-worker-session-status')).toContainText(String(leaseFixture.fixture.expectedStaleStatusLabel || '').trim());
  await expect(sessionCard.getByTestId('house-office-worker-session-ask')).toBeDisabled();
  await expect(sessionCard.getByTestId('house-office-worker-session-stop')).toHaveText('Clear Session');

  await deploymentCard.getByTestId('house-office-helper-start').click();

  await expect.poll(async () => {
    const sessionsPayload = await readHouseWorkerSessionsFromPage(secondPage, { teamId: 'team_main' });
    const sessions = Array.isArray(sessionsPayload?.json?.data?.sessions) ? sessionsPayload.json.data.sessions : [];
    const session = [...sessions].reverse().find((entry) => String(entry?.status || '').trim() !== 'stopped') || null;
    return {
      status: String(session?.status || '').trim(),
      leaseStatus: String(session?.leaseStatus || '').trim(),
    };
  }).toMatchObject({
    leaseStatus: 'active_detached',
  });

  await expect(deploymentCard.getByTestId('house-office-helper-start')).toHaveText('Running in this tab');
  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText('already running in this tab');
  await secondPage.close();
});
