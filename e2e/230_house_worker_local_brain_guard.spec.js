const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('House worker start stays blocked with plain-language guidance when no local brain is configured', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(installFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);

  await page.getByTestId('house-open-office').click();

  await expect(page.getByTestId('house-office-helper-status').first()).toContainText('Configure your local brain in this browser before starting helpers.');
  await expect(page.getByTestId('house-office-helper-start').first()).toBeDisabled();
  await expect(page.getByTestId('house-office-worker-sessions')).toContainText('No active helper sessions yet.');

  const snapshot = await readHouseWorkerSupervisorSnapshot(page);
  expect(snapshot?.localBrainReady).toBe(false);
  expect(String(snapshot?.localBrainStatusLabel || '')).toContain('Configure your local brain in this browser');
});
