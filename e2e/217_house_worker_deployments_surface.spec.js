const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.2: installed helpers appear in House Office with plain-language setup state', async ({ page, request }) => {
  const registryFixture = await getPlatformFixture(request, 'worker_package_registry_seed');
  expect(registryFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const seededHouse = await seedRecoverableTokenHouse(request);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const install = await installHouseWorker(page.request, {
    registryEntityId: registryFixture.fixture.registryEntityId,
  });
  expect(install.status).toBe(200);

  const overviewResponse = await page.request.get('/api/platform/house-office', {
    failOnStatusCode: false,
  });
  expect(overviewResponse.status()).toBe(200);
  const overviewPayload = await overviewResponse.json();
  expect(overviewPayload?.ok).toBe(true);
  expect(overviewPayload?.data?.summary?.deploymentCount).toBe(1);
  expect(overviewPayload?.data?.deployments).toHaveLength(1);
  expect(overviewPayload?.data?.deployments?.[0]).toMatchObject({
    deploymentId: install.json?.data?.deployment?.deploymentId,
    displayName: 'Front Desk Helper',
    officeLabel: 'Operations',
    status: 'brain_binding_required',
    statusLabel: 'Connect a local brain before this helper can start working.',
  });

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-summary')).toContainText('1 helpers');
  await expect(page.getByTestId('house-office-deployments')).toContainText('Front Desk Helper');
  await expect(page.getByTestId('house-office-deployment-item')).toContainText('Operations');
  await expect(page.getByTestId('house-office-deployment-item')).toContainText('Connect a local brain before this helper can start working.');
  await expect(page.getByTestId('house-office-deployment-advanced-body')).not.toBeVisible();
});
