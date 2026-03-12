const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('House worker sessions stay honest after reload and support an explicit restart in the current tab', async ({ page, request }) => {
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

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const snapshot = await readHouseWorkerSupervisorSnapshot(page);
    return Number(snapshot?.activeWorkerCount || 0);
  }).toBeGreaterThanOrEqual(2);

  await page.reload();
  await waitForLiteApi(page);
  await page.getByTestId('house-open-office').click();

  const sessionCard = page.getByTestId('house-office-worker-session-item').first();
  await expect(sessionCard).toBeVisible();
  await expect(sessionCard.getByTestId('house-office-worker-session-status')).toContainText(/Running in another tab or after refresh|Ready to resume after refresh/);
  await expect(sessionCard.getByTestId('house-office-worker-session-ask')).toBeDisabled();
  await expect(page.getByTestId('house-office-helper-start').first()).toHaveText(/Take Over Here|Resume Here/);

  const snapshotAfterReload = await readHouseWorkerSupervisorSnapshot(page);
  expect(Number(snapshotAfterReload?.activeWorkerCount || 0)).toBe(1);

  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const snapshot = await readHouseWorkerSupervisorSnapshot(page);
    return Number(snapshot?.activeWorkerCount || 0);
  }).toBeGreaterThanOrEqual(2);

  await expect(sessionCard.getByTestId('house-office-worker-session-status')).toContainText(/Ready|Working|Idle/);
  await expect(sessionCard.getByTestId('house-office-worker-session-ask')).toBeEnabled();
});
