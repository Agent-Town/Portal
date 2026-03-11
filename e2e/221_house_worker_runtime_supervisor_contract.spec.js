const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { installHouseWorker, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { attachHouseToPageSession, getPlatformFixture, readWorkerSessionId } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.6: House Office keeps the primary worker alive while a real child helper session runs beside it', async ({ page, request }) => {
  const runtimeFixture = await getPlatformFixture(request, 'worker_runtime_supervisor_seed');
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(runtimeFixture?.ok).toBe(true);
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

  const primaryWorkerId = await readWorkerSessionId(page);
  expect(primaryWorkerId).toBeTruthy();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-worker-sessions')).toContainText('No active helper sessions yet.');

  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const snapshot = await readHouseWorkerSupervisorSnapshot(page);
    return Number(snapshot?.activeWorkerCount || 0);
  }).toBeGreaterThanOrEqual(Number(runtimeFixture.fixture.minimumActiveWorkerCount || 2));

  const snapshot = await readHouseWorkerSupervisorSnapshot(page);
  expect(snapshot?.primaryWorkerId).toBe(primaryWorkerId);
  expect(Array.isArray(snapshot?.helpers)).toBe(true);
  expect(snapshot.helpers.length).toBeGreaterThanOrEqual(1);
  expect(runtimeFixture.fixture.requiredStatuses).toContain(String(snapshot.helpers[0]?.status || '').trim());

  await expect(page.getByTestId('house-office-worker-session-item')).toHaveCount(1);
  await expect(page.getByTestId('house-office-worker-session-item').first()).toContainText('Ready');

  const primaryAfterSpawn = await readWorkerSessionId(page);
  expect(primaryAfterSpawn).toBe(primaryWorkerId);
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
});
