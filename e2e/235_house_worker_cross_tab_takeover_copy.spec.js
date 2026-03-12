const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('House helper cross-tab handoff uses plain-language takeover copy for normal users', async ({ page, request, context }) => {
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

  const installResult = await page.evaluate(async ({ registryEntityId }) => {
    const response = await fetch('/api/platform/house-workers/install', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ registryEntityId }),
    });
    return {
      status: response.status,
      json: await response.json().catch(() => null),
    };
  }, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);
  expect(String(installResult.json?.data?.deployment?.deploymentId || '').trim()).toBeTruthy();

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-deployment-item')).toHaveCount(1);
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const snapshot = await readHouseWorkerSupervisorSnapshot(page);
    return Number(snapshot?.activeWorkerCount || 0);
  }).toBeGreaterThanOrEqual(2);

  const secondPage = await context.newPage();
  await secondPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(secondPage);
  await setDeterministicLlm(secondPage);
  await attachHouseToPageSession(secondPage, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  await secondPage.getByTestId('house-open-office').click();

  const deploymentCard = secondPage.getByTestId('house-office-deployment-item').first();
  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText('another tab or after a page refresh');
  await expect(deploymentCard.getByTestId('house-office-helper-start')).toHaveText('Take Over Here');
  await expect(deploymentCard.getByTestId('house-office-helper-stop')).toHaveText('Stop Everywhere');

  const sessionCard = secondPage.getByTestId('house-office-worker-session-item').first();
  await expect(sessionCard.getByTestId('house-office-worker-session-status')).toContainText('Running in another tab or after refresh');
  await expect(sessionCard.getByTestId('house-office-worker-session-ask')).toBeDisabled();
  await expect(sessionCard.getByTestId('house-office-worker-session-stop')).toHaveText('Stop Everywhere');

  await deploymentCard.getByTestId('house-office-helper-start').click();

  await expect.poll(async () => {
    const snapshot = await readHouseWorkerSupervisorSnapshot(secondPage);
    return Number(snapshot?.activeWorkerCount || 0);
  }).toBeGreaterThanOrEqual(2);

  await expect(deploymentCard.getByTestId('house-office-helper-start')).toHaveText('Running in this tab');
  await expect(deploymentCard.getByTestId('house-office-helper-status')).toContainText('already running in this tab');

  await secondPage.close();
});
